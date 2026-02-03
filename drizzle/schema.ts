import {
  mysqlTable,
  int,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = mysqlEnum("role", ["user", "admin"]);
export const programCategoryEnum = mysqlEnum("category", [
  "group",
  "individual",
  "shooting",
  "league",
  "camp",
  "membership",
]);
export const programSportEnum = mysqlEnum("sport", [
  "basketball",
  "football",
  "flag_football",
  "soccer",
  "multi_sport",
  "saq",
]);
export const contactTypeEnum = mysqlEnum("type", ["general", "volunteer"]);
export const contactStatusEnum = mysqlEnum("status", [
  "new",
  "read",
  "responded",
]);
export const paymentStatusEnum = mysqlEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);
export const paymentTypeEnum = mysqlEnum("payment_type", [
  "one_time",
  "recurring",
]);
export const subscriptionStatusEnum = mysqlEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "incomplete",
]);
export const registrationStatusEnum = mysqlEnum("registration_status", [
  "registered",
  "attended",
  "canceled",
  "no_show",
]);
export const galleryCategoryEnum = mysqlEnum("gallery_category", [
  "training",
  "teams",
  "events",
  "facilities",
  "other",
]);
export const blogCategoryEnum = mysqlEnum("blog_category", [
  "training_tips",
  "athlete_spotlight",
  "news",
  "events",
  "other",
]);
export const productCategoryEnum = mysqlEnum("product_category", [
  "apparel",
  "accessories",
  "equipment",
]);
export const orderStatusEnum = mysqlEnum("order_status", [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
export const videoCategoryEnum = mysqlEnum("video_category", [
  "training",
  "highlights",
]);
export const videoPlatformEnum = mysqlEnum("video_platform", [
  "tiktok",
  "instagram",
]);
export const attendanceStatusEnum = mysqlEnum("attendance_status", [
  "present",
  "absent",
  "excused",
  "late",
]);
export const dayOfWeekEnum = mysqlEnum("day_of_week", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

// ============================================================================
// TABLES
// ============================================================================

/**
 * Core user table backing auth flow.
 * Extended with role-based access for public, member, and admin users.
 */
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Programs offered by The Academy
 */
export const programs = mysqlTable("programs", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: mysqlEnum("category", ["group", "individual", "shooting", "league", "camp", "membership"]).notNull(),
  sport: mysqlEnum("sport", ["basketball", "football", "flag_football", "soccer", "multi_sport", "saq"]),
  ageMin: int("ageMin").notNull().default(8),
  ageMax: int("ageMax").notNull().default(18),
  maxParticipants: int("maxParticipants"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;

/**
 * Announcements for members
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: int("authorId").notNull(),
  isPublished: boolean("isPublished").notNull().default(false),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Contact form submissions
 */
export const contactSubmissions = mysqlTable("contactSubmissions", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["general", "volunteer"]).notNull().default("general"),
  status: mysqlEnum("status", ["new", "read", "responded"]).notNull().default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

/**
 * Training schedules and sessions
 */
export const schedules = mysqlTable("schedules", {
  id: int("id").primaryKey().autoincrement(),
  programId: int("programId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  dayOfWeek: mysqlEnum("dayOfWeek", ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  location: varchar("location", { length: 255 }),
  locationId: int("locationId"),
  maxParticipants: int("maxParticipants"),
  sessionType: varchar("sessionType", { length: 50 }),
  isRecurring: boolean("isRecurring").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

/**
 * Session registrations (user enrollments in specific sessions)
 */
export const sessionRegistrations = mysqlTable("sessionRegistrations", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  scheduleId: int("scheduleId").notNull(),
  paymentId: int("paymentId"),
  status: mysqlEnum("status", ["registered", "attended", "canceled", "no_show"]).notNull().default("registered"),
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
});

export type SessionRegistration = typeof sessionRegistrations.$inferSelect;
export type InsertSessionRegistration = typeof sessionRegistrations.$inferInsert;

/**
 * Payments table
 */
export const payments = mysqlTable("payments", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("usd"),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "refunded"]).notNull().default("pending"),
  type: mysqlEnum("type", ["one_time", "recurring"]).notNull().default("one_time"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Stripe webhook events (dedupe + processing state)
 */
export const stripeWebhookEvents = mysqlTable("stripeWebhookEvents", {
  id: int("id").primaryKey().autoincrement(),
  eventId: varchar("eventId", { length: 255 }).notNull().unique(),
  eventType: varchar("eventType", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("processing"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type InsertStripeWebhookEvent = typeof stripeWebhookEvents.$inferInsert;

/**
 * Subscriptions table
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "incomplete"]).notNull().default("active"),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Gallery photos
 */
export const galleryPhotos = mysqlTable("galleryPhotos", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  imageKey: varchar("imageKey", { length: 500 }),
  category: mysqlEnum("category", ["training", "teams", "events", "facilities", "other"]).notNull().default("other"),
  uploadedBy: int("uploadedBy").notNull(),
  isVisible: boolean("isVisible").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type InsertGalleryPhoto = typeof galleryPhotos.$inferInsert;

/**
 * Videos table
 */
export const videos = mysqlTable("videos", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  url: varchar("url", { length: 500 }).notNull(),
  thumbnail: varchar("thumbnail", { length: 500 }),
  category: mysqlEnum("category", ["training", "highlights"]).notNull().default("training"),
  platform: mysqlEnum("platform", ["tiktok", "instagram"]).notNull().default("tiktok"),
  viewCount: int("viewCount").default(0),
  isPublished: boolean("isPublished").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Products table (shop/merchandise)
 */
export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  imageKey: varchar("imageKey", { length: 500 }),
  category: mysqlEnum("category", ["apparel", "accessories", "equipment"]).notNull(),
  stock: int("stock").default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Orders table
 */
export const orders = mysqlTable("orders", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "processing", "shipped", "delivered", "cancelled"]).notNull().default("pending"),
  shippingAddress: text("shippingAddress"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items table
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").primaryKey().autoincrement(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Campaigns table (promotions/discounts)
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Chat messages table
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  message: text("message").notNull(),
  room: varchar("room", { length: 100 }).default("general"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  imageKey: varchar("imageKey", { length: 500 }),
  mentions: text("mentions"), // JSON array of mentioned user IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Attendance records table
 */
export const attendanceRecords = mysqlTable("attendanceRecords", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  scheduleId: int("scheduleId").notNull(),
  status: mysqlEnum("status", ["present", "absent", "excused", "late"]).notNull().default("present"),
  markedBy: int("markedBy"),
  markedAt: timestamp("markedAt").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = typeof attendanceRecords.$inferInsert;

/**
 * Blog posts table
 */
export const blogPosts = mysqlTable("blogPosts", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: varchar("featuredImage", { length: 500 }),
  authorId: int("authorId").notNull(),
  category: mysqlEnum("category", ["training_tips", "athlete_spotlight", "news", "events", "other"]).notNull(),
  tags: text("tags"),
  isPublished: boolean("isPublished").notNull().default(false),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Locations table
 */
export const locations = mysqlTable("locations", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;

/**
 * Coaches and staff table
 * Tracks coaching staff and their assignments
 */
export const coaches = mysqlTable("coaches", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  bio: text("bio"),
  specialties: text("specialties"),
  certifications: text("certifications"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Coach = typeof coaches.$inferSelect;
export type InsertCoach = typeof coaches.$inferInsert;

/**
 * Coach assignments table
 * Links coaches to programs or specific sessions
 */
export const coachAssignments = mysqlTable("coachAssignments", {
  id: int("id").primaryKey().autoincrement(),
  coachId: int("coachId").notNull(),
  programId: int("programId"),
  scheduleId: int("scheduleId"),
  role: varchar("role", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachAssignment = typeof coachAssignments.$inferSelect;
export type InsertCoachAssignment = typeof coachAssignments.$inferInsert;

/**
 * Notification preferences table
 * User preferences for email notifications
 */
export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull().unique(),
  sessionRegistrations: boolean("sessionRegistrations").notNull().default(true),
  paymentConfirmations: boolean("paymentConfirmations").notNull().default(true),
  announcements: boolean("announcements").notNull().default(true),
  attendanceUpdates: boolean("attendanceUpdates").notNull().default(true),
  blogPosts: boolean("blogPosts").notNull().default(false),
  marketing: boolean("marketing").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * User relations table
 * Links parent accounts to child athlete accounts
 */
export const userRelations = mysqlTable("userRelations", {
  id: int("id").primaryKey().autoincrement(),
  parentId: int("parentId").notNull(),
  childId: int("childId").notNull(),
  relationshipType: varchar("relationshipType", { length: 50 }).notNull().default("parent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserRelation = typeof userRelations.$inferSelect;
export type InsertUserRelation = typeof userRelations.$inferInsert;

/**
 * Private Session Booking Requests table
 * Tracks booking requests for individual training sessions
 */
export const privateSessionBookings = mysqlTable("privateSessionBookings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId"),
  customerEmail: varchar("customerEmail", { length: 255 }).notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }),
  coachId: int("coachId").notNull(),
  coachName: varchar("coachName", { length: 100 }).notNull(),
  preferredDates: text("preferredDates"),
  preferredTimes: text("preferredTimes"),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
export const dmConversations = mysqlTable("dmConversations", {
  id: int("id").primaryKey().autoincrement(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
});

export type DmConversation = typeof dmConversations.$inferSelect;
export type InsertDmConversation = typeof dmConversations.$inferInsert;

/**
 * DM Participants table
 * Links users to conversations with their settings
 */
export const dmParticipants = mysqlTable("dmParticipants", {
  id: int("id").primaryKey().autoincrement(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  lastReadAt: timestamp("lastReadAt"),
  isMuted: boolean("isMuted").notNull().default(false),
  mutedUntil: timestamp("mutedUntil"),
  isArchived: boolean("isArchived").notNull().default(false),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type DmParticipant = typeof dmParticipants.$inferSelect;
export type InsertDmParticipant = typeof dmParticipants.$inferInsert;

/**
 * DM Messages table
 * Individual messages within a conversation
 */
export const dmMessages = mysqlTable("dmMessages", {
  id: int("id").primaryKey().autoincrement(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isEdited: boolean("isEdited").notNull().default(false),
  isDeleted: boolean("isDeleted").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DmMessage = typeof dmMessages.$inferSelect;
export type InsertDmMessage = typeof dmMessages.$inferInsert;

/**
 * DM Read Receipts table
 * Tracks when users read specific messages
 */
export const dmReadReceipts = mysqlTable("dmReadReceipts", {
  id: int("id").primaryKey().autoincrement(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
});

export type DmReadReceipt = typeof dmReadReceipts.$inferSelect;
export type InsertDmReadReceipt = typeof dmReadReceipts.$inferInsert;

/**
 * User Blocks table
 * Tracks blocked users for DM purposes
 */
export const userBlocks = mysqlTable("userBlocks", {
  id: int("id").primaryKey().autoincrement(),
  blockerId: int("blockerId").notNull(),
  blockedId: int("blockedId").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserBlock = typeof userBlocks.$inferSelect;
export type InsertUserBlock = typeof userBlocks.$inferInsert;

/**
 * User Roles Extended table
 * Extended roles for messaging permissions (parent, athlete, coach, staff)
 */
export const userMessagingRoles = mysqlTable("userMessagingRoles", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull().unique(),
  messagingRole: mysqlEnum("messagingRole", ["parent", "athlete", "coach", "staff", "admin"]).notNull().default("parent"),
  canDmCoaches: boolean("canDmCoaches").notNull().default(true),
  canDmParents: boolean("canDmParents").notNull().default(false),
  canDmAthletes: boolean("canDmAthletes").notNull().default(false),
  canBroadcast: boolean("canBroadcast").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserMessagingRole = typeof userMessagingRoles.$inferSelect;
export type InsertUserMessagingRole = typeof userMessagingRoles.$inferInsert;

// ============================================================================
// PUSH NOTIFICATIONS TABLES
// ============================================================================

/**
 * Push Subscriptions table
 * Stores Web Push API subscriptions for users
 */
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: varchar("p256dh", { length: 255 }).notNull(),
  auth: varchar("auth", { length: 255 }).notNull(),
  userAgent: text("userAgent"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Notification Settings table
 * User preferences for push and email notifications
 */
export const notificationSettings = mysqlTable("notificationSettings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull().unique(),
  pushEnabled: boolean("pushEnabled").notNull().default(false),
  emailFallback: boolean("emailFallback").notNull().default(true),
  dmNotifications: boolean("dmNotifications").notNull().default(true),
  channelNotifications: boolean("channelNotifications").notNull().default(true),
  mentionNotifications: boolean("mentionNotifications").notNull().default(true),
  announcementNotifications: boolean("announcementNotifications").notNull().default(true),
  quietHoursEnabled: boolean("quietHoursEnabled").notNull().default(false),
  quietHoursStart: varchar("quietHoursStart", { length: 5 }),
  quietHoursEnd: varchar("quietHoursEnd", { length: 5 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = typeof notificationSettings.$inferInsert;

/**
 * Notification Log table
 * Tracks sent notifications for debugging and analytics
 */
export const notificationLogs = mysqlTable("notificationLogs", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  type: mysqlEnum("notificationType", ["push", "email"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  data: text("data"),
  status: mysqlEnum("notificationStatus", ["pending", "sent", "failed", "clicked"]).notNull().default("pending"),
  sentAt: timestamp("sentAt"),
  clickedAt: timestamp("clickedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;
