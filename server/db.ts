import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
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

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

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
// USER FUNCTIONS
// ============================================================================

export async function upsertUser(userData: Partial<InsertUser> & { openId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(users).where(eq(users.openId, userData.openId)).limit(1);
  
  if (existing.length > 0) {
    const updates: Partial<InsertUser> = {};
    if (userData.name !== undefined) updates.name = userData.name;
    if (userData.email !== undefined) updates.email = userData.email;
    if (userData.loginMethod !== undefined) updates.loginMethod = userData.loginMethod;
    if (userData.lastSignedIn !== undefined) updates.lastSignedIn = userData.lastSignedIn;
    if (userData.role !== undefined) updates.role = userData.role;

    await db.update(users)
      .set(updates)
      .where(eq(users.openId, userData.openId));
    
    return (await db.select().from(users).where(eq(users.openId, userData.openId)).limit(1))[0];
  } else {
    const result = await db.insert(users).values({
      openId: userData.openId,
      name: userData.name ?? null,
      email: userData.email ?? null,
      loginMethod: userData.loginMethod ?? null,
      lastSignedIn: userData.lastSignedIn ?? new Date(),
      role: userData.role ?? "user",
    }).returning();
    return result[0];
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
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
  return await db.select().from(programs).where(eq(programs.isActive, true)).orderBy(asc(programs.name));
}

export async function getAllProgramsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(programs).orderBy(asc(programs.name));
}

export async function getProgramBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(programs).where(eq(programs.slug, slug)).limit(1);
  return result[0] || null;
}

export async function getProgramById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
  return result[0] || null;
}

export async function createProgram(programData: InsertProgram) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(programs).values(programData).returning();
  return result[0];
}

export async function updateProgram(id: number, updates: Partial<InsertProgram>) {
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
  return await db.select().from(announcements)
    .where(eq(announcements.isPublished, true))
    .orderBy(desc(announcements.publishedAt));
}

export async function getAllAnnouncementsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
}

export async function createAnnouncement(announcementData: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(announcements).values(announcementData).returning();
  return result[0];
}

export async function publishAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(announcements)
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
  return await db.select().from(schedules)
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
  const result = await db.select().from(schedules).where(eq(schedules.id, id)).limit(1);
  return result[0] || null;
}

export async function createSchedule(scheduleData: InsertSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(schedules).values(scheduleData).returning();
  return result[0];
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

// ============================================================================
// SESSION REGISTRATION FUNCTIONS
// ============================================================================

export async function getScheduleRegistrations(scheduleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sessionRegistrations)
    .where(eq(sessionRegistrations.scheduleId, scheduleId));
}

export async function createSessionRegistration(userId: number, scheduleId: number, paymentId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sessionRegistrations).values({
    userId,
    scheduleId,
    paymentId: paymentId ?? null,
    status: "registered",
  }).returning();
  return result[0];
}

export async function getUserRegistrations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sessionRegistrations)
    .where(eq(sessionRegistrations.userId, userId))
    .orderBy(desc(sessionRegistrations.registeredAt));
}

// ============================================================================
// CONTACT SUBMISSION FUNCTIONS
// ============================================================================

export async function createContactSubmission(submissionData: InsertContactSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contactSubmissions).values(submissionData).returning();
  return result[0];
}

export async function getContactSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
}

export async function markContactAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contactSubmissions)
    .set({ status: "read" })
    .where(eq(contactSubmissions.id, id));
}

export async function markContactAsResponded(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contactSubmissions)
    .set({ status: "responded" })
    .where(eq(contactSubmissions.id, id));
}

// ============================================================================
// GALLERY PHOTO FUNCTIONS
// ============================================================================

