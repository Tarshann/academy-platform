import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { ENV } from "./_core/env";
import { logger } from "./_core/logger";
import { eq, and, or, desc, asc, inArray, gte, lte, sql } from "drizzle-orm";
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
} from "../drizzle/schema";

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

let _db: any = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  if (!ENV.databaseUrl) {
    logger.error("[DB] DATABASE_URL not set");
    return null;
  }

  if (_db && _pool) {
    return _db;
  }

  try {
    _pool = mysql.createPool({
      uri: ENV.databaseUrl,
      ssl: ENV.isProduction ? { rejectUnauthorized: true } : undefined,
      connectionLimit: ENV.isProduction ? 10 : 5,
    });
    _db = drizzle(_pool);
    return _db;
  } catch (error) {
    logger.error("[DB] Failed to connect:", error);
    return null;
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
  const result = await db.insert(programs).values(programData);
  const insertId = result[0].insertId;
  const inserted = await db.select().from(programs).where(eq(programs.id, insertId)).limit(1);
  return inserted[0];
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
  const result = await db
    .insert(announcements)
    .values(announcementData);
  const insertId = result[0].insertId;
  const inserted = await db.select().from(announcements).where(eq(announcements.id, insertId)).limit(1);
  return inserted[0];
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
  const result = await db.insert(schedules).values(scheduleData);
  const insertId = result[0].insertId;
  const inserted = await db.select().from(schedules).where(eq(schedules.id, insertId)).limit(1);
  return inserted[0];
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
  const result = await db
    .insert(sessionRegistrations)
    .values({
      userId,
      scheduleId,
      paymentId: paymentId ?? null,
      status: "registered",
    });
  const insertId = result[0].insertId;
  const inserted = await db.select().from(sessionRegistrations).where(eq(sessionRegistrations.id, insertId)).limit(1);
  return inserted[0];
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
  const result = await db
    .insert(contactSubmissions)
    .values(submissionData);
  const insertId = result[0].insertId;
  const inserted = await db.select().from(contactSubmissions).where(eq(contactSubmissions.id, insertId)).limit(1);
  return inserted[0];
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

export async function getAllGalleryPhotos() {
  const db = await getDb();
  if (!db) return [];
  const photos = await db
    .select()
    .from(galleryPhotos)
    .where(
      and(
        eq(galleryPhotos.isVisible, true),
        sql`lower(${galleryPhotos.title}) NOT LIKE '%test%'`,
        sql`lower(coalesce(${galleryPhotos.description}, '')) NOT LIKE '%test%'`
      )
    );

  // Sort: populated images (with imageUrl) first, then by creation date (newest first)
  return photos.sort((a: any, b: any) => {
    const aHasImage = !!(a.imageUrl && a.imageUrl.trim());
    const bHasImage = !!(b.imageUrl && b.imageUrl.trim());

    if (aHasImage && !bHasImage) return -1;
    if (!aHasImage && bHasImage) return 1;

    // Both have images or both don't - sort by date (newest first)
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bDate - aDate;
  });
}

export async function getGalleryPhotosByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  const photos = await db
    .select()
    .from(galleryPhotos)
    .where(
      and(
        eq(galleryPhotos.isVisible, true),
        eq(galleryPhotos.category, category as any),
        sql`lower(${galleryPhotos.title}) NOT LIKE '%test%'`,
        sql`lower(coalesce(${galleryPhotos.description}, '')) NOT LIKE '%test%'`
      )
    );

  // Sort: populated images (with imageUrl) first, then by creation date (newest first)
  return photos.sort((a: any, b: any) => {
    const aHasImage = !!(a.imageUrl && a.imageUrl.trim());
    const bHasImage = !!(b.imageUrl && b.imageUrl.trim());

    if (aHasImage && !bHasImage) return -1;
    if (!aHasImage && bHasImage) return 1;

    // Both have images or both don't - sort by date (newest first)
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bDate - aDate;
  });
}

export async function createGalleryPhoto(photoData: InsertGalleryPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(galleryPhotos).values(photoData);
  const insertId = result[0].insertId;
  const inserted = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, insertId)).limit(1);
  return inserted[0];
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

export async function getAllPublishedBlogPosts() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true))
    .orderBy(desc(blogPosts.publishedAt));
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
  const result = await db.insert(blogPosts).values(postData);
  const insertId = result[0].insertId;
  const inserted = await db.select().from(blogPosts).where(eq(blogPosts.id, insertId)).limit(1);
  return inserted[0];
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

export async function getAllVideos(onlyPublished: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  if (onlyPublished) {
    return await db
      .select()
      .from(videos)
      .where(eq(videos.isPublished, true))
      .orderBy(desc(videos.createdAt));
  }
  return await db.select().from(videos).orderBy(desc(videos.createdAt));
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
  onlyPublished: boolean = false
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(videos.category, category as any)];
  if (onlyPublished) {
    conditions.push(eq(videos.isPublished, true));
  }
  return await db
    .select()
    .from(videos)
    .where(and(...conditions))
    .orderBy(desc(videos.createdAt));
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
  const result = await db.insert(videos).values(videoData);
  const insertId = result[0].insertId;
  const inserted = await db.select().from(videos).where(eq(videos.id, insertId)).limit(1);
  return inserted[0];
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

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        sql`lower(${products.name}) NOT LIKE '%test%'`,
        sql`lower(coalesce(${products.description}, '')) NOT LIKE '%test%'`
      )
    )
    .orderBy(asc(products.name));
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
  const result = await db.insert(products).values(productData);
  const insertId = result[0].insertId;
  const inserted = await db.select().from(products).where(eq(products.id, insertId)).limit(1);
  return inserted[0];
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
  const result = await db.insert(campaigns).values(campaignData);
  const insertId = result[0].insertId;
  const inserted = await db.select().from(campaigns).where(eq(campaigns.id, insertId)).limit(1);
  return inserted[0];
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

