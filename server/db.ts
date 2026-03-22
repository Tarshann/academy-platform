import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ENV } from "./_core/env";
import { logger } from "./_core/logger";
import { eq, and, or, ne, gt, desc, asc, inArray, gte, lte, sql, count } from "drizzle-orm";
import {
  users,
  programs,
  announcements,
  schedules,
  sessionRegistrations,
  contactSubmissions,
  galleryPhotos,
  blogPosts,
  videos,
  products,
  campaigns,
  payments,
  subscriptions,
  orders,
  orderItems,
  locations,
  coaches,
  coachAssignments,
  notificationPreferences,
  attendanceRecords,
  userRelations,
  type InsertUser,
  type InsertProgram,
  type InsertAnnouncement,
  type InsertSchedule,
  type InsertSessionRegistration,
  type InsertContactSubmission,
  type InsertGalleryPhoto,
  type InsertBlogPost,
  type InsertVideo,
  type InsertProduct,
  type InsertCampaign,
  type InsertLocation,
  type InsertCoach,
  type InsertCoachAssignment,
  type InsertNotificationPreference,
  type InsertAttendanceRecord,
  type InsertUserRelation,
  athleteMetrics,
  athleteShowcases,
  merchDrops,
  userPoints,
  gameEntries,
  triviaQuestions,
  socialPosts,
  type InsertAthleteMetric,
  type InsertAthleteShowcase,
  type InsertMerchDrop,
  type InsertUserPoint,
  type InsertGameEntry,
  type InsertTriviaQuestion,
  type TriviaQuestion,
  type InsertSocialPost,
  waitlist,
  referrals,
  scheduleTemplates,
  billingReminders,
  onboardingSteps,
  type InsertWaitlistEntry,
  type InsertReferral,
  type InsertScheduleTemplate,
  type InsertBillingReminder,
  type InsertOnboardingStep,
  governanceEvidence,
  type InsertGovernanceEvidence,
} from "../drizzle/schema";

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

let _db: any = null;
let _client: any = null;

export async function getDb() {
  if (!ENV.databaseUrl) {
    logger.error("[DB] DATABASE_URL not set");
    return null;
  }

  if (_db && _client) {
    return _db;
  }

  try {
    _client = postgres(ENV.databaseUrl, {
      ssl: ENV.isProduction ? "require" : undefined,
      max: ENV.isProduction ? 10 : 5,
    });
    _db = drizzle(_client);
    return _db;
  } catch (error) {
    logger.error("[DB] Failed to connect:", error);
    return null;
  }
}

// ============================================================================
// AUTO-MIGRATION: Ensure game tables exist (idempotent)
// ============================================================================

let _gameTablesEnsured = false;