export async function getAllGalleryPhotos() {
  const db = await getDb();
  if (!db) return [];
  const photos = await db.select().from(galleryPhotos)
    .where(and(
      eq(galleryPhotos.isVisible, true),
      sql`lower(${galleryPhotos.title}) NOT LIKE '%test%'`,
      sql`lower(coalesce(${galleryPhotos.description}, '')) NOT LIKE '%test%'`
    ));
  
  // Sort: populated images (with imageUrl) first, then by creation date (newest first)
  return photos.sort((a, b) => {
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
  const photos = await db.select().from(galleryPhotos)
    .where(and(
      eq(galleryPhotos.isVisible, true),
      eq(galleryPhotos.category, category as any),
      sql`lower(${galleryPhotos.title}) NOT LIKE '%test%'`,
      sql`lower(coalesce(${galleryPhotos.description}, '')) NOT LIKE '%test%'`
    ));
  
  // Sort: populated images (with imageUrl) first, then by creation date (newest first)
  return photos.sort((a, b) => {
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
  const result = await db.insert(galleryPhotos).values(photoData).returning();
  return result[0];
}

export async function deleteGalleryPhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, id));
}

export async function toggleGalleryPhotoVisibility(id: number, isVisible: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(galleryPhotos)
    .set({ isVisible })
    .where(eq(galleryPhotos.id, id));
}

// ============================================================================
// BLOG POST FUNCTIONS
// ============================================================================

export async function getAllPublishedBlogPosts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(blogPosts)
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
  const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return result[0] || null;
}

export async function createBlogPost(postData: InsertBlogPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(blogPosts).values(postData).returning();
  return result[0];
}

export async function updateBlogPost(id: number, updates: Partial<InsertBlogPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(blogPosts).set(updates).where(eq(blogPosts.id, id));
}

export async function publishBlogPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(blogPosts)
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
    return await db.select().from(videos)
      .where(eq(videos.isPublished, true))
      .orderBy(desc(videos.createdAt));
  }
  return await db.select().from(videos).orderBy(desc(videos.createdAt));
}

export async function createVideo(videoData: InsertVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(videos).values(videoData).returning();
  return result[0];
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
  return await db.select().from(products)
    .where(and(
      eq(products.isActive, true),
      sql`lower(${products.name}) NOT LIKE '%test%'`,
      sql`lower(coalesce(${products.description}, '')) NOT LIKE '%test%'`
    ))
    .orderBy(asc(products.name));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0] || null;
}

export async function createProduct(productData: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(productData).returning();
  return result[0];
}

export async function updateProduct(id: number, updates: Partial<InsertProduct>) {
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
  return await db.select().from(campaigns)
    .where(and(
      eq(campaigns.isActive, true),
      sql`lower(${campaigns.name}) NOT LIKE '%test%'`,
      sql`lower(coalesce(${campaigns.description}, '')) NOT LIKE '%test%'`
    ))
    .orderBy(desc(campaigns.startDate));
}

export async function getActiveCampaigns() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return await db.select().from(campaigns)
    .where(and(
      eq(campaigns.isActive, true),
      lte(campaigns.startDate, now),
      gte(campaigns.endDate, now),
      sql`lower(${campaigns.name}) NOT LIKE '%test%'`,
      sql`lower(coalesce(${campaigns.description}, '')) NOT LIKE '%test%'`
    ))
    .orderBy(desc(campaigns.startDate));
}

export async function createCampaign(campaignData: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(campaigns).values(campaignData).returning();
  return result[0];
}

export async function updateCampaign(id: number, updates: Partial<InsertCampaign>) {
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
  return await db.select().from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
}

export async function getUserSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));
}

// ============================================================================
// ORDER FUNCTIONS
// ============================================================================

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0] || null;
}

