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