export async function ensureGameTables() {
  if (_gameTablesEnsured) return;
  const db = await getDb();
  if (!db) return;

  try {
    // Create enums (idempotent via DO $$ EXCEPTION block)
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "game_type" AS ENUM ('spin_wheel', 'trivia', 'scratch_card');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "reward_type" AS ENUM ('points', 'discount', 'merch', 'badge', 'none');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    // Create tables (idempotent via IF NOT EXISTS)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "userPoints" (
        "id" serial PRIMARY KEY,
        "userId" integer NOT NULL UNIQUE,
        "totalPoints" integer NOT NULL DEFAULT 0,
        "lifetimePoints" integer NOT NULL DEFAULT 0,
        "currentStreak" integer NOT NULL DEFAULT 0,
        "longestStreak" integer NOT NULL DEFAULT 0,
        "lastPlayedAt" timestamp,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "gameEntries" (
        "id" serial PRIMARY KEY,
        "userId" integer NOT NULL,
        "gameType" "game_type" NOT NULL,
        "rewardType" "reward_type" NOT NULL DEFAULT 'none',
        "rewardValue" varchar(255),
        "pointsEarned" integer NOT NULL DEFAULT 0,
        "metadata" text,
        "playedAt" timestamp DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "triviaQuestions" (
        "id" serial PRIMARY KEY,
        "question" text NOT NULL,
        "optionA" varchar(255) NOT NULL,
        "optionB" varchar(255) NOT NULL,
        "optionC" varchar(255) NOT NULL,
        "optionD" varchar(255) NOT NULL,
        "correctOption" varchar(1) NOT NULL,
        "category" varchar(100),
        "difficulty" varchar(20) NOT NULL DEFAULT 'medium',
        "pointValue" integer NOT NULL DEFAULT 10,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indexes (idempotent)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_gameEntries_user_type_date"
        ON "gameEntries" ("userId", "gameType", "playedAt")
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_gameEntries_user_played"
        ON "gameEntries" ("userId", "playedAt")
    `);

    // Seed trivia questions if table is empty
    const triviaCount = await db.execute(sql`SELECT COUNT(*)::int AS count FROM "triviaQuestions"`);
    const triviaRows = Array.isArray(triviaCount) ? triviaCount : (triviaCount as any).rows ?? [];
    if (Number(triviaRows[0]?.count ?? 0) === 0) {
      logger.info("[DB] Seeding basketball trivia questions...");
      await db.execute(sql`
        INSERT INTO "triviaQuestions" ("question", "optionA", "optionB", "optionC", "optionD", "correctOption", "category", "difficulty", "pointValue", "isActive")
        VALUES
        ('What is the standard height of an NBA basketball hoop?', '9 feet', '10 feet', '11 feet', '12 feet', 'b', 'basketball', 'easy', 10, true),
        ('How many players from one team are on the court at a time?', '4', '5', '6', '7', 'b', 'basketball', 'easy', 10, true),
        ('What is it called when you move with the ball without dribbling?', 'Carrying', 'Traveling', 'Double dribble', 'Palming', 'b', 'basketball', 'easy', 10, true),
        ('How many points is a free throw worth?', '1 point', '2 points', '3 points', 'It varies', 'a', 'basketball', 'easy', 10, true),
        ('What is the name of the line you shoot free throws from?', 'Half court line', 'Free throw line', 'Baseline', 'Three-point line', 'b', 'basketball', 'easy', 10, true),
        ('What does dribbling mean in basketball?', 'Passing the ball', 'Bouncing the ball while moving', 'Shooting the ball', 'Blocking a shot', 'b', 'basketball', 'easy', 10, true),
        ('Which line is furthest from the basket on a basketball court?', 'Free throw line', 'Three-point line', 'Half court line', 'Baseline', 'c', 'basketball', 'easy', 10, true),
        ('What is a rebound in basketball?', 'A stolen ball', 'Catching a missed shot', 'A fast break', 'A timeout', 'b', 'basketball', 'easy', 10, true),
        ('What happens when a player commits 5 fouls in a game?', 'Free throws for the other team', 'They are fouled out', 'A warning is given', 'The team loses a point', 'b', 'basketball', 'easy', 10, true),
        ('How many quarters are in a standard basketball game?', '2', '3', '4', '5', 'c', 'basketball', 'easy', 10, true),
        ('What is a pick and roll?', 'A defensive play', 'When a player sets a screen then rolls to the basket', 'A fast break strategy', 'A type of free throw', 'b', 'basketball', 'medium', 15, true),
        ('What is the triple threat position?', 'When a player can shoot, pass, or dribble', 'When three players guard one', 'A three-pointer attempt', 'A triple double stat line', 'a', 'basketball', 'medium', 15, true),
        ('What does boxing out mean?', 'Fighting in basketball', 'Positioning your body to get a rebound', 'Guarding the three-point line', 'A fast break defense', 'b', 'basketball', 'medium', 15, true),
        ('What is a crossover dribble?', 'Switching the ball from one hand to the other in front of you', 'Dribbling between your legs', 'Spinning while dribbling', 'Passing behind your back', 'a', 'basketball', 'medium', 15, true),
        ('What is a double-double in basketball?', 'Scoring double digits in 2 stat categories', 'Scoring 22 points', 'Getting 2 blocks and 2 steals', 'Making 2 three-pointers', 'a', 'basketball', 'medium', 15, true),
        ('What is the purpose of a pump fake?', 'To pass the ball quickly', 'To fake a shot and get the defender in the air', 'To call a timeout', 'To request a substitution', 'b', 'basketball', 'medium', 15, true),
        ('What is a fast break?', 'A foul during a breakaway', 'Quickly pushing the ball up court before the defense sets up', 'A timeout during the game', 'A half-court shot', 'b', 'basketball', 'medium', 15, true),
        ('In a zone defense, players guard:', 'A specific opponent', 'An area of the court', 'Only the paint', 'Only the three-point line', 'b', 'basketball', 'medium', 15, true),
        ('What is the key or paint on a basketball court?', 'The three-point area', 'The rectangular area near the basket', 'The half-court circle', 'The bench area', 'b', 'basketball', 'medium', 15, true),
        ('What is an and-one in basketball?', 'A bonus free throw after making a basket while being fouled', 'Scoring one extra point', 'A one-on-one drill', 'A type of defense', 'a', 'basketball', 'medium', 15, true),
        ('How long does a team have to advance the ball past half court?', '5 seconds', '8 seconds', '10 seconds', '15 seconds', 'c', 'basketball', 'medium', 15, true),
        ('What is a charge in basketball?', 'An offensive foul for running into a set defender', 'A fast break play', 'A type of timeout', 'A defensive foul', 'a', 'basketball', 'medium', 15, true),
        ('What does spacing mean on offense?', 'Taking breaks between plays', 'Spreading players out to create driving lanes and open shots', 'Standing close together', 'Running fast', 'b', 'basketball', 'medium', 15, true),
        ('What is the weak side of the court?', 'The side with fewer players', 'The side away from the ball', 'The defensive end', 'The bench side', 'b', 'basketball', 'medium', 15, true),
        ('What is a screen or pick in basketball?', 'A defensive steal', 'Standing still to block a defenders path', 'A type of shot', 'A passing technique', 'b', 'basketball', 'medium', 15, true),
        ('What is a euro step?', 'A step-back three pointer', 'A two-step layup where you change direction mid-air', 'A European style free throw', 'A defensive slide drill', 'b', 'basketball', 'hard', 20, true),
        ('What is help-side defense?', 'When a coach helps with defense', 'Positioning away from your man to help stop drives to the basket', 'A full-court press', 'Guarding two players at once', 'b', 'basketball', 'hard', 20, true),
        ('What does reading the defense mean?', 'Studying the playbook', 'Analyzing the defense to make the best offensive decision', 'Watching game film', 'Counting defensive players', 'b', 'basketball', 'hard', 20, true),
        ('What is a high post vs low post position?', 'Standing vs sitting', 'Near the free throw line vs near the basket block', 'Above the rim vs below it', 'First half vs second half', 'b', 'basketball', 'hard', 20, true),
        ('What is the shot clock designed to prevent?', 'Too many shots', 'Teams stalling and not attempting to score', 'Players arguing with refs', 'Too many substitutions', 'b', 'basketball', 'hard', 20, true),
        ('Why is stretching before basketball important?', 'It makes you taller', 'It helps prevent injuries and improves flexibility', 'It makes you faster immediately', 'It is not important', 'b', 'general', 'easy', 10, true),
        ('What should you drink to stay hydrated during a game?', 'Soda', 'Water', 'Coffee', 'Juice only', 'b', 'general', 'easy', 10, true),
        ('How many hours of sleep do teen athletes need per night?', '4-5 hours', '6-7 hours', '8-10 hours', '12+ hours', 'c', 'general', 'easy', 10, true),
        ('What is the best way to improve your basketball shooting?', 'Watch videos only', 'Consistent practice with proper form', 'Play video games', 'Just play games, no practice', 'b', 'general', 'easy', 10, true),
        ('What does good sportsmanship include?', 'Arguing every call', 'Respecting opponents, officials, and teammates', 'Only celebrating your own success', 'Ignoring your coach', 'b', 'general', 'easy', 10, true),
        ('Who is known as the greatest basketball player of all time by many fans?', 'LeBron James', 'Michael Jordan', 'Kobe Bryant', 'Stephen Curry', 'b', 'basketball', 'medium', 15, true),
        ('What does NBA stand for?', 'National Ball Association', 'National Basketball Association', 'North Basketball Alliance', 'National Basketball Academy', 'b', 'basketball', 'medium', 15, true),
        ('Which NBA team has won the most championships?', 'Chicago Bulls', 'Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors', 'c', 'basketball', 'medium', 15, true),
        ('What year was basketball invented?', '1850', '1891', '1920', '1945', 'b', 'basketball', 'medium', 15, true),
        ('Who invented the game of basketball?', 'Michael Jordan', 'James Naismith', 'LeBron James', 'Wilt Chamberlain', 'b', 'basketball', 'medium', 15, true)
        ON CONFLICT DO NOTHING
      `);
      logger.info("[DB] Trivia questions seeded");
    }

    _gameTablesEnsured = true;
    logger.info("[DB] Game tables verified/created successfully");
  } catch (error) {
    logger.error("[DB] Failed to ensure game tables:", error);
    // Don't set flag — retry on next call
  }
}

// ============================================================================
// USER FUNCTIONS
// ============================================================================

export async function upsertUser(
  userData: Partial<InsertUser> & { openId: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.openId, userData.openId))
    .limit(1);

  if (existing.length > 0) {
    const updates: Partial<InsertUser> = {};
    if (userData.name !== undefined) updates.name = userData.name;
    if (userData.email !== undefined) updates.email = userData.email;
    if (userData.loginMethod !== undefined)
      updates.loginMethod = userData.loginMethod;
    if (userData.lastSignedIn !== undefined)
      updates.lastSignedIn = userData.lastSignedIn;
    if (userData.role !== undefined) updates.role = userData.role;
    if (userData.profilePictureUrl !== undefined) updates.profilePictureUrl = userData.profilePictureUrl;

    await db
      .update(users)
      .set(updates)
      .where(eq(users.openId, userData.openId));

    return (
      await db
        .select()
        .from(users)
        .where(eq(users.openId, userData.openId))
        .limit(1)
    )[0];
  } else {
    await db
      .insert(users)
      .values({
        openId: userData.openId,
        name: userData.name ?? null,
        email: userData.email ?? null,
        loginMethod: userData.loginMethod ?? null,
        lastSignedIn: userData.lastSignedIn ?? new Date(),
        role: userData.role ?? "user",
      });
    // Fetch the newly inserted user
    const inserted = await db
      .select()
      .from(users)
      .where(eq(users.openId, userData.openId))
      .limit(1);
    return inserted[0];
  }
}

export async function updateUserProfile(
  userId: number,
  updates: { name?: string; profilePictureUrl?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const setFields: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.name !== undefined) setFields.name = updates.name;
  if (updates.profilePictureUrl !== undefined) setFields.profilePictureUrl = updates.profilePictureUrl;

  await db.update(users).set(setFields).where(eq(users.id, userId));

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0] || null;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

// ============================================================================
// PROGRAM FUNCTIONS
// ============================================================================

export async function getAllPrograms() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(programs)
    .where(eq(programs.isActive, true))
    .orderBy(asc(programs.name));
}

export async function getAllProgramsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(programs).orderBy(asc(programs.name));
}

export async function getProgramBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(programs)
    .where(eq(programs.slug, slug))
    .limit(1);
  return result[0] || null;
}

export async function getProgramById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(programs)
    .where(eq(programs.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createProgram(programData: InsertProgram) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(programs).values(programData).returning();
  return inserted;
}

export async function updateProgram(
  id: number,
  updates: Partial<InsertProgram>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(programs).set(updates).where(eq(programs.id, id));
}

export async function deleteProgram(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(programs).where(eq(programs.id, id));
}

// ============================================================================
// ANNOUNCEMENT FUNCTIONS
// ============================================================================

export async function getPublishedAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(announcements)
    .where(eq(announcements.isPublished, true))
    .orderBy(desc(announcements.publishedAt));
}

export async function getAllAnnouncementsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt));
}

export async function createAnnouncement(announcementData: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db
    .insert(announcements)
    .values(announcementData)
    .returning();
  return inserted;
}

export async function publishAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(announcements)
    .set({ isPublished: true, publishedAt: new Date() })
    .where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(announcements).where(eq(announcements.id, id));
}

// ============================================================================
// SCHEDULE FUNCTIONS
// ============================================================================

export async function getUpcomingSchedules() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return await db
    .select()
    .from(schedules)
    .where(gte(schedules.startTime, now))
    .orderBy(asc(schedules.startTime));
}

export async function getAllSchedulesAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(schedules).orderBy(desc(schedules.startTime));
}

export async function getScheduleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(schedules)
    .where(eq(schedules.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createSchedule(scheduleData: InsertSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(schedules).values(scheduleData).returning();
  return inserted;
}

export async function updateSchedule(
  id: number,
  updates: Partial<InsertSchedule>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schedules).set(updates).where(eq(schedules.id, id));
}

export async function deleteSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(schedules).where(eq(schedules.id, id));
}

// ============================================================================
// SESSION REGISTRATION FUNCTIONS
// ============================================================================

export async function getScheduleRegistrations(scheduleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(sessionRegistrations)
    .where(eq(sessionRegistrations.scheduleId, scheduleId));
}

export async function createSessionRegistration(
  userId: number,
  scheduleId: number,
  paymentId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db
    .insert(sessionRegistrations)
    .values({
      userId,
      scheduleId,
      paymentId: paymentId ?? null,
      status: "registered",
    })
    .returning();
  return inserted;
}

export async function getUserRegistrations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(sessionRegistrations)
    .where(eq(sessionRegistrations.userId, userId))
    .orderBy(desc(sessionRegistrations.registeredAt));
}

// ============================================================================
// CONTACT SUBMISSION FUNCTIONS
// ============================================================================

export async function createContactSubmission(
  submissionData: InsertContactSubmission
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db
    .insert(contactSubmissions)
    .values(submissionData)
    .returning();
  return inserted;
}

export async function getContactSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(contactSubmissions)
    .orderBy(desc(contactSubmissions.createdAt));
}

export async function markContactAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(contactSubmissions)
    .set({ status: "read" })
    .where(eq(contactSubmissions.id, id));
}

export async function markContactAsResponded(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(contactSubmissions)
    .set({ status: "responded" })
    .where(eq(contactSubmissions.id, id));
}

// ============================================================================
// GALLERY PHOTO FUNCTIONS
// ============================================================================

export async function getAllGalleryPhotos(opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];

  // DB-level sort: photos with imageUrl first, then by newest
  const query = db
    .select()
    .from(galleryPhotos)
    .where(eq(galleryPhotos.isVisible, true))
    .orderBy(
      sql`CASE WHEN ${galleryPhotos.imageUrl} IS NOT NULL AND TRIM(${galleryPhotos.imageUrl}) != '' THEN 0 ELSE 1 END`,
      desc(galleryPhotos.createdAt)
    )
    .$dynamic();

  if (opts?.limit != null) {
    query.limit(opts.limit);
  }
  if (opts?.offset != null) {
    query.offset(opts.offset);
  }

  return await query;
}

export async function getGalleryPhotosByCategory(category: string, opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];

  const query = db
    .select()
    .from(galleryPhotos)
    .where(
      and(
        eq(galleryPhotos.isVisible, true),
        eq(galleryPhotos.category, category as any)
      )
    )
    .orderBy(
      sql`CASE WHEN ${galleryPhotos.imageUrl} IS NOT NULL AND TRIM(${galleryPhotos.imageUrl}) != '' THEN 0 ELSE 1 END`,
      desc(galleryPhotos.createdAt)
    )
    .$dynamic();

  if (opts?.limit != null) {
    query.limit(opts.limit);
  }
  if (opts?.offset != null) {
    query.offset(opts.offset);
  }

  return await query;
}

export async function createGalleryPhoto(photoData: InsertGalleryPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(galleryPhotos).values(photoData).returning();
  return inserted;
}

export async function deleteGalleryPhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, id));
}

export async function toggleGalleryPhotoVisibility(
  id: number,
  isVisible: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(galleryPhotos)
    .set({ isVisible })
    .where(eq(galleryPhotos.id, id));
}

// ============================================================================
// BLOG POST FUNCTIONS
// ============================================================================

export async function getAllPublishedBlogPosts(opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true))
    .orderBy(desc(blogPosts.publishedAt))
    .$dynamic();
  if (opts?.limit != null) query = query.limit(opts.limit);
  if (opts?.offset != null) query = query.offset(opts.offset);
  return await query;
}

export async function getAllBlogPostsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
}

export async function getBlogPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  return result[0] || null;
}

export async function createBlogPost(postData: InsertBlogPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(blogPosts).values(postData).returning();
  return inserted;
}

export async function updateBlogPost(
  id: number,
  updates: Partial<InsertBlogPost>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(blogPosts).set(updates).where(eq(blogPosts.id, id));
}

export async function publishBlogPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(blogPosts)
    .set({ isPublished: true, publishedAt: new Date() })
    .where(eq(blogPosts.id, id));
}

export async function deleteBlogPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

// ============================================================================
// VIDEO FUNCTIONS
// ============================================================================

export async function getAllVideos(onlyPublished: boolean = false, opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  if (onlyPublished) {
    let query = db
      .select()
      .from(videos)
      .where(eq(videos.isPublished, true))
      .orderBy(desc(videos.createdAt))
      .$dynamic();
    if (opts?.limit != null) query = query.limit(opts.limit);
    if (opts?.offset != null) query = query.offset(opts.offset);
    return await query;
  }
  let query = db.select().from(videos).orderBy(desc(videos.createdAt)).$dynamic();
  if (opts?.limit != null) query = query.limit(opts.limit);
  if (opts?.offset != null) query = query.offset(opts.offset);
  return await query;
}

export async function getVideoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(videos)
    .where(eq(videos.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getVideosByCategory(
  category: string,
  onlyPublished: boolean = false,
  opts?: { limit?: number; offset?: number }
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(videos.category, category as any)];
  if (onlyPublished) {
    conditions.push(eq(videos.isPublished, true));
  }
  let query = db
    .select()
    .from(videos)
    .where(and(...conditions))
    .orderBy(desc(videos.createdAt))
    .$dynamic();
  if (opts?.limit != null) query = query.limit(opts.limit);
  if (opts?.offset != null) query = query.offset(opts.offset);
  return await query;
}

export async function incrementVideoViewCount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(videos)
    .set({ viewCount: sql`${videos.viewCount} + 1` })
    .where(eq(videos.id, id));
}

export async function createVideo(videoData: InsertVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(videos).values(videoData).returning();
  return inserted;
}

export async function updateVideo(id: number, updates: Partial<InsertVideo>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(videos).set(updates).where(eq(videos.id, id));
}

export async function deleteVideo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(videos).where(eq(videos.id, id));
}

// ============================================================================
// PRODUCT FUNCTIONS
// ============================================================================

export async function getAllProducts(opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db
    .select()
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        sql`lower(${products.name}) NOT LIKE '%test%'`,
        sql`lower(coalesce(${products.description}, '')) NOT LIKE '%test%'`
      )
    )
    .orderBy(asc(products.name))
    .$dynamic();
  if (opts?.limit != null) query = query.limit(opts.limit);
  if (opts?.offset != null) query = query.offset(opts.offset);
  return await query;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createProduct(productData: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(products).values(productData).returning();
  return inserted;
}

export async function updateProduct(
  id: number,
  updates: Partial<InsertProduct>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(updates).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(products).where(eq(products.id, id));
}

// ============================================================================
// CAMPAIGN FUNCTIONS
// ============================================================================

export async function getAllCampaigns() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.isActive, true),
        sql`lower(${campaigns.name}) NOT LIKE '%test%'`,
        sql`lower(coalesce(${campaigns.description}, '')) NOT LIKE '%test%'`
      )
    )
    .orderBy(desc(campaigns.startDate));
}

export async function getActiveCampaigns() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.isActive, true),
        lte(campaigns.startDate, now),
        gte(campaigns.endDate, now),
        sql`lower(${campaigns.name}) NOT LIKE '%test%'`,
        sql`lower(coalesce(${campaigns.description}, '')) NOT LIKE '%test%'`
      )
    )
    .orderBy(desc(campaigns.startDate));
}

export async function createCampaign(campaignData: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(campaigns).values(campaignData).returning();
  return inserted;
}

export async function updateCampaign(
  id: number,
  updates: Partial<InsertCampaign>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(campaigns).set(updates).where(eq(campaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(campaigns).where(eq(campaigns.id, id));
}

// ============================================================================
// PAYMENT FUNCTIONS
// ============================================================================

export async function getUserPayments(userId: number, opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .$dynamic();
  if (opts?.limit != null) query = query.limit(opts.limit);
  if (opts?.offset != null) query = query.offset(opts.offset);
  return await query;
}

export async function getUserSubscriptions(userId: number, opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .$dynamic();
  if (opts?.limit != null) query = query.limit(opts.limit);
  if (opts?.offset != null) query = query.offset(opts.offset);
  return await query;
}

// ============================================================================
// ORDER FUNCTIONS
// ============================================================================

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createOrder(orderData: {
  userId: number;
  stripeCheckoutSessionId?: string;
  totalAmount: string;
  shippingAddress?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db
    .insert(orders)
    .values({
      userId: orderData.userId,
      stripeCheckoutSessionId: orderData.stripeCheckoutSessionId ?? null,
      totalAmount: orderData.totalAmount,
      status: "pending",
      shippingAddress: orderData.shippingAddress ?? null,
    })
    .returning();
  return inserted;
}

export async function createOrderItem(itemData: {
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(orderItems).values(itemData).returning();
  return inserted;
}

export async function updateOrderStatus(
  id: number,
  status:
    | "pending"
    | "paid"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

// ============================================================================
// LOCATION FUNCTIONS
// ============================================================================

export async function getAllLocations(opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db
    .select()
    .from(locations)
    .where(eq(locations.isActive, true))
    .orderBy(asc(locations.name))
    .$dynamic();
  if (opts?.limit != null) query = query.limit(opts.limit);
  if (opts?.offset != null) query = query.offset(opts.offset);
  return await query;
}

export async function getAllLocationsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(locations).orderBy(asc(locations.name));
}

export async function getLocationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(locations)
    .where(eq(locations.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createLocation(locationData: InsertLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(locations).values(locationData).returning();
  return inserted.id;
}

export async function updateLocation(
  id: number,
  updates: Partial<InsertLocation>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(locations).set(updates).where(eq(locations.id, id));
}

export async function deleteLocation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(locations).where(eq(locations.id, id));
}

// ============================================================================
// COACH FUNCTIONS
// ============================================================================

export async function getAllCoaches(opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db
    .select({
      id: coaches.id,
      userId: coaches.userId,
      bio: coaches.bio,
      specialties: coaches.specialties,
      certifications: coaches.certifications,
      isActive: coaches.isActive,
      createdAt: coaches.createdAt,
      updatedAt: coaches.updatedAt,
      name: users.name,
      email: users.email,
    })
    .from(coaches)
    .leftJoin(users, eq(coaches.userId, users.id))
    .where(eq(coaches.isActive, true))
    .orderBy(asc(coaches.id))
    .$dynamic();
  if (opts?.limit != null) query = query.limit(opts.limit);
  if (opts?.offset != null) query = query.offset(opts.offset);
  return await query;
}

export async function getAllCoachesAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(coaches).orderBy(asc(coaches.id));
}

export async function getCoachById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(coaches)
    .where(eq(coaches.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createCoach(coachData: InsertCoach) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(coaches).values(coachData).returning();
  return inserted.id;
}

export async function updateCoach(id: number, updates: Partial<InsertCoach>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(coaches).set(updates).where(eq(coaches.id, id));
}

export async function deleteCoach(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(coaches).where(eq(coaches.id, id));
}

// ============================================================================
// COACH ASSIGNMENT FUNCTIONS
// ============================================================================

export async function getCoachAssignments(
  coachId?: number,
  programId?: number,
  scheduleId?: number
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (coachId) conditions.push(eq(coachAssignments.coachId, coachId));
  if (programId) conditions.push(eq(coachAssignments.programId, programId));
  if (scheduleId) conditions.push(eq(coachAssignments.scheduleId, scheduleId));

  if (conditions.length > 0) {
    return await db
      .select()
      .from(coachAssignments)
      .where(and(...conditions));
  }

  return await db.select().from(coachAssignments);
}

export async function createCoachAssignment(
  assignmentData: InsertCoachAssignment
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db
    .insert(coachAssignments)
    .values(assignmentData)
    .returning();
  return inserted.id;
}

export async function deleteCoachAssignment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(coachAssignments).where(eq(coachAssignments.id, id));
}

// ============================================================================
// NOTIFICATION PREFERENCE FUNCTIONS
// ============================================================================

export async function getUserNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return result[0] || null;
}

export async function createOrUpdateNotificationPreferences(
  userId: number,
  preferences: Partial<InsertNotificationPreference>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserNotificationPreferences(userId);

  if (existing) {
    await db
      .update(notificationPreferences)
      .set(preferences)
      .where(eq(notificationPreferences.userId, userId));
  } else {
    await db.insert(notificationPreferences).values({
      userId,
      ...preferences,
    });
  }
}

// ============================================================================
// ATTENDANCE FUNCTIONS
// ============================================================================

export async function markAttendance(attendanceData: InsertAttendanceRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if attendance already exists
  const existing = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.userId, attendanceData.userId),
        eq(attendanceRecords.scheduleId, attendanceData.scheduleId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(attendanceRecords)
      .set({
        status: attendanceData.status,
        notes: attendanceData.notes ?? null,
        markedBy: attendanceData.markedBy ?? null,
        markedAt: new Date(),
      })
      .where(eq(attendanceRecords.id, existing[0].id));
    return existing[0].id;
  } else {
    // Create new
    const [inserted] = await db
      .insert(attendanceRecords)
      .values(attendanceData)
      .returning();
    return inserted.id;
  }
}

export async function getAttendanceBySchedule(scheduleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.scheduleId, scheduleId))
    .orderBy(asc(attendanceRecords.userId));
}

export async function getAttendanceByUser(userId: number, opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.userId, userId))
    .orderBy(desc(attendanceRecords.markedAt))
    .$dynamic();
  if (opts?.limit != null) query = query.limit(opts.limit);
  if (opts?.offset != null) query = query.offset(opts.offset);
  return await query;
}

export async function getAttendanceStats(
  userId: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) return { present: 0, absent: 0, excused: 0, late: 0, total: 0 };

  const conditions = [eq(attendanceRecords.userId, userId)];
  if (startDate) {
    conditions.push(gte(attendanceRecords.markedAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(attendanceRecords.markedAt, endDate));
  }

  const records = await db
    .select()
    .from(attendanceRecords)
    .where(and(...conditions));

  const stats = {
    present: records.filter((r: any) => r.status === "present").length,
    absent: records.filter((r: any) => r.status === "absent").length,
    excused: records.filter((r: any) => r.status === "excused").length,
    late: records.filter((r: any) => r.status === "late").length,
    total: records.length,
  };

  return stats;
}

export async function updateAttendance(
  id: number,
  updates: Partial<InsertAttendanceRecord>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(attendanceRecords)
    .set(updates)
    .where(eq(attendanceRecords.id, id));
}

// ============================================================================
// USER RELATIONS (PARENT-CHILD) FUNCTIONS
// ============================================================================

export async function getUserRelations(parentId?: number, childId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (parentId) {
    conditions.push(eq(userRelations.parentId, parentId));
  }
  if (childId) {
    conditions.push(eq(userRelations.childId, childId));
  }

  if (conditions.length > 0) {
    return await db
      .select()
      .from(userRelations)
      .where(and(...conditions));
  }

  return await db.select().from(userRelations);
}

export async function createUserRelation(relation: InsertUserRelation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db
    .insert(userRelations)
    .values(relation)
    .returning();
  return inserted.id;
}

export async function deleteUserRelation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userRelations).where(eq(userRelations.id, id));
}

export async function getChildrenForParent(parentId: number) {
  const db = await getDb();
  if (!db) return [];

  const relations = await db
    .select()
    .from(userRelations)
    .where(eq(userRelations.parentId, parentId));

  const childIds = relations.map((r: any) => r.childId);
  if (childIds.length === 0) return [];

  return await db.select().from(users).where(inArray(users.id, childIds));
}

export async function getParentsForChild(childId: number) {
  const db = await getDb();
  if (!db) return [];

  const relations = await db
    .select()
    .from(userRelations)
    .where(eq(userRelations.childId, childId));

  const parentIds = relations.map((r: any) => r.parentId);
  if (parentIds.length === 0) return [];

  return await db.select().from(users).where(inArray(users.id, parentIds));
}


// ============================================================================
// DIRECT MESSAGING FUNCTIONS
// ============================================================================

import {
  dmConversations,
  dmParticipants,
  dmMessages,
  dmReadReceipts,
  userBlocks,
  userMessagingRoles,
  pushSubscriptions,
  notificationSettings,
  notificationLogs,
  type InsertDmConversation,
  type InsertDmParticipant,
  type InsertDmMessage,
  type InsertDmReadReceipt,
  type InsertUserBlock,
  type InsertUserMessagingRole,
  type InsertPushSubscription,
  type InsertNotificationSetting,
  type InsertNotificationLog,
} from "../drizzle/schema";

// Lightweight check: is userId a participant in conversationId?
export async function isConversationParticipant(
  conversationId: number,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select({ id: dmParticipants.id })
    .from(dmParticipants)
    .where(
      and(
        eq(dmParticipants.conversationId, conversationId),
        eq(dmParticipants.userId, userId)
      )
    )
    .limit(1);

  return result.length > 0;
}

// Get or create a conversation between two users
export async function getOrCreateConversation(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Find existing conversation between these two users
  const existingParticipants = await db
    .select()
    .from(dmParticipants)
    .where(eq(dmParticipants.userId, userId1));

  for (const p1 of existingParticipants) {
    const otherParticipant = await db
      .select()
      .from(dmParticipants)
      .where(
        and(
          eq(dmParticipants.conversationId, p1.conversationId),
          eq(dmParticipants.userId, userId2)
        )
      )
      .limit(1);

    if (otherParticipant.length > 0) {
      // Found existing conversation
      const conversation = await db
        .select()
        .from(dmConversations)
        .where(eq(dmConversations.id, p1.conversationId))
        .limit(1);
      return conversation[0];
    }
  }

  // Create new conversation
  const [newConv] = await db.insert(dmConversations).values({}).returning();
  const conversationId = newConv.id;

  // Add both participants
  await db.insert(dmParticipants).values([
    { conversationId, userId: userId1 },
    { conversationId, userId: userId2 },
  ]);

  const newConversation = await db
    .select()
    .from(dmConversations)
    .where(eq(dmConversations.id, conversationId))
    .limit(1);

  return newConversation[0];
}

// Get all conversations for a user
export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const participations = await db
    .select()
    .from(dmParticipants)
    .where(
      and(
        eq(dmParticipants.userId, userId),
        eq(dmParticipants.isArchived, false)
      )
    );

  const conversations = [];
  for (const p of participations) {
    const conversation = await db
      .select()
      .from(dmConversations)
      .where(eq(dmConversations.id, p.conversationId))
      .limit(1);

    if (conversation.length > 0) {
      // Get other participant
      const otherParticipant = await db
        .select()
        .from(dmParticipants)
        .where(
          and(
            eq(dmParticipants.conversationId, p.conversationId),
            ne(dmParticipants.userId, userId)
          )
        )
        .limit(1);

      // Get last message
      const lastMessage = await db
        .select()
        .from(dmMessages)
        .where(eq(dmMessages.conversationId, p.conversationId))
        .orderBy(desc(dmMessages.createdAt))
        .limit(1);

      // Get unread count using Drizzle operators (not raw sql) for proper Date serialization
      const unreadConditions = [
        eq(dmMessages.conversationId, p.conversationId),
        ne(dmMessages.senderId, userId),
      ];
      if (p.lastReadAt) {
        unreadConditions.push(gt(dmMessages.createdAt, p.lastReadAt));
      }
      const [unreadResult] = await db
        .select({ value: count() })
        .from(dmMessages)
        .where(and(...unreadConditions));

      let otherUser = null;
      if (otherParticipant.length > 0) {
        otherUser = await db
          .select()
          .from(users)
          .where(eq(users.id, otherParticipant[0].userId))
          .limit(1);
      }

      conversations.push({
        ...conversation[0],
        participant: p,
        otherUser: otherUser?.[0] || null,
        lastMessage: lastMessage[0] || null,
        unreadCount: Number(unreadResult?.value ?? 0),
      });
    }
  }

  // Sort by last message time
  conversations.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt?.getTime() || 0;
    const bTime = b.lastMessage?.createdAt?.getTime() || 0;
    return bTime - aTime;
  });

  return conversations;
}

// Get messages for a conversation
export async function getConversationMessages(
  conversationId: number,
  limit = 50,
  before?: number
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(dmMessages.conversationId, conversationId)];
  if (before) {
    conditions.push(sql`${dmMessages.id} < ${before}`);
  }

  return await db
    .select()
    .from(dmMessages)
    .where(and(...conditions))
    .orderBy(desc(dmMessages.createdAt))
    .limit(limit);
}

// Send a DM
export async function sendDmMessage(
  conversationId: number,
  senderId: number,
  senderName: string,
  content: string,
  imageUrl?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [newMessage] = await db.insert(dmMessages).values({
    conversationId,
    senderId,
    senderName,
    content,
    ...(imageUrl ? { imageUrl } : {}),
  }).returning();

  // Update conversation lastMessageAt
  await db
    .update(dmConversations)
    .set({ lastMessageAt: new Date(), updatedAt: new Date() })
    .where(eq(dmConversations.id, conversationId));

  return newMessage;
}

// Mark messages as read
export async function markConversationAsRead(
  conversationId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(dmParticipants)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(dmParticipants.conversationId, conversationId),
        eq(dmParticipants.userId, userId)
      )
    );
}

// Check if user can DM another user (role-based)
export async function canUserDm(senderId: number, recipientId: number) {
  const db = await getDb();
  if (!db) return false;

  // Check if blocked
  const blocked = await db
    .select()
    .from(userBlocks)
    .where(
      or(
        and(
          eq(userBlocks.blockerId, senderId),
          eq(userBlocks.blockedId, recipientId)
        ),
        and(
          eq(userBlocks.blockerId, recipientId),
          eq(userBlocks.blockedId, senderId)
        )
      )
    )
    .limit(1);

  if (blocked.length > 0) return false;

  // Get sender's messaging role
  const senderRole = await db
    .select()
    .from(userMessagingRoles)
    .where(eq(userMessagingRoles.userId, senderId))
    .limit(1);

  // Get recipient's messaging role
  const recipientRole = await db
    .select()
    .from(userMessagingRoles)
    .where(eq(userMessagingRoles.userId, recipientId))
    .limit(1);

  // Derive messaging role from users.role when no userMessagingRoles entry exists
  // users.role "admin" → messaging role "admin"; users.role "user" → "parent"
  async function fallbackMessagingRole(userId: number): Promise<string> {
    const [u] = await db!.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    return u?.role === "admin" ? "admin" : "parent";
  }

  // Default permissions if no role set
  const senderPerms = senderRole[0] || {
    messagingRole: await fallbackMessagingRole(senderId),
    canDmCoaches: true,
    canDmParents: false,
    canDmAthletes: false,
  };
  const recipientPerms = recipientRole[0] || { messagingRole: await fallbackMessagingRole(recipientId) };

  // Check permissions based on roles
  if (
    senderPerms.messagingRole === "coach" ||
    senderPerms.messagingRole === "staff" ||
    senderPerms.messagingRole === "admin"
  ) {
    // Coaches/staff/admin can DM anyone
    return true;
  }

  if (senderPerms.messagingRole === "parent") {
    // Parents can DM coaches
    if (
      recipientPerms.messagingRole === "coach" ||
      recipientPerms.messagingRole === "staff" ||
      recipientPerms.messagingRole === "admin"
    ) {
      return senderPerms.canDmCoaches;
    }
    // Parents can DM other parents if enabled
    if (recipientPerms.messagingRole === "parent") {
      return senderPerms.canDmParents;
    }
  }

  if (senderPerms.messagingRole === "athlete") {
    // Athletes can only DM coaches
    if (
      recipientPerms.messagingRole === "coach" ||
      recipientPerms.messagingRole === "staff" ||
      recipientPerms.messagingRole === "admin"
    ) {
      return true;
    }
    return false;
  }

  return false;
}

// Block a user
export async function blockUser(blockerId: number, blockedId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already blocked
  const existing = await db
    .select()
    .from(userBlocks)
    .where(
      and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId))
    )
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const [inserted] = await db.insert(userBlocks).values({
    blockerId,
    blockedId,
    reason,
  }).returning();

  return inserted.id;
}

// Unblock a user
export async function unblockUser(blockerId: number, blockedId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(userBlocks)
    .where(
      and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId))
    );
}

// Get blocked users
export async function getBlockedUsers(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const blocks = await db
    .select()
    .from(userBlocks)
    .where(eq(userBlocks.blockerId, userId));

  const blockedUserIds = blocks.map((b: any) => b.blockedId);
  if (blockedUserIds.length === 0) return [];

  return await db.select().from(users).where(inArray(users.id, blockedUserIds));
}

// Mute a conversation
export async function muteConversation(
  conversationId: number,
  userId: number,
  until?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(dmParticipants)
    .set({ isMuted: true, mutedUntil: until || null })
    .where(
      and(
        eq(dmParticipants.conversationId, conversationId),
        eq(dmParticipants.userId, userId)
      )
    );
}

// Unmute a conversation
export async function unmuteConversation(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(dmParticipants)
    .set({ isMuted: false, mutedUntil: null })
    .where(
      and(
        eq(dmParticipants.conversationId, conversationId),
        eq(dmParticipants.userId, userId)
      )
    );
}

// Archive a conversation
export async function archiveConversation(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(dmParticipants)
    .set({ isArchived: true })
    .where(
      and(
        eq(dmParticipants.conversationId, conversationId),
        eq(dmParticipants.userId, userId)
      )
    );
}

// Search messages
export async function searchDmMessages(userId: number, query: string, opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];

  // Get user's conversations
  const participations = await db
    .select()
    .from(dmParticipants)
    .where(eq(dmParticipants.userId, userId));

  const conversationIds = participations.map((p: any) => p.conversationId);
  if (conversationIds.length === 0) return [];

  const effectiveLimit = Math.min(opts?.limit ?? 20, 100);

  // Search messages in those conversations
  // Parameterized query with escaped LIKE wildcards to prevent SQL injection
  const escapedQuery = query.replace(/[%_\\]/g, "\\$&");
  let dbQuery = db
    .select()
    .from(dmMessages)
    .where(
      and(
        inArray(dmMessages.conversationId, conversationIds),
        sql`${dmMessages.content} ILIKE ${"%" + escapedQuery + "%"}`
      )
    )
    .orderBy(desc(dmMessages.createdAt))
    .$dynamic();
  dbQuery = dbQuery.limit(effectiveLimit);
  if (opts?.offset != null) dbQuery = dbQuery.offset(opts.offset);
  return await dbQuery;
}

// Get or create user messaging role
export async function getOrCreateUserMessagingRole(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(userMessagingRoles)
    .where(eq(userMessagingRoles.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(userMessagingRoles).values({ userId });

  const created = await db
    .select()
    .from(userMessagingRoles)
    .where(eq(userMessagingRoles.userId, userId))
    .limit(1);

  return created[0];
}

// Update user messaging role
export async function updateUserMessagingRole(
  userId: number,
  updates: Partial<InsertUserMessagingRole>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await getOrCreateUserMessagingRole(userId);

  await db
    .update(userMessagingRoles)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(userMessagingRoles.userId, userId));
}

// Get users available for DM (based on role permissions)
export async function getAvailableDmUsers(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const userRole = await getOrCreateUserMessagingRole(userId);

  // Get all users with their messaging roles
  const allUsers = await db.select().from(users).where(sql`${users.id} != ${userId}`);

  const availableUsers = [];
  for (const user of allUsers) {
    const canDm = await canUserDm(userId, user.id);
    if (canDm) {
      const role = await db
        .select()
        .from(userMessagingRoles)
        .where(eq(userMessagingRoles.userId, user.id))
        .limit(1);

      availableUsers.push({
        ...user,
        messagingRole: role[0]?.messagingRole || (user.role === "admin" ? "admin" : "parent"),
      });
    }
  }

  return availableUsers;
}

// ============================================================================
// PUSH NOTIFICATION FUNCTIONS
// ============================================================================

// Save push subscription (web push via endpoint)
export async function savePushSubscription(
  userId: number,
  endpoint: string,
  p256dh: string,
  auth: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Atomic upsert by endpoint (unique per browser push subscription)
  const [row] = await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint,
      p256dh,
      auth,
      userAgent,
    })
    .onConflictDoUpdate({
      target: [pushSubscriptions.endpoint],
      set: {
        p256dh: sql`excluded."p256dh"`,
        auth: sql`excluded."auth"`,
        userAgent: sql`excluded."userAgent"`,
        isActive: sql`true`,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return row.id;
}

// Get user's push subscriptions
export async function getUserPushSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.isActive, true)));
}

// Remove push subscription
export async function removePushSubscription(userId: number, endpoint: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(pushSubscriptions)
    .set({ isActive: false })
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        sql`${pushSubscriptions.endpoint} = ${endpoint}`
      )
    );
}

// Get or create notification settings
export async function getOrCreateNotificationSettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(notificationSettings).values({ userId });

  const created = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1);

  return created[0];
}

// Update notification settings
export async function updateNotificationSettings(
  userId: number,
  updates: Partial<InsertNotificationSetting>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await getOrCreateNotificationSettings(userId);

  await db
    .update(notificationSettings)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(notificationSettings.userId, userId));
}

// Log a notification
export async function logNotification(
  userId: number,
  type: "push" | "email",
  title: string,
  body?: string,
  data?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(notificationLogs).values({
    userId,
    type,
    title,
    body,
    data,
  }).returning();

  return inserted.id;
}

// Update notification log status
export async function updateNotificationLogStatus(
  id: number,
  status: "pending" | "sent" | "failed" | "clicked",
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: any = { status };
  if (status === "sent") updates.sentAt = new Date();
  if (status === "clicked") updates.clickedAt = new Date();
  if (errorMessage) updates.errorMessage = errorMessage;

  await db.update(notificationLogs).set(updates).where(eq(notificationLogs.id, id));
}

// Get users to notify for a DM
export async function getUsersToNotifyForDm(conversationId: number, senderId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get other participants
  const participants = await db
    .select()
    .from(dmParticipants)
    .where(
      and(
        eq(dmParticipants.conversationId, conversationId),
        ne(dmParticipants.userId, senderId),
        eq(dmParticipants.isMuted, false)
      )
    );

  const usersToNotify = [];
  for (const p of participants) {
    const settings = await getOrCreateNotificationSettings(p.userId);
    if (settings.dmNotifications) {
      const user = await getUserById(p.userId);
      const subscriptions = await getUserPushSubscriptions(p.userId);
      usersToNotify.push({
        user,
        settings,
        subscriptions,
      });
    }
  }

  return usersToNotify;
}

// Get all users for a specific role
export async function getUsersByMessagingRole(role: string) {
  const db = await getDb();
  if (!db) return [];

  const roles = await db
    .select()
    .from(userMessagingRoles)
    .where(eq(userMessagingRoles.messagingRole, role as any));

  const userIds = roles.map((r: any) => r.userId);
  if (userIds.length === 0) return [];

  return await db.select().from(users).where(inArray(users.id, userIds));
}

// ============================================================================
// ATHLETE METRICS
// ============================================================================

export async function getAthleteMetrics(athleteId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(athleteMetrics)
      .where(eq(athleteMetrics.athleteId, athleteId))
      .orderBy(desc(athleteMetrics.sessionDate));
  } catch (err) {
    logger.error("[metrics] getAthleteMetrics failed:", err);
    return [];
  }
}

export async function getAthleteMetricsByName(athleteId: number, metricName: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(athleteMetrics)
    .where(
      and(
        eq(athleteMetrics.athleteId, athleteId),
        eq(athleteMetrics.metricName, metricName)
      )
    )
    .orderBy(asc(athleteMetrics.sessionDate));
}

export async function getAllMetricsAdmin() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(athleteMetrics)
      .orderBy(desc(athleteMetrics.createdAt));
  } catch (err) {
    logger.error("[metrics] getAllMetricsAdmin failed:", err);
    return [];
  }
}

export async function createAthleteMetric(data: InsertAthleteMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [metric] = await db.insert(athleteMetrics).values(data).returning();
  return metric;
}

export async function updateAthleteMetric(id: number, data: Partial<Omit<InsertAthleteMetric, 'id' | 'recordedBy' | 'createdAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [metric] = await db.update(athleteMetrics).set(data).where(eq(athleteMetrics.id, id)).returning();
  return metric;
}

export async function deleteAthleteMetric(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(athleteMetrics).where(eq(athleteMetrics.id, id));
}

// ============================================================================
// ATHLETE SHOWCASES
// ============================================================================

export async function getActiveShowcases() {
  const db = await getDb();
  if (!db) return [];
  try {
    const now = new Date();
    return await db
      .select()
      .from(athleteShowcases)
      .where(
        and(
          eq(athleteShowcases.isActive, true),
          lte(athleteShowcases.featuredFrom, now),
          // Exclude expired showcases — null featuredUntil means no expiry
          or(
            sql`${athleteShowcases.featuredUntil} IS NULL`,
            gte(athleteShowcases.featuredUntil, now)
          )
        )
      )
      .orderBy(desc(athleteShowcases.featuredFrom));
  } catch (err) {
    logger.error("[showcases] getActiveShowcases failed:", err);
    return [];
  }
}

export async function getAllShowcasesAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(athleteShowcases)
    .orderBy(desc(athleteShowcases.createdAt));
}

export async function createShowcase(data: InsertAthleteShowcase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [showcase] = await db.insert(athleteShowcases).values(data).returning();
  return showcase;
}

export async function updateShowcase(id: number, data: Partial<InsertAthleteShowcase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [showcase] = await db
    .update(athleteShowcases)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(athleteShowcases.id, id))
    .returning();
  return showcase;
}

export async function deleteShowcase(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(athleteShowcases).where(eq(athleteShowcases.id, id));
}

// ============================================================================
// MERCH DROPS
// ============================================================================

export async function getUpcomingDrops() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(merchDrops)
      .where(eq(merchDrops.isSent, false))
      .orderBy(asc(merchDrops.scheduledAt));
  } catch (err) {
    logger.error("[merchDrops] getUpcomingDrops failed:", err);
    return [];
  }
}

export async function getAllDropsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(merchDrops)
    .orderBy(desc(merchDrops.createdAt));
}

export async function createMerchDrop(data: InsertMerchDrop) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [drop] = await db.insert(merchDrops).values(data).returning();
  return drop;
}

export async function markDropSent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [drop] = await db
    .update(merchDrops)
    .set({ isSent: true, sentAt: new Date() })
    .where(eq(merchDrops.id, id))
    .returning();
  return drop;
}

export async function updateMerchDrop(id: number, data: Partial<InsertMerchDrop>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { title, description, dropType, imageUrl, scheduledAt } = data;
  const [drop] = await db
    .update(merchDrops)
    .set({ title, description, dropType, imageUrl, scheduledAt })
    .where(eq(merchDrops.id, id))
    .returning();
  return drop;
}

export async function incrementDropView(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(merchDrops)
    .set({ viewCount: sql`${merchDrops.viewCount} + 1` })
    .where(eq(merchDrops.id, id));
}

export async function incrementDropClick(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(merchDrops)
    .set({ clickCount: sql`${merchDrops.clickCount} + 1` })
    .where(eq(merchDrops.id, id));
}

export async function deleteMerchDrop(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(merchDrops).where(eq(merchDrops.id, id));
}

// ============================================================================
// GAMES & REWARDS
// ============================================================================

export async function getUserPoints(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [points] = await db
    .select()
    .from(userPoints)
    .where(eq(userPoints.userId, userId));
  return points ?? null;
}

export async function getOrCreateUserPoints(userId: number) {
  await ensureGameTables();
  const existing = await getUserPoints(userId);
  if (existing) return existing;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [points] = await db
    .insert(userPoints)
    .values({ userId, totalPoints: 0, lifetimePoints: 0 })
    .onConflictDoNothing({ target: userPoints.userId })
    .returning();
  // If conflict occurred, the row already exists — fetch it
  if (!points) {
    const [existing] = await db
      .select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId));
    return existing;
  }
  return points;
}

export async function addUserPoints(userId: number, amount: number) {
  // Ensure the row exists first
  await getOrCreateUserPoints(userId);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Atomic increment — safe under concurrency
  const [updated] = await db
    .update(userPoints)
    .set({
      totalPoints: sql`${userPoints.totalPoints} + ${amount}`,
      lifetimePoints: sql`${userPoints.lifetimePoints} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(userPoints.userId, userId))
    .returning();
  return updated;
}

export async function updateUserStreak(userId: number, streak: number) {
  await getOrCreateUserPoints(userId);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Atomic: set currentStreak and update longestStreak only if new streak is larger
  const [updated] = await db
    .update(userPoints)
    .set({
      currentStreak: streak,
      longestStreak: sql`GREATEST(${userPoints.longestStreak}, ${streak})`,
      lastPlayedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userPoints.userId, userId))
    .returning();
  return updated;
}

/**
 * Update a user's play streak. Call after a successful game play.
 * If they played yesterday -> increment. Already played today -> no-op. Otherwise -> reset to 1.
 */
export async function refreshUserStreak(userId: number) {
  const points = await getOrCreateUserPoints(userId);
  const db = await getDb();
  if (!db) return;

  const lastPlayed = points.lastPlayedAt;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);

  let newStreak: number;
  if (lastPlayed && lastPlayed >= todayStart) {
    // Already played today — keep current streak
    return;
  } else if (lastPlayed && lastPlayed >= yesterdayStart) {
    // Played yesterday — increment streak
    newStreak = points.currentStreak + 1;
  } else {
    // Streak broken — reset to 1
    newStreak = 1;
  }

  await db
    .update(userPoints)
    .set({
      currentStreak: newStreak,
      longestStreak: sql`GREATEST(${userPoints.longestStreak}, ${newStreak})`,
      lastPlayedAt: now,
      updatedAt: now,
    })
    .where(eq(userPoints.userId, userId));
}

export async function createGameEntry(data: InsertGameEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [entry] = await db.insert(gameEntries).values(data).returning();
  return entry;
}

export async function getUserGameHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(gameEntries)
    .where(eq(gameEntries.userId, userId))
    .orderBy(desc(gameEntries.playedAt))
    .limit(limit);
}