export async function getUserPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
}

export async function getUserSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));
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
  const result = await db
    .insert(orders)
    .values({
      userId: orderData.userId,
      stripeCheckoutSessionId: orderData.stripeCheckoutSessionId ?? null,
      totalAmount: orderData.totalAmount,
      status: "pending",
      shippingAddress: orderData.shippingAddress ?? null,
    });
  const insertId = result[0].insertId;
  const inserted = await db.select().from(orders).where(eq(orders.id, insertId)).limit(1);
  return inserted[0];
}

export async function createOrderItem(itemData: {
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orderItems).values(itemData);
  const insertId = result[0].insertId;
  const inserted = await db.select().from(orderItems).where(eq(orderItems.id, insertId)).limit(1);
  return inserted[0];
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

export async function getAllLocations() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(locations)
    .where(eq(locations.isActive, true))
    .orderBy(asc(locations.name));
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
  const result = await db.insert(locations).values(locationData);
  return result[0].insertId;
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

export async function getAllCoaches() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(coaches)
    .where(eq(coaches.isActive, true))
    .orderBy(asc(coaches.id));
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
  const result = await db.insert(coaches).values(coachData);
  return result[0].insertId;
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
  const result = await db
    .insert(coachAssignments)
    .values(assignmentData);
  return result[0].insertId;
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
    const result = await db
      .insert(attendanceRecords)
      .values(attendanceData);
    return result[0].insertId;
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

export async function getAttendanceByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.userId, userId))
    .orderBy(desc(attendanceRecords.markedAt));
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
  const result = await db
    .insert(userRelations)
    .values(relation);
  return result[0].insertId;
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
  const result = await db.insert(dmConversations).values({});
  const conversationId = result[0].insertId;

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
            sql`${dmParticipants.userId} != ${userId}`
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

      // Get unread count
      const unreadMessages = await db
        .select()
        .from(dmMessages)
        .where(
          and(
            eq(dmMessages.conversationId, p.conversationId),
            sql`${dmMessages.senderId} != ${userId}`,
            p.lastReadAt
              ? sql`${dmMessages.createdAt} > ${p.lastReadAt}`
              : sql`1=1`
          )
        );

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
        unreadCount: unreadMessages.length,
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
  content: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(dmMessages).values({
    conversationId,
    senderId,
    senderName,
    content,
  });

  // Update conversation lastMessageAt
  await db
    .update(dmConversations)
    .set({ lastMessageAt: new Date(), updatedAt: new Date() })
    .where(eq(dmConversations.id, conversationId));

  const insertId = result[0].insertId;
  const message = await db
    .select()
    .from(dmMessages)
    .where(eq(dmMessages.id, insertId))
    .limit(1);

  return message[0];
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

  // Default permissions if no role set
  const senderPerms = senderRole[0] || {
    messagingRole: "parent",
    canDmCoaches: true,
    canDmParents: false,
    canDmAthletes: false,
  };
  const recipientPerms = recipientRole[0] || { messagingRole: "parent" };

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

  const result = await db.insert(userBlocks).values({
    blockerId,
    blockedId,
    reason,
  });

  return result[0].insertId;
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
export async function searchDmMessages(userId: number, query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  // Get user's conversations
  const participations = await db
    .select()
    .from(dmParticipants)
    .where(eq(dmParticipants.userId, userId));

  const conversationIds = participations.map((p: any) => p.conversationId);
  if (conversationIds.length === 0) return [];

  // Search messages in those conversations
  return await db
    .select()
    .from(dmMessages)
    .where(
      and(
        inArray(dmMessages.conversationId, conversationIds),
        sql`${dmMessages.content} LIKE ${`%${query}%`}`
      )
    )
    .orderBy(desc(dmMessages.createdAt))
    .limit(limit);
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
        messagingRole: role[0]?.messagingRole || "parent",
      });
    }
  }

  return availableUsers;
}

// ============================================================================
// PUSH NOTIFICATION FUNCTIONS
// ============================================================================

// Save push subscription
export async function savePushSubscription(
  userId: number,
  endpoint: string,
  p256dh: string,
  auth: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if subscription already exists
  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        sql`${pushSubscriptions.endpoint} = ${endpoint}`
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(pushSubscriptions)
      .set({ p256dh, auth, userAgent, isActive: true, updatedAt: new Date() })
      .where(eq(pushSubscriptions.id, existing[0].id));
    return existing[0].id;
  }

  const result = await db.insert(pushSubscriptions).values({
    userId,
    endpoint,
    p256dh,
    auth,
    userAgent,
  });

  return result[0].insertId;
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

  const result = await db.insert(notificationLogs).values({
    userId,
    type,
    title,
    body,
    data,
  });

  return result[0].insertId;
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
        sql`${dmParticipants.userId} != ${senderId}`,
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
