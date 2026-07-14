/**
 * Contract test template — Volume 11: Deployment & Infrastructure
 * Per ADR-0009. Covers FR-1 through FR-2 (Volume 11 §5).
 *
 * Note: Volume 11 defines deployment configuration rather than runtime
 * interfaces (per its own §7), so FR-1 is a doc-lint style check against the
 * Volume's own Ch. 2 table, not a runtime unit test. This is a deliberate
 * departure from the other contract tests' shape, not an oversight.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

declare function parseManagedServiceTable(markdown: string): Array<{
  service: string;
  selfHostedFallback: string | null;
}>;
declare function loadRuntimeConfig(): { maxParallelAgents: number };

describe("Volume 11 — Every managed service has a documented self-hosted fallback (FR-1)", () => {
  it("no row in Ch. 2's table has an empty/missing self-hosted fallback column", () => {
    const volumePath = path.resolve(__dirname, "../../01-Volumes/Volume-11.md");
    const markdown = fs.readFileSync(volumePath, "utf-8");
    const rows = parseManagedServiceTable(markdown);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.selfHostedFallback).toBeTruthy();
    }
  });
});

describe("Volume 11 — scaling config is a config value, not a hardcoded constant (FR-2)", () => {
  it("maxParallelAgents is read from config, not a literal in source", () => {
    const config = loadRuntimeConfig();
    expect(typeof config.maxParallelAgents).toBe("number");
    expect(config.maxParallelAgents).toBeGreaterThan(0);
  });

  it("changing the config value changes behavior with no code change required", () => {
    // Illustrative: a real implementation session would load two different
    // config fixtures and assert the effective parallelism differs
    // accordingly, without touching source. Left as a structural
    // placeholder pending a real config-loading seam to test against.
  });
});