export async function getUserDailyPlays(userId: number, gameType: string) {
  await ensureGameTables();
  const db = await getDb();
  if (!db) return 0;
  // Use database CURRENT_DATE for consistent day boundary (UTC)
  const [result] = await db
    .select({ count: count() })
    .from(gameEntries)
    .where(
      and(
        eq(gameEntries.userId, userId),
        eq(gameEntries.gameType, gameType as any),
        gte(gameEntries.playedAt, sql`CURRENT_DATE`)
      )
    );
  // count() returns string from postgres-js driver — convert to number
  return Number(result?.count ?? 0);
}

/**
 * Check daily play limit and create a game entry.
 * Returns the created entry, or null if the daily limit has been reached.
 */
export async function createGameEntryWithLimit(
  data: InsertGameEntry,
  maxPlays: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Count today's plays for this user + game type
  const todayPlays = await getUserDailyPlays(data.userId!, data.gameType!);

  if (todayPlays >= maxPlays) {
    return null;
  }

  // Use raw SQL to avoid Drizzle enum binding issues with postgres-js driver.
  // Do NOT use ::game_type or ::reward_type casts — let PostgreSQL handle
  // implicit text→enum conversion for parameterized queries.
  const rows = await db.execute(sql`
    INSERT INTO "gameEntries" ("userId", "gameType", "rewardType", "rewardValue", "pointsEarned", "metadata")
    VALUES (
      ${data.userId},
      ${data.gameType},
      ${data.rewardType ?? 'none'},
      ${data.rewardValue ?? null},
      ${data.pointsEarned ?? 0},
      ${data.metadata ?? null}
    )
    RETURNING "id", "userId", "gameType"::text, "rewardType"::text, "rewardValue", "pointsEarned", "metadata", "playedAt"
  `);

  // postgres-js returns array-like result; Drizzle wraps it in { rows } or passes through
  const resultRows = Array.isArray(rows) ? rows : (rows as any).rows ?? [];
  const entry = resultRows[0];

  if (!entry) throw new Error("Insert returned no rows");
  return entry as GameEntryRow;
}

