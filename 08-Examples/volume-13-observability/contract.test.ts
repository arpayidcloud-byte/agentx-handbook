/**
 * Contract test template — Volume 13: Observability & SRE
 * Per ADR-0009. Covers FR-1 through FR-2 (Volume 13 §5).
 */
import { describe, it, expect } from "vitest";
import type { MetricsQuery } from "../../types/volume-13";

declare function runMetricsQuery(query: MetricsQuery): Promise<unknown[]>;
declare function seedAuditEventsAndCostRecords(): Promise<void>;
declare function publishTestEventsToBus(count: number): Promise<Array<{ traceId?: string }>>;

describe("Volume 13 — Every metric is computable purely from AuditEvent/CostRecord (FR-1)", () => {
  it.each([
    "task.duration_ms",
    "provider.cost_usd",
    "provider.latency_ms",
    "tool.failure_rate",
  ] as MetricsQuery["metric"][])("%s can be computed with no parallel metrics store", async (metric) => {
    await seedAuditEventsAndCostRecords();
    const results = await runMetricsQuery({
      metric,
      range: { from: new Date(0), to: new Date() },
    });
    expect(Array.isArray(results)).toBe(true);
  });
});

describe("Volume 13 — traceId present on 100% of published events (FR-2)", () => {
  it("every event published to the bus during a normal run has a non-empty traceId", async () => {
    const events = await publishTestEventsToBus(50);
    const missingTraceId = events.filter((e) => !e.traceId);
    expect(missingTraceId).toEqual([]);
  });
});
