/**
 * Contract test template — Volume 8: Plugin System
 * Per ADR-0009. Covers FR-1 through FR-3 (Volume 8 §5).
 */
import { describe, it, expect } from "vitest";
import type { PluginManifest } from "../../types/volume-08";

declare function createPluginLoaderUnderTest(): {
  load(pluginPath: string): Promise<void>;
};
declare const FIXED_V01_AGENT_ROLES: string[];
declare function createToolReviewFlowSpy(): { calls: unknown[] };

describe("Volume 8 — Manifest-before-code loading (FR-1)", () => {
  it("refuses to import a plugin's entry point when the manifest is missing", async () => {
    const loader = createPluginLoaderUnderTest();
    await expect(loader.load("/fixtures/plugin-no-manifest")).rejects.toThrow(/manifest/i);
  });

  it("refuses to import when the manifest fails validation", async () => {
    const loader = createPluginLoaderUnderTest();
    await expect(loader.load("/fixtures/plugin-invalid-manifest")).rejects.toThrow(/manifest/i);
  });

  it("loads successfully only after the manifest validates", async () => {
    const loader = createPluginLoaderUnderTest();
    await expect(loader.load("/fixtures/plugin-valid")).resolves.not.toThrow();
  });
});

describe("Volume 8 — Agent-role collision prevention (FR-2)", () => {
  it("rejects a plugin manifest declaring an AgentRole already in the fixed v0.1 roster", async () => {
    const loader = createPluginLoaderUnderTest();
    // Fixture manifest declares role: "coding", which collides with the
    // fixed roster (coding/review/test/security per Volume 3 Ch. 1).
    await expect(loader.load("/fixtures/plugin-role-collision")).rejects.toThrow(/collis|role/i);
  });
});

describe("Volume 8 — Tool-kind plugin permission review parity (FR-3)", () => {
  it("a tool-kind plugin's declared categories go through the same review flow as a built-in tool", async () => {
    const reviewSpy = createToolReviewFlowSpy();
    const loader = createPluginLoaderUnderTest();
    await loader.load("/fixtures/plugin-tool-kind").catch(() => {});
    expect(reviewSpy.calls.length).toBeGreaterThan(0);
  });
});