// Minimal type for the raw SQL return
type GameEntryRow = {
  id: number;
  userId: number;
  gameType: string;
  rewardType: string;
  rewardValue: string | null;
  pointsEarned: number;
  metadata: string | null;
  playedAt: Date;
};

export async function getPointsLeaderboard(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      userId: userPoints.userId,
      displayName: sql<string>`COALESCE(${users.name}, 'Player #' || ${userPoints.userId})`,
      totalPoints: userPoints.totalPoints,
      lifetimePoints: userPoints.lifetimePoints,
      currentStreak: userPoints.currentStreak,
      longestStreak: userPoints.longestStreak,
    })
    .from(userPoints)
    .leftJoin(users, eq(userPoints.userId, users.id))
    .orderBy(desc(userPoints.lifetimePoints))
    .limit(limit);
}

// Trivia
export async function getRandomTriviaQuestions(count = 5, category?: string): Promise<TriviaQuestion[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(triviaQuestions.isActive, true)];
  if (category) {
    conditions.push(eq(triviaQuestions.category, category));
  }
  return await db
    .select()
    .from(triviaQuestions)
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(count);
}

export async function getTriviaByIds(ids: number[]): Promise<TriviaQuestion[]> {
  const db = await getDb();
  if (!db) return [];
  if (ids.length === 0) return [];
  return await db
    .select()
    .from(triviaQuestions)
    .where(inArray(triviaQuestions.id, ids));
}

