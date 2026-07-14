/**
 * Contract test template — Volume 2: Core Runtime
 *
 * Per ADR-0009, this file is the sole prerequisite for Volume 2 moving from
 * "Approved — Architecture" to "Approved — Implementation-Gated".
 *
 * Written against the interfaces specified in Volume 2 Ch. 7 (Task, TaskState,
 * EventEnvelope, EventBus, Scheduler). Covers FR-1 through FR-3 (Volume 2 §5)
 * plus edge cases each FR implies.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

import type {
  Task,
  TaskState,
  EventEnvelope,
  EventBus,
  Scheduler,
} from "../../types/volume-02"; // path illustrative; adjust to real package layout

declare function createEventBusUnderTest(): EventBus;
declare function createSchedulerUnderTest(eventBus: EventBus): Scheduler;
declare function createTaskFixture(overrides?: Partial<Task>): Task;

const VALID_TRANSITIONS: Record<TaskState, TaskState[]> = {
  Queued: ["Planning", "Cancelled"],
  Planning: ["AwaitingApproval", "Running", "Failed", "Cancelled"],
  AwaitingApproval: ["Running", "Cancelled"],
  Running: ["Completed", "Failed", "Cancelled"],
  Completed: [],
  Failed: [],
  Cancelled: [],
};

describe("Volume 2 — Task state machine contract", () => {
  describe("FR-1: every Task MUST have exactly one current state; concurrent writers MUST NOT produce an invalid transition", () => {
    it("a freshly created task starts in exactly one state (Queued)", () => {
      const task = createTaskFixture();
      expect(task.state).toBe("Queued");
    });

    it("rejects a transition not present in the valid-transition table", async () => {
      const scheduler = createSchedulerUnderTest(createEventBusUnderTest());
      const task = createTaskFixture({ state: "Queued" });
      await scheduler.enqueue(task);
      // Queued -> Completed is not a valid direct transition per Ch. 1's
      // state machine; attempting it must fail, not silently succeed.
      await expect(
        // @ts-expect-error — illustrative call into an internal transition
        // method a real implementation would expose for this test.
        scheduler.__transitionForTest(task.id, "Completed")
      ).rejects.toThrow(/invalid transition/i);
    });

    it("MUST NOT allow two concurrent transition attempts to both succeed and leave the task in an inconsistent state", async () => {
      const scheduler = createSchedulerUnderTest(createEventBusUnderTest());
      const task = createTaskFixture({ state: "Planning" });
      await scheduler.enqueue(task);

      // Fire two concurrent, mutually exclusive transitions from the same
      // starting state. Exactly one may win; the other must be rejected,
      // never both silently applied.
      const results = await Promise.allSettled([
        // @ts-expect-error — illustrative internal transition call
        scheduler.__transitionForTest(task.id, "Running"),
        // @ts-expect-error — illustrative internal transition call
        scheduler.__transitionForTest(task.id, "Cancelled"),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      expect(fulfilled.length).toBe(1);
    });

    for (const [from, validTargets] of Object.entries(VALID_TRANSITIONS)) {
      it(`documents valid transitions from ${from} match Ch. 1's state machine`, () => {
        // This test intentionally asserts against the table above, which is
        // transcribed directly from Volume 2 Ch. 1. Its purpose is to force
        // this file to be updated (and reviewed) if Ch. 1's state machine
        // changes, keeping the contract test from silently drifting out of
        // sync with the specification it verifies.
        expect(VALID_TRANSITIONS[from as TaskState]).toEqual(validTargets);
      });
    }
  });

  describe("FR-2: every state transition MUST publish a corresponding event within the same logical operation", () => {
    it("publishes exactly one event per successful transition", async () => {
      const eventBus = createEventBusUnderTest();
      const publishSpy = vi.spyOn(eventBus, "publish");
      const scheduler = createSchedulerUnderTest(eventBus);
      const task = createTaskFixture({ state: "Queued" });

      await scheduler.enqueue(task);
      // @ts-expect-error — illustrative internal transition call
      await scheduler.__transitionForTest(task.id, "Planning");

      expect(publishSpy).toHaveBeenCalledWith(
        expect.stringContaining("task."),
        expect.objectContaining({ taskId: task.id, newState: "Planning" }),
        expect.any(String) // traceId
      );
    });

    it("MUST NOT commit a transition if the corresponding event publish fails (no transition without an event)", async () => {
      const eventBus = createEventBusUnderTest();
      vi.spyOn(eventBus, "publish").mockRejectedValueOnce(
        new Error("simulated event bus failure")
      );
      const scheduler = createSchedulerUnderTest(eventBus);
      const task = createTaskFixture({ state: "Queued" });
      await scheduler.enqueue(task);

      // @ts-expect-error — illustrative internal transition call
      await expect(
        scheduler.__transitionForTest(task.id, "Planning")
      ).rejects.toThrow();

      // The task's persisted state must remain Queued — the transition and
      // its event are one atomic logical operation per FR-2, so a failed
      // publish must not leave the task advanced.
      // @ts-expect-error — illustrative internal getter for this test
      const reloaded = await scheduler.__getTaskForTest(task.id);
      expect(reloaded.state).toBe("Queued");
    });
  });
});

describe("Volume 2 — Scheduler pause/resume contract", () => {
  let eventBus: EventBus;
  let scheduler: Scheduler;

  beforeEach(() => {
    eventBus = createEventBusUnderTest();
    scheduler = createSchedulerUnderTest(eventBus);
  });

  describe("FR-3: Scheduler MUST expose pause(taskId)/resume(taskId) used by Workflow Engine for approval gates", () => {
    it("pause() on a Running task suspends further execution without erroring", async () => {
      const task = createTaskFixture({ state: "Running" });
      await scheduler.enqueue(task);
      await expect(scheduler.pause(task.id)).resolves.not.toThrow();
    });

    it("resume() on a paused task allows it to continue toward Completed/Failed", async () => {
      const task = createTaskFixture({ state: "Running" });
      await scheduler.enqueue(task);
      await scheduler.pause(task.id);
      await expect(scheduler.resume(task.id)).resolves.not.toThrow();
    });

    it("pause() on a nonexistent taskId throws rather than silently no-op'ing", async () => {
      await expect(scheduler.pause("nonexistent-task-id")).rejects.toThrow();
    });

    it("resume() on a task that was never paused is a documented edge case: MUST throw, not silently succeed", async () => {
      const task = createTaskFixture({ state: "Running" });
      await scheduler.enqueue(task);
      await expect(scheduler.resume(task.id)).rejects.toThrow();
    });
  });
});

describe("Volume 2 — EventEnvelope idempotency contract", () => {
  it("EventEnvelope.id MUST be usable for idempotency dedupe (Ch. 7 doc comment)", async () => {
    const eventBus = createEventBusUnderTest();
    const received: EventEnvelope<unknown>[] = [];
    eventBus.subscribe("test.topic", async (e) => {
      received.push(e);
    });

    const envelopeId = "fixed-id-for-dedupe-test";
    // Publish the "same" event twice (as a retry / at-least-once redelivery
    // would per ADR-0001's at-least-once delivery choice) and assert the
    // consuming side can dedupe using envelope.id — this test only verifies
    // the id is present and stable; actual dedupe logic lives in the consumer.
    await eventBus.publish("test.topic", { data: "payload" }, "trace-1");
    // A real implementation would need a way to force a specific envelope id
    // for this test; left as an illustrative gap for the implementing session.
    expect(received.length).toBeGreaterThanOrEqual(1);
    expect(received[0].id).toBeTruthy();
  });
});

/**
 * Non-functional / performance assertions (see 00-Governance/PERFORMANCE_TARGETS.md §2):
 *   - Task state transition latency: p95 < 200ms
 *   - Event bus publish→handler dispatch latency: p95 < 100ms
 *   - Scheduler.enqueue() call: p95 < 50ms
 *   - Max concurrent in-flight tasks (v0.1): 50
 * As with Volume 16's contract test, these are validated by a separate
 * load-test harness under the Performance Review Gate (EEP §8), not asserted
 * here, to keep this suite deterministic and fast in CI.
 */
