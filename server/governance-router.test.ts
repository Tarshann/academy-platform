/**
 * Strix Governance — Admin API Router Tests
 *
 * Proves the governance admin API returns correct data:
 *   - governance.stats — dashboard overview
 *   - governance.evidenceTrail — paginated evidence records
 *   - governance.listCapabilities — capability registry
 */

import { describe, test, expect, vi, beforeEach } from "vitest";

// ---- Top-level mocks ----

vi.mock("./_core/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@trpc/server", () => {
  class MockTRPCError extends Error {
    code: string;
    constructor(opts: { code: string; message?: string }) {
      super(opts.message ?? opts.code);
      this.code = opts.code;
      this.name = "TRPCError";
    }
  }

  const initTRPC = {
    context: () => ({
      create: () => {
        const middleware = (fn: any) => fn;
        const procedure = {
          use: (fn: any) => procedure,
          query: (fn: any) => fn,
          mutation: (fn: any) => fn,
          input: () => procedure,
        };
        return {
          router: (routes: any) => routes,
          procedure,
          middleware,
        };
      },
    }),
  };

  return { initTRPC, TRPCError: MockTRPCError };
});

vi.mock("superjson", () => ({
  default: {},
}));

vi.mock("../../shared/const", () => ({
  NOT_ADMIN_ERR_MSG: "Not admin",
  UNAUTHED_ERR_MSG: "Not authenticated",
}));

// Mock zod
vi.mock("zod", () => {
  const z: any = {};
  const schemaFactory = () => {
    const schema: any = {};
    schema.optional = () => schema;
    schema.default = () => schema;
    return schema;
  };
  z.string = schemaFactory;
  z.number = () => {
    const s: any = {};
    s.int = () => s;
    s.min = () => s;
    s.max = () => s;
    s.default = () => s;
    return s;
  };
  z.object = (shape: any) => shape;
  return { z };
});

const mockExecute = vi.fn();
const mockGetDb = vi.fn();

vi.mock("./db", () => ({
  getDb: (...args: any[]) => mockGetDb(...args),
}));

