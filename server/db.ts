import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
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
  InsertSchedule,
  locations,
  InsertLocation,
  coaches,
  InsertCoach,
  coachAssignments,
  InsertCoachAssignment,
  notificationPreferences,
  InsertNotificationPreference
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
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

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
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
  return db.select().from(programs).where(eq(programs.isActive, true));
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
    .where(eq(announcements.isPublished, true))
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
  const { gte } = await import("drizzle-orm");
  return db.select().from(schedules)
    .where(gte(schedules.startTime, new Date()))
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
  
  // Soft delete by setting isActive to false
  await db.update(programs).set({ isActive: false }).where(eq(programs.id, id));
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
    isPublished: true,
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


// Gallery helpers
export async function getAllGalleryPhotos() {
  const db = await getDb();
  if (!db) return [];
  
  const { galleryPhotos } = await import("../drizzle/schema");
  return db.select().from(galleryPhotos).where(eq(galleryPhotos.isVisible, true)).orderBy(desc(galleryPhotos.createdAt));
}

export async function getGalleryPhotosByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  
  const { galleryPhotos } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  return db.select().from(galleryPhotos)
    .where(and(
      eq(galleryPhotos.category, category as any),
      eq(galleryPhotos.isVisible, true)
    ))
    .orderBy(desc(galleryPhotos.createdAt));
}

export async function createGalleryPhoto(photo: {
  title: string;
  description?: string;
  imageUrl: string;
  imageKey: string;
  category: string;
  uploadedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { galleryPhotos } = await import("../drizzle/schema");
  await db.insert(galleryPhotos).values(photo as any);
}

export async function deleteGalleryPhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { galleryPhotos } = await import("../drizzle/schema");
  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, id));
}

export async function toggleGalleryPhotoVisibility(id: number, isVisible: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { galleryPhotos } = await import("../drizzle/schema");
  await db.update(galleryPhotos).set({ isVisible: isVisible }).where(eq(galleryPhotos.id, id));
}

// Blog helpers
export async function getAllPublishedBlogPosts() {
  const db = await getDb();
  if (!db) return [];
  
  const { blogPosts } = await import("../drizzle/schema");
  return db.select().from(blogPosts)
    .where(eq(blogPosts.isPublished, true))
    .orderBy(desc(blogPosts.publishedAt));
}

export async function getBlogPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { blogPosts } = await import("../drizzle/schema");
  const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllBlogPostsAdmin() {
  const db = await getDb();
  if (!db) return [];
  
  const { blogPosts } = await import("../drizzle/schema");
  return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
}

export async function createBlogPost(post: {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  authorId: number;
  category: string;
  tags?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { blogPosts } = await import("../drizzle/schema");
  await db.insert(blogPosts).values(post as any);
}

export async function updateBlogPost(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { blogPosts } = await import("../drizzle/schema");
  await db.update(blogPosts).set(updates).where(eq(blogPosts.id, id));
}

export async function publishBlogPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { blogPosts } = await import("../drizzle/schema");
  await db.update(blogPosts).set({ 
    isPublished: true,
    publishedAt: new Date()
  }).where(eq(blogPosts.id, id));
}

export async function deleteBlogPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { blogPosts } = await import("../drizzle/schema");
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

// ============================================================================
// MERCHANDISE & SHOP HELPERS
// ============================================================================

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  
  const { products } = await import("../drizzle/schema");
  return await db.select().from(products).where(eq(products.isActive, true));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { products } = await import("../drizzle/schema");
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function createProduct(product: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { products } = await import("../drizzle/schema");
  await db.insert(products).values(product);
}

export async function updateProduct(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { products } = await import("../drizzle/schema");
  await db.update(products).set(updates).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { products } = await import("../drizzle/schema");
  await db.update(products).set({ isActive: false }).where(eq(products.id, id));
}

export async function getProductVariants(productId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { productVariants } = await import("../drizzle/schema");
  return await db.select().from(productVariants).where(eq(productVariants.productId, productId));
}

export async function createOrder(order: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { orders } = await import("../drizzle/schema");
  const result = await db.insert(orders).values(order).returning({ id: orders.id });
  return result[0].id;
}