export async function getAllTriviaAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(triviaQuestions)
    .orderBy(desc(triviaQuestions.createdAt));
}

export async function createTriviaQuestion(data: InsertTriviaQuestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [question] = await db.insert(triviaQuestions).values(data).returning();
  return question;
}

export async function updateTriviaQuestion(id: number, data: Partial<InsertTriviaQuestion>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [question] = await db
    .update(triviaQuestions)
    .set(data)
    .where(eq(triviaQuestions.id, id))
    .returning();
  return question;
}

export async function deleteTriviaQuestion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(triviaQuestions).where(eq(triviaQuestions.id, id));
}

// ============================================================================
// SOCIAL POSTS
// ============================================================================

export async function getVisibleSocialPosts() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.isVisible, true))
    .orderBy(desc(socialPosts.createdAt));
}

export async function getAllSocialPostsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(socialPosts)
    .orderBy(asc(socialPosts.sortOrder), desc(socialPosts.createdAt));
}

export async function reorderSocialPosts(orderedIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(socialPosts)
      .set({ sortOrder: i })
      .where(eq(socialPosts.id, orderedIds[i]));
  }
}

export async function createSocialPost(data: InsertSocialPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [post] = await db.insert(socialPosts).values(data).returning();
  return post;
}

export async function updateSocialPost(id: number, data: Partial<InsertSocialPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { platform, postUrl, embedHtml, thumbnailUrl, caption } = data;
  const [post] = await db
    .update(socialPosts)
    .set({ platform, postUrl, embedHtml, thumbnailUrl, caption })
    .where(eq(socialPosts.id, id))
    .returning();
  return post;
}

