import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const programCategoryEnum = pgEnum("program_category", [
  "group",
  "individual",
  "shooting",
  "league",
  "camp",
  "membership",
]);
export const programSportEnum = pgEnum("program_sport", [
  "basketball",
  "football",
  "flag_football",
  "soccer",
  "multi_sport",
  "saq",
]);
export const contactTypeEnum = pgEnum("contact_type", ["general", "volunteer"]);
export const contactStatusEnum = pgEnum("contact_status", [
  "new",
  "read",
  "responded",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);
export const paymentTypeEnum = pgEnum("payment_type", [
  "one_time",
  "recurring",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "incomplete",
]);
export const registrationStatusEnum = pgEnum("registration_status", [
  "registered",
  "attended",
  "canceled",
  "no_show",
]);
export const galleryCategoryEnum = pgEnum("gallery_category", [
  "training",
  "highlights",
]);
export const blogCategoryEnum = pgEnum("blog_category", [
  "training_tips",
  "athlete_spotlight",
  "news",
  "events",
  "other",
]);
export const productCategoryEnum = pgEnum("product_category", [
  "apparel",
  "accessories",
  "equipment",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
export const videoCategoryEnum = pgEnum("video_category", [
  "training",
  "highlights",
]);
export const videoPlatformEnum = pgEnum("video_platform", [
  "tiktok",
  "instagram",
]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "excused",
  "late",
]);
export const dayOfWeekEnum = pgEnum("day_of_week", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export const messagingRoleEnum = pgEnum("messaging_role", [
  "parent",
  "athlete",
  "coach",
  "staff",
  "admin",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "push",
  "email",
]);
export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
  "clicked",
]);
export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "nurturing",
  "converted",
  "unsubscribed",
]);

// ============================================================================
// TABLES
// ============================================================================

/**
 * Core user table backing auth flow.
 * Extended with role-based access for public, member, and admin users.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  profilePictureUrl: text("profilePictureUrl"),
  role: userRoleEnum("role").default("user").notNull(),
  extendedRole: varchar("extendedRole", { length: 30 }).default("athlete"),
  onboardingCompleted: boolean("onboardingCompleted").notNull().default(false),
  onboardingCompletedAt: timestamp("onboardingCompletedAt", { mode: 'date' }),
  sport: varchar("sport", { length: 50 }),
  dateOfBirth: timestamp("dateOfBirth", { mode: 'date' }),
  goals: text("goals"),
  referralCode: varchar("referralCode", { length: 20 }).unique(),
  referredBy: integer("referredBy"),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { mode: 'date' }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Programs offered by The Academy
 */
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: programCategoryEnum("category").notNull(),
  sport: programSportEnum("sport"),
  ageMin: integer("ageMin").notNull().default(8),
  ageMax: integer("ageMax").notNull().default(18),
  maxParticipants: integer("maxParticipants"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;

/**
 * User-program enrollments (many-to-many join table)
 */
export const userPrograms = pgTable("userPrograms", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  programId: integer("programId").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  enrolledAt: timestamp("enrolledAt", { mode: 'date' }).defaultNow().notNull(),
  cancelledAt: timestamp("cancelledAt", { mode: 'date' }),
});

export type UserProgram = typeof userPrograms.$inferSelect;
export type InsertUserProgram = typeof userPrograms.$inferInsert;

/**
 * Announcements for members
 */
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: integer("authorId").notNull(),
  isPublished: boolean("isPublished").notNull().default(false),
  publishedAt: timestamp("publishedAt", { mode: 'date' }),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Contact form submissions
 */
export const contactSubmissions = pgTable("contactSubmissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: contactTypeEnum("type").notNull().default("general"),
  status: contactStatusEnum("status").notNull().default("new"),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

/**
 * Training schedules and sessions
 */
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  programId: integer("programId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime", { mode: 'date' }).notNull(),
  endTime: timestamp("endTime", { mode: 'date' }).notNull(),
  dayOfWeek: dayOfWeekEnum("dayOfWeek"),
  location: varchar("location", { length: 255 }),
  locationId: integer("locationId"),
  maxParticipants: integer("maxParticipants"),
  sessionType: varchar("sessionType", { length: 50 }),
  isRecurring: boolean("isRecurring").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

/**
 * Session registrations (user enrollments in specific sessions)
 */
export const sessionRegistrations = pgTable("sessionRegistrations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  scheduleId: integer("scheduleId").notNull(),
  paymentId: integer("paymentId"),
  status: registrationStatusEnum("status").notNull().default("registered"),
  registeredAt: timestamp("registeredAt", { mode: 'date' }).defaultNow().notNull(),
});

