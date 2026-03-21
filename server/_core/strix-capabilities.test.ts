/**
 * Strix Governance — Capability Registry Integrity Tests
 *
 * Proves the capability registry is correct, complete, and internally consistent.
 * Pure imports — no mocking needed.
 */

import { describe, test, expect } from "vitest";
import {
  CAPABILITIES,
  CAPABILITY_MAP,
  getCapability,
  getCapabilitiesByDomain,
  getCapabilitiesByRisk,
} from "./strix-capabilities";

describe("Capability Registry", () => {
  test("CAPABILITIES array has exactly 104 entries", () => {
    expect(CAPABILITIES.length).toBe(104);
  });

  test("every capability has a unique ID", () => {
    const ids = CAPABILITIES.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(CAPABILITIES.length);
  });

  test("every capability has all required fields (id, label, domain, risk, approvalsRequired, description)", () => {
    for (const cap of CAPABILITIES) {
      expect(cap).toHaveProperty("id");
      expect(cap).toHaveProperty("label");
      expect(cap).toHaveProperty("domain");
      expect(cap).toHaveProperty("risk");
      expect(cap).toHaveProperty("approvalsRequired");
      expect(cap).toHaveProperty("description");
    }
  });

  test("risk values are only 'critical', 'high', 'medium', or 'low'", () => {
    const validRisks = ["critical", "high", "medium", "low"];
    for (const cap of CAPABILITIES) {
      expect(validRisks).toContain(cap.risk);
    }
  });

  test("approvalsRequired is a non-negative integer", () => {
    for (const cap of CAPABILITIES) {
      expect(cap.approvalsRequired).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(cap.approvalsRequired)).toBe(true);
    }
  });

  test("approvalsRequired >= 2 for all CRITICAL capabilities (except cron auto-approve)", () => {
    const criticals = CAPABILITIES.filter(
      (c) => c.risk === "critical" && c.domain !== "cron"
    );
    for (const cap of criticals) {
      expect(
        cap.approvalsRequired,
        `CRITICAL capability "${cap.id}" should require >= 2 approvals`
      ).toBeGreaterThanOrEqual(2);
    }
  });

  test("approvalsRequired >= 1 for all HIGH capabilities (except cron auto-approve)", () => {
    const highs = CAPABILITIES.filter(
      (c) => c.risk === "high" && c.domain !== "cron"
    );
    for (const cap of highs) {
      expect(
        cap.approvalsRequired,
        `HIGH capability "${cap.id}" should require >= 1 approval`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  test("approvalsRequired === 0 for all cron capabilities (auto-approve)", () => {
    const crons = CAPABILITIES.filter((c) => c.domain === "cron");
    for (const cap of crons) {
      expect(
        cap.approvalsRequired,
        `Cron capability "${cap.id}" should be auto-approve (0)`
      ).toBe(0);
    }
  });

  test("no duplicate capability IDs exist", () => {
    const ids = CAPABILITIES.map((c) => c.id);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    }
    expect(duplicates, `Duplicate IDs found: ${duplicates.join(", ")}`).toHaveLength(0);
  });

  test("no empty strings in any field", () => {
    for (const cap of CAPABILITIES) {
      expect(cap.id.trim().length, `Empty id on capability`).toBeGreaterThan(0);
      expect(cap.label.trim().length, `Empty label on "${cap.id}"`).toBeGreaterThan(0);
      expect(cap.domain.trim().length, `Empty domain on "${cap.id}"`).toBeGreaterThan(0);
      expect(cap.description.trim().length, `Empty description on "${cap.id}"`).toBeGreaterThan(0);
    }
  });

  test("CAPABILITY_MAP has same size as CAPABILITIES array", () => {
    expect(CAPABILITY_MAP.size).toBe(CAPABILITIES.length);
  });

  test("getCapability returns correct entry for known ID", () => {
    const cap = getCapability("admin.members.updateRole");
    expect(cap).toBeDefined();
    expect(cap!.label).toBe("Update Member Role");
    expect(cap!.risk).toBe("critical");
  });

  test("getCapability returns undefined for unknown ID", () => {
    const cap = getCapability("nonexistent.capability.xyz");
    expect(cap).toBeUndefined();
  });

  test("getCapabilitiesByDomain returns only capabilities in that domain", () => {
    const cronCaps = getCapabilitiesByDomain("cron");
    expect(cronCaps.length).toBeGreaterThan(0);
    for (const cap of cronCaps) {
      expect(cap.domain).toBe("cron");
    }
  });

  test("getCapabilitiesByRisk returns only capabilities at that risk level", () => {
    const criticals = getCapabilitiesByRisk("critical");
    expect(criticals.length).toBeGreaterThan(0);
    for (const cap of criticals) {
      expect(cap.risk).toBe("critical");
    }
  });

  describe("risk distribution", () => {
    test("CRITICAL count is 12", () => {
      const count = CAPABILITIES.filter((c) => c.risk === "critical").length;
      expect(count).toBe(12);
    });

    test("HIGH count is 37", () => {
      const count = CAPABILITIES.filter((c) => c.risk === "high").length;
      expect(count).toBe(37);
    });

    test("MEDIUM count is 49", () => {
      const count = CAPABILITIES.filter((c) => c.risk === "medium").length;
      expect(count).toBe(49);
    });

    test("LOW count is 6", () => {
      const count = CAPABILITIES.filter((c) => c.risk === "low").length;
      expect(count).toBe(6);
    });

    test("sum of all risk levels === 104", () => {
      const sum =
        CAPABILITIES.filter((c) => c.risk === "critical").length +
        CAPABILITIES.filter((c) => c.risk === "high").length +
        CAPABILITIES.filter((c) => c.risk === "medium").length +
        CAPABILITIES.filter((c) => c.risk === "low").length;
      expect(sum).toBe(104);
    });
  });

  describe("domain coverage", () => {
    test("every domain has at least 1 capability", () => {
      const domains = new Set(CAPABILITIES.map((c) => c.domain));
      for (const domain of domains) {
        const count = getCapabilitiesByDomain(domain).length;
        expect(count, `Domain "${domain}" has 0 capabilities`).toBeGreaterThanOrEqual(1);
      }
    });

    test("cron domain has exactly 16 capabilities", () => {
      const cronCaps = getCapabilitiesByDomain("cron");
      expect(cronCaps.length).toBe(16);
    });

    test("ai domain has exactly 13 capabilities", () => {
      const aiCaps = getCapabilitiesByDomain("ai");
      expect(aiCaps.length).toBe(13);
    });
  });
});
