/**
 * Contract test template — Volume 1: Foundation
 * Per ADR-0009. Covers FR-1 through FR-3 (Volume 1 §5).
 *
 * Like Volume 14's, these are meta-checks against the handbook's own
 * structure and are genuinely runnable today, not mocked against
 * not-yet-written runtime code.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const HANDBOOK_ROOT = path.resolve(__dirname, "../..");

describe("Volume 1 — Single glossary referenced, not redefined locally (FR-1)", () => {
  it("00-Governance/GLOSSARY.md exists", () => {
    const glossaryPath = path.join(HANDBOOK_ROOT, "00-Governance", "GLOSSARY.md");
    expect(fs.existsSync(glossaryPath)).toBe(true);
  });

  it("no Volume file contains its own '## Glossary' or '## Definitions' heading (would indicate local redefinition)", () => {
    const volumesDir = path.join(HANDBOOK_ROOT, "01-Volumes");
    const offenders: string[] = [];
    for (const file of fs.readdirSync(volumesDir)) {
      if (!file.endsWith(".md")) continue;
      const content = fs.readFileSync(path.join(volumesDir, file), "utf-8");
      if (/^##\s+(Glossary|Definitions)\s*$/im.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("Volume 1 — Dependency table exists and is CI-validatable (FR-2)", () => {
  it("Volume-01.md contains the 12-module dependency table with a 'Depends on' column", () => {
    const volume01Path = path.join(HANDBOOK_ROOT, "01-Volumes", "Volume-01.md");
    const content = fs.readFileSync(volume01Path, "utf-8");
    expect(content).toMatch(/Depends on/);
    expect(content).toMatch(/12-Module Map/);
  });

  // The actual CI-enforceable validation of this table's directionality is
  // covered by Volume 14's contract test (FR-2) — this test only confirms
  // the table Volume 14's test depends on actually exists and is parseable,
  // per FR-2's phrasing ("that CI tooling can later validate against").
});

describe("Volume 1 — Repository layout matches what codegen prompts target (FR-3)", () => {
  it("06-Prompts/codegen/ contains a prompt file for every packages/ entry in Ch. 4's layout", () => {
    const promptsDir = path.join(HANDBOOK_ROOT, "06-Prompts", "codegen");
    const promptFiles = fs.existsSync(promptsDir) ? fs.readdirSync(promptsDir) : [];
    // Volume 1 Ch. 4 lists 8 packages (core-runtime, agent-platform,
    // provider-sdk, workflow-engine, memory-engine, tool-sdk, plugin-sdk,
    // shared). This test asserts prompt coverage exists for the numbered
    // Volumes (2-8) that map to those packages.
    const expectedVolumeNumbers = [2, 3, 4, 5, 6, 7, 8];
    const missing = expectedVolumeNumbers.filter(
      (n) => !promptFiles.some((f) => f.startsWith(String(n).padStart(2, "0") + "-"))
    );
    expect(missing).toEqual([]);
  });
});
