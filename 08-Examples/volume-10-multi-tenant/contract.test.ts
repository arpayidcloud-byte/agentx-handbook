/**
 * Contract test template — Volume 10: Multi-Tenant & Policy Engine
 * Per ADR-0009. Covers FR-1 through FR-3 (Volume 10 §5).
 */
import { describe, it, expect } from "vitest";
import type { OrgPolicy } from "../../types/volume-10";

declare function getTableRlsStatus(tableName: string): Promise<{ rlsEnabled: boolean }>;
declare const VOLUME_6_TABLES: string[];
declare function checkRbacPermission(role: string, action: string): Promise<boolean>;
declare function createPolicyEngineUnderTest(): {
  evaluate(action: unknown): Promise<{ blocked: boolean; auditEventWritten: boolean; finding?: string }>;
};

describe("Volume 10 — RLS required on every Volume 6 table (FR-1)", () => {
  it.each(VOLUME_6_TABLES ?? [])("table %s has RLS enabled", async (table) => {
    const status = await getTableRlsStatus(table);
    expect(status.rlsEnabled).toBe(true);
  });
});

describe("Volume 10 — RBAC fail-closed on unrecognized role (FR-2)", () => {
  it("an unrecognized role has zero permissions, never default/implicit access", async () => {
    const allowed = await checkRbacPermission("totally-unrecognized-role", "read:tasks");
    expect(allowed).toBe(false);
  });

  it("a recognized role with no explicit grant for an action is also denied (fail closed, not fail open)", async () => {
    const allowed = await checkRbacPermission("viewer", "delete:tasks");
    expect(allowed).toBe(false);
  });
});

describe("Volume 10 — Policy Engine blocking decisions are logged with the specific finding (FR-3)", () => {
  it("a blocked action writes an AuditEvent containing the finding that triggered the block", async () => {
    const engine = createPolicyEngineUnderTest();
    const result = await engine.evaluate({ action: "exceeds-budget", costUsd: 999 });
    expect(result.blocked).toBe(true);
    expect(result.auditEventWritten).toBe(true);
    expect(result.finding).toBeTruthy();
  });
});