export async function createOrderItem(item: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { orderItems } = await import("../drizzle/schema");
  await db.insert(orderItems).values(item);
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { orders } = await import("../drizzle/schema");
  return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { orders } = await import("../drizzle/schema");
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function updateOrderStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { orders } = await import("../drizzle/schema");
  await db.update(orders).set({ status: status as any }).where(eq(orders.id, id));
}

export async function getActiveCampaigns() {
  const db = await getDb();
  if (!db) return [];
  
  const { campaigns } = await import("../drizzle/schema");
  const { and, lte, gte } = await import("drizzle-orm");
  const now = new Date();
  return await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.isActive, true), lte(campaigns.startDate, now), gte(campaigns.endDate, now)));
}

export async function getAllCampaigns() {
  const db = await getDb();
  if (!db) return [];
  
  const { campaigns } = await import("../drizzle/schema");
  return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

export async function createCampaign(campaign: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { campaigns } = await import("../drizzle/schema");
  const result = await db.insert(campaigns).values(campaign).returning({ id: campaigns.id });
  return result[0].id;
}

export async function updateCampaign(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { campaigns } = await import("../drizzle/schema");
  await db.update(campaigns).set(updates).where(eq(campaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { campaigns } = await import("../drizzle/schema");
  await db.delete(campaigns).where(eq(campaigns.id, id));
}

// ==================== Video Library ====================

export async function getAllVideos(publishedOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  const { videos } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  if (publishedOnly) {
    return await db.select().from(videos).where(eq(videos.isPublished, true)).orderBy(desc(videos.createdAt));
  }
  
  return await db.select().from(videos).orderBy(desc(videos.createdAt));
}

export async function getVideoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { videos } = await import("../drizzle/schema");
  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result[0];
}

export async function getVideosByCategory(category: string, publishedOnly: boolean = true) {
  const db = await getDb();
  if (!db) return [];
  
  const { videos } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  if (publishedOnly) {
    return await db.select().from(videos)
      .where(and(
        eq(videos.category, category as any),
        eq(videos.isPublished, true)
      ))
      .orderBy(desc(videos.createdAt));
  }
  
  return await db.select().from(videos)
    .where(eq(videos.category, category as any))
    .orderBy(desc(videos.createdAt));
}

export async function createVideo(video: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { videos } = await import("../drizzle/schema");
  await db.insert(videos).values(video);
}

export async function updateVideo(id: number, video: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { videos } = await import("../drizzle/schema");
  await db.update(videos).set({ ...video, updatedAt: new Date() }).where(eq(videos.id, id));
}

export async function deleteVideo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { videos } = await import("../drizzle/schema");
  await db.delete(videos).where(eq(videos.id, id));
}

export async function incrementVideoViewCount(id: number) {
  const db = await getDb();
  if (!db) return;
  
  const { videos } = await import("../drizzle/schema");
  const video = await getVideoById(id);
  if (video) {
    await db.update(videos).set({ viewCount: (video.viewCount || 0) + 1 }).where(eq(videos.id, id));
  }
}


// ==================== Attendance Tracking ====================

export async function markAttendance(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { attendance } = await import("../drizzle/schema");
  const result = await db.insert(attendance).values(data).returning({ id: attendance.id });
  return result[0].id;
}

export async function getAttendanceBySchedule(scheduleId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { attendance } = await import("../drizzle/schema");
  const results = await db
    .select({
      id: attendance.id,
      userId: attendance.userId,
      userName: users.name,
      userEmail: users.email,
      status: attendance.status,
      notes: attendance.notes,
      markedBy: attendance.markedBy,
      markedAt: attendance.markedAt,
    })
    .from(attendance)
    .leftJoin(users, eq(attendance.userId, users.id))
    .where(eq(attendance.scheduleId, scheduleId));
  
  return results;
}

export async function getAttendanceByUser(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const { attendance } = await import("../drizzle/schema");
  const results = await db
    .select({
      id: attendance.id,
      scheduleId: attendance.scheduleId,
      scheduleTitle: schedules.title,
      scheduleDate: schedules.startTime,
      scheduleLocation: schedules.location,
      status: attendance.status,
      notes: attendance.notes,
      markedAt: attendance.markedAt,
    })
    .from(attendance)
    .leftJoin(schedules, eq(attendance.scheduleId, schedules.id))
    .where(eq(attendance.userId, userId))
    .orderBy(desc(schedules.startTime))
    .limit(limit);
  
  return results;
}

export async function updateAttendance(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { attendance } = await import("../drizzle/schema");
  await db.update(attendance).set(data).where(eq(attendance.id, id));
}

export async function getAttendanceStats(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { total: 0, present: 0, absent: 0, excused: 0, late: 0, attendanceRate: 0 };
  
  const { attendance } = await import("../drizzle/schema");
  const { and, gte, lte } = await import("drizzle-orm");
  
  let query = db
    .select({
      status: attendance.status,
    })
    .from(attendance)
    .leftJoin(schedules, eq(attendance.scheduleId, schedules.id))
    .where(eq(attendance.userId, userId));
  
  const results = await query;
  
  const stats = {
    total: results.length,
    present: results.filter(r => r.status === 'present').length,
    absent: results.filter(r => r.status === 'absent').length,
    excused: results.filter(r => r.status === 'excused').length,
    late: results.filter(r => r.status === 'late').length,
    attendanceRate: 0,
  };
  
  if (stats.total > 0) {
    stats.attendanceRate = Math.round((stats.present / stats.total) * 100);
  }
  
  return stats;
}

// ==================== Location Management ====================

export async function getAllLocations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(locations).where(eq(locations.isActive, true)).orderBy(locations.name);
}

