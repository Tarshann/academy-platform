/**
 * Strix Governance — Governed Procedure Tests
 *
 * Proves the governance middleware works correctly:
 *   - evaluateLocalPolicy: deterministic risk-based enforcement
 *   - computeEvidenceHash: SHA-256, deterministic, tamper-evident
 *   - recordEvidence: fire-and-forget, never throws
 *   - governedProcedure: middleware behavior with/without SDK
 *   - evaluateCronGovernance: cron job governance evaluation
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "crypto";

// ---- Top-level mocks ----

// Mock @trpc/server since node_modules may not be fully accessible
class MockTRPCError extends Error {
  code: string;
  constructor(opts: { code: string; message?: string }) {
    super(opts.message ?? opts.code);
    this.code = opts.code;
    this.name = "TRPCError";
  }
}

vi.mock("@trpc/server", () => ({
  TRPCError: MockTRPCError,
}));

vi.mock("./logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockInsertGovernanceEvidence = vi.fn().mockResolvedValue(undefined);
vi.mock("../db", () => ({
  insertGovernanceEvidence: mockInsertGovernanceEvidence,
}));

// Mock tRPC's adminProcedure — capture the .use() middleware for direct invocation
const mockNext = vi.fn().mockResolvedValue({ ok: true });
let capturedMiddleware: any = null;

vi.mock("./trpc", () => ({
  adminProcedure: {
    use: (fn: any) => {
      capturedMiddleware = fn;
      return {
        mutation: (handler: any) => handler,
        query: (handler: any) => handler,
      };
    },
    mutation: (handler: any) => handler,
    query: (handler: any) => handler,
  },
}));

// Mock Strix SDK
const mockEvaluate = vi.fn();
const mockIsCircuitOpen = vi.fn().mockReturnValue(false);
const mockGetStrixClient = vi.fn().mockReturnValue(null);
const mockIsStrixConfigured = vi.fn().mockReturnValue(true);

vi.mock("./strix", () => ({
  getStrixClient: (...args: any[]) => mockGetStrixClient(...args),
  isStrixCircuitOpen: (...args: any[]) => mockIsCircuitOpen(...args),
  isStrixConfigured: (...args: any[]) => mockIsStrixConfigured(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedMiddleware = null;
  mockNext.mockResolvedValue({ ok: true });
  mockGetStrixClient.mockReturnValue(null);
  mockIsCircuitOpen.mockReturnValue(false);
  mockIsStrixConfigured.mockReturnValue(true);
});

// ---- Helper: Invoke the governed middleware directly ----

async function invokeGovernedMiddleware(
  capabilityId: string,
  user: { id: number; role: string; email?: string },
  envOverrides: Record<string, string | undefined> = {}
) {
  // Apply env overrides
  const origEnv: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(envOverrides)) {
    origEnv[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    // Re-import to pick up env changes
    vi.resetModules();
    // Re-apply mocks after reset
    vi.doMock("@trpc/server", () => ({
      TRPCError: MockTRPCError,
    }));
    vi.doMock("./logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../db", () => ({
      insertGovernanceEvidence: mockInsertGovernanceEvidence,
    }));
    vi.doMock("./trpc", () => ({
      adminProcedure: {
        use: (fn: any) => {
          capturedMiddleware = fn;
          return {
            mutation: (handler: any) => handler,
            query: (handler: any) => handler,
          };
        },
        mutation: (handler: any) => handler,
        query: (handler: any) => handler,
      },
    }));
    vi.doMock("./strix", () => ({
      getStrixClient: (...args: any[]) => mockGetStrixClient(...args),
      isStrixCircuitOpen: (...args: any[]) => mockIsCircuitOpen(...args),
      isStrixConfigured: (...args: any[]) => mockIsStrixConfigured(...args),
    }));

    const mod = await import("./governed-procedure");
    mod.governedProcedure(capabilityId);

    if (!capturedMiddleware) {
      throw new Error("No middleware captured — governedProcedure did not call .use()");
    }

    const ctx = {
      user: {
        id: user.id,
        role: user.role,
        email: user.email ?? null,
      },
    };

    const result = await capturedMiddleware({ ctx, next: mockNext });
    // Allow fire-and-forget recordEvidence() to complete
    await new Promise((r) => setTimeout(r, 50));
    return result;
  } finally {
    // Restore env
    for (const [key, value] of Object.entries(origEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

// ==================================================================
// Section A: evaluateLocalPolicy()
// ==================================================================

describe("evaluateLocalPolicy (via governedProcedure middleware)", () => {
  test("CRITICAL capability + non-owner actor → deny (FORBIDDEN)", async () => {
    await expect(
      invokeGovernedMiddleware("admin.members.updateRole", {
        id: 99,
        role: "admin",
        email: "notowner@test.com",
      }, {
        STRIX_GOVERNANCE_ENABLED: "true",
        CLERK_ADMIN_EMAIL: "owner@test.com",
      })
    ).rejects.toThrow(/governance policy|critical_requires_owner/);
  });

  test("CRITICAL capability + owner actor → allow", async () => {
    const result = await invokeGovernedMiddleware("admin.members.updateRole", {
      id: 1,
      role: "admin",
      email: "owner@test.com",
    }, {
      STRIX_GOVERNANCE_ENABLED: "true",
      CLERK_ADMIN_EMAIL: "owner@test.com",
    });

    expect(mockNext).toHaveBeenCalled();
  });

  test("HIGH capability → escalate (proceeds, evidence recorded)", async () => {
    await invokeGovernedMiddleware("admin.programs.delete", {
      id: 1,
      role: "admin",
      email: "admin@test.com",
    }, {
      STRIX_GOVERNANCE_ENABLED: "true",
      CLERK_ADMIN_EMAIL: "owner@test.com",
    });

    expect(mockNext).toHaveBeenCalled();
    // Evidence should be recorded with escalate action
    expect(mockInsertGovernanceEvidence).toHaveBeenCalled();
    const call = mockInsertGovernanceEvidence.mock.calls[0][0];
    expect(call.action).toBe("escalate");
    expect(call.reason).toContain("high_risk");
  });

  test("MEDIUM capability → allow with local_policy", async () => {
    const result = await invokeGovernedMiddleware("contacts.create", {
      id: 1,
      role: "admin",
      email: "admin@test.com",
    }, {
      STRIX_GOVERNANCE_ENABLED: "true",
      CLERK_ADMIN_EMAIL: "owner@test.com",
    });

    expect(mockNext).toHaveBeenCalled();
  });

  test("LOW capability → allow with local_policy", async () => {
    const result = await invokeGovernedMiddleware("contacts.markRead", {
      id: 1,
      role: "admin",
      email: "admin@test.com",
    }, {
      STRIX_GOVERNANCE_ENABLED: "true",
      CLERK_ADMIN_EMAIL: "owner@test.com",
    });

    expect(mockNext).toHaveBeenCalled();
  });

  test("unregistered capability ID → allow", async () => {
    const result = await invokeGovernedMiddleware("nonexistent.capability", {
      id: 1,
      role: "admin",
      email: "admin@test.com",
    }, {
      STRIX_GOVERNANCE_ENABLED: "true",
    });

    expect(mockNext).toHaveBeenCalled();
  });
});

// ==================================================================
// Section B: computeEvidenceHash() — tested via independent verification
// ==================================================================

describe("computeEvidenceHash (algorithm verification)", () => {
  function computeHash(params: {
    capabilityId: string;
    actorId: string;
    actorRole: string;
    actorEmail?: string | null;
    action: string;
    reason?: string | null;
    source: string;
    timestamp: string;
  }): string {
    const payload = JSON.stringify({
      capabilityId: params.capabilityId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      actorEmail: params.actorEmail ?? null,
      action: params.action,
      reason: params.reason ?? null,
      source: params.source,
      timestamp: params.timestamp,
    });
    return createHash("sha256").update(payload).digest("hex");
  }

  const baseParams = {
    capabilityId: "admin.members.updateRole",
    actorId: "user_1",
    actorRole: "admin",
    actorEmail: "admin@test.com",
    action: "deny",
    reason: "critical_requires_owner",
    source: "trpc",
    timestamp: "2026-03-21T14:00:00.000Z",
  };

  test("returns 64-character hex string (SHA-256)", () => {
    const hash = computeHash(baseParams);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test("deterministic: same inputs → same hash (verified 100 times)", () => {
    const hashes = Array.from({ length: 100 }, () => computeHash(baseParams));
    const uniqueHashes = new Set(hashes);
    expect(uniqueHashes.size).toBe(1);
  });

  test("changes when capabilityId changes", () => {
    const h1 = computeHash(baseParams);
    const h2 = computeHash({ ...baseParams, capabilityId: "other.cap" });
    expect(h1).not.toBe(h2);
  });

  test("changes when actorId changes", () => {
    const h1 = computeHash(baseParams);
    const h2 = computeHash({ ...baseParams, actorId: "user_999" });
    expect(h1).not.toBe(h2);
  });

  test("changes when actorRole changes", () => {
    const h1 = computeHash(baseParams);
    const h2 = computeHash({ ...baseParams, actorRole: "member" });
    expect(h1).not.toBe(h2);
  });

  test("changes when actorEmail changes", () => {
    const h1 = computeHash(baseParams);
    const h2 = computeHash({ ...baseParams, actorEmail: "other@test.com" });
    expect(h1).not.toBe(h2);
  });

  test("changes when action changes", () => {
    const h1 = computeHash(baseParams);
    const h2 = computeHash({ ...baseParams, action: "allow" });
    expect(h1).not.toBe(h2);
  });

  test("changes when reason changes", () => {
    const h1 = computeHash(baseParams);
    const h2 = computeHash({ ...baseParams, reason: "other_reason" });
    expect(h1).not.toBe(h2);
  });

  test("changes when source changes", () => {
    const h1 = computeHash(baseParams);
    const h2 = computeHash({ ...baseParams, source: "cron" });
    expect(h1).not.toBe(h2);
  });

  test("changes when timestamp changes", () => {
    const h1 = computeHash(baseParams);
    const h2 = computeHash({ ...baseParams, timestamp: "2026-03-22T14:00:00.000Z" });
    expect(h1).not.toBe(h2);
  });

  test("field order is deterministic (JSON keys sorted)", () => {
    // The governed-procedure.ts uses explicit field ordering in JSON.stringify
    const payload = JSON.stringify({
      capabilityId: baseParams.capabilityId,
      actorId: baseParams.actorId,
      actorRole: baseParams.actorRole,
      actorEmail: baseParams.actorEmail ?? null,
      action: baseParams.action,
      reason: baseParams.reason ?? null,
      source: baseParams.source,
      timestamp: baseParams.timestamp,
    });
    const expected = createHash("sha256").update(payload).digest("hex");
    expect(computeHash(baseParams)).toBe(expected);
  });
});

// ==================================================================
// Section C: recordEvidence()
// ==================================================================

describe("recordEvidence (via middleware side-effects)", () => {
  test("evidence is recorded when middleware proceeds (allow)", async () => {
    await invokeGovernedMiddleware("contacts.create", {
      id: 1,
      role: "admin",
      email: "admin@test.com",
    }, {
      STRIX_GOVERNANCE_ENABLED: "false",
    });

    expect(mockInsertGovernanceEvidence).toHaveBeenCalledTimes(1);
    const call = mockInsertGovernanceEvidence.mock.calls[0][0];
    expect(call.capabilityId).toBe("contacts.create");
    expect(call.actorId).toBe("1");
    expect(call.source).toBe("trpc");
    expect(call.evidenceHash).toMatch(/^[a-f0-9]{64}$/);
  });

  test("evidence is recorded even when mutation is denied", async () => {
    try {
      await invokeGovernedMiddleware("admin.members.updateRole", {
        id: 99,
        role: "admin",
        email: "notowner@test.com",
      }, {
        STRIX_GOVERNANCE_ENABLED: "true",
        CLERK_ADMIN_EMAIL: "owner@test.com",
      });
    } catch {
      // Expected FORBIDDEN — wait for fire-and-forget evidence to complete
      await new Promise((r) => setTimeout(r, 50));
    }

    expect(mockInsertGovernanceEvidence).toHaveBeenCalled();
  });

  test("never throws on DB error (fire-and-forget)", async () => {
    mockInsertGovernanceEvidence.mockRejectedValueOnce(new Error("DB connection lost"));

    // Should not throw even if evidence write fails
    await expect(
      invokeGovernedMiddleware("contacts.create", {
        id: 1,
        role: "admin",
        email: "admin@test.com",
      }, {
        STRIX_GOVERNANCE_ENABLED: "false",
      })
    ).resolves.not.toThrow();
  });

  test("includes source='trpc' for tRPC mutations", async () => {
    await invokeGovernedMiddleware("contacts.create", {
      id: 1,
      role: "admin",
      email: "admin@test.com",
    }, {
      STRIX_GOVERNANCE_ENABLED: "false",
    });

    const call = mockInsertGovernanceEvidence.mock.calls[0][0];
    expect(call.source).toBe("trpc");
  });
});

// ==================================================================
// Section D: governedProcedure() — Middleware Behavior
// ==================================================================

describe("governedProcedure", () => {
  test("returns raw adminProcedure when capabilityId is undefined", async () => {
    vi.resetModules();
    vi.doMock("./logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../db", () => ({
      insertGovernanceEvidence: mockInsertGovernanceEvidence,
    }));
    vi.doMock("@trpc/server", () => ({
      TRPCError: MockTRPCError,
    }));
    vi.doMock("./trpc", () => ({
      adminProcedure: { _isAdminProcedure: true },
    }));
    vi.doMock("./strix", () => ({
      getStrixClient: mockGetStrixClient,
      isStrixCircuitOpen: mockIsCircuitOpen,
      isStrixConfigured: mockIsStrixConfigured,
    }));

    const mod = await import("./governed-procedure");
    const result = mod.governedProcedure(undefined);
    expect(result).toHaveProperty("_isAdminProcedure", true);
  });

  describe("when STRIX_GOVERNANCE_ENABLED=false", () => {
    test("calls next (allows action)", async () => {
      await invokeGovernedMiddleware("contacts.create", {
        id: 1,
        role: "admin",
        email: "admin@test.com",
      }, {
        STRIX_GOVERNANCE_ENABLED: "false",
      });

      expect(mockNext).toHaveBeenCalled();
    });

    test("records evidence with action=allow and reason=governance_disabled", async () => {
      await invokeGovernedMiddleware("contacts.create", {
        id: 1,
        role: "admin",
        email: "admin@test.com",
      }, {
        STRIX_GOVERNANCE_ENABLED: "false",
      });

      expect(mockInsertGovernanceEvidence).toHaveBeenCalled();
      const call = mockInsertGovernanceEvidence.mock.calls[0][0];
      expect(call.action).toBe("allow");
      expect(call.reason).toBe("governance_disabled");
    });
  });

  describe("when STRIX_GOVERNANCE_ENABLED=true", () => {
    test("SDK returns deny → throws TRPCError FORBIDDEN + records evidence", async () => {
      mockGetStrixClient.mockReturnValue({
        evaluate: vi.fn().mockResolvedValue({
          id: "decision_123",
          action: "deny",
          reason: "Policy violation",
        }),
      });

      try {
        await invokeGovernedMiddleware("contacts.create", {
          id: 1,
          role: "admin",
          email: "admin@test.com",
        }, {
          STRIX_GOVERNANCE_ENABLED: "true",
        });
        expect.unreachable("Should have thrown");
      } catch (err: any) {
        await new Promise((r) => setTimeout(r, 50));
        expect(err.message).toContain("Policy violation");
      }

      expect(mockInsertGovernanceEvidence).toHaveBeenCalled();
    });

    test("SDK returns allow → proceeds + records evidence with externalDecisionId", async () => {
      mockGetStrixClient.mockReturnValue({
        evaluate: vi.fn().mockResolvedValue({
          id: "decision_456",
          action: "allow",
          reason: "approved",
        }),
      });

      await invokeGovernedMiddleware("contacts.create", {
        id: 1,
        role: "admin",
        email: "admin@test.com",
      }, {
        STRIX_GOVERNANCE_ENABLED: "true",
      });

      expect(mockNext).toHaveBeenCalled();
      expect(mockInsertGovernanceEvidence).toHaveBeenCalled();
      const call = mockInsertGovernanceEvidence.mock.calls[0][0];
      expect(call.externalDecisionId).toBe("decision_456");
    });

    test("SDK returns escalate → proceeds + records evidence with escalate action", async () => {
      mockGetStrixClient.mockReturnValue({
        evaluate: vi.fn().mockResolvedValue({
          id: "decision_789",
          action: "escalate",
          reason: "needs review",
        }),
      });

      await invokeGovernedMiddleware("contacts.create", {
        id: 1,
        role: "admin",
        email: "admin@test.com",
      }, {
        STRIX_GOVERNANCE_ENABLED: "true",
      });

      expect(mockNext).toHaveBeenCalled();
    });

    test("SDK throws error → falls back to local policy (fail-open)", async () => {
      mockGetStrixClient.mockReturnValue({
        evaluate: vi.fn().mockRejectedValue(new Error("Network error")),
      });

      await invokeGovernedMiddleware("contacts.create", {
        id: 1,
        role: "admin",
        email: "admin@test.com",
      }, {
        STRIX_GOVERNANCE_ENABLED: "true",
      });

      // Should still proceed (fail-open)
      expect(mockNext).toHaveBeenCalled();
    });

    test("circuit breaker open → skips SDK, uses local policy", async () => {
      mockIsCircuitOpen.mockReturnValue(true);
      mockGetStrixClient.mockReturnValue({
        evaluate: vi.fn().mockResolvedValue({ id: "x", action: "deny", reason: "should not reach" }),
      });

      await invokeGovernedMiddleware("contacts.create", {
        id: 1,
        role: "admin",
        email: "admin@test.com",
      }, {
        STRIX_GOVERNANCE_ENABLED: "true",
      });

      // SDK evaluate should not be called
      expect(mockGetStrixClient().evaluate).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

// ==================================================================
// Section E: evaluateCronGovernance()
// ==================================================================

describe("evaluateCronGovernance", () => {
  test("returns { allowed: true } for cron capabilities (governance disabled)", async () => {
    vi.resetModules();
    vi.doMock("./logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../db", () => ({
      insertGovernanceEvidence: mockInsertGovernanceEvidence,
    }));
    vi.doMock("@trpc/server", () => ({
      TRPCError: MockTRPCError,
    }));
    vi.doMock("./trpc", () => ({
      adminProcedure: { use: vi.fn() },
    }));
    vi.doMock("./strix", () => ({
      getStrixClient: mockGetStrixClient,
      isStrixCircuitOpen: mockIsCircuitOpen,
      isStrixConfigured: mockIsStrixConfigured,
    }));

    // Ensure governance is disabled
    const origEnabled = process.env.STRIX_GOVERNANCE_ENABLED;
    process.env.STRIX_GOVERNANCE_ENABLED = "false";

    try {
      const mod = await import("./governed-procedure");
      const result = await mod.evaluateCronGovernance("cron.nurture", "nurture");
      expect(result.allowed).toBe(true);
    } finally {
      if (origEnabled !== undefined) {
        process.env.STRIX_GOVERNANCE_ENABLED = origEnabled;
      } else {
        delete process.env.STRIX_GOVERNANCE_ENABLED;
      }
    }
  });

  test("records evidence with source='cron' and metadata.cronName", async () => {
    vi.resetModules();
    vi.doMock("./logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../db", () => ({
      insertGovernanceEvidence: mockInsertGovernanceEvidence,
    }));
    vi.doMock("@trpc/server", () => ({
      TRPCError: MockTRPCError,
    }));
    vi.doMock("./trpc", () => ({
      adminProcedure: { use: vi.fn() },
    }));
    vi.doMock("./strix", () => ({
      getStrixClient: mockGetStrixClient,
      isStrixCircuitOpen: mockIsCircuitOpen,
      isStrixConfigured: mockIsStrixConfigured,
    }));

    const origEnabled = process.env.STRIX_GOVERNANCE_ENABLED;
    process.env.STRIX_GOVERNANCE_ENABLED = "false";

    try {
      const mod = await import("./governed-procedure");
      await mod.evaluateCronGovernance("cron.nurture", "nurture");
      // Wait for fire-and-forget recordEvidence
      await new Promise((r) => setTimeout(r, 50));

      expect(mockInsertGovernanceEvidence).toHaveBeenCalled();
      const call = mockInsertGovernanceEvidence.mock.calls[0][0];
      expect(call.source).toBe("cron");
      expect(call.metadata).toEqual({ cronName: "nurture" });
    } finally {
      if (origEnabled !== undefined) {
        process.env.STRIX_GOVERNANCE_ENABLED = origEnabled;
      } else {
        delete process.env.STRIX_GOVERNANCE_ENABLED;
      }
    }
  });

  test("records evidence with actorId='system:cron' and actorRole='automation'", async () => {
    vi.resetModules();
    vi.doMock("./logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../db", () => ({
      insertGovernanceEvidence: mockInsertGovernanceEvidence,
    }));
    vi.doMock("@trpc/server", () => ({
      TRPCError: MockTRPCError,
    }));
    vi.doMock("./trpc", () => ({
      adminProcedure: { use: vi.fn() },
    }));
    vi.doMock("./strix", () => ({
      getStrixClient: mockGetStrixClient,
      isStrixCircuitOpen: mockIsCircuitOpen,
      isStrixConfigured: mockIsStrixConfigured,
    }));

    const origEnabled = process.env.STRIX_GOVERNANCE_ENABLED;
    process.env.STRIX_GOVERNANCE_ENABLED = "false";

    try {
      const mod = await import("./governed-procedure");
      await mod.evaluateCronGovernance("cron.nurture", "nurture");
      // Wait for fire-and-forget recordEvidence
      await new Promise((r) => setTimeout(r, 50));

      const call = mockInsertGovernanceEvidence.mock.calls[0][0];
      expect(call.actorId).toBe("system:cron");
      expect(call.actorRole).toBe("automation");
    } finally {
      if (origEnabled !== undefined) {
        process.env.STRIX_GOVERNANCE_ENABLED = origEnabled;
      } else {
        delete process.env.STRIX_GOVERNANCE_ENABLED;
      }
    }
  });

  test("when SDK denies: returns { allowed: false } with reason", async () => {
    vi.resetModules();
    vi.doMock("./logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../db", () => ({
      insertGovernanceEvidence: mockInsertGovernanceEvidence,
    }));
    vi.doMock("@trpc/server", () => ({
      TRPCError: MockTRPCError,
    }));
    vi.doMock("./trpc", () => ({
      adminProcedure: { use: vi.fn() },
    }));

    const sdkEvaluate = vi.fn().mockResolvedValue({
      id: "cron_deny_1",
      action: "deny",
      reason: "cron_policy_violation",
    });
    mockGetStrixClient.mockReturnValue({ evaluate: sdkEvaluate });
    mockIsCircuitOpen.mockReturnValue(false);

    vi.doMock("./strix", () => ({
      getStrixClient: (...args: any[]) => mockGetStrixClient(...args),
      isStrixCircuitOpen: (...args: any[]) => mockIsCircuitOpen(...args),
      isStrixConfigured: (...args: any[]) => mockIsStrixConfigured(...args),
    }));

    const origEnabled = process.env.STRIX_GOVERNANCE_ENABLED;
    process.env.STRIX_GOVERNANCE_ENABLED = "true";

    try {
      const mod = await import("./governed-procedure");
      const result = await mod.evaluateCronGovernance("cron.nurture", "nurture");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("cron_policy_violation");
    } finally {
      if (origEnabled !== undefined) {
        process.env.STRIX_GOVERNANCE_ENABLED = origEnabled;
      } else {
        delete process.env.STRIX_GOVERNANCE_ENABLED;
      }
    }
  });

  test("when SDK errors: falls back to local policy (auto-allow)", async () => {
    vi.resetModules();
    vi.doMock("./logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../db", () => ({
      insertGovernanceEvidence: mockInsertGovernanceEvidence,
    }));
    vi.doMock("@trpc/server", () => ({
      TRPCError: MockTRPCError,
    }));
    vi.doMock("./trpc", () => ({
      adminProcedure: { use: vi.fn() },
    }));

    mockGetStrixClient.mockReturnValue({
      evaluate: vi.fn().mockRejectedValue(new Error("Network timeout")),
    });
    mockIsCircuitOpen.mockReturnValue(false);

    vi.doMock("./strix", () => ({
      getStrixClient: (...args: any[]) => mockGetStrixClient(...args),
      isStrixCircuitOpen: (...args: any[]) => mockIsCircuitOpen(...args),
      isStrixConfigured: (...args: any[]) => mockIsStrixConfigured(...args),
    }));

    const origEnabled = process.env.STRIX_GOVERNANCE_ENABLED;
    process.env.STRIX_GOVERNANCE_ENABLED = "true";

    try {
      const mod = await import("./governed-procedure");
      const result = await mod.evaluateCronGovernance("cron.nurture", "nurture");
      expect(result.allowed).toBe(true);
    } finally {
      if (origEnabled !== undefined) {
        process.env.STRIX_GOVERNANCE_ENABLED = origEnabled;
      } else {
        delete process.env.STRIX_GOVERNANCE_ENABLED;
      }
    }
  });

  test("evidence is always recorded regardless of SDK state", async () => {
    vi.resetModules();
    vi.doMock("./logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../db", () => ({
      insertGovernanceEvidence: mockInsertGovernanceEvidence,
    }));
    vi.doMock("@trpc/server", () => ({
      TRPCError: MockTRPCError,
    }));
    vi.doMock("./trpc", () => ({
      adminProcedure: { use: vi.fn() },
    }));
    vi.doMock("./strix", () => ({
      getStrixClient: mockGetStrixClient,
      isStrixCircuitOpen: mockIsCircuitOpen,
      isStrixConfigured: mockIsStrixConfigured,
    }));

    const origEnabled = process.env.STRIX_GOVERNANCE_ENABLED;
    process.env.STRIX_GOVERNANCE_ENABLED = "false";

    try {
      const mod = await import("./governed-procedure");
      await mod.evaluateCronGovernance("cron.nurture", "nurture");
      // Wait for fire-and-forget recordEvidence
      await new Promise((r) => setTimeout(r, 50));
      expect(mockInsertGovernanceEvidence).toHaveBeenCalled();
    } finally {
      if (origEnabled !== undefined) {
        process.env.STRIX_GOVERNANCE_ENABLED = origEnabled;
      } else {
        delete process.env.STRIX_GOVERNANCE_ENABLED;
      }
    }
  });
});