export async function createOrder(orderData: { userId: number; stripeCheckoutSessionId?: string; totalAmount: string; shippingAddress?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values({
    userId: orderData.userId,
    stripeCheckoutSessionId: orderData.stripeCheckoutSessionId ?? null,
    totalAmount: orderData.totalAmount,
    status: "pending",
    shippingAddress: orderData.shippingAddress ?? null,
  }).returning();
  return result[0];
}

export async function createOrderItem(itemData: { orderId: number; productId: number; quantity: number; price: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orderItems).values(itemData).returning();
  return result[0];
}

export async function updateOrderStatus(id: number, status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

// ============================================================================
// LOCATION FUNCTIONS
// ============================================================================

export async function getAllLocations() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(locations)
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
  const result = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
  return result[0] || null;
}

export async function createLocation(locationData: InsertLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(locations).values(locationData).returning();
  return result[0].id;
}

export async function updateLocation(id: number, updates: Partial<InsertLocation>) {
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
  return await db.select().from(coaches)
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
  const result = await db.select().from(coaches).where(eq(coaches.id, id)).limit(1);
  return result[0] || null;
}

export async function createCoach(coachData: InsertCoach) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(coaches).values(coachData).returning();
  return result[0].id;
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

export async function getCoachAssignments(coachId?: number, programId?: number, scheduleId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(coachAssignments);
  const conditions = [];
  
  if (coachId) conditions.push(eq(coachAssignments.coachId, coachId));
  if (programId) conditions.push(eq(coachAssignments.programId, programId));
  if (scheduleId) conditions.push(eq(coachAssignments.scheduleId, scheduleId));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  return await query;
}

export async function createCoachAssignment(assignmentData: InsertCoachAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(coachAssignments).values(assignmentData).returning();
  return result[0].id;
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
  const result = await db.select().from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return result[0] || null;
}

export async function createOrUpdateNotificationPreferences(userId: number, preferences: Partial<InsertNotificationPreference>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserNotificationPreferences(userId);
  
  if (existing) {
    await db.update(notificationPreferences)
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
  const existing = await db.select().from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.userId, attendanceData.userId),
        eq(attendanceRecords.scheduleId, attendanceData.scheduleId)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing
    await db.update(attendanceRecords)
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
    const result = await db.insert(attendanceRecords).values(attendanceData).returning();
    return result[0].id;
  }
}

export async function getAttendanceBySchedule(scheduleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(attendanceRecords)
    .where(eq(attendanceRecords.scheduleId, scheduleId))
    .orderBy(asc(attendanceRecords.userId));
}

export async function getAttendanceByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(attendanceRecords)
    .where(eq(attendanceRecords.userId, userId))
    .orderBy(desc(attendanceRecords.markedAt));
}

export async function getAttendanceStats(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { present: 0, absent: 0, excused: 0, late: 0, total: 0 };
  
  const conditions = [eq(attendanceRecords.userId, userId)];
  if (startDate) {
    conditions.push(gte(attendanceRecords.markedAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(attendanceRecords.markedAt, endDate));
  }
  
  const records = await db.select().from(attendanceRecords).where(and(...conditions));
  
  const stats = {
    present: records.filter(r => r.status === "present").length,
    absent: records.filter(r => r.status === "absent").length,
    excused: records.filter(r => r.status === "excused").length,
    late: records.filter(r => r.status === "late").length,
    total: records.length,
  };
  
  return stats;
}

export async function updateAttendance(id: number, updates: Partial<InsertAttendanceRecord>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(attendanceRecords).set(updates).where(eq(attendanceRecords.id, id));
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
    return await db.select().from(userRelations).where(and(...conditions));
  }
  
  return await db.select().from(userRelations);
}

export async function createUserRelation(relation: InsertUserRelation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userRelations).values(relation).returning({ id: userRelations.id });
  return result[0].id;
}

export async function deleteUserRelation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userRelations).where(eq(userRelations.id, id));
}

export async function getChildrenForParent(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const relations = await db.select()
    .from(userRelations)
    .where(eq(userRelations.parentId, parentId));
  
  const childIds = relations.map(r => r.childId);
  if (childIds.length === 0) return [];
  
  return await db.select().from(users).where(inArray(users.id, childIds));
}

export async function getParentsForChild(childId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const relations = await db.select()
    .from(userRelations)
    .where(eq(userRelations.childId, childId));
  
  const parentIds = relations.map(r => r.parentId);
  if (parentIds.length === 0) return [];
  
  return await db.select().from(users).where(inArray(users.id, parentIds));
}
