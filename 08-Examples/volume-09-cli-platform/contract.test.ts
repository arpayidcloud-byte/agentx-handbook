/**
 * Contract test template — Volume 9: CLI Platform
 * Per ADR-0009. Covers FR-1 through FR-3 (Volume 9 §5).
 */
import { describe, it, expect } from "vitest";

declare function runCliCommand(args: string[]): Promise<{ stdout: string; exitCode: number }>;

describe("Volume 9 — submit end-to-end for no-approval goals (FR-1)", () => {
  it("a no-approval-needed goal completes via `submit` alone, no other command required", async () => {
    const result = await runCliCommand(["submit", "--goal", "list files in /tmp"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/completed/i);
  });
});

describe("Volume 9 — Approval prompts show concrete action detail (FR-2)", () => {
  it("an approval prompt for a destructive fs.write shows the file path and content, not just 'approve this step?'", async () => {
    const result = await runCliCommand(["submit", "--goal", "overwrite config.json"]);
    expect(result.stdout).not.toMatch(/^approve this step\?$/im);
    expect(result.stdout).toMatch(/config\.json/);
  });
});

describe("Volume 9 — cost/audit are read-only (FR-3)", () => {
  it("`cost` command makes no write call to the audit log", async () => {
    const result = await runCliCommand(["cost"]);
    expect(result.exitCode).toBe(0);
    // Illustrative: a real implementation session would assert (via a spy
    // on Memory Engine's Persistence.appendAuditEvent) that this command
    // triggers zero writes — left as a structural placeholder here.
  });

  it("`audit` command makes no write call to the audit log", async () => {
    const result = await runCliCommand(["audit"]);
    expect(result.exitCode).toBe(0);
  });
});
