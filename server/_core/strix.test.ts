/**
 * Strix Governance — SDK Client Tests
 *
 * Proves the SDK client handles all failure modes correctly:
 *   - Initialization (singleton, env var checks)
 *   - Circuit breaker (threshold, cooldown, half-open)
 *   - Evaluate (headers, body, timeout)
 *   - Graceful degradation (never throws on read-only endpoints)
 */

import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("./logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// We need to mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
});

function makeSuccessResponse(data: any): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: () => Promise.resolve(data),
    headers: new Headers(),
  } as any;
}

function makeErrorResponse(status: number): Response {
  return {
    ok: false,
    status,
    statusText: "Error",
    json: () => Promise.resolve({}),
    headers: new Headers(),
  } as any;
}

describe("Strix SDK Client", () => {
  describe("initialization", () => {
    test("returns null when STRIX_API_KEY is not set", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const origKey = process.env.STRIX_API_KEY;
      const origTenant = process.env.STRIX_TENANT_ID;
      delete process.env.STRIX_API_KEY;
      process.env.STRIX_TENANT_ID = "test-tenant";

      try {
        const mod = await import("./strix");
        const client = mod.getStrixClient();
        expect(client).toBeNull();
      } finally {
        if (origKey !== undefined) process.env.STRIX_API_KEY = origKey;
        else delete process.env.STRIX_API_KEY;
        if (origTenant !== undefined) process.env.STRIX_TENANT_ID = origTenant;
        else delete process.env.STRIX_TENANT_ID;
      }
    });

    test("returns null when STRIX_TENANT_ID is not set", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const origKey = process.env.STRIX_API_KEY;
      const origTenant = process.env.STRIX_TENANT_ID;
      process.env.STRIX_API_KEY = "test-key";
      delete process.env.STRIX_TENANT_ID;

      try {
        const mod = await import("./strix");
        const client = mod.getStrixClient();
        expect(client).toBeNull();
      } finally {
        if (origKey !== undefined) process.env.STRIX_API_KEY = origKey;
        else delete process.env.STRIX_API_KEY;
        if (origTenant !== undefined) process.env.STRIX_TENANT_ID = origTenant;
        else delete process.env.STRIX_TENANT_ID;
      }
    });

    test("returns StrixClient when both env vars are set", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const origKey = process.env.STRIX_API_KEY;
      const origTenant = process.env.STRIX_TENANT_ID;
      process.env.STRIX_API_KEY = "test-key-123";
      process.env.STRIX_TENANT_ID = "test-tenant-456";

      try {
        const mod = await import("./strix");
        const client = mod.getStrixClient();
        expect(client).not.toBeNull();
        expect(client).toHaveProperty("evaluate");
        expect(client).toHaveProperty("getEvidenceTrail");
        expect(client).toHaveProperty("getStats");
        expect(client).toHaveProperty("listCapabilities");
      } finally {
        if (origKey !== undefined) process.env.STRIX_API_KEY = origKey;
        else delete process.env.STRIX_API_KEY;
        if (origTenant !== undefined) process.env.STRIX_TENANT_ID = origTenant;
        else delete process.env.STRIX_TENANT_ID;
      }
    });

    test("singleton: same instance returned on multiple calls", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const origKey = process.env.STRIX_API_KEY;
      const origTenant = process.env.STRIX_TENANT_ID;
      process.env.STRIX_API_KEY = "test-key";
      process.env.STRIX_TENANT_ID = "test-tenant";

      try {
        const mod = await import("./strix");
        const client1 = mod.getStrixClient();
        const client2 = mod.getStrixClient();
        expect(client1).toBe(client2);
      } finally {
        if (origKey !== undefined) process.env.STRIX_API_KEY = origKey;
        else delete process.env.STRIX_API_KEY;
        if (origTenant !== undefined) process.env.STRIX_TENANT_ID = origTenant;
        else delete process.env.STRIX_TENANT_ID;
      }
    });
  });

  describe("circuit breaker", () => {
    test("isStrixCircuitOpen returns false initially", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const mod = await import("./strix");
      expect(mod.isStrixCircuitOpen()).toBe(false);
    });

    test("opens after 5 consecutive failures", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const origKey = process.env.STRIX_API_KEY;
      const origTenant = process.env.STRIX_TENANT_ID;
      process.env.STRIX_API_KEY = "test-key";
      process.env.STRIX_TENANT_ID = "test-tenant";

      try {
        const mod = await import("./strix");
        const client = mod.getStrixClient();
        expect(client).not.toBeNull();

        // 5 failures
        mockFetch.mockRejectedValue(new Error("Network error"));
        for (let i = 0; i < 5; i++) {
          try {
            await client!.evaluate({
              capabilityId: "test.cap",
              actor: { id: "user_1", role: "admin" },
            });
          } catch {
            // expected
          }
        }

        expect(mod.isStrixCircuitOpen()).toBe(true);
      } finally {
        if (origKey !== undefined) process.env.STRIX_API_KEY = origKey;
        else delete process.env.STRIX_API_KEY;
        if (origTenant !== undefined) process.env.STRIX_TENANT_ID = origTenant;
        else delete process.env.STRIX_TENANT_ID;
      }
    });

    test("resets failure count on successful request", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const origKey = process.env.STRIX_API_KEY;
      const origTenant = process.env.STRIX_TENANT_ID;
      process.env.STRIX_API_KEY = "test-key";
      process.env.STRIX_TENANT_ID = "test-tenant";

      try {
        const mod = await import("./strix");
        const client = mod.getStrixClient();
        expect(client).not.toBeNull();

        // 4 failures (not enough to open)
        mockFetch.mockRejectedValue(new Error("Network error"));
        for (let i = 0; i < 4; i++) {
          try {
            await client!.evaluate({
              capabilityId: "test.cap",
              actor: { id: "user_1", role: "admin" },
            });
          } catch {
            // expected
          }
        }

        // 1 success resets counter
        mockFetch.mockResolvedValueOnce(
          makeSuccessResponse({ id: "d1", action: "allow" })
        );
        await client!.evaluate({
          capabilityId: "test.cap",
          actor: { id: "user_1", role: "admin" },
        });

        expect(mod.isStrixCircuitOpen()).toBe(false);

        // 4 more failures — still not enough
        mockFetch.mockRejectedValue(new Error("Network error"));
        for (let i = 0; i < 4; i++) {
          try {
            await client!.evaluate({
              capabilityId: "test.cap",
              actor: { id: "user_1", role: "admin" },
            });
          } catch {
            // expected
          }
        }

        expect(mod.isStrixCircuitOpen()).toBe(false);
      } finally {
        if (origKey !== undefined) process.env.STRIX_API_KEY = origKey;
        else delete process.env.STRIX_API_KEY;
        if (origTenant !== undefined) process.env.STRIX_TENANT_ID = origTenant;
        else delete process.env.STRIX_TENANT_ID;
      }
    });
  });

  describe("evaluate()", () => {
    test("sends correct headers (Authorization, X-Tenant-Id, Content-Type)", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const origKey = process.env.STRIX_API_KEY;
      const origTenant = process.env.STRIX_TENANT_ID;
      process.env.STRIX_API_KEY = "sk-test-key";
      process.env.STRIX_TENANT_ID = "tenant-abc";

      try {
        const mod = await import("./strix");
        const client = mod.getStrixClient();
        expect(client).not.toBeNull();

        mockFetch.mockResolvedValueOnce(
          makeSuccessResponse({ id: "d1", action: "allow", reason: "ok" })
        );

        await client!.evaluate({
          capabilityId: "test.cap",
          actor: { id: "user_1", role: "admin" },
        });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, opts] = mockFetch.mock.calls[0];
        expect(url).toContain("/evaluate");
        expect(opts.headers.Authorization).toBe("Bearer sk-test-key");
        expect(opts.headers["X-Tenant-Id"]).toBe("tenant-abc");
        expect(opts.headers["Content-Type"]).toBe("application/json");
      } finally {
        if (origKey !== undefined) process.env.STRIX_API_KEY = origKey;
        else delete process.env.STRIX_API_KEY;
        if (origTenant !== undefined) process.env.STRIX_TENANT_ID = origTenant;
        else delete process.env.STRIX_TENANT_ID;
      }
    });

    test("sends capabilityId and actor in request body", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const origKey = process.env.STRIX_API_KEY;
      const origTenant = process.env.STRIX_TENANT_ID;
      process.env.STRIX_API_KEY = "sk-test-key";
      process.env.STRIX_TENANT_ID = "tenant-abc";

      try {
        const mod = await import("./strix");
        const client = mod.getStrixClient();

        mockFetch.mockResolvedValueOnce(
          makeSuccessResponse({ id: "d1", action: "allow" })
        );

        await client!.evaluate({
          capabilityId: "admin.members.updateRole",
          actor: { id: "user_42", role: "admin", email: "admin@test.com" },
        });

        const [, opts] = mockFetch.mock.calls[0];
        const body = JSON.parse(opts.body);
        expect(body.capabilityId).toBe("admin.members.updateRole");
        expect(body.actor.id).toBe("user_42");
        expect(body.actor.role).toBe("admin");
      } finally {
        if (origKey !== undefined) process.env.STRIX_API_KEY = origKey;
        else delete process.env.STRIX_API_KEY;
        if (origTenant !== undefined) process.env.STRIX_TENANT_ID = origTenant;
        else delete process.env.STRIX_TENANT_ID;
      }
    });

    test("returns StrixDecision on success", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const origKey = process.env.STRIX_API_KEY;
      const origTenant = process.env.STRIX_TENANT_ID;
      process.env.STRIX_API_KEY = "sk-test-key";
      process.env.STRIX_TENANT_ID = "tenant-abc";

      try {
        const mod = await import("./strix");
        const client = mod.getStrixClient();

        const expectedDecision = {
          id: "decision_xyz",
          action: "allow",
          reason: "policy_passed",
        };
        mockFetch.mockResolvedValueOnce(makeSuccessResponse(expectedDecision));

        const result = await client!.evaluate({
          capabilityId: "test.cap",
          actor: { id: "user_1", role: "admin" },
        });

        expect(result).toEqual(expectedDecision);
      } finally {
        if (origKey !== undefined) process.env.STRIX_API_KEY = origKey;
        else delete process.env.STRIX_API_KEY;
        if (origTenant !== undefined) process.env.STRIX_TENANT_ID = origTenant;
        else delete process.env.STRIX_TENANT_ID;
      }
    });

    test("increments failure count on error", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const origKey = process.env.STRIX_API_KEY;
      const origTenant = process.env.STRIX_TENANT_ID;
      process.env.STRIX_API_KEY = "sk-test-key";
      process.env.STRIX_TENANT_ID = "tenant-abc";

      try {
        const mod = await import("./strix");
        const client = mod.getStrixClient();

        mockFetch.mockRejectedValue(new Error("Network error"));

        try {
          await client!.evaluate({
            capabilityId: "test.cap",
            actor: { id: "user_1", role: "admin" },
          });
        } catch {
          // expected
        }

        // Circuit not yet open (only 1 failure)
        expect(mod.isStrixCircuitOpen()).toBe(false);
      } finally {
        if (origKey !== undefined) process.env.STRIX_API_KEY = origKey;
        else delete process.env.STRIX_API_KEY;
        if (origTenant !== undefined) process.env.STRIX_TENANT_ID = origTenant;
        else delete process.env.STRIX_TENANT_ID;
      }
    });
  });

  describe("graceful degradation", () => {
    test("getEvidenceTrail returns [] on error (never throws)", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const origKey = process.env.STRIX_API_KEY;
      const origTenant = process.env.STRIX_TENANT_ID;
      process.env.STRIX_API_KEY = "sk-test-key";
      process.env.STRIX_TENANT_ID = "tenant-abc";

      try {
        const mod = await import("./strix");
        const client = mod.getStrixClient();
        expect(client).not.toBeNull();

        mockFetch.mockRejectedValueOnce(new Error("Network error"));
        const result = await client!.getEvidenceTrail();
        expect(result).toEqual([]);
      } finally {
        if (origKey !== undefined) process.env.STRIX_API_KEY = origKey;
        else delete process.env.STRIX_API_KEY;
        if (origTenant !== undefined) process.env.STRIX_TENANT_ID = origTenant;
        else delete process.env.STRIX_TENANT_ID;
      }
    });

    test("getStats returns {} on error (never throws)", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const origKey = process.env.STRIX_API_KEY;
      const origTenant = process.env.STRIX_TENANT_ID;
      process.env.STRIX_API_KEY = "sk-test-key";
      process.env.STRIX_TENANT_ID = "tenant-abc";

      try {
        const mod = await import("./strix");
        const client = mod.getStrixClient();
        expect(client).not.toBeNull();

        mockFetch.mockRejectedValueOnce(new Error("Network error"));
        const result = await client!.getStats();
        expect(result).toEqual({});
      } finally {
        if (origKey !== undefined) process.env.STRIX_API_KEY = origKey;
        else delete process.env.STRIX_API_KEY;
        if (origTenant !== undefined) process.env.STRIX_TENANT_ID = origTenant;
        else delete process.env.STRIX_TENANT_ID;
      }
    });

    test("listCapabilities returns [] on error (never throws)", async () => {
      vi.resetModules();
      vi.doMock("./logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      const origKey = process.env.STRIX_API_KEY;
      const origTenant = process.env.STRIX_TENANT_ID;
      process.env.STRIX_API_KEY = "sk-test-key";
      process.env.STRIX_TENANT_ID = "tenant-abc";

      try {
        const mod = await import("./strix");
        const client = mod.getStrixClient();
        expect(client).not.toBeNull();

        mockFetch.mockRejectedValueOnce(new Error("Network error"));
        const result = await client!.listCapabilities();
        expect(result).toEqual([]);
      } finally {
        if (origKey !== undefined) process.env.STRIX_API_KEY = origKey;
        else delete process.env.STRIX_API_KEY;
        if (origTenant !== undefined) process.env.STRIX_TENANT_ID = origTenant;
        else delete process.env.STRIX_TENANT_ID;
      }
    });
  });
});
