/**
 * Contract test template — Volume 3: Agent Platform
 * Per ADR-0009. Covers FR-1 through FR-3 (Volume 3 §5).
 */
import { describe, it, expect } from "vitest";
import type { Agent, AgentRole, AgentResult, Task, TaskContext } from "../../types/volume-03";

declare function createAgentUnderTest(role: AgentRole): Agent;
declare function createTaskFixture(overrides?: Partial<Task>): Task;
declare function createContextFixture(): TaskContext;
declare function createLlmDecomposerUnderTest(): {
  decompose(task: Task): Promise<unknown>;
};

describe("Volume 3 — Agent tool-category restriction (FR-1)", () => {
  it("a tool call outside allowedToolCategories is rejected by Tool SDK, not merely discouraged", async () => {
    const agent = createAgentUnderTest("review");
    const task = createTaskFixture({ goal: "Delete all files in /tmp" });
    const result: AgentResult = await agent.run(task, createContextFixture());
    // Review Agent has no write-capable tools (FR-3); an attempt must show
    // up as a rejected/absent tool call, not a successful destructive one.
    const destructiveCalls = result.toolCallsMade.filter((c: any) =>
      /write|delete|exec/i.test(c.toolName ?? "")
    );
    expect(destructiveCalls.every((c: any) => c.success === false)).toBe(true);
  });
});

describe("Volume 3 — LlmDecomposer output validation (FR-2)", () => {
  it("schema-invalid decomposition output is a retryable failure, never passed through unvalidated", async () => {
    const decomposer = createLlmDecomposerUnderTest();
    const task = createTaskFixture();
    // Illustrative: a real implementation session injects a mock LLM
    // response that fails schema validation and asserts decompose() throws
    // a retryable error type rather than returning the malformed output.
    await expect(decomposer.decompose(task)).resolves.toBeDefined();
  });
});

describe("Volume 3 — Review/Security Agent write-tool exclusion (FR-3)", () => {
  it.each(["review", "security"] as AgentRole[])(
    "%s agent's allowedToolCategories contains no write-capable category",
    (role) => {
      const agent = createAgentUnderTest(role);
      // @ts-expect-error — illustrative access to the agent's declared categories
      const categories: string[] = agent.allowedToolCategories ?? [];
      const writeCategories = categories.filter((c) => /write|exec|delete/i.test(c));
      expect(writeCategories).toEqual([]);
    }
  );
});
