import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Common mocks
// ============================================================================

vi.mock("../_core/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("../push", () => ({
  sendPushToUsers: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            sessionRecap: "Great session!",
            socialCaption: "Amazing work #TheAcademyWay",
            parentPushTitle: "Session Done",
            parentPushBody: "Athletes trained hard today",
          }),
        },
      },
    ],
  }),
}));

// Shared mock DB helpers
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockGroupBy = vi.fn();
const mockHaving = vi.fn();
const mockLeftJoin = vi.fn();
const mockExecute = vi.fn();
const mockReturning = vi.fn();

function createMockDb(returnData: any = []) {
  mockReturning.mockResolvedValue(returnData);
  mockLimit.mockResolvedValue(returnData);
  mockHaving.mockResolvedValue(returnData);
  mockOrderBy.mockResolvedValue(returnData);
  mockWhere.mockReturnValue({ limit: mockLimit, orderBy: mockOrderBy });
  mockLeftJoin.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy });
  mockGroupBy.mockReturnValue({ having: mockHaving });
  mockFrom.mockReturnValue({
    where: mockWhere,
    orderBy: mockOrderBy,
    groupBy: mockGroupBy,
    leftJoin: mockLeftJoin,
    limit: mockLimit,
  });
  mockSelect.mockReturnValue({ from: mockFrom });
  mockValues.mockResolvedValue(undefined);
  mockInsert.mockReturnValue({ values: mockValues });
  mockSet.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  mockUpdate.mockReturnValue({ set: mockSet });
  mockExecute.mockResolvedValue(returnData);

  return {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    execute: mockExecute,
  };
}

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(createMockDb()),
  getAthleteReportData: vi.fn().mockResolvedValue({
    athlete: { id: 1, name: "Test Athlete", sport: "basketball" },
    metrics: [
      { metricName: "40-Yard Dash", value: "5.5", unit: "s", sessionDate: new Date() },
      { metricName: "Vertical Jump", value: "22", unit: "in", sessionDate: new Date() },
    ],
    attendance: [{ status: "present", markedAt: new Date() }],
    showcases: [],
    points: { totalPoints: 100, currentStreak: 3 },
  }),
  getParentsForChild: vi.fn().mockResolvedValue([
    { id: 10, name: "Test Parent", email: "parent@test.com" },
  ]),
}));

vi.mock("../nurture", () => ({
  processNurtureQueue: vi.fn().mockResolvedValue({ sent: 3, errors: 0 }),
}));

