/**
 * Strix Governance — Capability Registry
 *
 * Every governed action in the Academy platform is registered here.
 * This file serves as the single source of truth for:
 *   - What actions exist
 *   - Their risk classification
 *   - How many approvals they require
 *   - What domain they belong to
 *
 * Risk Levels:
 *   CRITICAL — Privilege escalation, bulk outbound comms, financial ops, automated bulk actions
 *   HIGH     — Data deletion, content publishing, enrollment changes, AI content approval
 *   MEDIUM   — Data updates, visibility toggles, attendance, content edits
 *   LOW      — Reordering, read-heavy admin ops, non-destructive toggles
 *
 * v1.8.0 — 84 capabilities (75 tRPC mutations + 9 cron jobs)
 * 
 * CRON / SYSTEM ACTORS:
 *   All 9 cron jobs are set to approvalsRequired: 0 (auto-approve) until a
 *   pre-authorization UI is built. System actors still require capability
 *   validation and produce evidence. Approval is policy-driven, not implicit.
 *   Risk levels are preserved for evidence recording and future enforcement
 *   escalation. See Notion reconciliation.
 *
 * MOBILE COVERAGE:
 *   Mobile traffic is governed at the server boundary in v1.8.1. All tRPC
 *   mutations from mobile clients pass through governedProcedure() identically
 *   to web clients. Client-side token orchestration is introduced in a future
 *   release.
 */

export interface Capability {
  id: string;
  label: string;
  domain: string;
  risk: "critical" | "high" | "medium" | "low";
  approvalsRequired: number;
  description: string;
}