export async function deleteSocialPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(socialPosts).where(eq(socialPosts.id, id));
}

export async function toggleSocialPostVisibility(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [post] = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.id, id));
  if (!post) return null;
  const [updated] = await db
    .update(socialPosts)
    .set({ isVisible: !post.isVisible })
    .where(eq(socialPosts.id, id))
    .returning();
  return updated;
}

// ============================================================================
// FAMILY / HOUSEHOLD ACCOUNT FUNCTIONS
// ============================================================================

export async function addFamilyMember(parentId: number, childId: number, relationshipType = "parent") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Prevent duplicate links
  const existing = await db
    .select()
    .from(userRelations)
    .where(and(eq(userRelations.parentId, parentId), eq(userRelations.childId, childId)));
  if (existing.length > 0) return existing[0];
  const [relation] = await db
    .insert(userRelations)
    .values({ parentId, childId, relationshipType })
    .returning();
  return relation;
}

export async function removeFamilyMember(parentId: number, childId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(userRelations)
    .where(and(eq(userRelations.parentId, parentId), eq(userRelations.childId, childId)));
}

export async function getFamilyMembers(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  const relations = await db
    .select()
    .from(userRelations)
    .where(eq(userRelations.parentId, parentId));
  if (relations.length === 0) return [];
  const childIds = relations.map((r: any) => r.childId);
  const children = await db
    .select()
    .from(users)
    .where(inArray(users.id, childIds));
  return children;
}

