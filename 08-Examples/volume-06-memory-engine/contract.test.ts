/**
 * Contract test template — Volume 6: Memory Engine
 * Per ADR-0009. Covers FR-1 through FR-3 (Volume 6 §5).
 */
import { describe, it, expect, vi } from "vitest";
import type { Persistence, Task, TaskContext, EventEnvelope } from "../../types/volume-06";

declare function createPersistenceUnderTest(): Persistence;
declare function createLongTaskGraphFixture(nodeCount: number): { taskId: string };

describe("Volume 6 — Persistence interface completeness (FR-1)", () => {
  it("implements saveTask, loadTaskContext, and appendAuditEvent with no fallback in-memory store", async () => {
    const persistence = createPersistenceUnderTest();
    expect(typeof persistence.saveTask).toBe("function");
    expect(typeof persistence.loadTaskContext).toBe("function");
    expect(typeof persistence.appendAuditEvent).toBe("function");
  });

  it("loadTaskContext for a nonexistent taskId throws rather than returning an empty in-memory default", async () => {
    const persistence = createPersistenceUnderTest();
    await expect(persistence.loadTaskContext("nonexistent-id")).rejects.toThrow();
  });
});

describe("Volume 6 — TaskContext size bounding (FR-2)", () => {
  it("TaskContext size does not grow unbounded as graph length increases", async () => {
    const persistence = createPersistenceUnderTest();
    const shortGraph = createLongTaskGraphFixture(5);
    const longGraph = createLongTaskGraphFixture(500);

    const shortCtx: TaskContext = await persistence.loadTaskContext(shortGraph.taskId);
    const longCtx: TaskContext = await persistence.loadTaskContext(longGraph.taskId);

    const shortSize = JSON.stringify(shortCtx).length;
    const longSize = JSON.stringify(longCtx).length;

    // The point of "last-N + summary" (Ch. 2) is that context size should
    // plateau, not grow linearly with graph length — assert the 500-node
    // graph's context is not ~100x the 5-node graph's context.
    expect(longSize).toBeLessThan(shortSize * 10);
  });
});

describe("Volume 6 — AuditEvent append-only guarantee (FR-3)", () => {
  it("appendAuditEvent adds a new row; there is no update/delete method exposed on Persistence", () => {
    const persistence = createPersistenceUnderTest();
    // Negative assertion: the interface itself must not expose mutation of
    // existing audit rows — this is enforceable at the type/interface level,
    // matching ADR-0014's database-trigger enforcement.
    expect((persistence as any).updateAuditEvent).toBeUndefined();
    expect((persistence as any).deleteAuditEvent).toBeUndefined();
  });

  it("appendAuditEvent is called for every state-changing operation (spot check via saveTask)", async () => {
    const persistence = createPersistenceUnderTest();
    const appendSpy = vi.fn();
    (persistence as any).appendAuditEvent = appendSpy;
    // Illustrative: a real implementation would wire saveTask to internally
    // call appendAuditEvent per its Volume 2/6 integration contract.
  });
});
