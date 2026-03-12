/**
 * Academy Platform — Strix Capability Registry
 *
 * Maps all irreversible / destructive admin actions in the Academy
 * platform to Strix governance capabilities. These capabilities are
 * enforced at the tRPC procedure boundary via the Strix SDK.
 *
 * Each capability defines:
 * - capabilityId: Unique identifier (namespace.resource.action)
 * - riskLevel: Classification for policy engine decisions
 * - allowedEnvironments: Where this action can be executed
 * - approvalsRequired: Number of approvals needed (0 = auto-approve in dev)
 * - irreversible: Whether the action cannot be undone
 */

import type { LocalCapabilityDef } from "@strix/governance-sdk";

/**
 * All governed capabilities in the Academy platform.
 */
export const ACADEMY_CAPABILITIES: LocalCapabilityDef[] = [
  // ─── Program Management ─────────────────────────────────────────
  {
    capabilityId: "academy.program.delete",
    riskLevel: "high",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: true,
  },

  // ─── Announcement Management ────────────────────────────────────
  {
    capabilityId: "academy.announcement.delete",
    riskLevel: "medium",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: true,
  },

  // ─── Schedule Management ────────────────────────────────────────
  {
    capabilityId: "academy.schedule.delete",
    riskLevel: "high",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: true,
  },

  // ─── Member Management ──────────────────────────────────────────
  {
    capabilityId: "academy.member.remove-program",
    riskLevel: "high",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: true,
  },
  {
    capabilityId: "academy.member.update-role",
    riskLevel: "critical",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: false,
  },

  // ─── Chat Management ───────────────────────────────────────────
  {
    capabilityId: "academy.chat.clear-all",
    riskLevel: "critical",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: true,
  },

  // ─── Gallery Management ─────────────────────────────────────────
  {
    capabilityId: "academy.gallery.delete",
    riskLevel: "medium",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: true,
  },

  // ─── Shop / Product Management ──────────────────────────────────
  {
    capabilityId: "academy.product.delete",
    riskLevel: "high",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: true,
  },

  // ─── Campaign Management ────────────────────────────────────────
  {
    capabilityId: "academy.campaign.delete",
    riskLevel: "medium",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: true,
  },

  // ─── Video Management ──────────────────────────────────────────
  {
    capabilityId: "academy.video.delete",
    riskLevel: "medium",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: true,
  },

  // ─── Location Management ───────────────────────────────────────
  {
    capabilityId: "academy.location.delete",
    riskLevel: "high",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: true,
  },

  // ─── Coach Management ──────────────────────────────────────────
  {
    capabilityId: "academy.coach.delete",
    riskLevel: "high",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: true,
  },
  {
    capabilityId: "academy.coach-assignment.delete",
    riskLevel: "medium",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: true,
  },

  // ─── Blog Management ──────────────────────────────────────────
  {
    capabilityId: "academy.blog.delete",
    riskLevel: "medium",
    allowedEnvironments: ["development", "staging", "production"],
    approvalsRequired: 0,
    irreversible: true,
  },
];

/**
 * Lookup a capability by ID.
 */
export function getCapability(capabilityId: string): LocalCapabilityDef | undefined {
  return ACADEMY_CAPABILITIES.find((c) => c.capabilityId === capabilityId);
}

/**
 * Get all capability IDs.
 */
export function getAllCapabilityIds(): string[] {
  return ACADEMY_CAPABILITIES.map((c) => c.capabilityId);
}
