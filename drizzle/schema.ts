import { pgTable, serial, text, timestamp, varchar, numeric, integer, boolean, pgEnum } from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const programCategoryEnum = pgEnum("program_category", ["group", "individual", "shooting", "league", "camp", "membership"]);
export const contactTypeEnum = pgEnum("contact_type", ["general", "volunteer"]);
export const contactStatusEnum = pgEnum("contact_status", ["new", "read", "responded"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "succeeded", "failed", "refunded"]);
export const paymentTypeEnum = pgEnum("payment_type", ["one_time", "recurring"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled", "past_due", "incomplete"]);
export const registrationStatusEnum = pgEnum("registration_status", ["registered", "attended", "canceled", "no_show"]);
export const galleryCategoryEnum = pgEnum("gallery_category", ["training", "teams", "events", "facilities", "other"]);
export const blogCategoryEnum = pgEnum("blog_category", ["training_tips", "athlete_spotlight", "news", "events", "other"]);
export const productCategoryEnum = pgEnum("product_category", ["apparel", "accessories", "equipment"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "processing", "shipped", "delivered", "cancelled"]);
export const videoCategoryEnum = pgEnum("video_category", ["drills", "technique", "conditioning", "games", "other"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "excused", "late"]);

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
 * Schedules for programs and events
 */
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  programId: integer("programId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  location: varchar("location", { length: 255 }),
  isRecurring: boolean("isRecurring").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

/**
 * Payment records table
 * Stores essential Stripe identifiers for payment tracking
 */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  productId: varchar("productId", { length: 255 }).notNull(),
  productName: text("productName").notNull(),
  amountInCents: integer("amountInCents").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("usd"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  paymentType: paymentTypeEnum("paymentType").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Subscriptions table
 * Tracks active Stripe subscriptions for memberships
 */
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull(),
  productId: varchar("productId", { length: 255 }).notNull(),
  productName: text("productName").notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Session registrations table
 * Tracks user registrations for specific training sessions
 */
export const sessionRegistrations = pgTable("sessionRegistrations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  scheduleId: integer("scheduleId").notNull(),
  paymentId: integer("paymentId"),
  status: registrationStatusEnum("status").notNull().default("registered"),
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SessionRegistration = typeof sessionRegistrations.$inferSelect;
export type InsertSessionRegistration = typeof sessionRegistrations.$inferInsert;

/**
 * Gallery photos table
 * Stores photos showcasing training sessions, teams, and events
 */
export const galleryPhotos = pgTable("galleryPhotos", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 500 }).notNull(),
  category: galleryCategoryEnum("category").notNull().default("other"),
  uploadedBy: integer("uploadedBy").notNull(),
  isVisible: boolean("isVisible").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type InsertGalleryPhoto = typeof galleryPhotos.$inferInsert;

/**
 * Blog posts table
 * Stores training tips, athlete spotlights, and Academy updates
 */
export const blogPosts = pgTable("blogPosts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featuredImage"),
  authorId: integer("authorId").notNull(),
  category: blogCategoryEnum("category").notNull().default("other"),
  tags: text("tags"),
  isPublished: boolean("isPublished").notNull().default(false),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Chat messages table
 * Stores realtime chat messages for member communication
 */
export const chatMessages = pgTable("chatMessages", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  message: text("message").notNull(),
  room: varchar("room", { length: 100 }).notNull().default("general"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Merchandise products table
 */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Price in cents
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 255 }),
  category: productCategoryEnum("category").notNull(),
  stock: integer("stock").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product variants (sizes, colors, etc.)
 */
export const productVariants = pgTable("productVariants", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Small", "Medium", "Large"
  sku: varchar("sku", { length: 100 }),
  stock: integer("stock").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;

/**
 * Merchandise orders
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  totalAmount: integer("totalAmount").notNull(), // Total in cents
  status: orderStatusEnum("status").default("pending").notNull(),
  shippingAddress: text("shippingAddress"),
  trackingNumber: varchar("trackingNumber", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items
 */
export const orderItems = pgTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  productId: integer("productId").notNull(),
  variantId: integer("variantId"),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: integer("priceAtPurchase").notNull(), // Price in cents at time of purchase
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Campaigns for limited-time drops and promotions
 */
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  bannerImageUrl: text("bannerImageUrl"),
  bannerImageKey: varchar("bannerImageKey", { length: 255 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Campaign products (products associated with campaigns)
 */
export const campaignProducts = pgTable("campaignProducts", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaignId").notNull(),
  productId: integer("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CampaignProduct = typeof campaignProducts.$inferSelect;
export type InsertCampaignProduct = typeof campaignProducts.$inferInsert;

/**
 * Video library table for training demonstrations and technique tutorials
 */
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: varchar("videoUrl", { length: 500 }).notNull(), // YouTube/Vimeo embed URL
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }), // Optional custom thumbnail
  category: videoCategoryEnum("category").default("other").notNull(),
  duration: integer("duration"), // Duration in seconds
  isPublished: boolean("isPublished").notNull().default(false),
  viewCount: integer("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Attendance tracking table
 * Tracks which athletes attended which training sessions
 */
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  scheduleId: integer("scheduleId").notNull(), // Link to schedules table
  userId: integer("userId").notNull(), // Link to users table (the athlete)
  status: attendanceStatusEnum("status").notNull().default("present"),
  notes: text("notes"), // Coach notes about performance, behavior, etc.
  markedBy: integer("markedBy").notNull(), // Coach/admin who marked attendance
  markedAt: timestamp("markedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;