export const CAPABILITIES: Capability[] = [
  // ---- LEADS / CONTACTS ----
  { id: "leads.processNurture", label: "Process Nurture Campaign", domain: "leads", risk: "critical", approvalsRequired: 2, description: "Triggers bulk email nurture campaign to all leads" },
  { id: "contacts.create", label: "Create Contact", domain: "contacts", risk: "medium", approvalsRequired: 0, description: "Create a new contact record" },
  { id: "contacts.markRead", label: "Mark Contact Read", domain: "contacts", risk: "low", approvalsRequired: 0, description: "Mark a contact submission as read" },
  { id: "contacts.markResponded", label: "Mark Contact Responded", domain: "contacts", risk: "low", approvalsRequired: 0, description: "Mark a contact submission as responded" },
  { id: "contacts.triggerCron", label: "Manually Trigger Cron Job", domain: "system", risk: "critical", approvalsRequired: 2, description: "Manually fires any of the 9 automation cron jobs from admin panel" },

  // ---- PROGRAMS ----
  { id: "admin.programs.create", label: "Create Program", domain: "programs", risk: "medium", approvalsRequired: 0, description: "Create a new training program" },
  { id: "admin.programs.update", label: "Update Program", domain: "programs", risk: "medium", approvalsRequired: 0, description: "Modify program details, pricing, or capacity" },
  { id: "admin.programs.delete", label: "Delete Program", domain: "programs", risk: "high", approvalsRequired: 1, description: "Permanently remove a program and its associations" },

  // ---- ANNOUNCEMENTS ----
  { id: "admin.announcements.create", label: "Create Announcement", domain: "announcements", risk: "medium", approvalsRequired: 0, description: "Draft a new facility announcement" },
  { id: "admin.announcements.publish", label: "Publish Announcement", domain: "announcements", risk: "high", approvalsRequired: 1, description: "Make announcement visible to all members" },
  { id: "admin.announcements.delete", label: "Delete Announcement", domain: "announcements", risk: "high", approvalsRequired: 1, description: "Permanently remove an announcement" },

  // ---- SCHEDULES ----
  { id: "admin.schedules.create", label: "Create Schedule", domain: "schedules", risk: "medium", approvalsRequired: 0, description: "Create a new session schedule" },
  { id: "admin.schedules.update", label: "Update Schedule", domain: "schedules", risk: "medium", approvalsRequired: 0, description: "Modify session time, location, or capacity" },
  { id: "admin.schedules.delete", label: "Delete Schedule", domain: "schedules", risk: "high", approvalsRequired: 1, description: "Remove a scheduled session" },

  // ---- MEMBERS ----
  { id: "admin.members.assignProgram", label: "Assign Program to Member", domain: "members", risk: "medium", approvalsRequired: 0, description: "Enroll a member in a program" },
  { id: "admin.members.removeProgram", label: "Remove Member from Program", domain: "members", risk: "high", approvalsRequired: 1, description: "Unenroll a member from a program" },
  { id: "admin.members.updateRole", label: "Update Member Role", domain: "members", risk: "critical", approvalsRequired: 2, description: "Change a member's system role (privilege escalation)" },

  // ---- CHAT ADMIN ----
  { id: "chatAdmin.clearAll", label: "Clear Chat History", domain: "chat", risk: "high", approvalsRequired: 1, description: "Permanently delete all messages in a chat room" },

  // ---- GALLERY ----
  { id: "gallery.admin.update", label: "Update Gallery Photo", domain: "gallery", risk: "medium", approvalsRequired: 0, description: "Edit gallery photo metadata" },
  { id: "gallery.admin.upload", label: "Upload Gallery Photo", domain: "gallery", risk: "medium", approvalsRequired: 0, description: "Upload a new photo to the gallery" },
  { id: "gallery.admin.delete", label: "Delete Gallery Photo", domain: "gallery", risk: "high", approvalsRequired: 1, description: "Permanently remove a gallery photo" },
  { id: "gallery.admin.toggleVisibility", label: "Toggle Gallery Visibility", domain: "gallery", risk: "medium", approvalsRequired: 0, description: "Show or hide a gallery photo" },

  // ---- SHOP PRODUCTS ----
  { id: "shop.products.create", label: "Create Product", domain: "shop", risk: "medium", approvalsRequired: 0, description: "Add a new product to the shop" },
  { id: "shop.products.update", label: "Update Product", domain: "shop", risk: "medium", approvalsRequired: 0, description: "Modify product details or pricing" },
  { id: "shop.products.delete", label: "Delete Product", domain: "shop", risk: "high", approvalsRequired: 1, description: "Remove a product from the shop" },

  // ---- SHOP CAMPAIGNS ----
  { id: "shop.campaigns.create", label: "Create Campaign", domain: "shop", risk: "medium", approvalsRequired: 0, description: "Create a new marketing campaign" },
  { id: "shop.campaigns.update", label: "Update Campaign", domain: "shop", risk: "medium", approvalsRequired: 0, description: "Modify campaign details" },
  { id: "shop.campaigns.delete", label: "Delete Campaign", domain: "shop", risk: "high", approvalsRequired: 1, description: "Remove a marketing campaign" },

  // ---- VIDEOS ----
  { id: "videos.admin.create", label: "Create Video", domain: "videos", risk: "medium", approvalsRequired: 0, description: "Upload a new video" },
  { id: "videos.admin.update", label: "Update Video", domain: "videos", risk: "medium", approvalsRequired: 0, description: "Edit video metadata" },
  { id: "videos.admin.delete", label: "Delete Video", domain: "videos", risk: "high", approvalsRequired: 1, description: "Permanently remove a video" },

  // ---- COACHES ----
  { id: "coaches.updateBookingStatus", label: "Update Booking Status", domain: "coaches", risk: "medium", approvalsRequired: 0, description: "Change a private session booking status" },

  // ---- ATTENDANCE ----
  { id: "attendance.markAttendance", label: "Mark Attendance", domain: "attendance", risk: "medium", approvalsRequired: 0, description: "Record member attendance for a session" },
  { id: "attendance.updateAttendance", label: "Update Attendance", domain: "attendance", risk: "medium", approvalsRequired: 0, description: "Modify an existing attendance record" },

  // ---- LOCATIONS ----
  { id: "locations.admin.create", label: "Create Location", domain: "locations", risk: "medium", approvalsRequired: 0, description: "Add a new facility location" },
  { id: "locations.admin.update", label: "Update Location", domain: "locations", risk: "medium", approvalsRequired: 0, description: "Modify location details" },
  { id: "locations.admin.delete", label: "Delete Location", domain: "locations", risk: "high", approvalsRequired: 1, description: "Remove a facility location" },

  // ---- COACHES ADMIN ----
  { id: "coaches.admin.create", label: "Create Coach", domain: "coaches", risk: "medium", approvalsRequired: 0, description: "Add a new coach profile" },
  { id: "coaches.admin.update", label: "Update Coach", domain: "coaches", risk: "medium", approvalsRequired: 0, description: "Edit coach profile details" },
  { id: "coaches.admin.delete", label: "Delete Coach", domain: "coaches", risk: "high", approvalsRequired: 1, description: "Remove a coach profile" },

  // ---- COACH ASSIGNMENTS ----
  { id: "coaches.assignments.create", label: "Create Coach Assignment", domain: "coaches", risk: "medium", approvalsRequired: 0, description: "Assign a coach to a program or schedule" },
  { id: "coaches.assignments.delete", label: "Delete Coach Assignment", domain: "coaches", risk: "high", approvalsRequired: 1, description: "Remove a coach assignment" },

  // ---- DM ADMIN ----
  { id: "dmAdmin.setUserRole", label: "Set DM User Role", domain: "dm", risk: "critical", approvalsRequired: 2, description: "Change a user's DM moderation role" },

  // ---- BLOG ----
  { id: "blog.admin.create", label: "Create Blog Post", domain: "blog", risk: "medium", approvalsRequired: 0, description: "Draft a new blog post" },
  { id: "blog.admin.update", label: "Update Blog Post", domain: "blog", risk: "medium", approvalsRequired: 0, description: "Edit blog post content" },
  { id: "blog.admin.publish", label: "Publish Blog Post", domain: "blog", risk: "high", approvalsRequired: 1, description: "Make a blog post publicly visible" },
  { id: "blog.admin.delete", label: "Delete Blog Post", domain: "blog", risk: "high", approvalsRequired: 1, description: "Permanently remove a blog post" },

  // ---- METRICS ----
  { id: "metrics.admin.record", label: "Record Athlete Metric", domain: "metrics", risk: "medium", approvalsRequired: 0, description: "Record a new performance measurement (may trigger milestone)" },
  { id: "metrics.admin.update", label: "Update Athlete Metric", domain: "metrics", risk: "medium", approvalsRequired: 0, description: "Modify an existing metric record" },
  { id: "metrics.admin.delete", label: "Delete Athlete Metric", domain: "metrics", risk: "high", approvalsRequired: 1, description: "Remove a performance metric record" },

  // ---- SHOWCASES ----
  { id: "showcases.admin.create", label: "Create Showcase", domain: "showcases", risk: "medium", approvalsRequired: 0, description: "Create an athlete spotlight" },
  { id: "showcases.admin.update", label: "Update Showcase", domain: "showcases", risk: "medium", approvalsRequired: 0, description: "Edit showcase details" },
  { id: "showcases.admin.delete", label: "Delete Showcase", domain: "showcases", risk: "high", approvalsRequired: 1, description: "Remove an athlete showcase" },

  // ---- MERCH DROPS ----
  { id: "merchDrops.admin.create", label: "Create Merch Drop", domain: "merchDrops", risk: "medium", approvalsRequired: 0, description: "Schedule a new merch drop" },
  { id: "merchDrops.admin.update", label: "Update Merch Drop", domain: "merchDrops", risk: "medium", approvalsRequired: 0, description: "Edit merch drop details" },
  { id: "merchDrops.admin.sendNow", label: "Send Merch Drop Now", domain: "merchDrops", risk: "critical", approvalsRequired: 2, description: "Immediately send push notification for a merch drop" },
  { id: "merchDrops.admin.delete", label: "Delete Merch Drop", domain: "merchDrops", risk: "high", approvalsRequired: 1, description: "Remove a scheduled merch drop" },

  // ---- GAMES ----
  { id: "games.admin.createTrivia", label: "Create Trivia Question", domain: "games", risk: "medium", approvalsRequired: 0, description: "Add a new trivia question" },
  { id: "games.admin.updateTrivia", label: "Update Trivia Question", domain: "games", risk: "medium", approvalsRequired: 0, description: "Edit a trivia question" },
  { id: "games.admin.deleteTrivia", label: "Delete Trivia Question", domain: "games", risk: "high", approvalsRequired: 1, description: "Remove a trivia question" },

  // ---- WAITLIST ----
  { id: "waitlist.notifyNext", label: "Notify Next on Waitlist", domain: "waitlist", risk: "high", approvalsRequired: 1, description: "Send notification to next person on waitlist" },
  { id: "waitlist.enrollFromWaitlist", label: "Enroll from Waitlist", domain: "waitlist", risk: "high", approvalsRequired: 1, description: "Move a waitlisted person to enrolled status" },

  // ---- SCHEDULE TEMPLATES ----
  { id: "scheduleTemplates.create", label: "Create Schedule Template", domain: "scheduleTemplates", risk: "medium", approvalsRequired: 0, description: "Create a recurring weekly schedule template" },
  { id: "scheduleTemplates.update", label: "Update Schedule Template", domain: "scheduleTemplates", risk: "medium", approvalsRequired: 0, description: "Modify a schedule template" },
  { id: "scheduleTemplates.delete", label: "Delete Schedule Template", domain: "scheduleTemplates", risk: "high", approvalsRequired: 1, description: "Remove a schedule template" },
  { id: "scheduleTemplates.generate", label: "Generate Sessions from Template", domain: "scheduleTemplates", risk: "high", approvalsRequired: 1, description: "Auto-generate sessions from a weekly template" },

  // ---- BILLING ----
  { id: "billing.resolve", label: "Resolve Billing Reminder", domain: "billing", risk: "high", approvalsRequired: 1, description: "Mark a billing reminder as resolved" },

  // ---- ROLES (RBAC) ----
  { id: "roles.setRole", label: "Set User Role (RBAC)", domain: "roles", risk: "critical", approvalsRequired: 2, description: "Change a user's extended role — privilege escalation" },

  // ---- PROGRESS REPORTS ----
  { id: "progressReports.sendToParents", label: "Send Progress Reports to Parents", domain: "progressReports", risk: "critical", approvalsRequired: 2, description: "Bulk email AI-generated progress reports to parents" },

  // ---- CONTENT QUEUE (AI Content Engine) ----
  { id: "contentQueue.review", label: "Review AI Content", domain: "contentQueue", risk: "high", approvalsRequired: 1, description: "Approve or reject AI-generated content (session recaps, social captions)" },

  // ---- SOCIAL POSTS ----
  { id: "socialPosts.admin.create", label: "Create Social Post", domain: "socialPosts", risk: "medium", approvalsRequired: 0, description: "Add a social media post to the gallery" },
  { id: "socialPosts.admin.update", label: "Update Social Post", domain: "socialPosts", risk: "medium", approvalsRequired: 0, description: "Edit social post details" },
  { id: "socialPosts.admin.toggleVisibility", label: "Toggle Social Post Visibility", domain: "socialPosts", risk: "medium", approvalsRequired: 0, description: "Show or hide a social post" },
  { id: "socialPosts.admin.reorder", label: "Reorder Social Posts", domain: "socialPosts", risk: "low", approvalsRequired: 0, description: "Change display order of social posts" },
  { id: "socialPosts.admin.delete", label: "Delete Social Post", domain: "socialPosts", risk: "high", approvalsRequired: 1, description: "Remove a social media post" },

  // ---- CRON JOBS (Automated Actions) ----
  { id: "cron.nurture", label: "Cron: Nurture Campaign", domain: "cron", risk: "critical", approvalsRequired: 0, description: "Daily bulk email nurture campaign to leads (10 AM CT) — auto-approve until pre-auth UI built" },
  { id: "cron.generateSessions", label: "Cron: Auto-Generate Sessions", domain: "cron", risk: "high", approvalsRequired: 0, description: "Weekly auto-generate sessions from templates (Sunday 3 AM) — auto-approve until pre-auth UI built" },
  { id: "cron.sessionReminders", label: "Cron: Session Reminders", domain: "cron", risk: "high", approvalsRequired: 0, description: "Daily push notifications for upcoming sessions (1 PM CT) — auto-approve until pre-auth UI built" },
  { id: "cron.merchDrops", label: "Cron: Merch Drop Notifications", domain: "cron", risk: "high", approvalsRequired: 0, description: "Check and send merch drop notifications (every 15 min) — auto-approve until pre-auth UI built" },
  { id: "cron.metricsPrompt", label: "Cron: Metrics Prompt", domain: "cron", risk: "medium", approvalsRequired: 0, description: "Prompt coaches to record metrics (Tue/Thu/Sun 1 AM)" },
  { id: "cron.progressReports", label: "Cron: AI Progress Reports", domain: "cron", risk: "critical", approvalsRequired: 0, description: "Bi-weekly AI-generated progress reports emailed to parents (Friday 11 PM) — auto-approve until pre-auth UI built" },
  { id: "cron.reengagement", label: "Cron: Re-engagement Campaign", domain: "cron", risk: "critical", approvalsRequired: 0, description: "Weekly re-engagement emails to inactive members (Monday 3 PM) — auto-approve until pre-auth UI built" },
  { id: "cron.parentDigest", label: "Cron: Parent Weekly Digest", domain: "cron", risk: "critical", approvalsRequired: 0, description: "Weekly digest email to parents with child activity summary (Friday 6 PM) — auto-approve until pre-auth UI built" },
  { id: "cron.postSessionContent", label: "Cron: Post-Session AI Content", domain: "cron", risk: "high", approvalsRequired: 0, description: "AI-generated session recaps, social captions, parent push (Tue/Thu/Sun 1 AM) — auto-approve until pre-auth UI built" },
];

// Lookup helpers
export const CAPABILITY_MAP = new Map(CAPABILITIES.map((c) => [c.id, c]));
export function getCapability(id: string): Capability | undefined {
  return CAPABILITY_MAP.get(id);
}
export function getCapabilitiesByDomain(domain: string): Capability[] {
  return CAPABILITIES.filter((c) => c.domain === domain);
}
export function getCapabilitiesByRisk(risk: Capability["risk"]): Capability[] {
  return CAPABILITIES.filter((c) => c.risk === risk);
}
