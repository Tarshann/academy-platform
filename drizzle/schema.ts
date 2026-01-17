import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role-based access for public, member, and admin users.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Programs offered by The Academy
 */
export const programs = mysqlTable("programs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: mysqlEnum("category", ["group", "individual", "shooting", "league", "camp", "membership"]).notNull(),
  ageMin: int("ageMin").notNull().default(8),
  ageMax: int("ageMax").notNull().default(18),
  maxParticipants: int("maxParticipants"),
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;

/**
 * Announcements for members
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: int("authorId").notNull(),
  isPublished: int("isPublished").notNull().default(0),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Contact form submissions
 */
export const contactSubmissions = mysqlTable("contactSubmissions", {
  id: int("id").autoincrement().primaryKey(),
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
 * Schedules for programs and events
 */
export const schedules = mysqlTable("schedules", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("programId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  location: varchar("location", { length: 255 }),
  isRecurring: int("isRecurring").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

/**
 * Payment records table
 * Stores essential Stripe identifiers for payment tracking
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  productId: varchar("productId", { length: 255 }).notNull(),
  productName: text("productName").notNull(),
  amountInCents: int("amountInCents").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("usd"),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "refunded"]).notNull().default("pending"),
  paymentType: mysqlEnum("paymentType", ["one_time", "recurring"]).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Subscriptions table
 * Tracks active Stripe subscriptions for memberships
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull(),
  productId: varchar("productId", { length: 255 }).notNull(),
  productName: text("productName").notNull(),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "incomplete"]).notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: int("cancelAtPeriodEnd").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Session registrations table
 * Tracks user registrations for specific training sessions
 */
export const sessionRegistrations = mysqlTable("sessionRegistrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scheduleId: int("scheduleId").notNull(),
  paymentId: int("paymentId"),
  status: mysqlEnum("status", ["registered", "attended", "canceled", "no_show"]).notNull().default("registered"),
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SessionRegistration = typeof sessionRegistrations.$inferSelect;
export type InsertSessionRegistration = typeof sessionRegistrations.$inferInsert;

/**
 * Gallery photos table
 * Stores photos showcasing training sessions, teams, and events
 */
export const galleryPhotos = mysqlTable("galleryPhotos", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 500 }).notNull(),
  category: mysqlEnum("category", ["training", "teams", "events", "facilities", "other"]).notNull().default("other"),
  uploadedBy: int("uploadedBy").notNull(),
  isVisible: int("isVisible").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type InsertGalleryPhoto = typeof galleryPhotos.$inferInsert;

/**
 * Blog posts table
 * Stores training tips, athlete spotlights, and Academy updates
 */
export const blogPosts = mysqlTable("blogPosts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featuredImage"),
  authorId: int("authorId").notNull(),
  category: mysqlEnum("category", ["training_tips", "athlete_spotlight", "news", "events", "other"]).notNull().default("other"),
  tags: text("tags"),
  isPublished: int("isPublished").notNull().default(0),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Chat messages table
 * Stores realtime chat messages for member communication
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
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
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: int("price").notNull(), // Price in cents
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 255 }),
  category: mysqlEnum("category", ["apparel", "accessories", "equipment"]).notNull(),
  stock: int("stock").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product variants (sizes, colors, etc.)
 */
export const productVariants = mysqlTable("productVariants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Small", "Medium", "Large"
  sku: varchar("sku", { length: 100 }),
  stock: int("stock").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;

/**
 * Merchandise orders
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  totalAmount: int("totalAmount").notNull(), // Total in cents
  status: mysqlEnum("status", ["pending", "paid", "processing", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  shippingAddress: text("shippingAddress"),
  trackingNumber: varchar("trackingNumber", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  quantity: int("quantity").notNull(),
  priceAtPurchase: int("priceAtPurchase").notNull(), // Price in cents at time of purchase
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Campaigns for limited-time drops and promotions
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  bannerImageUrl: text("bannerImageUrl"),
  bannerImageKey: varchar("bannerImageKey", { length: 255 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Campaign products (products associated with campaigns)
 */
export const campaignProducts = mysqlTable("campaignProducts", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CampaignProduct = typeof campaignProducts.$inferSelect;
export type InsertCampaignProduct = typeof campaignProducts.$inferInsert;

/**
 * Video library table for training demonstrations and technique tutorials
 */
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: varchar("videoUrl", { length: 500 }).notNull(), // YouTube/Vimeo embed URL
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }), // Optional custom thumbnail
  category: mysqlEnum("category", ["drills", "technique", "conditioning", "games", "other"]).default("other").notNull(),
  duration: int("duration"), // Duration in seconds
  isPublished: int("isPublished").notNull().default(0),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;