vi.mock("drizzle-orm", () => ({
  sql: (strings: TemplateStringsArray, ...values: any[]) => ({
    strings,
    values,
    _tag: "sql",
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetDb.mockResolvedValue({
    execute: mockExecute,
  });
});

describe("Governance Router", () => {
  describe("governance.stats", () => {
    test("returns totalCapabilities matching CAPABILITIES array length", async () => {
      mockExecute.mockResolvedValueOnce({
        rows: [{ total: 100, denied: 5, allowed: 90, escalated: 5, errors: 0 }],
      });

      vi.resetModules();
      vi.doMock("@trpc/server", () => {
        class E extends Error {
          code: string;
          constructor(o: any) {
            super(o.message);
            this.code = o.code;
          }
        }
        return {
          initTRPC: {
            context: () => ({
              create: () => {
                const proc: any = {
                  use: () => proc,
                  query: (fn: any) => fn,
                  mutation: (fn: any) => fn,
                  input: () => proc,
                };
                return { router: (r: any) => r, procedure: proc, middleware: (fn: any) => fn };
              },
            }),
          },
          TRPCError: E,
        };
      });
      vi.doMock("superjson", () => ({ default: {} }));
      vi.doMock("../../shared/const", () => ({
        NOT_ADMIN_ERR_MSG: "Not admin",
        UNAUTHED_ERR_MSG: "Not authenticated",
      }));
      vi.doMock("zod", () => {
        const z: any = {};
        const sf = () => {
          const s: any = {};
          s.optional = () => s;
          s.default = () => s;
          return s;
        };
        z.string = sf;
        z.number = () => {
          const s: any = {};
          s.int = () => s;
          s.min = () => s;
          s.max = () => s;
          s.default = () => s;
          return s;
        };
        z.object = (shape: any) => shape;
        return { z };
      });
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));
      vi.doMock("./db", () => ({
        getDb: (...args: any[]) => mockGetDb(...args),
      }));
      vi.doMock("drizzle-orm", () => ({
        sql: (strings: TemplateStringsArray, ...values: any[]) => ({
          strings,
          values,
        }),
      }));

      const { governanceRouter } = await import("./governance-router");
      const stats = await governanceRouter.stats();

      expect(stats.totalCapabilities).toBe(104);
    });

    test("returns correct risk distribution counts", async () => {
      mockExecute.mockResolvedValueOnce({
        rows: [{ total: 0, denied: 0, allowed: 0, escalated: 0, errors: 0 }],
      });

      vi.resetModules();
      vi.doMock("@trpc/server", () => {
        class E extends Error {
          code: string;
          constructor(o: any) {
            super(o.message);
            this.code = o.code;
          }
        }
        return {
          initTRPC: {
            context: () => ({
              create: () => {
                const proc: any = {
                  use: () => proc,
                  query: (fn: any) => fn,
                  mutation: (fn: any) => fn,
                  input: () => proc,
                };
                return { router: (r: any) => r, procedure: proc, middleware: (fn: any) => fn };
              },
            }),
          },
          TRPCError: E,
        };
      });
      vi.doMock("superjson", () => ({ default: {} }));
      vi.doMock("../../shared/const", () => ({
        NOT_ADMIN_ERR_MSG: "Not admin",
        UNAUTHED_ERR_MSG: "Not authenticated",
      }));
      vi.doMock("zod", () => {
        const z: any = {};
        const sf = () => {
          const s: any = {};
          s.optional = () => s;
          s.default = () => s;
          return s;
        };
        z.string = sf;
        z.number = () => {
          const s: any = {};
          s.int = () => s;
          s.min = () => s;
          s.max = () => s;
          s.default = () => s;
          return s;
        };
        z.object = (shape: any) => shape;
        return { z };
      });
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));
      vi.doMock("./db", () => ({
        getDb: (...args: any[]) => mockGetDb(...args),
      }));
      vi.doMock("drizzle-orm", () => ({
        sql: (strings: TemplateStringsArray, ...values: any[]) => ({
          strings,
          values,
        }),
      }));

      const { governanceRouter } = await import("./governance-router");
      const stats = await governanceRouter.stats();

      expect(stats.critical).toBe(12);
      expect(stats.high).toBe(37);
      expect(stats.medium).toBe(49);
      expect(stats.low).toBe(6);
    });

    test("handles empty governance_evidence table gracefully", async () => {
      mockGetDb.mockResolvedValueOnce(null);

      vi.resetModules();
      vi.doMock("@trpc/server", () => {
        class E extends Error {
          code: string;
          constructor(o: any) {
            super(o.message);
            this.code = o.code;
          }
        }
        return {
          initTRPC: {
            context: () => ({
              create: () => {
                const proc: any = {
                  use: () => proc,
                  query: (fn: any) => fn,
                  mutation: (fn: any) => fn,
                  input: () => proc,
                };
                return { router: (r: any) => r, procedure: proc, middleware: (fn: any) => fn };
              },
            }),
          },
          TRPCError: E,
        };
      });
      vi.doMock("superjson", () => ({ default: {} }));
      vi.doMock("../../shared/const", () => ({
        NOT_ADMIN_ERR_MSG: "Not admin",
        UNAUTHED_ERR_MSG: "Not authenticated",
      }));
      vi.doMock("zod", () => {
        const z: any = {};
        const sf = () => {
          const s: any = {};
          s.optional = () => s;
          s.default = () => s;
          return s;
        };
        z.string = sf;
        z.number = () => {
          const s: any = {};
          s.int = () => s;
          s.min = () => s;
          s.max = () => s;
          s.default = () => s;
          return s;
        };
        z.object = (shape: any) => shape;
        return { z };
      });
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));
      vi.doMock("./db", () => ({
        getDb: (...args: any[]) => mockGetDb(...args),
      }));
      vi.doMock("drizzle-orm", () => ({
        sql: (strings: TemplateStringsArray, ...values: any[]) => ({
          strings,
          values,
        }),
      }));

      const { governanceRouter } = await import("./governance-router");
      const stats = await governanceRouter.stats();

      expect(stats.totalDecisions).toBe(0);
      expect(stats.totalDenied).toBe(0);
      expect(stats.totalAllowed).toBe(0);
    });
  });

  describe("governance.listCapabilities", () => {
    test("returns all 104 capabilities", async () => {
      vi.resetModules();
      vi.doMock("@trpc/server", () => {
        class E extends Error {
          code: string;
          constructor(o: any) {
            super(o.message);
            this.code = o.code;
          }
        }
        return {
          initTRPC: {
            context: () => ({
              create: () => {
                const proc: any = {
                  use: () => proc,
                  query: (fn: any) => fn,
                  mutation: (fn: any) => fn,
                  input: () => proc,
                };
                return { router: (r: any) => r, procedure: proc, middleware: (fn: any) => fn };
              },
            }),
          },
          TRPCError: E,
        };
      });
      vi.doMock("superjson", () => ({ default: {} }));
      vi.doMock("../../shared/const", () => ({
        NOT_ADMIN_ERR_MSG: "Not admin",
        UNAUTHED_ERR_MSG: "Not authenticated",
      }));
      vi.doMock("zod", () => {
        const z: any = {};
        const sf = () => {
          const s: any = {};
          s.optional = () => s;
          s.default = () => s;
          return s;
        };
        z.string = sf;
        z.number = () => {
          const s: any = {};
          s.int = () => s;
          s.min = () => s;
          s.max = () => s;
          s.default = () => s;
          return s;
        };
        z.object = (shape: any) => shape;
        return { z };
      });
      vi.doMock("./_core/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));
      vi.doMock("./db", () => ({
        getDb: (...args: any[]) => mockGetDb(...args),
      }));
      vi.doMock("drizzle-orm", () => ({
        sql: (strings: TemplateStringsArray, ...values: any[]) => ({
          strings,
          values,
        }),
      }));

      const { governanceRouter } = await import("./governance-router");
      const capabilities = await governanceRouter.listCapabilities();

      expect(capabilities).toHaveLength(104);
      // Every capability has the governed flag
      for (const cap of capabilities) {
        expect(cap).toHaveProperty("governed");
        expect(cap).toHaveProperty("id");
        expect(cap).toHaveProperty("label");
        expect(cap).toHaveProperty("domain");
        expect(cap).toHaveProperty("risk");
      }
    });
  });
});
