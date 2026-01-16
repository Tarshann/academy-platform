import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  programs, 
  InsertProgram,
  announcements,
  InsertAnnouncement,
  contactSubmissions,
  InsertContactSubmission,
  schedules,
  InsertSchedule
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Program queries
export async function getAllPrograms() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(programs).where(eq(programs.isActive, 1));
}

export async function getProgramBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(programs).where(eq(programs.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProgram(program: InsertProgram) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(programs).values(program);
  return result;
}

// Announcement queries
export async function getPublishedAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(announcements)
    .where(eq(announcements.isPublished, 1))
    .orderBy(desc(announcements.publishedAt));
}

export async function createAnnouncement(announcement: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(announcements).values(announcement);
  return result;
}

// Contact submission queries
export async function createContactSubmission(submission: InsertContactSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contactSubmissions).values(submission);
  return result;
}

export async function getContactSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
}

// Schedule queries
export async function getUpcomingSchedules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schedules)
    .where(eq(schedules.startTime, new Date()))
    .orderBy(schedules.startTime);
}

export async function createSchedule(schedule: InsertSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(schedules).values(schedule);
  return result;
}

// Payment helpers
export async function getUserPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { payments } = await import("../drizzle/schema");
  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
}

export async function getUserSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { subscriptions } = await import("../drizzle/schema");
  return db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.createdAt));
}

export async function getActiveSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { subscriptions } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  return db.select().from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, "active")
    ));
}

// Session registration helpers
export async function getUserRegistrations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { sessionRegistrations } = await import("../drizzle/schema");
  return db.select().from(sessionRegistrations)
    .where(eq(sessionRegistrations.userId, userId))
    .orderBy(desc(sessionRegistrations.registeredAt));
}

export async function getScheduleRegistrations(scheduleId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { sessionRegistrations } = await import("../drizzle/schema");
  return db.select().from(sessionRegistrations)
    .where(eq(sessionRegistrations.scheduleId, scheduleId));
}

export async function createSessionRegistration(userId: number, scheduleId: number, paymentId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { sessionRegistrations } = await import("../drizzle/schema");
  
  await db.insert(sessionRegistrations).values({
    userId,
    scheduleId,
    paymentId: paymentId || null,
    status: "registered",
  });
}

// Admin helpers for program management
export async function updateProgram(id: number, updates: Partial<InsertProgram>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(programs).set(updates).where(eq(programs.id, id));
}

export async function deleteProgram(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Soft delete by setting isActive to 0
  await db.update(programs).set({ isActive: 0 }).where(eq(programs.id, id));
}

export async function getAllProgramsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(programs).orderBy(desc(programs.createdAt));
}

// Admin helpers for announcement management
export async function getAllAnnouncementsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(announcements).orderBy(desc(announcements.createdAt));
}

export async function updateAnnouncement(id: number, updates: Partial<InsertAnnouncement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(announcements).set(updates).where(eq(announcements.id, id));
}

export async function publishAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(announcements).set({
    isPublished: 1,
    publishedAt: new Date(),
  }).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(announcements).where(eq(announcements.id, id));
}

// Admin helpers for schedule management
export async function getAllSchedulesAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schedules).orderBy(desc(schedules.startTime));
}

export async function updateSchedule(id: number, updates: Partial<InsertSchedule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(schedules).set(updates).where(eq(schedules.id, id));
}

export async function deleteSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(schedules).where(eq(schedules.id, id));
}

// Admin helpers for contact submissions
export async function markContactAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(contactSubmissions).set({ status: 'read' }).where(eq(contactSubmissions.id, id));
}

export async function markContactAsResponded(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(contactSubmissions).set({ status: 'responded' }).where(eq(contactSubmissions.id, id));
}


export async function getScheduleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(schedules).where(eq(schedules.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
