/**
 * Contract test template — Volume 5: Workflow Engine
 * Per ADR-0009. Covers FR-1 through FR-3 (Volume 5 §5).
 */
import { describe, it, expect } from "vitest";
import type { TaskGraph, WorkflowPolicy } from "../../types/volume-05";

declare function buildGraphUnderTest(nodes: unknown[], edges: unknown[]): TaskGraph;
declare function createRetryLoopUnderTest(cap: number): {
  runWithRetry(fn: () => Promise<unknown>): Promise<unknown>;
};
declare function createPolicyGateUnderTest(policy: WorkflowPolicy): {
  evaluate(node: unknown): Promise<{ blocked: boolean }>;
};

describe("Volume 5 — buildGraph cycle rejection (FR-1)", () => {
  it("rejects a graph with a direct cycle (A -> B -> A) before scheduling begins", () => {
    expect(() =>
      buildGraphUnderTest(
        [{ id: "A" }, { id: "B" }],
        [{ from: "A", to: "B" }, { from: "B", to: "A" }]
      )
    ).toThrow(/cycl/i);
  });

  it("rejects a longer indirect cycle (A -> B -> C -> A)", () => {
    expect(() =>
      buildGraphUnderTest(
        [{ id: "A" }, { id: "B" }, { id: "C" }],
        [{ from: "A", to: "B" }, { from: "B", to: "C" }, { from: "C", to: "A" }]
      )
    ).toThrow(/cycl/i);
  });

  it("accepts a valid DAG with no cycles", () => {
    expect(() =>
      buildGraphUnderTest(
        [{ id: "A" }, { id: "B" }, { id: "C" }],
        [{ from: "A", to: "B" }, { from: "A", to: "C" }]
      )
    ).not.toThrow();
  });
});

describe("Volume 5 — Retry-with-feedback cap and escalation (FR-2)", () => {
  it("escalates to the operator when the retry cap is reached, rather than silently failing", async () => {
    const loop = createRetryLoopUnderTest(3);
    const alwaysFails = () => Promise.reject(new Error("simulated failure"));
    await expect(loop.runWithRetry(alwaysFails)).rejects.toThrow(/escalat/i);
  });

  it("does not exceed the configured retry cap", async () => {
    let attempts = 0;
    const loop = createRetryLoopUnderTest(3);
    const countingFn = () => {
      attempts++;
      return Promise.reject(new Error("fail"));
    };
    await loop.runWithRetry(countingFn).catch(() => {});
    expect(attempts).toBeLessThanOrEqual(3);
  });
});

describe("Volume 5 — Graph-level vs tool-level policy gate independence (FR-3)", () => {
  it("a node with no destructive tool call can still be policy-gated at graph level", async () => {
    const gate = createPolicyGateUnderTest({ maxCostUsd: 1 } as WorkflowPolicy);
    const nonDestructiveNode = { toolCalls: [], estimatedCostUsd: 5 };
    const result = await gate.evaluate(nonDestructiveNode);
    expect(result.blocked).toBe(true);
  });
});