export async function getAllLocationsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(locations).orderBy(locations.name);
}

export async function getLocationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLocation(location: InsertLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(locations).values(location).returning({ id: locations.id });
  return result[0].id;
}

export async function updateLocation(id: number, updates: Partial<InsertLocation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(locations).set({ ...updates, updatedAt: new Date() }).where(eq(locations.id, id));
}

export async function deleteLocation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete
  await db.update(locations).set({ isActive: false, updatedAt: new Date() }).where(eq(locations.id, id));
}

// ==================== Coach Management ====================

export async function getAllCoaches() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coaches)
    .leftJoin(users, eq(coaches.userId, users.id))
    .where(eq(coaches.isActive, true));
}

export async function getAllCoachesAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coaches)
    .leftJoin(users, eq(coaches.userId, users.id));
}

export async function getCoachById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coaches)
    .leftJoin(users, eq(coaches.userId, users.id))
    .where(eq(coaches.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCoachByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coaches)
    .leftJoin(users, eq(coaches.userId, users.id))
    .where(eq(coaches.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCoach(coach: InsertCoach) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(coaches).values(coach).returning({ id: coaches.id });
  return result[0].id;
}

export async function updateCoach(id: number, updates: Partial<InsertCoach>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(coaches).set({ ...updates, updatedAt: new Date() }).where(eq(coaches.id, id));
}

export async function deleteCoach(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete
  await db.update(coaches).set({ isActive: false, updatedAt: new Date() }).where(eq(coaches.id, id));
}

// ==================== Coach Assignments ====================

export async function getCoachAssignments(coachId?: number, programId?: number, scheduleId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(coachAssignments)
    .leftJoin(coaches, eq(coachAssignments.coachId, coaches.id))
    .leftJoin(users, eq(coaches.userId, users.id));
  
  if (coachId) {
    query = query.where(eq(coachAssignments.coachId, coachId));
  }
  if (programId) {
    query = query.where(eq(coachAssignments.programId, programId));
  }
  if (scheduleId) {
    query = query.where(eq(coachAssignments.scheduleId, scheduleId));
  }
  
  return query;
}

export async function createCoachAssignment(assignment: InsertCoachAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(coachAssignments).values(assignment).returning({ id: coachAssignments.id });
  return result[0].id;
}

export async function deleteCoachAssignment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(coachAssignments).where(eq(coachAssignments.id, id));
}

// ==================== Notification Preferences ====================

export async function getUserNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createOrUpdateNotificationPreferences(userId: number, preferences: Partial<InsertNotificationPreference>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserNotificationPreferences(userId);
  
  if (existing) {
    await db.update(notificationPreferences)
      .set({ ...preferences, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId));
  } else {
    await db.insert(notificationPreferences).values({
      userId,
      sessionRegistrations: preferences.sessionRegistrations ?? true,
      paymentConfirmations: preferences.paymentConfirmations ?? true,
      announcements: preferences.announcements ?? true,
      attendanceUpdates: preferences.attendanceUpdates ?? true,
      blogPosts: preferences.blogPosts ?? false,
      marketing: preferences.marketing ?? false,
    });
  }
}