export async function getFamilyChildMetrics(childId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(athleteMetrics)
    .where(eq(athleteMetrics.athleteId, childId))
    .orderBy(desc(athleteMetrics.sessionDate));
}

export async function getFamilyChildAttendance(childId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.userId, childId))
    .orderBy(desc(attendanceRecords.markedAt));
}

export async function getFamilyChildSchedules(childId: number) {
  const db = await getDb();
  if (!db) return [];
  const registrations = await db
    .select()
    .from(sessionRegistrations)
    .where(eq(sessionRegistrations.userId, childId));
  if (registrations.length === 0) return [];
  const scheduleIds = registrations.map((r: any) => r.scheduleId);
  return await db
    .select()
    .from(schedules)
    .where(inArray(schedules.id, scheduleIds))
    .orderBy(asc(schedules.startTime));
}

// ============================================================================
// WAITLIST FUNCTIONS
// ============================================================================

export async function addToWaitlist(data: InsertWaitlistEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Calculate next position
  const existing = await db
    .select({ maxPos: sql<number>`COALESCE(MAX(${waitlist.position}), 0)` })
    .from(waitlist)
    .where(
      and(
        data.scheduleId ? eq(waitlist.scheduleId, data.scheduleId) : eq(waitlist.programId, data.programId!),
        eq(waitlist.status, "waiting")
      )
    );
  const nextPosition = (existing[0]?.maxPos ?? 0) + 1;
  const [entry] = await db
    .insert(waitlist)
    .values({ ...data, position: nextPosition })
    .returning();
  return entry;
}

export async function getWaitlistForSchedule(scheduleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(waitlist)
    .where(and(eq(waitlist.scheduleId, scheduleId), eq(waitlist.status, "waiting")))
    .orderBy(asc(waitlist.position));
}

export async function getWaitlistForProgram(programId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(waitlist)
    .where(and(eq(waitlist.programId, programId), eq(waitlist.status, "waiting")))
    .orderBy(asc(waitlist.position));
}

export async function getUserWaitlistEntries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(waitlist)
    .where(and(eq(waitlist.userId, userId), eq(waitlist.status, "waiting")))
    .orderBy(desc(waitlist.createdAt));
}

export async function notifyNextOnWaitlist(scheduleId?: number, programId?: number) {
  const db = await getDb();
  if (!db) return null;
  const condition = scheduleId
    ? and(eq(waitlist.scheduleId, scheduleId), eq(waitlist.status, "waiting"))
    : and(eq(waitlist.programId, programId!), eq(waitlist.status, "waiting"));
  const [next] = await db
    .select()
    .from(waitlist)
    .where(condition)
    .orderBy(asc(waitlist.position))
    .limit(1);
  if (!next) return null;
  // Mark as notified with 24-hour expiry
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [updated] = await db
    .update(waitlist)
    .set({ status: "notified", notifiedAt: new Date(), expiresAt })
    .where(eq(waitlist.id, next.id))
    .returning();
  return updated;
}

export async function cancelWaitlistEntry(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [entry] = await db
    .update(waitlist)
    .set({ status: "cancelled" })
    .where(and(eq(waitlist.id, id), eq(waitlist.userId, userId)))
    .returning();
  return entry;
}

export async function enrollFromWaitlist(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [entry] = await db
    .update(waitlist)
    .set({ status: "enrolled" })
    .where(eq(waitlist.id, id))
    .returning();
  return entry;
}

// ============================================================================
// REFERRAL FUNCTIONS
// ============================================================================

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "REF-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getUserReferralCode(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error("User not found");
  if (user.referralCode) return user.referralCode;
  // Generate and save a new code
  const code = generateReferralCode();
  await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
  return code;
}

export async function createReferral(referrerId: number, referredEmail: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const code = generateReferralCode();
  const [referral] = await db
    .insert(referrals)
    .values({ referrerId, referredEmail, referralCode: code })
    .returning();
  return referral;
}

export async function getReferralByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const [referral] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referralCode, code));
  return referral ?? null;
}

export async function getUserReferrals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt));
}

export async function convertReferral(referralCode: string, referredUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [referral] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referralCode, referralCode));
  if (!referral) return null;
  // Mark as converted
  const [updated] = await db
    .update(referrals)
    .set({ status: "signed_up", referredUserId, convertedAt: new Date() })
    .where(eq(referrals.id, referral.id))
    .returning();
  // Award points to referrer (100 points for each referral)
  const REFERRAL_POINTS = 100;
  await addUserPoints(referral.referrerId, REFERRAL_POINTS);
  await db
    .update(referrals)
    .set({ pointsAwarded: REFERRAL_POINTS, status: "rewarded" })
    .where(eq(referrals.id, referral.id));
  // Record the referrer on the new user
  await db.update(users).set({ referredBy: referral.referrerId }).where(eq(users.id, referredUserId));
  return updated;
}

export async function getReferralStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalReferrals: 0, converted: 0, totalPoints: 0 };
  const allReferrals = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId));
  const converted = allReferrals.filter((r: any) => r.status === "rewarded" || r.status === "signed_up");
  const totalPoints = allReferrals.reduce((sum: number, r: any) => sum + (r.pointsAwarded || 0), 0);
  return { totalReferrals: allReferrals.length, converted: converted.length, totalPoints };
}

// ============================================================================
// SCHEDULE TEMPLATE FUNCTIONS
// ============================================================================