// Mock schema imports
vi.mock("../../drizzle/schema", () => ({
  scheduleTemplates: { isActive: "isActive", dayOfWeek: "dayOfWeek", startHour: "startHour" },
  schedules: { id: "id", programId: "programId", startTime: "startTime", endTime: "endTime", title: "title" },
  sessionRegistrations: { userId: "userId", scheduleId: "scheduleId" },
  attendanceRecords: { userId: "userId", scheduleId: "scheduleId", markedAt: "markedAt" },
  notificationPreferences: { userId: "userId", sessionRegistrations: "sessionRegistrations" },
  notificationSettings: { userId: "userId" },
  users: { id: "id", role: "role", extendedRole: "extendedRole", email: "email", name: "name" },
  merchDrops: { id: "id", scheduledAt: "scheduledAt", isSent: "isSent", title: "title" },
  pushSubscriptions: { userId: "userId", isActive: "isActive" },
  athleteMetrics: { athleteId: "athleteId", sessionDate: "sessionDate" },
  athleteShowcases: { athleteId: "athleteId", featuredFrom: "featuredFrom" },
  progressReports: { athleteId: "athleteId" },
  galleryPhotos: { createdAt: "createdAt", isVisible: "isVisible" },
  userRelations: { parentId: "parentId", childId: "childId" },
  reengagementLog: { userId: "userId", sentAt: "sentAt", type: "type" },
  reminderLog: { userId: "userId", scheduleId: "scheduleId", type: "type" },
  sessionRecaps: { scheduleId: "scheduleId", type: "type" },
  contentQueue: { scheduleId: "scheduleId" },
  milestones: { id: "id", athleteId: "athleteId", metricName: "metricName", createdAt: "createdAt" },
  digestLog: { userId: "userId", type: "type", weekKey: "weekKey", id: "id" },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Tests
// ============================================================================

describe("cron/nurture", () => {
  it("calls processNurtureQueue and returns result", async () => {
    const { run } = await import("./nurture");
    const result = await run();
    expect(result).toEqual({ sent: 3, errors: 0 });
  });
});

describe("cron/generate-sessions", () => {
  it("returns zero counts when DB is unavailable", async () => {
    vi.resetModules();
    vi.doMock("../_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
    }));
    vi.doMock("../../drizzle/schema", () => ({
      scheduleTemplates: { isActive: "isActive" },
      schedules: { id: "id", programId: "programId", startTime: "startTime" },
    }));

    const mod = await import("./generate-sessions");
    const result = await mod.run();
    expect(result).toEqual({ sessionsCreated: 0, templatesProcessed: 0, duplicatesSkipped: 0 });
  });

  it("returns result shape with correct keys", async () => {
    vi.resetModules();
    vi.doMock("../_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));

    // Create mock db that returns empty array for templates
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    };
    vi.doMock("../db", () => ({
      getDb: vi.fn().mockResolvedValue(mockDb),
    }));
    vi.doMock("../../drizzle/schema", () => ({
      scheduleTemplates: { isActive: "isActive" },
      schedules: { id: "id", programId: "programId", startTime: "startTime" },
    }));

    const mod = await import("./generate-sessions");
    const result = await mod.run();
    expect(result).toHaveProperty("sessionsCreated");
    expect(result).toHaveProperty("templatesProcessed");
    expect(result).toHaveProperty("duplicatesSkipped");
  });
});

describe("cron/session-reminders", () => {
  it("returns zero counts when DB is unavailable", async () => {
    vi.resetModules();
    vi.doMock("../_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../push", () => ({ sendPushToUsers: vi.fn() }));
    vi.doMock("../email", () => ({ sendEmail: vi.fn() }));
    vi.doMock("../db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));
    vi.doMock("../../drizzle/schema", () => ({
      schedules: {}, sessionRegistrations: {}, notificationPreferences: {},
      users: {}, reminderLog: {},
    }));

    const mod = await import("./session-reminders");
    const result = await mod.run();
    expect(result).toEqual({ pushSent: 0, emailsSent: 0, sessionsNotified: 0 });
  });

  it("returns result shape with correct keys", async () => {
    const mod = await import("./session-reminders");
    const result = await mod.run();
    expect(result).toHaveProperty("pushSent");
    expect(result).toHaveProperty("emailsSent");
    expect(result).toHaveProperty("sessionsNotified");
  });
});

describe("cron/merch-drops", () => {
  it("returns zero counts when DB is unavailable", async () => {
    vi.resetModules();
    vi.doMock("../_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../push", () => ({ sendPushToUsers: vi.fn() }));
    vi.doMock("../db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));
    vi.doMock("../../drizzle/schema", () => ({ merchDrops: {}, pushSubscriptions: {} }));

    const mod = await import("./merch-drops");
    const result = await mod.run();
    expect(result).toEqual({ dropsSent: 0, notificationsSent: 0 });
  });

  it("returns result shape with correct keys", async () => {
    const mod = await import("./merch-drops");
    const result = await mod.run();
    expect(result).toHaveProperty("dropsSent");
    expect(result).toHaveProperty("notificationsSent");
  });
});

describe("cron/metrics-prompt", () => {
  it("returns zero counts when DB is unavailable", async () => {
    vi.resetModules();
    vi.doMock("../_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../push", () => ({ sendPushToUsers: vi.fn() }));
    vi.doMock("../db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));
    vi.doMock("../../drizzle/schema", () => ({ schedules: {}, attendanceRecords: {}, users: {} }));

    const mod = await import("./metrics-prompt");
    const result = await mod.run();
    expect(result).toEqual({ promptsSent: 0, sessionsProcessed: 0 });
  });

  it("returns result shape with correct keys", async () => {
    const mod = await import("./metrics-prompt");
    const result = await mod.run();
    expect(result).toHaveProperty("promptsSent");
    expect(result).toHaveProperty("sessionsProcessed");
  });
});

describe("cron/progress-reports", () => {
  it("returns zero counts when DB is unavailable", async () => {
    vi.resetModules();
    vi.doMock("../_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../email", () => ({ sendEmail: vi.fn() }));
    vi.doMock("../push", () => ({ sendPushToUsers: vi.fn() }));
    vi.doMock("../db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
      getAthleteReportData: vi.fn(),
      getParentsForChild: vi.fn(),
    }));
    vi.doMock("../../drizzle/schema", () => ({
      athleteMetrics: {}, progressReports: {}, users: {},
    }));

    const mod = await import("./progress-reports");
    const result = await mod.run();
    expect(result).toEqual({ reportsGenerated: 0, emailsSent: 0, athletesSkipped: 0 });
  });

  it("returns result shape with correct keys", async () => {
    const mod = await import("./progress-reports");
    const result = await mod.run();
    expect(result).toHaveProperty("reportsGenerated");
    expect(result).toHaveProperty("emailsSent");
    expect(result).toHaveProperty("athletesSkipped");
  });
});

describe("cron/reengagement", () => {
  it("returns zero counts when DB is unavailable", async () => {
    vi.resetModules();
    vi.doMock("../_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../push", () => ({ sendPushToUsers: vi.fn() }));
    vi.doMock("../email", () => ({ sendEmail: vi.fn() }));
    vi.doMock("../db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));
    vi.doMock("../../drizzle/schema", () => ({
      users: {}, attendanceRecords: {}, reengagementLog: {},
    }));

    const mod = await import("./reengagement");
    const result = await mod.run();
    expect(result).toEqual({ pushSent: 0, emailsSent: 0, activeSkipped: 0 });
  });

  it("returns result shape with correct keys", async () => {
    const mod = await import("./reengagement");
    const result = await mod.run();
    expect(result).toHaveProperty("pushSent");
    expect(result).toHaveProperty("emailsSent");
    expect(result).toHaveProperty("activeSkipped");
  });
});

describe("cron/parent-digest", () => {
  it("returns zero counts when DB is unavailable", async () => {
    vi.resetModules();
    vi.doMock("../_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../email", () => ({ sendEmail: vi.fn() }));
    vi.doMock("../db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));
    vi.doMock("../../drizzle/schema", () => ({
      users: {}, userRelations: {}, attendanceRecords: {}, schedules: {},
      athleteMetrics: {}, athleteShowcases: {}, sessionRegistrations: {},
      notificationPreferences: {}, digestLog: {},
    }));

    const mod = await import("./parent-digest");
    const result = await mod.run();
    expect(result).toEqual({ digestsSent: 0, childrenCovered: 0, parentsSkipped: 0 });
  });

  it("returns result shape with correct keys", async () => {
    const mod = await import("./parent-digest");
    const result = await mod.run();
    expect(result).toHaveProperty("digestsSent");
    expect(result).toHaveProperty("childrenCovered");
    expect(result).toHaveProperty("parentsSkipped");
  });
});

describe("cron/post-session-content", () => {
  it("returns zero counts when DB is unavailable", async () => {
    vi.resetModules();
    vi.doMock("../_core/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock("../push", () => ({ sendPushToUsers: vi.fn() }));
    vi.doMock("../db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
      getParentsForChild: vi.fn(),
    }));
    vi.doMock("../../drizzle/schema", () => ({
      schedules: {}, attendanceRecords: {}, galleryPhotos: {},
      sessionRecaps: {}, contentQueue: {},
    }));

    const mod = await import("./post-session-content");
    const result = await mod.run();
    expect(result).toEqual({
      sessionsProcessed: 0,
      recapsGenerated: 0,
      socialDraftsQueued: 0,
      parentPushSent: 0,
    });
  });

  it("returns result shape with correct keys", async () => {
    const mod = await import("./post-session-content");
    const result = await mod.run();
    expect(result).toHaveProperty("sessionsProcessed");
    expect(result).toHaveProperty("recapsGenerated");
    expect(result).toHaveProperty("socialDraftsQueued");
    expect(result).toHaveProperty("parentPushSent");
  });
});

describe("milestones/isPR", () => {
  it("detects higher-is-better PR correctly", async () => {
    const { isPR } = await import("../milestones");
    expect(isPR("Vertical Jump", 30, 28)).toBe(true);
    expect(isPR("Vertical Jump", 26, 28)).toBe(false);
    expect(isPR("Vertical Jump", 28, 28)).toBe(false);
  });

  it("detects lower-is-better PR correctly (timed metrics)", async () => {
    const { isPR } = await import("../milestones");
    expect(isPR("40-Yard Dash", 4.5, 4.8)).toBe(true);
    expect(isPR("40-Yard Dash", 5.0, 4.8)).toBe(false);
    expect(isPR("Mile Run", 6.0, 6.5)).toBe(true);
    expect(isPR("L-Drill", 7.2, 7.0)).toBe(false);
  });
});

// ============================================================================
// Cron Governance Integration Tests
// ============================================================================

describe("Cron Governance Integration", () => {
  /**
   * Structural test: Every cron file calls evaluateCronGovernance with the
   * correct capability ID. Uses source file reading (not runtime mocking)
   * for speed and reliability.
   */
  const fs = require("fs");
  const path = require("path");
  const CRON_DIR = path.resolve(__dirname);

  const cronGovernanceMap: Record<string, string> = {
    "nurture.ts": "cron.nurture",
    "generate-sessions.ts": "cron.generateSessions",
    "session-reminders.ts": "cron.sessionReminders",
    "merch-drops.ts": "cron.merchDrops",
    "metrics-prompt.ts": "cron.metricsPrompt",
    "progress-reports.ts": "cron.progressReports",
    "reengagement.ts": "cron.reengagement",
    "parent-digest.ts": "cron.parentDigest",
    "post-session-content.ts": "cron.postSessionContent",
    "ai-smart-notifications.ts": "cron.aiSmartNotifications",
    "ai-gallery-capture.ts": "cron.aiGalleryCapture",
    "ai-showcase-generator.ts": "cron.aiShowcaseGenerator",
    "ai-content-autopublish.ts": "cron.aiContentAutopublish",
    "ai-announcement-drafter.ts": "cron.aiAnnouncementDrafter",
  };

  for (const [file, capabilityId] of Object.entries(cronGovernanceMap)) {
    it(`${file} calls evaluateCronGovernance with '${capabilityId}'`, () => {
      const content = fs.readFileSync(path.join(CRON_DIR, file), "utf-8");
      expect(content).toContain("evaluateCronGovernance");
      expect(content).toContain(`"${capabilityId}"`);
    });
  }

  it("every cron file imports evaluateCronGovernance", () => {
    const cronFiles = fs
      .readdirSync(CRON_DIR)
      .filter((f: string) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

    for (const file of cronFiles) {
      const content = fs.readFileSync(path.join(CRON_DIR, file), "utf-8");
      expect(
        content.includes("evaluateCronGovernance"),
        `Cron file "${file}" does not import evaluateCronGovernance`
      ).toBe(true);
    }
  });

  it("every cron file has an early return on guard.allowed === false", () => {
    const cronFiles = fs
      .readdirSync(CRON_DIR)
      .filter((f: string) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

    for (const file of cronFiles) {
      const content = fs.readFileSync(path.join(CRON_DIR, file), "utf-8");
      // Check that the guard pattern exists (guard.allowed check)
      const hasGuardCheck =
        content.includes("!guard.allowed") ||
        content.includes("guard.allowed === false") ||
        content.includes("guard.allowed !==");
      expect(
        hasGuardCheck,
        `Cron file "${file}" does not check guard.allowed`
      ).toBe(true);
    }
  });
});

describe("milestone-card/generateMilestoneCardSvg", () => {
  it("generates valid SVG with correct content", async () => {
    const { generateMilestoneCardSvg } = await import("../milestone-card");
    const svg = generateMilestoneCardSvg({
      athleteName: "John Doe",
      metricName: "Vertical Jump",
      newValue: 32,
      unit: "inches",
      improvementDisplay: "14.3% higher than previous best",
    });
    expect(svg).toContain("<svg");
    expect(svg).toContain("John Doe");
    expect(svg).toContain("Vertical Jump");
    expect(svg).toContain("32 inches");
    expect(svg).toContain("14.3% higher than previous best");
    expect(svg).toContain("NEW PERSONAL RECORD");
    expect(svg).toContain("THE ACADEMY");
  });

  it("escapes XML special characters", async () => {
    const { generateMilestoneCardSvg } = await import("../milestone-card");
    const svg = generateMilestoneCardSvg({
      athleteName: "O'Brien & Sons",
      metricName: "Pro Agility <5-10-5>",
      newValue: 4.2,
      unit: "s",
      improvementDisplay: "2.5% faster",
    });
    expect(svg).toContain("O&apos;Brien &amp; Sons");
    expect(svg).toContain("Pro Agility &lt;5-10-5&gt;");
  });
});
