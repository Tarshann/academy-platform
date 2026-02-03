import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  numeric,
  integer,
  boolean,
  pgEnum,
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
  "teams",
  "events",
  "facilities",
  "other",
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
  "drills",
  "technique",
  "conditioning",
  "games",
  "other",
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
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
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
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: programCategoryEnum("category").notNull(),
  sport: programSportEnum("sport"), // Optional: basketball, football, soccer, multi_sport, saq
  ageMin: integer("ageMin").notNull().default(8),
  ageMax: integer("ageMax").notNull().default(18),
  maxParticipants: integer("maxParticipants"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;

/**
 * Announcements for members
 */
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: integer("authorId").notNull(),
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
export const contactSubmissions = pgTable("contactSubmissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: contactTypeEnum("type").notNull().default("general"),
  status: contactStatusEnum("status").notNull().default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  dayOfWeek: dayOfWeekEnum("dayOfWeek"), // Day of week for schedule structure (Tuesday/Thursday/Sunday)
  location: varchar("location", { length: 255 }),
  locationId: integer("locationId"), // Reference to locations table
  maxParticipants: integer("maxParticipants"), // Capacity limit for this session
  sessionType: varchar("sessionType", { length: 50 }), // "regular", "open_gym", "special"
  isRecurring: boolean("isRecurring").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
});

export type SessionRegistration = typeof sessionRegistrations.$inferSelect;
export type InsertSessionRegistration =
  typeof sessionRegistrations.$inferInsert;

/**
 * Payments table
 */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("usd"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  type: paymentTypeEnum("type").notNull().default("one_time"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
export const galleryPhotos = pgTable("galleryPhotos", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  imageKey: varchar("imageKey", { length: 500 }),
  category: galleryCategoryEnum("category").notNull().default("other"),
  uploadedBy: integer("uploadedBy").notNull(),
  isVisible: boolean("isVisible").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  videoUrl: varchar("videoUrl", { length: 500 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  category: videoCategoryEnum("category").notNull().default("other"),
  viewCount: integer("viewCount").default(0),
  duration: integer("duration"), // in seconds
  isPublished: boolean("isPublished").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  imageKey: varchar("imageKey", { length: 500 }),
  category: productCategoryEnum("category").notNull(),
  stock: integer("stock").default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
  totalAmount: numeric("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  shippingAddress: text("shippingAddress"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  discountPercent: numeric("discountPercent", { precision: 5, scale: 2 }),
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
export const chatMessages = pgTable("chatMessages", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  message: text("message").notNull(),
  room: varchar("room", { length: 100 }).default("general"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  markedBy: integer("markedBy"), // Coach/admin who marked attendance
  markedAt: timestamp("markedAt").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  tags: text("tags"), // Comma-separated tags
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
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  description: text("description"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
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
export const coaches = pgTable("coaches", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // Link to users table
  bio: text("bio"),
  specialties: text("specialties"), // Comma-separated or JSON
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
export const coachAssignments = pgTable("coachAssignments", {
  id: serial("id").primaryKey(),
  coachId: integer("coachId").notNull(),
  programId: integer("programId"), // Optional: assign to program
  scheduleId: integer("scheduleId"), // Optional: assign to specific session
  role: varchar("role", { length: 50 }), // "lead", "assistant", "specialist"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NotificationPreference =
  typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference =
  typeof notificationPreferences.$inferInsert;

/**
 * User relations table
 * Links parent accounts to child athlete accounts
 */
export const userRelations = pgTable("userRelations", {
  id: serial("id").primaryKey(),
  parentId: integer("parentId").notNull(), // Parent user ID
  childId: integer("childId").notNull(), // Child user ID
  relationshipType: varchar("relationshipType", { length: 50 })
    .notNull()
    .default("parent"), // "parent", "guardian"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
  coachId: integer("coachId").notNull(), // Coach selected (1 for Coach Mac, 2 for Coach O)
  coachName: varchar("coachName", { length: 100 }).notNull(), // "Coach Mac" or "Coach O"
  preferredDates: text("preferredDates"), // JSON array of preferred dates
  preferredTimes: text("preferredTimes"), // JSON array of preferred times
  notes: text("notes"), // Additional notes from customer
  status: varchar("status", { length: 50 }).notNull().default("pending"), // "pending", "confirmed", "completed", "cancelled"
  stripeSessionId: varchar("stripeSessionId", { length: 255 }), // Link to payment session
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PrivateSessionBooking =
  typeof privateSessionBookings.$inferSelect;
export type InsertPrivateSessionBooking =
  typeof privateSessionBookings.$inferInsert;