export async function getAllScheduleTemplates() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(scheduleTemplates)
    .orderBy(asc(scheduleTemplates.dayOfWeek), asc(scheduleTemplates.startHour));
}

export async function getActiveScheduleTemplates() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(scheduleTemplates)
    .where(eq(scheduleTemplates.isActive, true))
    .orderBy(asc(scheduleTemplates.dayOfWeek), asc(scheduleTemplates.startHour));
}

export async function createScheduleTemplate(data: InsertScheduleTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [template] = await db
    .insert(scheduleTemplates)
    .values(data)
    .returning();
  return template;
}

export async function updateScheduleTemplate(id: number, data: Partial<InsertScheduleTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [template] = await db
    .update(scheduleTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(scheduleTemplates.id, id))
    .returning();
  return template;
}

export async function deleteScheduleTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(scheduleTemplates).where(eq(scheduleTemplates.id, id));
}

export async function generateSchedulesFromTemplates(weekStartDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const templates = await getActiveScheduleTemplates();
  const dayMap: Record<string, number> = {
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
    friday: 5, saturday: 6, sunday: 0,
  };
  const created: any[] = [];
  for (const tpl of templates) {
    const targetDay = dayMap[tpl.dayOfWeek];
    const weekStart = new Date(weekStartDate);
    const currentDay = weekStart.getDay();
    const diff = (targetDay - currentDay + 7) % 7;
    const scheduleDate = new Date(weekStart);
    scheduleDate.setDate(scheduleDate.getDate() + diff);
    const startTime = new Date(scheduleDate);
    startTime.setHours(tpl.startHour, tpl.startMinute, 0, 0);
    const endTime = new Date(scheduleDate);
    endTime.setHours(tpl.endHour, tpl.endMinute, 0, 0);
    const [schedule] = await db
      .insert(schedules)
      .values({
        title: tpl.name,
        programId: tpl.programId,
        startTime,
        endTime,
        dayOfWeek: tpl.dayOfWeek,
        location: tpl.location,
        maxParticipants: tpl.maxParticipants,
        isRecurring: true,
      })
      .returning();
    created.push(schedule);
  }
  return created;
}

// ============================================================================
// BILLING REMINDER FUNCTIONS
// ============================================================================

export async function createBillingReminder(data: InsertBillingReminder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [reminder] = await db
    .insert(billingReminders)
    .values(data)
    .returning();
  return reminder;
}

export async function getActiveBillingReminders() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(billingReminders)
    .where(eq(billingReminders.status, "active"))
    .orderBy(asc(billingReminders.nextSendAt));
}

export async function getUserBillingReminders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(billingReminders)
    .where(eq(billingReminders.userId, userId))
    .orderBy(desc(billingReminders.createdAt));
}

export async function updateBillingReminder(id: number, data: Partial<InsertBillingReminder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [updated] = await db
    .update(billingReminders)
    .set(data)
    .where(eq(billingReminders.id, id))
    .returning();
  return updated;
}

export async function resolveBillingReminder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(billingReminders)
    .set({ status: "resolved" })
    .where(eq(billingReminders.id, id));
}

// ============================================================================
// ONBOARDING FUNCTIONS
// ============================================================================

export async function getOnboardingProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(onboardingSteps)
    .where(eq(onboardingSteps.userId, userId))
    .orderBy(asc(onboardingSteps.completedAt));
}

export async function completeOnboardingStep(userId: number, step: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Prevent duplicates
  const existing = await db
    .select()
    .from(onboardingSteps)
    .where(and(eq(onboardingSteps.userId, userId), eq(onboardingSteps.step, step)));
  if (existing.length > 0) return existing[0];
  const [entry] = await db
    .insert(onboardingSteps)
    .values({ userId, step })
    .returning();
  return entry;
}

export async function completeOnboarding(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await completeOnboardingStep(userId, "complete");
  await db
    .update(users)
    .set({ onboardingCompleted: true, onboardingCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function updateUserOnboardingProfile(userId: number, data: { sport?: string; goals?: string; dateOfBirth?: Date; extendedRole?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

// ============================================================================
// RBAC / EXTENDED ROLE FUNCTIONS
// ============================================================================

export async function getUserExtendedRole(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [user] = await db.select({ extendedRole: users.extendedRole }).from(users).where(eq(users.id, userId));
  return user?.extendedRole ?? "athlete";
}

export async function setUserExtendedRole(userId: number, role: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [updated] = await db
    .update(users)
    .set({ extendedRole: role, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

export async function getUsersByExtendedRole(role: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(users)
    .where(eq(users.extendedRole, role))
    .orderBy(asc(users.name));
}

// ============================================================================
// AI PROGRESS REPORT FUNCTIONS
// ============================================================================

export async function getAthleteReportData(athleteId: number) {
  const db = await getDb();
  if (!db) return null;
  const [athlete] = await db.select().from(users).where(eq(users.id, athleteId));
  if (!athlete) return null;
  const metrics = await db
    .select()
    .from(athleteMetrics)
    .where(eq(athleteMetrics.athleteId, athleteId))
    .orderBy(desc(athleteMetrics.sessionDate))
    .limit(50);
  const attendance = await db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.userId, athleteId))
    .orderBy(desc(attendanceRecords.markedAt))
    .limit(30);
  const showcases = await db
    .select()
    .from(athleteShowcases)
    .where(eq(athleteShowcases.athleteId, athleteId))
    .orderBy(desc(athleteShowcases.featuredFrom))
    .limit(5);
  const points = await db
    .select()
    .from(userPoints)
    .where(eq(userPoints.userId, athleteId));
  return {
    athlete,
    metrics,
    attendance,
    showcases,
    points: points[0] ?? null,
  };
}

// ============================================================================
// GOVERNANCE EVIDENCE
// ============================================================================

export async function insertGovernanceEvidence(evidence: InsertGovernanceEvidence) {
  const db = await getDb();
  if (!db) return null;
  try {
    const [row] = await db.insert(governanceEvidence).values(evidence).returning();
    return row;
  } catch (err: any) {
    // If evidence_hash column doesn't exist yet (migration 0022 pending), retry with raw SQL
    if (err?.message?.includes("evidence_hash") || err?.code === "42703") {
      logger.warn("[governance-evidence] evidence_hash column not found, inserting without hash");
      try {
        const result = await db.execute(sql`
          INSERT INTO governance_evidence (capability_id, actor_id, actor_role, actor_email, action, reason, source, external_decision_id, metadata)
          VALUES (${evidence.capabilityId}, ${evidence.actorId}, ${evidence.actorRole}, ${evidence.actorEmail ?? null}, ${evidence.action}, ${evidence.reason ?? null}, ${evidence.source}, ${evidence.externalDecisionId ?? null}, ${evidence.metadata ? JSON.stringify(evidence.metadata) : null}::jsonb)
          RETURNING *
        `);
        return result.rows?.[0] ?? null;
      } catch (retryErr) {
        logger.error("[governance-evidence] Retry without hash also failed:", retryErr);
        return null;
      }
    }
    logger.error("[governance-evidence] Failed to write evidence:", err);
    return null;
  }
}

export async function getGovernanceEvidenceTrail(opts: {
  capabilityId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.capabilityId) conditions.push(eq(governanceEvidence.capabilityId, opts.capabilityId));
  if (opts.action) conditions.push(eq(governanceEvidence.action, opts.action));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  try {
    return await db
      .select()
      .from(governanceEvidence)
      .where(where)
      .orderBy(desc(governanceEvidence.createdAt))
      .limit(opts.limit ?? 50)
      .offset(opts.offset ?? 0);
  } catch (err: any) {
    // Fallback: if evidence_hash column doesn't exist yet (migration 0022 pending),
    // query only the columns that existed before
    if (err?.message?.includes("evidence_hash") || err?.code === "42703") {
      logger.warn("[governance-evidence] evidence_hash column not found, using fallback query");
      return await db
        .select({
          id: governanceEvidence.id,
          capabilityId: governanceEvidence.capabilityId,
          actorId: governanceEvidence.actorId,
          actorRole: governanceEvidence.actorRole,
          actorEmail: governanceEvidence.actorEmail,
          action: governanceEvidence.action,
          reason: governanceEvidence.reason,
          source: governanceEvidence.source,
          externalDecisionId: governanceEvidence.externalDecisionId,
          metadata: governanceEvidence.metadata,
          createdAt: governanceEvidence.createdAt,
        })
        .from(governanceEvidence)
        .where(where)
        .orderBy(desc(governanceEvidence.createdAt))
        .limit(opts.limit ?? 50)
        .offset(opts.offset ?? 0);
    }
    throw err;
  }
}

export async function getGovernanceStats() {
  const db = await getDb();
  if (!db) return { totalDecisions: 0, totalDenied: 0, totalAllowed: 0, totalEscalated: 0, totalErrors: 0 };
  const [total] = await db.select({ count: count() }).from(governanceEvidence);
  const [denied] = await db.select({ count: count() }).from(governanceEvidence).where(eq(governanceEvidence.action, "deny"));
  const [allowed] = await db.select({ count: count() }).from(governanceEvidence).where(eq(governanceEvidence.action, "allow"));
  const [escalated] = await db.select({ count: count() }).from(governanceEvidence).where(eq(governanceEvidence.action, "escalate"));
  const [errors] = await db.select({ count: count() }).from(governanceEvidence).where(eq(governanceEvidence.action, "error"));
  return {
    totalDecisions: total?.count ?? 0,
    totalDenied: denied?.count ?? 0,
    totalAllowed: allowed?.count ?? 0,
    totalEscalated: escalated?.count ?? 0,
    totalErrors: errors?.count ?? 0,
  };
}