export type SessionRegistration = typeof sessionRegistrations.$inferSelect;
export type InsertSessionRegistration = typeof sessionRegistrations.$inferInsert;

/**
 * Payments table
 */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("usd"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  type: paymentTypeEnum("type").notNull().default("one_time"),
  description: text("description"),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Stripe webhook events (dedupe + processing state)
 */
export const stripeWebhookEvents = pgTable("stripeWebhookEvents", {
  id: serial("id").primaryKey(),
  eventId: varchar("eventId", { length: 255 }).notNull().unique(),
  eventType: varchar("eventType", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("processing"),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type InsertStripeWebhookEvent = typeof stripeWebhookEvents.$inferInsert;

/**
 * Subscriptions table
 */
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodStart: timestamp("currentPeriodStart", { mode: 'date' }),
  currentPeriodEnd: timestamp("currentPeriodEnd", { mode: 'date' }),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Gallery photos
 */
export const galleryPhotos = pgTable("galleryPhotos", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  imageKey: varchar("imageKey", { length: 500 }),
  category: galleryCategoryEnum("category").notNull().default("training"),
  uploadedBy: integer("uploadedBy").notNull(),
  isVisible: boolean("isVisible").notNull().default(true),
  viewCount: integer("viewCount").default(0),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type InsertGalleryPhoto = typeof galleryPhotos.$inferInsert;

/**
 * Videos table
 */
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  url: varchar("url", { length: 500 }).notNull(),
  thumbnail: varchar("thumbnail", { length: 500 }),
  category: videoCategoryEnum("category").notNull().default("training"),
  platform: videoPlatformEnum("platform").notNull().default("tiktok"),
  viewCount: integer("viewCount").default(0),
  isPublished: boolean("isPublished").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Products table (shop/merchandise)
 */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  imageKey: varchar("imageKey", { length: 500 }),
  category: productCategoryEnum("category").notNull(),
  stock: integer("stock").default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Orders table
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  shippingAddress: text("shippingAddress"),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items table
 */
export const orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  productId: integer("productId").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Campaigns table (promotions/discounts)
 */
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }),
  startDate: timestamp("startDate", { mode: 'date' }).notNull(),
  endDate: timestamp("endDate", { mode: 'date' }).notNull(),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Chat messages table
 */
export const chatMessages = pgTable("chatMessages", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  message: text("message").notNull(),
  room: varchar("room", { length: 100 }).default("general"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  imageKey: varchar("imageKey", { length: 500 }),
  mentions: text("mentions"), // JSON array of mentioned user IDs
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Attendance records table
 */
export const attendanceRecords = pgTable("attendanceRecords", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  scheduleId: integer("scheduleId").notNull(),
  status: attendanceStatusEnum("status").notNull().default("present"),
  markedBy: integer("markedBy"),
  markedAt: timestamp("markedAt", { mode: 'date' }).defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = typeof attendanceRecords.$inferInsert;

/**
 * Blog posts table
 */
export const blogPosts = pgTable("blogPosts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: varchar("featuredImage", { length: 500 }),
  authorId: integer("authorId").notNull(),
  category: blogCategoryEnum("category").notNull(),
  tags: text("tags"),
  isPublished: boolean("isPublished").notNull().default(false),
  publishedAt: timestamp("publishedAt", { mode: 'date' }),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Locations table
 */
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;

/**
 * Coaches and staff table
 * Tracks coaching staff and their assignments
 */
export const coaches = pgTable("coaches", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  bio: text("bio"),
  specialties: text("specialties"),
  certifications: text("certifications"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type Coach = typeof coaches.$inferSelect;
export type InsertCoach = typeof coaches.$inferInsert;

/**
 * Coach assignments table
 * Links coaches to programs or specific sessions
 */
export const coachAssignments = pgTable("coachAssignments", {
  id: serial("id").primaryKey(),
  coachId: integer("coachId").notNull(),
  programId: integer("programId"),
  scheduleId: integer("scheduleId"),
  role: varchar("role", { length: 50 }),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type CoachAssignment = typeof coachAssignments.$inferSelect;
export type InsertCoachAssignment = typeof coachAssignments.$inferInsert;

/**
 * Notification preferences table
 * User preferences for email notifications
 */
export const notificationPreferences = pgTable("notificationPreferences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  sessionRegistrations: boolean("sessionRegistrations").notNull().default(true),
  paymentConfirmations: boolean("paymentConfirmations").notNull().default(true),
  announcements: boolean("announcements").notNull().default(true),
  attendanceUpdates: boolean("attendanceUpdates").notNull().default(true),
  blogPosts: boolean("blogPosts").notNull().default(false),
  marketing: boolean("marketing").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * User relations table
 * Links parent accounts to child athlete accounts
 */
export const userRelations = pgTable("userRelations", {
  id: serial("id").primaryKey(),
  parentId: integer("parentId").notNull(),
  childId: integer("childId").notNull(),
  relationshipType: varchar("relationshipType", { length: 50 }).notNull().default("parent"),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type UserRelation = typeof userRelations.$inferSelect;
export type InsertUserRelation = typeof userRelations.$inferInsert;

/**
 * Private Session Booking Requests table
 * Tracks booking requests for individual training sessions
 */
export const privateSessionBookings = pgTable("privateSessionBookings", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  customerEmail: varchar("customerEmail", { length: 255 }).notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }),
  coachId: integer("coachId").notNull(),
  coachName: varchar("coachName", { length: 100 }).notNull(),
  preferredDates: text("preferredDates"),
  preferredTimes: text("preferredTimes"),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type PrivateSessionBooking = typeof privateSessionBookings.$inferSelect;
export type InsertPrivateSessionBooking = typeof privateSessionBookings.$inferInsert;


// ============================================================================
// DIRECT MESSAGING TABLES
// ============================================================================

/**
 * DM Conversations table
 * Represents a direct message thread between users
 */
export const dmConversations = pgTable("dmConversations", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
  lastMessageAt: timestamp("lastMessageAt", { mode: 'date' }),
});

export type DmConversation = typeof dmConversations.$inferSelect;
export type InsertDmConversation = typeof dmConversations.$inferInsert;

/**
 * DM Participants table
 * Links users to conversations with their settings
 */
export const dmParticipants = pgTable("dmParticipants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  userId: integer("userId").notNull(),
  lastReadAt: timestamp("lastReadAt", { mode: 'date' }),
  isMuted: boolean("isMuted").notNull().default(false),
  mutedUntil: timestamp("mutedUntil", { mode: 'date' }),
  isArchived: boolean("isArchived").notNull().default(false),
  joinedAt: timestamp("joinedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type DmParticipant = typeof dmParticipants.$inferSelect;
export type InsertDmParticipant = typeof dmParticipants.$inferInsert;

/**
 * DM Messages table
 * Individual messages within a conversation
 */
export const dmMessages = pgTable("dmMessages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  senderId: integer("senderId").notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  isEdited: boolean("isEdited").notNull().default(false),
  isDeleted: boolean("isDeleted").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type DmMessage = typeof dmMessages.$inferSelect;
export type InsertDmMessage = typeof dmMessages.$inferInsert;

/**
 * DM Read Receipts table
 * Tracks when users read specific messages
 */
export const dmReadReceipts = pgTable("dmReadReceipts", {
  id: serial("id").primaryKey(),
  messageId: integer("messageId").notNull(),
  userId: integer("userId").notNull(),
  readAt: timestamp("readAt", { mode: 'date' }).defaultNow().notNull(),
});

export type DmReadReceipt = typeof dmReadReceipts.$inferSelect;
export type InsertDmReadReceipt = typeof dmReadReceipts.$inferInsert;

/**
 * User Blocks table
 * Tracks blocked users for DM purposes
 */
export const userBlocks = pgTable("userBlocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blockerId").notNull(),
  blockedId: integer("blockedId").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type UserBlock = typeof userBlocks.$inferSelect;
export type InsertUserBlock = typeof userBlocks.$inferInsert;

/**
 * User Roles Extended table
 * Extended roles for messaging permissions (parent, athlete, coach, staff)
 */
export const userMessagingRoles = pgTable("userMessagingRoles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  messagingRole: messagingRoleEnum("messagingRole").notNull().default("parent"),
  canDmCoaches: boolean("canDmCoaches").notNull().default(true),
  canDmParents: boolean("canDmParents").notNull().default(false),
  canDmAthletes: boolean("canDmAthletes").notNull().default(false),
  canBroadcast: boolean("canBroadcast").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type UserMessagingRole = typeof userMessagingRoles.$inferSelect;
export type InsertUserMessagingRole = typeof userMessagingRoles.$inferInsert;

// ============================================================================
// PUSH NOTIFICATIONS TABLES
// ============================================================================

/**
 * Push Subscriptions table
 * Stores both Web Push and Expo Push subscriptions.
 * - Web Push: uses endpoint + p256dh + auth
 * - Expo Push: uses expoPushToken
 * Platform distinguishes between them.
 */
export const pushSubscriptions = pgTable("pushSubscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  deviceId: varchar("deviceId", { length: 255 }), // Stable per-device ID for multi-device support
  platform: varchar("platform", { length: 20 }).notNull().default("web"), // "web" | "ios" | "android"
  // Web Push fields (nullable for Expo tokens)
  endpoint: text("endpoint"),
  p256dh: varchar("p256dh", { length: 255 }),
  auth: varchar("auth", { length: 255 }),
  // Expo Push token (nullable for Web Push)
  expoPushToken: varchar("expoPushToken", { length: 255 }),
  userAgent: text("userAgent"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Notification Settings table
 * User preferences for push and email notifications
 */
export const notificationSettings = pgTable("notificationSettings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  pushEnabled: boolean("pushEnabled").notNull().default(false),
  emailFallback: boolean("emailFallback").notNull().default(true),
  dmNotifications: boolean("dmNotifications").notNull().default(true),
  channelNotifications: boolean("channelNotifications").notNull().default(true),
  mentionNotifications: boolean("mentionNotifications").notNull().default(true),
  announcementNotifications: boolean("announcementNotifications").notNull().default(true),
  quietHoursEnabled: boolean("quietHoursEnabled").notNull().default(false),
  quietHoursStart: varchar("quietHoursStart", { length: 5 }),
  quietHoursEnd: varchar("quietHoursEnd", { length: 5 }),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = typeof notificationSettings.$inferInsert;

/**
 * Notification Log table
 * Tracks sent notifications for debugging and analytics
 */
export const notificationLogs = pgTable("notificationLogs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: notificationTypeEnum("notificationType").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  data: text("data"),
  status: notificationStatusEnum("notificationStatus").notNull().default("pending"),
  sentAt: timestamp("sentAt", { mode: 'date' }),
  clickedAt: timestamp("clickedAt", { mode: 'date' }),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;

// ============================================================================
// LEAD CAPTURE & NURTURE TABLES
// ============================================================================

/**
 * Leads captured from the marketing site (academytn.com).
 * Quiz completions, form submissions, and camp inquiries flow here.
 */
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  source: varchar("source", { length: 100 }).notNull().default("quiz"),
  athleteAge: varchar("athleteAge", { length: 20 }),
  sport: varchar("sport", { length: 50 }),
  goal: varchar("goal", { length: 50 }),
  recommendedProgram: varchar("recommendedProgram", { length: 100 }),
  status: leadStatusEnum("lead_status").notNull().default("new"),
  nurtureStep: integer("nurtureStep").notNull().default(0),
  lastNurtureAt: timestamp("lastNurtureAt", { mode: 'date' }),
  convertedAt: timestamp("convertedAt", { mode: 'date' }),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Log of nurture emails sent to leads.
 * Tracks which email in the sequence was sent and when.
 */
export const nurtureEmailLog = pgTable("nurtureEmailLog", {
  id: serial("id").primaryKey(),
  leadId: integer("leadId").notNull(),
  step: integer("step").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  sentAt: timestamp("sentAt", { mode: 'date' }).defaultNow().notNull(),
  opened: boolean("opened").notNull().default(false),
  clicked: boolean("clicked").notNull().default(false),
});

export type NurtureEmailLog = typeof nurtureEmailLog.$inferSelect;
export type InsertNurtureEmailLog = typeof nurtureEmailLog.$inferInsert;

// ============================================================================
// ATHLETE METRICS TABLES
// ============================================================================

export const metricCategoryEnum = pgEnum("metric_category", [
  "speed",
  "power",
  "agility",
  "endurance",
  "strength",
  "flexibility",
  "skill",
]);

/**
 * Athlete performance metrics.
 * Tracks measurements like vertical jump, 40-yard dash, shuttle run, etc.
 */
export const athleteMetrics = pgTable("athleteMetrics", {
  id: serial("id").primaryKey(),
  athleteId: integer("athleteId").notNull(),
  recordedBy: integer("recordedBy").notNull(), // coach/admin who recorded
  metricName: varchar("metricName", { length: 100 }).notNull(), // e.g., "Vertical Jump", "40-Yard Dash"
  category: metricCategoryEnum("category").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(), // raw numeric value
  unit: varchar("unit", { length: 20 }).notNull(), // "inches", "seconds", "mph", "reps"
  notes: text("notes"),
  sessionDate: timestamp("sessionDate", { mode: 'date' }).notNull(),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type AthleteMetric = typeof athleteMetrics.$inferSelect;
export type InsertAthleteMetric = typeof athleteMetrics.$inferInsert;

// ============================================================================
// ATHLETE SHOWCASE TABLE
// ============================================================================

/**
 * Athlete Showcase — weekly/featured athlete highlights.
 * Displayed on the announcements section or a dedicated showcase page.
 */
export const athleteShowcases = pgTable("athleteShowcases", {
  id: serial("id").primaryKey(),
  athleteId: integer("athleteId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  imageKey: varchar("imageKey", { length: 500 }),
  sport: programSportEnum("sport"),
  achievements: text("achievements"), // JSON array of achievement strings
  stats: text("stats"), // JSON object of key stats to highlight
  isActive: boolean("isActive").notNull().default(true),
  featuredFrom: timestamp("featuredFrom", { mode: 'date' }).notNull(),
  featuredUntil: timestamp("featuredUntil", { mode: 'date' }),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type AthleteShowcase = typeof athleteShowcases.$inferSelect;
export type InsertAthleteShowcase = typeof athleteShowcases.$inferInsert;

// ============================================================================
// MERCH DROP NOTIFICATIONS TABLE
// ============================================================================

export const dropTypeEnum = pgEnum("drop_type", [
  "product",
  "program",
  "content",
  "event",
]);

/**
 * Merchandise/content drops — scheduled announcements for new items.
 * Triggers push notifications to members.
 */
export const merchDrops = pgTable("merchDrops", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dropType: dropTypeEnum("dropType").notNull(),
  referenceId: integer("referenceId"), // product/program/video ID
  imageUrl: varchar("imageUrl", { length: 500 }),
  scheduledAt: timestamp("scheduledAt", { mode: 'date' }).notNull(),
  isSent: boolean("isSent").notNull().default(false),
  sentAt: timestamp("sentAt", { mode: 'date' }),
  viewCount: integer("viewCount").notNull().default(0),
  clickCount: integer("clickCount").notNull().default(0),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type MerchDrop = typeof merchDrops.$inferSelect;
export type InsertMerchDrop = typeof merchDrops.$inferInsert;

// ============================================================================
// GAMES & REWARDS TABLES
// ============================================================================

export const gameTypeEnum = pgEnum("game_type", [
  "spin_wheel",
  "trivia",
  "scratch_card",
]);

export const rewardTypeEnum = pgEnum("reward_type", [
  "points",
  "discount",
  "merch",
  "badge",
  "none",
]);

/**
 * User points balance for the rewards/games system.
 */
export const userPoints = pgTable("userPoints", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  totalPoints: integer("totalPoints").notNull().default(0),
  lifetimePoints: integer("lifetimePoints").notNull().default(0),
  currentStreak: integer("currentStreak").notNull().default(0),
  longestStreak: integer("longestStreak").notNull().default(0),
  lastPlayedAt: timestamp("lastPlayedAt", { mode: 'date' }),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type UserPoint = typeof userPoints.$inferSelect;
export type InsertUserPoint = typeof userPoints.$inferInsert;

/**
 * Individual game plays — tracks each game session and outcome.
 */
export const gameEntries = pgTable("gameEntries", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  gameType: gameTypeEnum("gameType").notNull(),
  rewardType: rewardTypeEnum("rewardType").notNull().default("none"),
  rewardValue: varchar("rewardValue", { length: 255 }), // e.g., "50" points, "10%" discount, "Academy T-Shirt"
  pointsEarned: integer("pointsEarned").notNull().default(0),
  metadata: text("metadata"), // JSON — game-specific data (trivia answers, wheel result, etc.)
  playedAt: timestamp("playedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type GameEntry = typeof gameEntries.$inferSelect;
export type InsertGameEntry = typeof gameEntries.$inferInsert;

/**
 * Trivia question bank — admin-managed questions for the trivia game.
 */
export const triviaQuestions = pgTable("triviaQuestions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  optionA: varchar("optionA", { length: 255 }).notNull(),
  optionB: varchar("optionB", { length: 255 }).notNull(),
  optionC: varchar("optionC", { length: 255 }).notNull(),
  optionD: varchar("optionD", { length: 255 }).notNull(),
  correctOption: varchar("correctOption", { length: 1 }).notNull(), // "a", "b", "c", "d"
  category: varchar("category", { length: 100 }), // "basketball", "football", "academy", "general"
  difficulty: varchar("difficulty", { length: 20 }).notNull().default("medium"), // "easy", "medium", "hard"
  pointValue: integer("pointValue").notNull().default(10),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type TriviaQuestion = typeof triviaQuestions.$inferSelect;
export type InsertTriviaQuestion = typeof triviaQuestions.$inferInsert;

// ============================================================================
// SOCIAL MEDIA POSTS TABLE
// ============================================================================

export const socialPlatformEnum = pgEnum("social_platform", [
  "instagram",
  "tiktok",
  "twitter",
  "facebook",
  "youtube",
]);

/**
 * Social media post embeds — references to external social media posts.
 * Used for the social gallery feature in the mobile app.
 */
export const socialPosts = pgTable("socialPosts", {
  id: serial("id").primaryKey(),
  platform: socialPlatformEnum("socialPlatform").notNull(),
  postUrl: varchar("postUrl", { length: 500 }).notNull(),
  embedHtml: text("embedHtml"),
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  caption: text("caption"),
  postedAt: timestamp("postedAt", { mode: 'date' }),
  isVisible: boolean("isVisible").notNull().default(true),
  sortOrder: integer("sortOrder").notNull().default(0),
  addedBy: integer("addedBy").notNull(),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = typeof socialPosts.$inferInsert;

// ============================================================================
// EXTENDED RBAC
// ============================================================================

export const userRoleExtendedEnum = pgEnum("user_role_extended", [
  "owner",
  "admin",
  "head_coach",
  "assistant_coach",
  "front_desk",
  "parent",
  "athlete",
]);

// ============================================================================
// WAITLIST TABLE
// ============================================================================

/**
 * Waitlist entries for sessions/programs at capacity.
 * When a spot opens, the next person in line is notified.
 */
export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  scheduleId: integer("scheduleId"),
  programId: integer("programId"),
  position: integer("position").notNull().default(0),
  status: varchar("status", { length: 30 }).notNull().default("waiting"), // waiting, notified, enrolled, expired, cancelled
  notifiedAt: timestamp("notifiedAt", { mode: 'date' }),
  expiresAt: timestamp("expiresAt", { mode: 'date' }),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type WaitlistEntry = typeof waitlist.$inferSelect;
export type InsertWaitlistEntry = typeof waitlist.$inferInsert;

// ============================================================================
// REFERRALS TABLE
// ============================================================================

/**
 * Member referral program.
 * Tracks referral codes, conversions, and point rewards.
 */
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrerId").notNull(),
  referredEmail: varchar("referredEmail", { length: 320 }).notNull(),
  referredUserId: integer("referredUserId"),
  referralCode: varchar("referralCode", { length: 20 }).notNull().unique(),
  status: varchar("status", { length: 30 }).notNull().default("pending"), // pending, signed_up, enrolled, rewarded
  pointsAwarded: integer("pointsAwarded").notNull().default(0),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }),
  convertedAt: timestamp("convertedAt", { mode: 'date' }),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// ============================================================================
// SCHEDULE TEMPLATES TABLE
// ============================================================================

/**
 * Recurring schedule templates.
 * Admins define weekly templates; the system generates actual schedule entries from them.
 */
export const scheduleTemplates = pgTable("scheduleTemplates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  programId: integer("programId"),
  dayOfWeek: dayOfWeekEnum("dayOfWeek").notNull(),
  startHour: integer("startHour").notNull(),
  startMinute: integer("startMinute").notNull().default(0),
  endHour: integer("endHour").notNull(),
  endMinute: integer("endMinute").notNull().default(0),
  location: varchar("location", { length: 255 }),
  maxParticipants: integer("maxParticipants"),
  isActive: boolean("isActive").notNull().default(true),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: 'date' }).defaultNow().notNull(),
});

export type ScheduleTemplate = typeof scheduleTemplates.$inferSelect;
export type InsertScheduleTemplate = typeof scheduleTemplates.$inferInsert;

// ============================================================================
// BILLING REMINDERS TABLE
// ============================================================================

/**
 * Tracks dunning/billing reminder emails sent to users with failed payments.
 * Escalates: Day 1 → Day 3 → Day 7 → Day 14 (suspension).
 */
export const billingReminders = pgTable("billingReminders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  subscriptionId: integer("subscriptionId"),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }),
  reminderType: varchar("reminderType", { length: 50 }).notNull().default("payment_failed"),
  reminderCount: integer("reminderCount").notNull().default(1),
  lastSentAt: timestamp("lastSentAt", { mode: 'date' }).defaultNow().notNull(),
  nextSendAt: timestamp("nextSendAt", { mode: 'date' }),
  status: varchar("status", { length: 30 }).notNull().default("active"), // active, resolved, suspended
  createdAt: timestamp("createdAt", { mode: 'date' }).defaultNow().notNull(),
});

export type BillingReminder = typeof billingReminders.$inferSelect;
export type InsertBillingReminder = typeof billingReminders.$inferInsert;

// ============================================================================
// ONBOARDING STEPS TABLE
// ============================================================================

/**
 * Tracks which onboarding steps a user has completed.
 */
export const onboardingSteps = pgTable("onboardingSteps", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  step: varchar("step", { length: 50 }).notNull(), // select_sport, set_goals, choose_program, schedule_first_session, complete
  completedAt: timestamp("completedAt", { mode: 'date' }).defaultNow().notNull(),
})

export type OnboardingStep = typeof onboardingSteps.$inferSelect;
export type InsertOnboardingStep = typeof onboardingSteps.$inferInsert;

// ============================================================================
// AI PROGRESS REPORTS
// ============================================================================

/**
 * AI-generated athlete progress reports — stored for history and parent email.
 */
export const progressReports = pgTable("progress_reports", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  content: text("content").notNull(),
  generatedAt: timestamp("generated_at", { mode: 'date' }).defaultNow().notNull(),
});

export type ProgressReport = typeof progressReports.$inferSelect;
export type InsertProgressReport = typeof progressReports.$inferInsert;

// ============================================================================
// AUTOMATION INFRASTRUCTURE (v1.8.0)
// ============================================================================

/**
 * Re-engagement tracking — prevents notification spam for win-back campaigns.
 */
export const reengagementLog = pgTable("reengagement_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  sentAt: timestamp("sent_at", { mode: 'date' }).defaultNow().notNull(),
});

export type ReengagementLogEntry = typeof reengagementLog.$inferSelect;
export type InsertReengagementLogEntry = typeof reengagementLog.$inferInsert;

/**
 * AI-generated session recaps — feeds the community/media feed.
 */
export const sessionRecaps = pgTable("session_recaps", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id"),
  content: text("content").notNull(),
  type: varchar("type", { length: 20 }).default("recap").notNull(),
  generatedAt: timestamp("generated_at", { mode: 'date' }).defaultNow().notNull(),
});

export type SessionRecap = typeof sessionRecaps.$inferSelect;
export type InsertSessionRecap = typeof sessionRecaps.$inferInsert;

/**
 * AI-generated social content queue — coach reviews before posting externally.
 */
export const contentQueue = pgTable("content_queue", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  platform: varchar("platform", { length: 20 }).default("instagram"),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  scheduleId: integer("schedule_id"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { mode: 'date' }),
  generatedAt: timestamp("generated_at", { mode: 'date' }).defaultNow().notNull(),
});

export type ContentQueueItem = typeof contentQueue.$inferSelect;
export type InsertContentQueueItem = typeof contentQueue.$inferInsert;

/**
 * Digest tracking — prevents duplicate weekly digest sends.
 */
export const digestLog = pgTable("digest_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  weekKey: varchar("week_key", { length: 10 }).notNull(),
  sentAt: timestamp("sent_at", { mode: 'date' }).defaultNow().notNull(),
});

export type DigestLogEntry = typeof digestLog.$inferSelect;
export type InsertDigestLogEntry = typeof digestLog.$inferInsert;

/**
 * Reminder dedup — prevents re-sending reminders for the same session+user.
 */
export const reminderLog = pgTable("reminder_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  scheduleId: integer("schedule_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  sentAt: timestamp("sent_at", { mode: 'date' }).defaultNow().notNull(),
});

export type ReminderLogEntry = typeof reminderLog.$inferSelect;
export type InsertReminderLogEntry = typeof reminderLog.$inferInsert;

// ============================================================================
// MILESTONES (PR Celebration Engine)
// ============================================================================

/**
 * Athlete personal-record milestones with celebration card images.
 */
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  metricName: varchar("metric_name", { length: 100 }).notNull(),
  previousValue: decimal("previous_value", { precision: 10, scale: 2 }),
  newValue: decimal("new_value", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }),
  improvementPct: decimal("improvement_pct", { precision: 5, scale: 1 }),
  improvementDisplay: varchar("improvement_display", { length: 100 }).notNull(),
  cardImageUrl: text("card_image_url"),
  sharedCount: integer("shared_count").default(0),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
});

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;

// ============================================================================
// VISION CAPTURES TABLE
// ============================================================================

/**
 * Vision Captures — AI-assisted metric extraction from voice memos and photos.
 * Tracks capture sessions, extraction results, and confirmation status.
 */
export const visionCaptures = pgTable("vision_captures", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id"),
  capturedBy: integer("captured_by").notNull(),
  mode: varchar("mode", { length: 20 }).notNull(),
  mediaUrl: text("media_url").notNull(),
  mediaType: varchar("media_type", { length: 30 }).notNull(),
  extractionJson: jsonb("extraction_json"),
  status: varchar("status", { length: 20 }).default("processing").notNull(),
  athleteCount: integer("athlete_count").default(0),
  metricCount: integer("metric_count").default(0),
  processingTimeMs: integer("processing_time_ms"),
  aiObservations: text("ai_observations"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at", { mode: 'date' }),
});

export type VisionCapture = typeof visionCaptures.$inferSelect;
export type InsertVisionCapture = typeof visionCaptures.$inferInsert;

// ============================================================================
// GOVERNANCE EVIDENCE (Local Audit Trail)
// ============================================================================

/**
 * Local governance evidence trail. Every governed mutation and cron job
 * execution is recorded here, regardless of whether the external Strix SDK
 * is configured. This is the platform's own audit log — the canonical
 * record of "who did what, when, and what the system decided."
 */
export const governanceEvidence = pgTable("governance_evidence", {
  id: serial("id").primaryKey(),
  capabilityId: varchar("capability_id", { length: 120 }).notNull(),
  actorId: varchar("actor_id", { length: 100 }).notNull(),
  actorRole: varchar("actor_role", { length: 50 }).notNull(),
  actorEmail: varchar("actor_email", { length: 255 }),
  action: varchar("action", { length: 20 }).notNull(), // allow, deny, escalate, error
  reason: text("reason"),
  source: varchar("source", { length: 20 }).notNull(), // trpc, cron
  externalDecisionId: varchar("external_decision_id", { length: 200 }),
  evidenceHash: varchar("evidence_hash", { length: 64 }), // SHA-256 hex digest of decision payload
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
});

export type GovernanceEvidenceRow = typeof governanceEvidence.$inferSelect;
export type InsertGovernanceEvidence = typeof governanceEvidence.$inferInsert;
