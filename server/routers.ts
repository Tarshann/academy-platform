import { COOKIE_NAME } from "../shared/const";
import { toCents } from "../shared/money";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { buildCheckoutUrl, resolveCheckoutOrigin } from "./_core/checkout";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, publicQueryProcedure, publicMutationProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllPrograms,
  getProgramBySlug,
  getPublishedAnnouncements,
  createContactSubmission,
  getContactSubmissions,
  getUpcomingSchedules,
  updateUserProfile,
  // Athlete Metrics
  getAthleteMetrics,
  getAthleteMetricsByName,
  getAllMetricsAdmin,
  createAthleteMetric,
  updateAthleteMetric,
  deleteAthleteMetric,
  // Athlete Showcases
  getActiveShowcases,
  getAllShowcasesAdmin,
  createShowcase,
  updateShowcase,
  deleteShowcase,
  // Merch Drops
  getUpcomingDrops,
  getAllDropsAdmin,
  createMerchDrop,
  markDropSent,
  updateMerchDrop,
  incrementDropView,
  incrementDropClick,
  deleteMerchDrop,
  // Games & Rewards
  getUserPoints,
  getOrCreateUserPoints,
  addUserPoints,
  updateUserStreak,
  refreshUserStreak,
  createGameEntry,
  createGameEntryWithLimit,
  getUserGameHistory,
  getUserDailyPlays,
  getPointsLeaderboard,
  getRandomTriviaQuestions,
  getTriviaByIds,
  getAllTriviaAdmin,
  createTriviaQuestion,
  updateTriviaQuestion,
  deleteTriviaQuestion,
  // Social Posts
  getVisibleSocialPosts,
  getAllSocialPostsAdmin,
  reorderSocialPosts,
  createSocialPost,
  updateSocialPost,
  deleteSocialPost,
  toggleSocialPostVisibility,
  // Family / Household
  addFamilyMember,
  removeFamilyMember,
  getFamilyMembers,
  getParentsForChild,
  getFamilyChildMetrics,
  getFamilyChildAttendance,
  getFamilyChildSchedules,
  // Waitlist
  addToWaitlist,
  getWaitlistForSchedule,
  getWaitlistForProgram,
  getUserWaitlistEntries,
  notifyNextOnWaitlist,
  cancelWaitlistEntry,
  enrollFromWaitlist,
  // Referrals
  getUserReferralCode,
  createReferral,
  getReferralByCode,
  getUserReferrals,
  convertReferral,
  getReferralStats,
  // Schedule Templates
  getAllScheduleTemplates,
  getActiveScheduleTemplates,
  createScheduleTemplate,
  updateScheduleTemplate,
  deleteScheduleTemplate,
  generateSchedulesFromTemplates,
  // Billing Reminders
  getActiveBillingReminders,
  getUserBillingReminders,
  resolveBillingReminder,
  // Onboarding
  getOnboardingProgress,
  completeOnboardingStep,
  completeOnboarding,
  updateUserOnboardingProfile,
  // RBAC
  getUserExtendedRole,
  setUserExtendedRole,
  getUsersByExtendedRole,
  // AI Reports
  getAthleteReportData,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { TRPCError } from "@trpc/server";
import { logger } from "./_core/logger";
import { governedProcedure } from "./_core/governed-procedure";
import { governanceRouter } from "./governance-router";
import { invokeLLM } from "./_core/llm";
import { sendEmail } from "./email";

// Feed table existence cache — probed once per cold start, avoids per-request queries
const _feedTableCache = { hasRecaps: false, hasMilestones: false, checkedAt: 0 };

// Simple in-memory rate limiter for tRPC public mutations
const publicMutationRateStore: Record<string, { count: number; resetTime: number }> = {};
const RATE_STORE_MAX_SIZE = 10_000;

// Periodically clean up expired entries to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const key of Object.keys(publicMutationRateStore)) {
    if (publicMutationRateStore[key].resetTime < now) {
      delete publicMutationRateStore[key];
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

function checkPublicMutationRate(key: string, maxPerWindow = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const entry = publicMutationRateStore[key];
  if (!entry || entry.resetTime < now) {
    // Evict oldest entries if store exceeds max size
    const keys = Object.keys(publicMutationRateStore);
    if (keys.length >= RATE_STORE_MAX_SIZE) {
      const sorted = keys.sort((a, b) => publicMutationRateStore[a].resetTime - publicMutationRateStore[b].resetTime);
      const evictCount = Math.max(1, Math.floor(RATE_STORE_MAX_SIZE * 0.1));
      for (let i = 0; i < evictCount && i < sorted.length; i++) {
        delete publicMutationRateStore[sorted[i]];
      }
    }
    publicMutationRateStore[key] = { count: 1, resetTime: now + windowMs };
    return;
  }
  if (entry.count >= maxPerWindow) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many requests. Please try again later." });
  }
  entry.count++;
}

const CHAT_TOKEN_TTL_MS = 1000 * 60 * 10;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const normalizePriceInput = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(2);
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return value;
};

const priceSchema = z.preprocess(
  normalizePriceInput,
  z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid amount")
);

// Metric values allow up to 4 decimal places (e.g., "4.3210" for a 40-yard dash)
const metricValueSchema = z.preprocess(
  (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "string") return value.trim();
    return value;
  },
  z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid numeric measurement")
);

const textSchema = z.string().trim().min(1);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .transform(slugify)
  .refine(value => value.length > 0, "Slug must include letters or numbers");

const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
}).optional();

const ageSchema = z.number().int().min(1).max(99);
const maxParticipantsSchema = z.number().int().min(1).nullable();


const createProgramCheckoutSession = async ({
  productIds,
  origin,
  customerEmail,
  clientReferenceId,
  metadata,
  idempotencyKey,
}: {
  productIds: string[];
  origin: string;
  customerEmail?: string;
  clientReferenceId?: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}) => {
  const { ENV } = await import("./_core/env");
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(ENV.stripeSecretKey);
  const { getProduct } = await import("./products");

  // Look up products from static registry first, then fall back to database programs
  const products = await Promise.all(
    productIds.map(async (productId) => {
      const staticProduct = getProduct(productId);
      if (staticProduct) return staticProduct;

      // Fall back to database program lookup by slug
      const dbProgram = await getProgramBySlug(productId);
      if (!dbProgram) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Product "${productId}" not found` });
      }

      // Convert database program to the same shape as static products
      const priceNum = typeof dbProgram.price === "string" ? parseFloat(dbProgram.price) : Number(dbProgram.price);
      return {
        id: dbProgram.slug,
        name: dbProgram.name,
        description: dbProgram.description,
        priceInCents: Math.round(priceNum * 100),
        currency: "usd" as const,
        type: (dbProgram.category === "membership" ? "recurring" : "one_time") as "one_time" | "recurring",
        interval: dbProgram.category === "membership" ? ("month" as const) : undefined,
        category: dbProgram.category,
      };
    })
  );

  const hasRecurring = products.some((product) => product.type === "recurring");
  const hasOneTime = products.some((product) => product.type === "one_time");

  if (hasRecurring && products.length > 1) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Memberships must be purchased individually.",
    });
  }

  if (hasRecurring && hasOneTime) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Subscriptions cannot be combined with one-time classes.",
    });
  }

  const successUrl = buildCheckoutUrl(
    origin,
    "/payment/success",
    "session_id={CHECKOUT_SESSION_ID}"
  );
  const cancelUrl = buildCheckoutUrl(origin, "/sign-up");

  const sessionParams: any = {
    payment_method_types: ["card"],
    line_items: products.map((product) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          description: product.description,
        },
        unit_amount: product.priceInCents,
        ...(product.type === "recurring" && {
          recurring: {
            interval: product.interval,
          },
        }),
      },
      quantity: 1,
    })),
    mode: hasRecurring ? "subscription" : "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  };

  if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  if (clientReferenceId) {
    sessionParams.client_reference_id = clientReferenceId;
  }

  if (metadata) {
    sessionParams.metadata = metadata;
  }

  sessionParams.metadata = {
    ...(sessionParams.metadata || {}),
    program_ids: productIds.join(","),
  };

  return await stripe.checkout.sessions.create(
    sessionParams,
    idempotencyKey ? { idempotencyKey } : undefined
  );
};

export const appRouter = router({
  system: systemRouter,
  governance: governanceRouter,

  auth: router({
    me: publicQueryProcedure.query(opts => opts.ctx.user),
    chatToken: protectedProcedure.query(async ({ ctx }) => {
      const appId = ctx.user.loginMethod || ENV.appId || "app";
      const token = await sdk.signSession(
        {
          openId: ctx.user.openId,
          appId,
          name: ctx.user.name ?? "",
        },
        { expiresInMs: CHAT_TOKEN_TTL_MS }
      );

      return { token, expiresInMs: CHAT_TOKEN_TTL_MS };
    }),
    ablyToken: protectedProcedure.query(async ({ ctx }) => {
      const { createAblyTokenRequest } = await import("./ably");
      const tokenRequest = await createAblyTokenRequest(
        ctx.user.id,
        ctx.user.name || "User"
      );
      if (!tokenRequest) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Real-time not configured",
        });
      }
      return tokenRequest;
    }),
    logout: protectedProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100).optional(),
          profilePictureUrl: z.string().url().max(2048).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const updated = await updateUserProfile(ctx.user.id, input);
        return updated;
      }),
  }),

  programs: router({
    list: publicQueryProcedure.query(async () => {
      return await getAllPrograms();
    }),
    getBySlug: publicQueryProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getProgramBySlug(input.slug);
      }),
  }),

  announcements: router({
    list: protectedProcedure.query(async () => {
      return await getPublishedAnnouncements();
    }),
  }),

  schedules: router({
    upcoming: protectedProcedure.query(async () => {
      return await getUpcomingSchedules();
    }),
    register: protectedProcedure
      .input(z.object({ scheduleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const {
          createSessionRegistration,
          getScheduleById,
          getScheduleRegistrations,
        } = await import("./db");
        const { sendSessionRegistrationEmail } = await import("./email");

        const schedule = await getScheduleById(input.scheduleId);
        if (!schedule) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Schedule not found",
          });
        }

        const registrations = await getScheduleRegistrations(input.scheduleId);
        const alreadyRegistered = registrations.some(
          (registration: any) => registration.userId === ctx.user.id
        );
        if (alreadyRegistered) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Already registered for this session",
          });
        }

        if (
          schedule.maxParticipants &&
          registrations.length >= schedule.maxParticipants
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This session is full",
          });
        }

        await createSessionRegistration(ctx.user.id, input.scheduleId);

        if (ctx.user.email) {
          const { getUserNotificationPreferences } = await import("./db");
          const preferences = await getUserNotificationPreferences(ctx.user.id);
          const allowEmail = preferences?.sessionRegistrations ?? true;
          if (allowEmail) {
            await sendSessionRegistrationEmail({
              to: ctx.user.email,
              userName: ctx.user.name || "Member",
              sessionTitle: schedule.title,
              sessionDate: schedule.startTime,
              sessionLocation: schedule.location || "TBA",
            });
          }
        }

        return { success: true };
      }),
  }),
  // Lead capture — public endpoint for the marketing site (academytn.com)
  leads: router({
    submit: publicMutationProcedure
      .input(
        z.object({
          name: z.string().max(200).optional(),
          email: z.string().email().max(320),
          phone: z.string().max(30).optional(),
          source: z.string().max(100).default("quiz"),
          athleteAge: z.string().max(20).optional(),
          sport: z.string().max(100).optional(),
          goal: z.string().max(200).optional(),
          recommendedProgram: z.string().max(200).optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Rate limit lead submissions by email
        checkPublicMutationRate(`lead:${input.email}`);

        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Upsert: if email already exists, update the record
        const existing = await db.select().from(leads).where(eq(leads.email, input.email)).limit(1);
        if (existing.length > 0) {
          await db.update(leads).set({
            name: input.name || existing[0].name,
            phone: input.phone || existing[0].phone,
            athleteAge: input.athleteAge || existing[0].athleteAge,
            sport: input.sport || existing[0].sport,
            goal: input.goal || existing[0].goal,
            recommendedProgram: input.recommendedProgram || existing[0].recommendedProgram,
            source: input.source,
            updatedAt: new Date(),
          }).where(eq(leads.email, input.email));
        } else {
          await db.insert(leads).values({
            name: input.name || null,
            email: input.email,
            phone: input.phone || null,
            source: input.source,
            athleteAge: input.athleteAge || null,
            sport: input.sport || null,
            goal: input.goal || null,
            recommendedProgram: input.recommendedProgram || null,
            status: "new",
            nurtureStep: 0,
          });
        }

        // Notify owner of new lead
        await notifyOwner({
          title: "New Lead from Website",
          content: `${input.name || "Unknown"} (${input.email}) — ${input.recommendedProgram || input.source}\nAge: ${input.athleteAge || "N/A"} | Sport: ${input.sport || "N/A"} | Goal: ${input.goal || "N/A"}`,
        });

        return { success: true };
      }),

    list: adminProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { leads } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) return [];
      return await db.select().from(leads).orderBy(desc(leads.createdAt));
    }),

    // Unsubscribe a lead from nurture emails
    unsubscribe: publicMutationProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        await db
          .update(leads)
          .set({ status: "unsubscribed", updatedAt: new Date() })
          .where(eq(leads.email, input.email));

        return { success: true };
      }),

    // Trigger nurture queue processing (call from cron or admin)
    processNurture: governedProcedure("leads.processNurture").mutation(async () => {
      const { processNurtureQueue } = await import("./nurture");
      return await processNurtureQueue();
    }),
  }),

  contact: router({
    submit: publicMutationProcedure
      .input(
        z.object({
          name: z.string().min(1).max(200),
          email: z.string().email().max(320),
          phone: z.string().max(30).optional(),
          subject: z.string().min(1).max(300),
          message: z.string().min(10).max(5000),
          type: z.enum(["general", "volunteer"]).default("general"),
        })
      )
      .mutation(async ({ input }) => {
        await createContactSubmission({
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          subject: input.subject,
          message: input.message,
          type: input.type,
          status: "new",
        });

        // Notify owner
        await notifyOwner({
          title: `New ${input.type === "volunteer" ? "Volunteer" : "Contact"} Inquiry`,
          content: `From: ${input.name} (${input.email})\nSubject: ${input.subject}\n\n${input.message}`,
        });

        return { success: true };
      }),
    list: adminProcedure.query(async () => {
      return await getContactSubmissions();
    }),
  }),

  admin: router({
    // Program management
    programs: router({
      list: adminProcedure.query(async () => {
        const { getAllProgramsAdmin } = await import("./db");
        return await getAllProgramsAdmin();
      }),
      create: governedProcedure("admin.programs.create")
        .input(
          z
            .object({
              name: textSchema,
              slug: slugSchema,
              description: textSchema,
              price: priceSchema,
              category: z.enum([
                "group",
                "individual",
                "shooting",
                "league",
                "camp",
                "membership",
              ]),
              sport: z
                .enum([
                  "basketball",
                  "flag_football",
                  "soccer",
                  "multi_sport",
                  "saq",
                ])
                .optional(),
              ageMin: ageSchema.default(8),
              ageMax: ageSchema.default(18),
              maxParticipants: maxParticipantsSchema.optional(),
            })
            .refine(data => data.ageMin <= data.ageMax, {
              message: "Minimum age must be less than or equal to maximum age",
              path: ["ageMin"],
            })
        )
        .mutation(async ({ input }) => {
          const { createProgram } = await import("./db");
          await createProgram({ ...input, isActive: true });
          return { success: true };
        }),
      update: governedProcedure("admin.programs.update")
        .input(
          z
            .object({
              id: z.number(),
              name: textSchema.optional(),
              slug: slugSchema.optional(),
              description: textSchema.optional(),
              price: priceSchema.optional(),
              category: z
                .enum([
                  "group",
                  "individual",
                  "shooting",
                  "league",
                  "camp",
                  "membership",
                ])
                .optional(),
              sport: z
                .enum([
                  "basketball",
                  "flag_football",
                  "soccer",
                  "multi_sport",
                  "saq",
                ])
                .optional()
                .nullable(),
              ageMin: ageSchema.optional(),
              ageMax: ageSchema.optional(),
              maxParticipants: maxParticipantsSchema.optional(),
              isActive: z.boolean().optional(),
            })
            .refine(
              data => {
                if (data.ageMin === undefined || data.ageMax === undefined)
                  return true;
                return data.ageMin <= data.ageMax;
              },
              {
                message:
                  "Minimum age must be less than or equal to maximum age",
                path: ["ageMin"],
              }
            )
        )
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          const normalizedUpdates = Object.fromEntries(
            Object.entries(updates).filter(([, value]) => value !== undefined)
          );
          const { updateProgram } = await import("./db");
          await updateProgram(id, normalizedUpdates);
          return { success: true };
        }),
      delete: governedProcedure("admin.programs.delete")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteProgram } = await import("./db");
          await deleteProgram(input.id);
          return { success: true };
        }),
    }),

    // Announcement management
    announcements: router({
      list: adminProcedure.query(async () => {
        const { getAllAnnouncementsAdmin } = await import("./db");
        return await getAllAnnouncementsAdmin();
      }),
      create: governedProcedure("admin.announcements.create")
        .input(
          z.object({
            title: z.string().min(1),
            content: z.string().min(1),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const { createAnnouncement } = await import("./db");
          await createAnnouncement({
            ...input,
            authorId: ctx.user.id,
            isPublished: false,
            publishedAt: null,
          });
          return { success: true };
        }),
      publish: governedProcedure("admin.announcements.publish")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { publishAnnouncement } = await import("./db");
          await publishAnnouncement(input.id);
          return { success: true };
        }),
      delete: governedProcedure("admin.announcements.delete")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteAnnouncement } = await import("./db");
          await deleteAnnouncement(input.id);
          return { success: true };
        }),
    }),

    // Schedule management
    schedules: router({
      list: adminProcedure.query(async () => {
        const { getAllSchedulesAdmin } = await import("./db");
        return await getAllSchedulesAdmin();
      }),
      create: governedProcedure("admin.schedules.create")
        .input(
          z.object({
            programId: z.number().optional(),
            title: z.string().min(1),
            description: z.string().optional(),
            startTime: z.date(),
            endTime: z.date(),
            dayOfWeek: z
              .enum([
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ])
              .optional(),
            location: z.string().optional(),
            locationId: z.number().optional(),
            maxParticipants: z.number().nullable().optional(),
            sessionType: z.enum(["regular", "open_gym", "special"]).optional(),
            isRecurring: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { createSchedule } = await import("./db");
          await createSchedule(input);
          return { success: true };
        }),
      update: governedProcedure("admin.schedules.update")
        .input(
          z.object({
            id: z.number(),
            title: z.string().optional(),
            description: z.string().optional(),
            startTime: z.date().optional(),
            endTime: z.date().optional(),
            location: z.string().optional(),
            locationId: z.number().optional(),
            maxParticipants: z.number().nullable().optional(),
            sessionType: z.enum(["regular", "open_gym", "special"]).optional(),
            isRecurring: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          const { updateSchedule } = await import("./db");
          await updateSchedule(id, updates);
          return { success: true };
        }),
      delete: governedProcedure("admin.schedules.delete")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteSchedule } = await import("./db");
          await deleteSchedule(input.id);
          return { success: true };
        }),
    }),

    // Members / Roster management
    members: router({
      list: adminProcedure.query(async () => {
        const { getDb } = await import("./db");
        const { users, userPrograms, programs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) return [];

        const allUsers = await db.select().from(users);
        const allEnrollments = await db.select().from(userPrograms);
        const allPrograms = await db.select().from(programs);

        const programMap = new Map<number, any>(allPrograms.map((p: any) => [p.id, p]));

        return allUsers.map((user: any) => ({
          ...user,
          programs: allEnrollments
            .filter((e: any) => e.userId === user.id && e.status === "active")
            .map((e: any) => ({
              enrollmentId: e.id,
              programId: e.programId,
              programName: programMap.get(e.programId)?.name || "Unknown",
              enrolledAt: e.enrolledAt,
            })),
        }));
      }),

      assignProgram: governedProcedure("admin.members.assignProgram")
        .input(z.object({ userId: z.number(), programId: z.number() }))
        .mutation(async ({ input }) => {
          try {
            const { getDb } = await import("./db");
            const { userPrograms } = await import("../drizzle/schema");
            const { eq, and } = await import("drizzle-orm");

            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

            // Check for existing active enrollment
            const existing = await db
              .select()
              .from(userPrograms)
              .where(
                and(
                  eq(userPrograms.userId, input.userId),
                  eq(userPrograms.programId, input.programId),
                  eq(userPrograms.status, "active")
                )
              )
              .limit(1);

            if (existing.length > 0) {
              throw new TRPCError({ code: "CONFLICT", message: "User already enrolled in this program" });
            }

            await db.insert(userPrograms).values({
              userId: input.userId,
              programId: input.programId,
              status: "active",
            });

            return { success: true };
          } catch (error) {
            if (error instanceof TRPCError) throw error;
            logger.error("[admin.members.assignProgram] Error:", error);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operation failed" });
          }
        }),

      removeProgram: governedProcedure("admin.members.removeProgram")
        .input(z.object({ enrollmentId: z.number() }))
        .mutation(async ({ input }) => {
          try {
            const { getDb } = await import("./db");
            const { userPrograms } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");

            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

            await db
              .update(userPrograms)
              .set({ status: "cancelled", cancelledAt: new Date() })
              .where(eq(userPrograms.id, input.enrollmentId));

            return { success: true };
          } catch (error) {
            if (error instanceof TRPCError) throw error;
            logger.error("[admin.members.removeProgram] Error:", error);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operation failed" });
          }
        }),

      updateRole: governedProcedure("admin.members.updateRole")
        .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
        .mutation(async ({ input }) => {
          try {
            const { getDb } = await import("./db");
            const { users } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");

            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

            await db
              .update(users)
              .set({ role: input.role, updatedAt: new Date() })
              .where(eq(users.id, input.userId));

            return { success: true };
          } catch (error) {
            if (error instanceof TRPCError) throw error;
            logger.error("[admin.members.updateRole] Error:", error);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operation failed" });
          }
        }),

      create: governedProcedure("contacts.create")
        .input(z.object({
          name: z.string().min(1),
          email: z.string().email(),
        }))
        .mutation(async ({ input }) => {
          const { getDb } = await import("./db");
          const { users } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");

          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          // Check if email already exists
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, input.email))
            .limit(1);

          if (existing.length > 0) {
            throw new TRPCError({ code: "CONFLICT", message: "A user with this email already exists" });
          }

          // Create placeholder user with a generated openId
          const openId = `placeholder_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

          const [newUser] = await db
            .insert(users)
            .values({
              openId,
              name: input.name,
              email: input.email,
              role: "user",
              loginMethod: "placeholder",
            })
            .returning();

          return { success: true, userId: newUser.id };
        }),
    }),

    // Contact submissions
    contacts: router({
      markRead: governedProcedure("contacts.markRead")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          try {
            const { markContactAsRead } = await import("./db");
            await markContactAsRead(input.id);
            return { success: true };
          } catch (error) {
            if (error instanceof TRPCError) throw error;
            logger.error("[contacts.markRead] Error:", error);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operation failed" });
          }
        }),
      markResponded: governedProcedure("contacts.markResponded")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          try {
            const { markContactAsResponded } = await import("./db");
            await markContactAsResponded(input.id);
            return { success: true };
          } catch (error) {
            if (error instanceof TRPCError) throw error;
            logger.error("[contacts.markResponded] Error:", error);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operation failed" });
          }
        }),
    }),

    // Manual cron trigger for testing
    triggerCron: governedProcedure("contacts.triggerCron")
      .input(z.object({
        name: z.enum([
          "nurture", "generate-sessions", "session-reminders", "merch-drops",
          "metrics-prompt", "progress-reports", "reengagement", "parent-digest",
          "post-session-content",
        ]),
      }))
      .mutation(async ({ input }) => {
        // Explicit module map — dynamic template-literal imports cause esbuild
        // to glob the entire cron/ directory (including test files), which pulls
        // in vitest and crashes the serverless bundle on startup.
        const cronModules: Record<string, () => Promise<{ run: () => Promise<any> }>> = {
          "nurture": () => import("./cron/nurture"),
          "generate-sessions": () => import("./cron/generate-sessions"),
          "session-reminders": () => import("./cron/session-reminders"),
          "merch-drops": () => import("./cron/merch-drops"),
          "metrics-prompt": () => import("./cron/metrics-prompt"),
          "progress-reports": () => import("./cron/progress-reports"),
          "reengagement": () => import("./cron/reengagement"),
          "parent-digest": () => import("./cron/parent-digest"),
          "post-session-content": () => import("./cron/post-session-content"),
        };
        const mod = await cronModules[input.name]();
        return await mod.run();
      }),
  }),

  chatAdmin: router({
    clearAll: governedProcedure("chatAdmin.clearAll")
      .input(z.object({ room: z.string().optional() }))
      .mutation(async ({ input }) => {
        try {
          const { chatMessages } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const { getDb } = await import("./db");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
          if (input.room) {
            await db.delete(chatMessages).where(eq(chatMessages.room, input.room));
          } else {
            await db.delete(chatMessages);
          }
          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          logger.error("[chatAdmin.clearAll] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operation failed" });
        }
      }),
  }),

  // ========================================================================
  // CHAT ENHANCEMENTS (P1 Bundle — Reactions, Unread, Room Prefs, Search)
  // ========================================================================
  chatEnhanced: router({
    // --- Emoji Reactions ---
    addReaction: protectedProcedure
      .input(z.object({
        messageId: z.number().int().positive(),
        emoji: z.string().min(1).max(32),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { chatMessageReactions } = await import("../drizzle/schema");
          const { getDb } = await import("./db");
          const { and, eq } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          // Upsert: insert or ignore if duplicate (unique index handles this)
          await db.insert(chatMessageReactions).values({
            messageId: input.messageId,
            userId: ctx.user.id,
            emoji: input.emoji,
          }).onConflictDoNothing();

          // Get updated reactions for this message
          const reactions = await db.select().from(chatMessageReactions)
            .where(eq(chatMessageReactions.messageId, input.messageId));

          // Broadcast reaction update via SSE + Ably
          const reactionData = { messageId: input.messageId, reactions, userId: ctx.user.id, emoji: input.emoji, action: "add" };
          try {
            const { broadcastToRoom } = await import("./chat-sse");
            // We need the room — get it from the message
            const { chatMessages } = await import("../drizzle/schema");
            const [msg] = await db.select({ room: chatMessages.room }).from(chatMessages).where(eq(chatMessages.id, input.messageId)).limit(1);
            if (msg?.room) {
              broadcastToRoom(msg.room, "reaction_update", reactionData);
              try {
                const { publishChatMessage } = await import("./ably");
                // Publish reaction event to Ably for mobile
                const ably = await import("./ably");
                if ((ably as any).publishToChannel) {
                  await (ably as any).publishToChannel(`chat:${msg.room}`, "reaction_update", reactionData);
                }
              } catch { /* Ably not configured */ }
            }
          } catch (e) { logger.error("[Chat] Reaction broadcast failed:", e); }

          return { success: true, reactions };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          logger.error("[chatEnhanced.addReaction] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add reaction" });
        }
      }),

    removeReaction: protectedProcedure
      .input(z.object({
        messageId: z.number().int().positive(),
        emoji: z.string().min(1).max(32),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { chatMessageReactions } = await import("../drizzle/schema");
          const { getDb } = await import("./db");
          const { and, eq } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          await db.delete(chatMessageReactions).where(
            and(
              eq(chatMessageReactions.messageId, input.messageId),
              eq(chatMessageReactions.userId, ctx.user.id),
              eq(chatMessageReactions.emoji, input.emoji),
            )
          );

          const reactions = await db.select().from(chatMessageReactions)
            .where(eq(chatMessageReactions.messageId, input.messageId));

          // Broadcast reaction removal
          try {
            const { broadcastToRoom } = await import("./chat-sse");
            const { chatMessages } = await import("../drizzle/schema");
            const [msg] = await db.select({ room: chatMessages.room }).from(chatMessages).where(eq(chatMessages.id, input.messageId)).limit(1);
            if (msg?.room) {
              broadcastToRoom(msg.room, "reaction_update", { messageId: input.messageId, reactions, userId: ctx.user.id, emoji: input.emoji, action: "remove" });
            }
          } catch (e) { logger.error("[Chat] Reaction broadcast failed:", e); }

          return { success: true, reactions };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          logger.error("[chatEnhanced.removeReaction] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to remove reaction" });
        }
      }),

    getReactions: protectedProcedure
      .input(z.object({
        messageIds: z.array(z.number().int().positive()).max(100),
      }))
      .query(async ({ input }) => {
        try {
          const { chatMessageReactions } = await import("../drizzle/schema");
          const { getDb } = await import("./db");
          const { inArray } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          if (input.messageIds.length === 0) return {};

          const reactions = await db.select().from(chatMessageReactions)
            .where(inArray(chatMessageReactions.messageId, input.messageIds));

          // Group by messageId
          const grouped: Record<number, Array<{ userId: number; emoji: string; createdAt: Date }>> = {};
          for (const r of reactions) {
            if (!grouped[r.messageId]) grouped[r.messageId] = [];
            grouped[r.messageId].push({ userId: r.userId, emoji: r.emoji, createdAt: r.createdAt });
          }
          return grouped;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          logger.error("[chatEnhanced.getReactions] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get reactions" });
        }
      }),

    // --- Unread Badge Tracking ---
    markRoomRead: protectedProcedure
      .input(z.object({
        room: z.string().min(1).max(100),
        lastReadMessageId: z.number().int().nonnegative(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { chatRoomReadStatus } = await import("../drizzle/schema");
          const { getDb } = await import("./db");
          const { sql } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          // Upsert: insert or update the last-read message ID
          await db.execute(sql`
            INSERT INTO chat_room_read_status (user_id, room, last_read_message_id, last_read_at)
            VALUES (${ctx.user.id}, ${input.room}, ${input.lastReadMessageId}, NOW())
            ON CONFLICT (user_id, room)
            DO UPDATE SET last_read_message_id = GREATEST(chat_room_read_status.last_read_message_id, ${input.lastReadMessageId}),
                         last_read_at = NOW()
          `);

          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          logger.error("[chatEnhanced.markRoomRead] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to mark room as read" });
        }
      }),

    getUnreadCounts: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const { getDb } = await import("./db");
          const { sql } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          // Get unread count per room: messages with id > last_read_message_id
          const result = await db.execute(sql`
            SELECT r.room, COUNT(cm.id)::int AS unread_count
            FROM (VALUES ('general'), ('announcements'), ('parents'), ('coaches')) AS r(room)
            LEFT JOIN chat_room_read_status crs
              ON crs.room = r.room AND crs.user_id = ${ctx.user.id}
            LEFT JOIN "chatMessages" cm
              ON cm.room = r.room AND cm.id > COALESCE(crs.last_read_message_id, 0)
            GROUP BY r.room
          `);

          const counts: Record<string, number> = {};
          for (const row of result.rows as any[]) {
            counts[row.room] = row.unread_count || 0;
          }
          return counts;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          logger.error("[chatEnhanced.getUnreadCounts] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get unread counts" });
        }
      }),

    // --- Per-Room Notification Preferences ---
    getRoomNotifPrefs: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const { chatRoomNotificationPrefs } = await import("../drizzle/schema");
          const { getDb } = await import("./db");
          const { eq } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          const prefs = await db.select().from(chatRoomNotificationPrefs)
            .where(eq(chatRoomNotificationPrefs.userId, ctx.user.id));

          const prefsMap: Record<string, string> = {};
          for (const p of prefs) {
            prefsMap[p.room] = p.mode;
          }
          // Fill defaults
          for (const room of ["general", "announcements", "parents", "coaches"]) {
            if (!prefsMap[room]) prefsMap[room] = "all";
          }
          return prefsMap;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          logger.error("[chatEnhanced.getRoomNotifPrefs] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get notification preferences" });
        }
      }),

    setRoomNotifPref: protectedProcedure
      .input(z.object({
        room: z.string().min(1).max(100),
        mode: z.enum(["all", "mentions", "none"]),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { getDb } = await import("./db");
          const { sql } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          await db.execute(sql`
            INSERT INTO chat_room_notification_prefs (user_id, room, mode, updated_at)
            VALUES (${ctx.user.id}, ${input.room}, ${input.mode}, NOW())
            ON CONFLICT (user_id, room)
            DO UPDATE SET mode = ${input.mode}, updated_at = NOW()
          `);

          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          logger.error("[chatEnhanced.setRoomNotifPref] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to set notification preference" });
        }
      }),

    // --- Room Message Search ---
    searchMessages: protectedProcedure
      .input(z.object({
        room: z.string().min(1).max(100).optional(),
        query: z.string().min(1).max(200),
        limit: z.number().int().min(1).max(50).default(20),
      }))
      .query(async ({ input }) => {
        try {
          const { chatMessages } = await import("../drizzle/schema");
          const { getDb } = await import("./db");
          const { desc, eq, and, ilike } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          // Escape LIKE wildcards to prevent injection
          const escaped = input.query.replace(/[%_\\]/g, "\\$&");

          const conditions = [ilike(chatMessages.message, `%${escaped}%`)];
          if (input.room) {
            conditions.push(eq(chatMessages.room, input.room));
          }

          const results = await db.select().from(chatMessages)
            .where(and(...conditions))
            .orderBy(desc(chatMessages.createdAt))
            .limit(input.limit);

          return results;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          logger.error("[chatEnhanced.searchMessages] Error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to search messages" });
        }
      }),
  }),

  gallery: router({
    list: publicQueryProcedure
      .input(paginationSchema)
      .query(async ({ input }) => {
        const { getAllGalleryPhotos } = await import("./db");
        return await getAllGalleryPhotos(input ? { limit: input.limit, offset: input.offset } : undefined);
      }),

    byCategory: publicQueryProcedure
      .input(z.object({
        category: z.string(),
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      }))
      .query(async ({ input }) => {
        const { getGalleryPhotosByCategory } = await import("./db");
        return await getGalleryPhotosByCategory(input.category, { limit: input.limit, offset: input.offset });
      }),

    admin: router({
      list: adminProcedure.query(async () => {
        const { getDb } = await import("./db");
        const { galleryPhotos } = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(galleryPhotos).orderBy(desc(galleryPhotos.createdAt));
      }),

      update: governedProcedure("gallery.admin.update")
        .input(
          z.object({
            id: z.number(),
            title: z.string().max(200).optional(),
            description: z.string().max(2000).optional(),
            category: z.enum(["training", "highlights"]).optional(),
            isVisible: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          try {
            const { getDb } = await import("./db");
            const { galleryPhotos } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
            const { id, ...updates } = input;
            await db.update(galleryPhotos).set(updates).where(eq(galleryPhotos.id, id));
            return { success: true };
          } catch (error) {
            if (error instanceof TRPCError) throw error;
            logger.error("[gallery.admin.update] Error:", error);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operation failed" });
          }
        }),

      upload: governedProcedure("gallery.admin.upload")
        .input(
          z.object({
            title: z.string().max(200),
            description: z.string().max(2000).optional(),
            imageUrl: z.string().max(500),
            imageKey: z.string().max(500),
            mediaType: z.enum(["image", "video"]).default("image"),
            category: z.enum(["training", "highlights"]),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const { createGalleryPhoto } = await import("./db");
          await createGalleryPhoto({
            ...input,
            uploadedBy: ctx.user.id,
          });
          return { success: true };
        }),

      delete: governedProcedure("gallery.admin.delete")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          try {
            const { deleteGalleryPhoto } = await import("./db");
            await deleteGalleryPhoto(input.id);
            return { success: true };
          } catch (error) {
            if (error instanceof TRPCError) throw error;
            logger.error("[gallery.admin.delete] Error:", error);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operation failed" });
          }
        }),

      toggleVisibility: governedProcedure("gallery.admin.toggleVisibility")
        .input(z.object({ id: z.number(), isVisible: z.boolean() }))
        .mutation(async ({ input }) => {
          const { toggleGalleryPhotoVisibility } = await import("./db");
          await toggleGalleryPhotoVisibility(input.id, input.isVisible);
          return { success: true };
        }),
    }),
  }),

  shop: router({
    // Public shop endpoints
    products: publicQueryProcedure
      .input(paginationSchema)
      .query(async ({ input }) => {
        const { getAllProducts } = await import("./db");
        return await getAllProducts(input ? { limit: input.limit, offset: input.offset } : undefined);
      }),

    productById: publicQueryProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getProductById } = await import("./db");
        return await getProductById(input.id);
      }),

    campaigns: publicQueryProcedure.query(async () => {
      const { getActiveCampaigns } = await import("./db");
      return await getActiveCampaigns();
    }),

    // Protected shop endpoints
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      const { getUserOrders } = await import("./db");
      return await getUserOrders(ctx.user.id);
    }),

    createCheckout: protectedProcedure
      .input(
        z.object({
          items: z.array(
            z.object({
              productId: z.number(),
              variantId: z.number().optional(),
              quantity: z.number().min(1),
            })
          ),
          shippingAddress: z.string(),
          idempotencyKey: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { ENV } = await import("./_core/env");
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(ENV.stripeSecretKey);
        const { getProductById, createOrder, createOrderItem } = await import(
          "./db"
        );

        // Calculate total and prepare line items
        const lineItems = [];
        let totalAmount = 0;

        for (const item of input.items) {
          const product = await getProductById(item.productId);
          if (!product) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Product ${item.productId} not found`,
            });
          }
          const unitAmount = toCents(product.price);

          lineItems.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: product.name,
                description: product.description || "",
              },
              unit_amount: unitAmount,
            },
            quantity: item.quantity,
          });

          totalAmount += unitAmount * item.quantity;
        }

        const origin = resolveCheckoutOrigin(ctx.req, ENV.siteUrl);
        const successUrl = buildCheckoutUrl(
          origin,
          "/shop/order-success",
          "session_id={CHECKOUT_SESSION_ID}"
        );
        const cancelUrl = buildCheckoutUrl(origin, "/shop");

        const session = await stripe.checkout.sessions.create(
          {
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: ctx.user.email || undefined,
            client_reference_id: ctx.user.id.toString(),
            metadata: {
              user_id: ctx.user.id.toString(),
              customer_email: ctx.user.email || "",
              customer_name: ctx.user.name || "",
              order_items: JSON.stringify(input.items),
              shipping_address: input.shippingAddress,
              order_total_cents: totalAmount.toString(),
            },
            allow_promotion_codes: true,
          },
          input.idempotencyKey
            ? { idempotencyKey: input.idempotencyKey }
            : undefined
        );

        return { url: session.url };
      }),

    // Admin shop endpoints
    admin: router({
      products: router({
        list: adminProcedure.query(async () => {
          const { getAllProducts } = await import("./db");
          return await getAllProducts();
        }),

        create: governedProcedure("shop.products.create")
          .input(
            z.object({
              name: z.string(),
              description: z.string().optional(),
              price: z.number().min(0),
              imageUrl: z.string().optional(),
              imageKey: z.string().optional(),
              category: z.enum(["apparel", "accessories", "equipment"]),
              stock: z.number().min(0),
            })
          )
          .mutation(async ({ input }) => {
            const { createProduct } = await import("./db");
            await createProduct({
              ...input,
              price: input.price.toFixed(2),
            });
            return { success: true };
          }),

        update: governedProcedure("shop.products.update")
          .input(
            z.object({
              id: z.number(),
              name: z.string().optional(),
              description: z.string().optional(),
              price: z.number().optional(),
              imageUrl: z.string().optional(),
              stock: z.number().optional(),
              isActive: z.boolean().optional(),
            })
          )
          .mutation(async ({ input }) => {
            const { updateProduct } = await import("./db");
            const { id, ...updates } = input;
            await updateProduct(id, {
              ...updates,
              price:
                updates.price !== undefined
                  ? updates.price.toFixed(2)
                  : undefined,
            });
            return { success: true };
          }),

        delete: governedProcedure("shop.products.delete")
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input }) => {
            const { deleteProduct } = await import("./db");
            await deleteProduct(input.id);
            return { success: true };
          }),
      }),

      campaigns: router({
        list: adminProcedure.query(async () => {
          const { getAllCampaigns } = await import("./db");
          return await getAllCampaigns();
        }),

        create: governedProcedure("shop.campaigns.create")
          .input(
            z.object({
              name: z.string(),
              description: z.string().optional(),
              bannerImageUrl: z.string().optional(),
              bannerImageKey: z.string().optional(),
              startDate: z.date(),
              endDate: z.date(),
            })
          )
          .mutation(async ({ input }) => {
            const { createCampaign } = await import("./db");
            await createCampaign(input);
            return { success: true };
          }),

        update: governedProcedure("shop.campaigns.update")
          .input(
            z.object({
              id: z.number(),
              name: z.string().optional(),
              description: z.string().optional(),
              startDate: z.date().optional(),
              endDate: z.date().optional(),
              isActive: z.boolean().optional(),
            })
          )
          .mutation(async ({ input }) => {
            const { updateCampaign } = await import("./db");
            const { id, ...updates } = input;
            await updateCampaign(id, updates);
            return { success: true };
          }),

        delete: governedProcedure("shop.campaigns.delete")
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input }) => {
            const { deleteCampaign } = await import("./db");
            await deleteCampaign(input.id);
            return { success: true };
          }),
      }),
    }),
  }),

  videos: router({
    list: publicQueryProcedure
      .input(paginationSchema)
      .query(async ({ input }) => {
        const { getAllVideos } = await import("./db");
        return await getAllVideos(true, input ? { limit: input.limit, offset: input.offset } : undefined);
      }),

    byId: publicQueryProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getVideoById } = await import("./db");
        return await getVideoById(input.id);
      }),

    byCategory: publicQueryProcedure
      .input(z.object({
        category: z.string(),
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      }))
      .query(async ({ input }) => {
        const { getVideosByCategory } = await import("./db");
        return await getVideosByCategory(input.category, true, { limit: input.limit, offset: input.offset });
      }),

    trackView: publicMutationProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { incrementVideoViewCount } = await import("./db");
        await incrementVideoViewCount(input.id);
        return { success: true };
      }),

    admin: router({
      list: adminProcedure.query(async () => {
        const { getAllVideos } = await import("./db");
        return await getAllVideos(false); // All videos for admin
      }),

      create: governedProcedure("videos.admin.create")
        .input(
          z.object({
            title: z.string().max(200),
            description: z.string().max(2000).optional(),
            url: z.string().max(500),
            thumbnail: z.string().max(500).optional(),
            category: z.enum(["training", "highlights"]),
            platform: z.enum(["tiktok", "instagram"]),
          })
        )
        .mutation(async ({ input }) => {
          const { createVideo } = await import("./db");
          await createVideo(input);
          return { success: true };
        }),

      update: governedProcedure("videos.admin.update")
        .input(
          z.object({
            id: z.number(),
            title: z.string().max(200).optional(),
            description: z.string().max(2000).optional(),
            url: z.string().max(500).optional(),
            thumbnail: z.string().max(500).optional(),
            category: z.enum(["training", "highlights"]).optional(),
            platform: z.enum(["tiktok", "instagram"]).optional(),
            isPublished: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { updateVideo } = await import("./db");
          const { id, ...updates } = input;
          await updateVideo(id, updates);
          return { success: true };
        }),

      delete: governedProcedure("videos.admin.delete")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteVideo } = await import("./db");
          await deleteVideo(input.id);
          return { success: true };
        }),
    }),
  }),

  payment: router({
    createCheckout: protectedProcedure
      .input(
        z.object({
          productIds: z.array(z.string()).min(1),
          idempotencyKey: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const origin = resolveCheckoutOrigin(ctx.req, ENV.siteUrl);
        const session = await createProgramCheckoutSession({
          productIds: input.productIds,
          origin,
          customerEmail: ctx.user.email || undefined,
          clientReferenceId: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
          },
          idempotencyKey: input.idempotencyKey,
        });

        return { url: session.url };
      }),

    createGuestCheckout: publicMutationProcedure
      .input(
        z.object({
          productIds: z.array(z.string()).min(1),
          email: z.string().email().optional(),
          idempotencyKey: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const origin = resolveCheckoutOrigin(ctx.req, ENV.siteUrl);
        const session = await createProgramCheckoutSession({
          productIds: input.productIds,
          origin,
          customerEmail: input.email,
          metadata: {
            guest_checkout: "true",
            ...(input.email && { guest_email: input.email }),
          },
          idempotencyKey: input.idempotencyKey,
        });

        return { url: session.url };
      }),

    myPayments: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
        const { getUserPayments } = await import("./db");
        return await getUserPayments(ctx.user.id, input ? { limit: input.limit, offset: input.offset } : undefined);
      }),

    mySubscriptions: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
        const { getUserSubscriptions } = await import("./db");
        return await getUserSubscriptions(ctx.user.id, input ? { limit: input.limit, offset: input.offset } : undefined);
      }),

    // Calculate sibling discount based on number of enrolled children
    getSiblingDiscount: protectedProcedure.query(async ({ ctx }) => {
      const familyMembers = await getFamilyMembers(ctx.user.id);
      // Discount tiers: 2 children = 10%, 3+ = 15%
      const childCount = familyMembers.length;
      if (childCount >= 3) return { discount: 15, childCount, message: "15% family discount (3+ children)" };
      if (childCount >= 2) return { discount: 10, childCount, message: "10% sibling discount (2 children)" };
      return { discount: 0, childCount, message: null };
    }),

    createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
      const { ENV } = await import("./_core/env");
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(ENV.stripeSecretKey);
      const { getUserById } = await import("./db");

      const user = await getUserById(ctx.user.id);
      if (!user?.stripeCustomerId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No Stripe customer found for this account. Please make a purchase first.",
        });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${resolveCheckoutOrigin(ctx.req, ENV.siteUrl)}/member`,
      });

      return { url: session.url };
    }),

    catalog: publicQueryProcedure.query(async () => {
      const { getAllProducts } = await import("./products");
      return getAllProducts();
    }),

    getCheckoutSessionDetails: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ ctx, input }) => {
        const { ENV } = await import("./_core/env");
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(ENV.stripeSecretKey);
        const { getProduct } = await import("./products");

        try {
          const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
            expand: ["line_items", "payment_intent"],
          });

          // Verify the requesting user owns this checkout session
          if (
            session.customer_email &&
            ctx.user.email &&
            session.customer_email.toLowerCase() !== ctx.user.email.toLowerCase()
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You do not have access to this checkout session",
            });
          }

          // Extract product details from line items
          const items = (session.line_items?.data || []).map((item) => {
            const productId = item.price?.metadata?.product_id || "";
            const product = getProduct(productId);
            return {
              name: item.description || "Unknown Item",
              quantity: item.quantity || 1,
              amount: item.amount_total || 0,
              productId,
              product,
            };
          });

          return {
            id: session.id,
            amount: session.amount_total || 0,
            currency: session.currency || "usd",
            status: session.payment_status,
            customerEmail: session.customer_email || "",
            items,
            createdAt: new Date(session.created * 1000),
            paymentIntentId: typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Checkout session not found",
          });
        }
      }),

    // Coach Dashboard Queries
    getCoachBookings: protectedProcedure
      .input(
        z.object({
          coachId: z.number().optional(),
          status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        // Only admins can view all bookings; coaches can only view their own
        if (input.coachId && input.coachId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only view your own bookings" });
        }

        const { getDb } = await import("./db");
        const { privateSessionBookings } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const conditions = [];
        if (input.coachId) {
          conditions.push(eq(privateSessionBookings.coachId, input.coachId));
        }
        if (input.status) {
          conditions.push(eq(privateSessionBookings.status, input.status));
        }
        
        const bookings = await db
          .select()
          .from(privateSessionBookings)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(privateSessionBookings.createdAt);
        
        return bookings;
      }),

    updateBookingStatus: governedProcedure("coaches.updateBookingStatus")
      .input(
        z.object({
          bookingId: z.number(),
          status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { privateSessionBookings } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        await db
          .update(privateSessionBookings)
          .set({
            status: input.status,
            notes: input.notes || null,
            updatedAt: new Date(),
          })
          .where(eq(privateSessionBookings.id, input.bookingId));
        
        return { success: true };
      }),

    submitPrivateSessionBooking: publicMutationProcedure
      .input(
        z.object({
          customerName: z.string().min(1),
          customerEmail: z.string().email(),
          customerPhone: z.string().optional(),
          coachId: z.number(),
          coachName: z.string(),
          preferredDates: z.string().optional(),
          preferredTimes: z.string().optional(),
          notes: z.string().optional(),
          stripeSessionId: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Rate limit booking submissions by email
        checkPublicMutationRate(`booking:${input.customerEmail}`);

        try {
          const { getDb } = await import("./db");
          const { privateSessionBookings } = await import("../drizzle/schema");

          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

          // Insert booking request into database
          const [inserted] = await db
            .insert(privateSessionBookings)
            .values({
              customerName: input.customerName,
              customerEmail: input.customerEmail,
              customerPhone: input.customerPhone || null,
              coachId: input.coachId,
              coachName: input.coachName,
              preferredDates: input.preferredDates || null,
              preferredTimes: input.preferredTimes || null,
              notes: input.notes || null,
              stripeSessionId: input.stripeSessionId || null,
              status: "pending",
            })
            .returning();
          const bookingId = inserted.id;

          // Send notification to owner
          await notifyOwner({
            title: "New Private Session Booking Request",
            content: `${input.customerName} (${input.customerEmail}) has requested a private session with ${input.coachName}. Phone: ${input.customerPhone || "Not provided"}. Preferred dates: ${input.preferredDates || "Not specified"}. Preferred times: ${input.preferredTimes || "Not specified"}.`,
          });

          return {
            success: true,
            bookingId,
          };
        } catch (error) {
          logger.error("Booking submission error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to submit booking request",
          });
        }
      }),
  }),

  attendance: router({
    markAttendance: governedProcedure("attendance.markAttendance")
      .input(
        z.object({
          scheduleId: z.number(),
          userId: z.number(),
          status: z.enum(["present", "absent", "excused", "late"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { markAttendance } = await import("./db");
        const id = await markAttendance({
          ...input,
          markedBy: ctx.user.id,
        });
        return { success: true, id };
      }),

    getBySchedule: adminProcedure
      .input(z.object({ scheduleId: z.number() }))
      .query(async ({ input }) => {
        const { getAttendanceBySchedule } = await import("./db");
        return await getAttendanceBySchedule(input.scheduleId);
      }),

    getMyAttendance: protectedProcedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
        const { getAttendanceByUser } = await import("./db");
        return await getAttendanceByUser(ctx.user.id, input ? { limit: input.limit, offset: input.offset } : undefined);
      }),

    getMyStats: protectedProcedure
      .input(
        z
          .object({
            startDate: z.date().optional(),
            endDate: z.date().optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const { getAttendanceStats } = await import("./db");
        return await getAttendanceStats(
          ctx.user.id,
          input?.startDate,
          input?.endDate
        );
      }),

    updateAttendance: governedProcedure("attendance.updateAttendance")
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["present", "absent", "excused", "late"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateAttendance } = await import("./db");
        const { id, ...updates } = input;
        await updateAttendance(id, updates);
        return { success: true };
      }),
  }),

  // Location management
  locations: router({
    list: publicQueryProcedure
      .input(paginationSchema)
      .query(async ({ input }) => {
        const { getAllLocations } = await import("./db");
        return await getAllLocations(input ? { limit: input.limit, offset: input.offset } : undefined);
      }),
    admin: router({
      list: adminProcedure.query(async () => {
        const { getAllLocationsAdmin } = await import("./db");
        return await getAllLocationsAdmin();
      }),
      create: governedProcedure("locations.admin.create")
        .input(
          z.object({
            name: z.string().min(1),
            address: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            description: z.string().optional(),
            latitude: z.string().optional(),
            longitude: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { createLocation } = await import("./db");
          const id = await createLocation({
            ...input,
            latitude: input.latitude?.trim() || null,
            longitude: input.longitude?.trim() || null,
          });
          return { success: true, id };
        }),
      update: governedProcedure("locations.admin.update")
        .input(
          z.object({
            id: z.number(),
            name: z.string().optional(),
            address: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            description: z.string().optional(),
            latitude: z.string().optional(),
            longitude: z.string().optional(),
            isActive: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          const { updateLocation } = await import("./db");
          await updateLocation(id, {
            ...updates,
            latitude: updates.latitude?.trim(),
            longitude: updates.longitude?.trim(),
          });
          return { success: true };
        }),
      delete: governedProcedure("locations.admin.delete")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteLocation } = await import("./db");
          await deleteLocation(input.id);
          return { success: true };
        }),
    }),
  }),

  // Coach management
  coaches: router({
    list: publicQueryProcedure
      .input(paginationSchema)
      .query(async ({ input }) => {
        const { getAllCoaches } = await import("./db");
        return await getAllCoaches(input ? { limit: input.limit, offset: input.offset } : undefined);
      }),
    admin: router({
      list: adminProcedure.query(async () => {
        const { getAllCoachesAdmin } = await import("./db");
        return await getAllCoachesAdmin();
      }),
      create: governedProcedure("coaches.admin.create")
        .input(
          z.object({
            userId: z.number(),
            bio: z.string().optional(),
            specialties: z.string().optional(),
            certifications: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { createCoach } = await import("./db");
          const id = await createCoach(input);
          return { success: true, id };
        }),
      update: governedProcedure("coaches.admin.update")
        .input(
          z.object({
            id: z.number(),
            bio: z.string().optional(),
            specialties: z.string().optional(),
            certifications: z.string().optional(),
            isActive: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          const { updateCoach } = await import("./db");
          await updateCoach(id, updates);
          return { success: true };
        }),
      delete: governedProcedure("coaches.admin.delete")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteCoach } = await import("./db");
          await deleteCoach(input.id);
          return { success: true };
        }),
      assignments: router({
        list: adminProcedure
          .input(
            z
              .object({
                coachId: z.number().optional(),
                programId: z.number().optional(),
                scheduleId: z.number().optional(),
              })
              .optional()
          )
          .query(async ({ input }) => {
            const { getCoachAssignments } = await import("./db");
            return await getCoachAssignments(
              input?.coachId,
              input?.programId,
              input?.scheduleId
            );
          }),
        create: governedProcedure("coaches.assignments.create")
          .input(
            z.object({
              coachId: z.number(),
              programId: z.number().optional(),
              scheduleId: z.number().optional(),
              role: z.string().optional(),
            })
          )
          .mutation(async ({ input }) => {
            const { createCoachAssignment } = await import("./db");
            const id = await createCoachAssignment(input);
            return { success: true, id };
          }),
        delete: governedProcedure("coaches.assignments.delete")
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input }) => {
            const { deleteCoachAssignment } = await import("./db");
            await deleteCoachAssignment(input.id);
            return { success: true };
          }),
      }),
    }),
  }),

  // Notification preferences
  notifications: router({
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      const { getUserNotificationPreferences } = await import("./db");
      return await getUserNotificationPreferences(ctx.user.id);
    }),
    updatePreferences: protectedProcedure
      .input(
        z.object({
          sessionRegistrations: z.boolean().optional(),
          paymentConfirmations: z.boolean().optional(),
          announcements: z.boolean().optional(),
          attendanceUpdates: z.boolean().optional(),
          blogPosts: z.boolean().optional(),
          marketing: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createOrUpdateNotificationPreferences } = await import("./db");
        await createOrUpdateNotificationPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Direct Messaging routes
  dm: router({
    // Get all conversations for current user
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      try {
        const { getUserConversations } = await import("./db");
        return await getUserConversations(ctx.user.id);
      } catch (error: any) {
        logger.error("[DM] getConversations failed for user", ctx.user.id, ":", error?.message, error?.stack);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load conversations",
        });
      }
    }),

    // Get messages for a conversation
    getMessages: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          limit: z.number().optional().default(50),
          before: z.number().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const { getConversationMessages, isConversationParticipant } = await import("./db");
        // Verify user is participant (single lightweight query)
        const allowed = await isConversationParticipant(input.conversationId, ctx.user.id);
        if (!allowed) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
        }
        return await getConversationMessages(
          input.conversationId,
          input.limit,
          input.before
        );
      }),

    // Start or get existing conversation with a user
    startConversation: protectedProcedure
      .input(z.object({ recipientId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { getOrCreateConversation, canUserDm } = await import("./db");
        
        // Check if user can DM recipient
        const canDm = await canUserDm(ctx.user.id, input.recipientId);
        if (!canDm) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You cannot message this user",
          });
        }

        const conversation = await getOrCreateConversation(
          ctx.user.id,
          input.recipientId
        );
        return conversation;
      }),

    // Send a message
    sendMessage: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          content: z.string().min(1).max(5000),
          imageUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { sendDmMessage, isConversationParticipant } = await import("./db");

        // Verify user is participant (single lightweight query)
        const allowed = await isConversationParticipant(input.conversationId, ctx.user.id);
        if (!allowed) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
        }

        const senderName = ctx.user.name || "Unknown";
        const message = await sendDmMessage(
          input.conversationId,
          ctx.user.id,
          senderName,
          input.content,
          input.imageUrl
        );

        // Publish to Ably for real-time delivery (fire-and-forget, don't block response)
        import("./ably").then(({ publishDmMessage }) =>
          publishDmMessage(input.conversationId, {
            id: (message as any).id,
            conversationId: input.conversationId,
            senderId: ctx.user.id,
            senderName,
            content: input.content,
            imageUrl: input.imageUrl,
            createdAt: new Date().toISOString(),
          })
        ).catch((err) => logger.error("[DM] Ably publish failed:", err));

        // Send push notifications to DM recipient (fire-and-forget)
        import("./push").then(({ notifyDmMessage }) =>
          notifyDmMessage(
            input.conversationId,
            ctx.user.id,
            senderName,
            input.content
          )
        ).catch((err) => logger.error("[DM] Push notification failed:", err));

        return message;
      }),

    // Mark conversation as read
    markAsRead: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { markConversationAsRead } = await import("./db");
        await markConversationAsRead(input.conversationId, ctx.user.id);
        return { success: true };
      }),

    // Get users available for DM
    getAvailableUsers: protectedProcedure.query(async ({ ctx }) => {
      try {
        const { getAvailableDmUsers } = await import("./db");
        return await getAvailableDmUsers(ctx.user.id);
      } catch (error: any) {
        logger.error("[DM] getAvailableUsers failed:", error?.message || error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch available users",
        });
      }
    }),

    // Search messages
    searchMessages: protectedProcedure
      .input(z.object({
        query: z.string().min(1).max(500),
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const { searchDmMessages } = await import("./db");
        return await searchDmMessages(ctx.user.id, input.query, { limit: input.limit, offset: input.offset });
      }),

    // Block a user
    blockUser: protectedProcedure
      .input(z.object({ userId: z.number(), reason: z.string().max(1000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const { blockUser } = await import("./db");
        await blockUser(ctx.user.id, input.userId, input.reason);
        return { success: true };
      }),

    // Unblock a user
    unblockUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { unblockUser } = await import("./db");
        await unblockUser(ctx.user.id, input.userId);
        return { success: true };
      }),

    // Get blocked users
    getBlockedUsers: protectedProcedure.query(async ({ ctx }) => {
      const { getBlockedUsers } = await import("./db");
      return await getBlockedUsers(ctx.user.id);
    }),

    // Mute a conversation
    muteConversation: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          until: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { muteConversation } = await import("./db");
        await muteConversation(input.conversationId, ctx.user.id, input.until);
        return { success: true };
      }),

    // Unmute a conversation
    unmuteConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { unmuteConversation } = await import("./db");
        await unmuteConversation(input.conversationId, ctx.user.id);
        return { success: true };
      }),

    // Archive a conversation
    archiveConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { archiveConversation } = await import("./db");
        await archiveConversation(input.conversationId, ctx.user.id);
        return { success: true };
      }),

    // Get user's messaging role
    getMyRole: protectedProcedure.query(async ({ ctx }) => {
      const { getOrCreateUserMessagingRole } = await import("./db");
      return await getOrCreateUserMessagingRole(ctx.user.id);
    }),
  }),

  // Admin DM management
  dmAdmin: router({
    // Set user's messaging role
    setUserRole: governedProcedure("dmAdmin.setUserRole")
      .input(
        z.object({
          userId: z.number(),
          messagingRole: z.enum(["parent", "athlete", "coach", "staff", "admin"]),
          canDmCoaches: z.boolean().optional(),
          canDmParents: z.boolean().optional(),
          canDmAthletes: z.boolean().optional(),
          canBroadcast: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateUserMessagingRole } = await import("./db");
        const { userId, ...updates } = input;
        await updateUserMessagingRole(userId, updates);
        return { success: true };
      }),

    // Get all users with their messaging roles (single query via LEFT JOIN)
    getUsersWithRoles: adminProcedure.query(async () => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return [];

      const { users, userMessagingRoles } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const rows = await db
        .select()
        .from(users)
        .leftJoin(userMessagingRoles, eq(users.id, userMessagingRoles.userId));

      return rows.map((row: any) => ({
        ...row.users,
        messagingRole: row.userMessagingRoles || null,
      }));
    }),
  }),

  // Push notification routes
  pushNotifications: router({
    // Get notification settings
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const { getOrCreateNotificationSettings } = await import("./db");
      return await getOrCreateNotificationSettings(ctx.user.id);
    }),

    // Update notification settings
    updateSettings: protectedProcedure
      .input(
        z.object({
          pushEnabled: z.boolean().optional(),
          emailFallback: z.boolean().optional(),
          dmNotifications: z.boolean().optional(),
          channelNotifications: z.boolean().optional(),
          mentionNotifications: z.boolean().optional(),
          announcementNotifications: z.boolean().optional(),
          quietHoursEnabled: z.boolean().optional(),
          quietHoursStart: z.string().optional(),
          quietHoursEnd: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateNotificationSettings } = await import("./db");
        await updateNotificationSettings(ctx.user.id, input);
        return { success: true };
      }),

    // Subscribe to push notifications
    subscribe: protectedProcedure
      .input(
        z.object({
          endpoint: z.string(),
          p256dh: z.string(),
          auth: z.string(),
          userAgent: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { savePushSubscription, updateNotificationSettings } = await import("./db");
        await savePushSubscription(
          ctx.user.id,
          input.endpoint,
          input.p256dh,
          input.auth,
          input.userAgent
        );
        // Enable push notifications
        await updateNotificationSettings(ctx.user.id, { pushEnabled: true });
        return { success: true };
      }),

    // Unsubscribe from push notifications
    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { removePushSubscription } = await import("./db");
        await removePushSubscription(ctx.user.id, input.endpoint);
        return { success: true };
      }),

    // Get VAPID public key for push subscription
    getVapidPublicKey: publicQueryProcedure.query(async () => {
      // Return the VAPID public key from environment
      return { publicKey: ENV.vapidPublicKey || null };
    }),

    // Register an Expo push token (mobile app)
    registerExpoToken: protectedProcedure
      .input(
        z.object({
          expoPushToken: z.string(),
          platform: z.enum(["ios", "android"]),
          deviceId: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { pushSubscriptions } = await import("../drizzle/schema");
        const { sql } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        try {
          // Atomic upsert by (userId, deviceId) using unique index
          await db
            .insert(pushSubscriptions)
            .values({
              userId: ctx.user.id,
              deviceId: input.deviceId,
              platform: input.platform,
              expoPushToken: input.expoPushToken,
              isActive: true,
            })
            .onConflictDoUpdate({
              target: [pushSubscriptions.userId, pushSubscriptions.deviceId],
              set: {
                expoPushToken: sql`excluded."expoPushToken"`,
                platform: sql`excluded."platform"`,
                isActive: sql`true`,
                updatedAt: sql`now()`,
              },
            });
        } catch (err) {
          // Fallback: if upsert fails (missing unique index), try simple insert
          logger.error("[push] registerExpoToken upsert failed, trying insert:", err);
          try {
            await db.insert(pushSubscriptions).values({
              userId: ctx.user.id,
              deviceId: input.deviceId,
              platform: input.platform,
              expoPushToken: input.expoPushToken,
              isActive: true,
            });
          } catch {
            // Already exists — not critical
            logger.error("[push] registerExpoToken insert also failed — token may already exist");
          }
        }

        // Enable push in notification settings
        try {
          const { updateNotificationSettings } = await import("./db");
          await updateNotificationSettings(ctx.user.id, { pushEnabled: true });
        } catch (err) {
          logger.error("[push] updateNotificationSettings failed:", err);
        }

        return { success: true };
      }),
  }),

  // Blog routes (public)
  blog: router({
    list: publicQueryProcedure
      .input(
        z
          .object({
            limit: z.number().int().min(1).max(100).optional(),
            offset: z.number().int().min(0).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const { getAllPublishedBlogPosts } = await import("./db");
        return await getAllPublishedBlogPosts(input ? { limit: input.limit, offset: input.offset } : undefined);
      }),
    getBySlug: publicQueryProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const { getBlogPostBySlug } = await import("./db");
        return await getBlogPostBySlug(input.slug);
      }),
  }),

  // Blog admin routes
  blogAdmin: router({
    list: adminProcedure.query(async () => {
      const { getAllBlogPostsAdmin } = await import("./db");
      return await getAllBlogPostsAdmin();
    }),
    create: governedProcedure("blog.admin.create")
      .input(
        z.object({
          title: z.string().min(1),
          slug: z.string().min(1),
          excerpt: z.string().optional(),
          content: z.string().min(1),
          featuredImage: z.string().optional(),
          category: z.enum([
            "training_tips",
            "athlete_spotlight",
            "news",
            "events",
            "other",
          ]),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createBlogPost } = await import("./db");
        await createBlogPost({
          ...input,
          authorId: ctx.user.id,
          isPublished: false,
        });
        return { success: true };
      }),
    update: governedProcedure("blog.admin.update")
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          slug: z.string().optional(),
          excerpt: z.string().optional(),
          content: z.string().optional(),
          featuredImage: z.string().optional(),
          category: z
            .enum([
              "training_tips",
              "athlete_spotlight",
              "news",
              "events",
              "other",
            ])
            .optional(),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const { updateBlogPost } = await import("./db");
        await updateBlogPost(id, updates);
        return { success: true };
      }),
    publish: governedProcedure("blog.admin.publish")
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { publishBlogPost } = await import("./db");
        await publishBlogPost(input.id);
        return { success: true };
      }),
    delete: governedProcedure("blog.admin.delete")
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteBlogPost } = await import("./db");
        await deleteBlogPost(input.id);
        return { success: true };
      }),
  }),

  feed: router({
    list: publicQueryProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(50).optional(),
          offset: z.number().int().min(0).optional(),
          category: z.enum(["all", "training", "highlights"]).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const limit = input?.limit ?? 20;
        const offset = input?.offset ?? 0;
        const category = input?.category ?? "all";

        const { getDb } = await import("./db");
        const { sql } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) return { items: [], total: 0, hasMore: false };

        try {
          // Build category filter clause for both tables
          const videoCategoryFilter = category !== "all"
            ? sql`AND "category" = ${category}`
            : sql``;
          const photoCategoryFilter = category !== "all"
            ? sql`AND "category" = ${category}`
            : sql``;

          // Check which optional tables exist — cached after first probe per cold start
          // (tables don't appear/disappear at runtime, so one check is sufficient)
          if (_feedTableCache.checkedAt === 0) {
            try {
              await db.execute(sql`SELECT 1 FROM "session_recaps" LIMIT 0`);
              _feedTableCache.hasRecaps = true;
            } catch { /* table doesn't exist yet */ }
            try {
              await db.execute(sql`SELECT 1 FROM "milestones" LIMIT 0`);
              _feedTableCache.hasMilestones = true;
            } catch { /* table doesn't exist yet */ }
            _feedTableCache.checkedAt = Date.now();
          }
          const hasRecaps = _feedTableCache.hasRecaps;
          const hasMilestones = _feedTableCache.hasMilestones;

          // Build UNION ALL query — core tables always included, optional tables only if they exist
          const recapUnion = hasRecaps ? sql`
              UNION ALL

              SELECT
                'recap-' || sr."id" AS "id",
                'recap' AS "type",
                s."title" AS "title",
                sr."content" AS "description",
                NULL::text AS "mediaUrl",
                NULL::text AS "thumbnail",
                NULL::text AS "platform",
                'training'::text AS "category",
                0 AS "viewCount",
                sr."generated_at" AS "createdAt"
              FROM "session_recaps" sr
              INNER JOIN "schedules" s ON sr."schedule_id" = s."id"
              WHERE sr."type" = 'recap'
          ` : sql``;

          const milestoneUnion = hasMilestones ? sql`
              UNION ALL

              SELECT
                'milestone-' || m."id" AS "id",
                'milestone' AS "type",
                u."name" AS "title",
                m."improvement_display" AS "description",
                m."card_image_url" AS "mediaUrl",
                NULL::text AS "thumbnail",
                NULL::text AS "platform",
                'highlights'::text AS "category",
                0 AS "viewCount",
                m."created_at" AS "createdAt"
              FROM "milestones" m
              LEFT JOIN "users" u ON m."athlete_id" = u."id"
          ` : sql``;

          // Single UNION ALL query with DB-level sort + pagination
          const unionQuery = sql`
            SELECT * FROM (
              SELECT
                'video-' || "id" AS "id",
                'video' AS "type",
                "title",
                "description",
                "url" AS "mediaUrl",
                "thumbnail",
                "platform"::text,
                "category"::text,
                COALESCE("viewCount", 0) AS "viewCount",
                "createdAt"
              FROM "videos"
              WHERE "isPublished" = true ${videoCategoryFilter}

              UNION ALL

              SELECT
                'photo-' || "id" AS "id",
                'photo' AS "type",
                "title",
                "description",
                "imageUrl" AS "mediaUrl",
                NULL::text AS "thumbnail",
                NULL::text AS "platform",
                "category"::text,
                COALESCE("viewCount", 0) AS "viewCount",
                "createdAt"
              FROM "galleryPhotos"
              WHERE "isVisible" = true ${photoCategoryFilter}

              ${recapUnion}
              ${milestoneUnion}
            ) AS feed
            ORDER BY "createdAt" DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `;

          const items = await db.execute(unionQuery);

          // Get total count for pagination
          const recapCount = hasRecaps ? sql`(SELECT COUNT(*) FROM "session_recaps" WHERE "type" = 'recap') +` : sql``;
          const milestoneCount = hasMilestones ? sql`(SELECT COUNT(*) FROM "milestones") +` : sql``;
          const countQuery = sql`
            SELECT (
              ${recapCount}
              ${milestoneCount}
              (SELECT COUNT(*) FROM "videos" WHERE "isPublished" = true ${videoCategoryFilter}) +
              (SELECT COUNT(*) FROM "galleryPhotos" WHERE "isVisible" = true ${photoCategoryFilter})
            )::int AS "total"
          `;
          const countResult = await db.execute(countQuery);

          // postgres-js returns results as array-like, access rows via array index or .rows
          const resultRows = Array.isArray(items) ? items : (items.rows ?? []);
          const countRows = Array.isArray(countResult) ? countResult : (countResult.rows ?? []);
          const total = Number((countRows[0] as any)?.total ?? 0);

          return {
            items: resultRows.map((row: any) => ({
              id: row.id,
              type: row.type,
              title: row.title,
              description: row.description ?? null,
              mediaUrl: row.mediaUrl ?? row.mediaurl,
              thumbnail: row.thumbnail ?? null,
              platform: row.platform ?? null,
              category: row.category,
              viewCount: Number(row.viewCount ?? row.viewcount ?? 0),
              createdAt: row.createdAt ?? row.createdat,
            })),
            total,
            hasMore: offset + limit < total,
          };
        } catch (err) {
          logger.error("[Feed] list query failed:", err);
          return { items: [], total: 0, hasMore: false };
        }
      }),
  }),

  // ============================================================================
  // ATHLETE METRICS
  // ============================================================================

  metrics: router({
    // Get metrics for a specific athlete — only the athlete themselves or admins
    getByAthlete: protectedProcedure
      .input(z.object({ athleteId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.id !== input.athleteId && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own metrics",
          });
        }
        return await getAthleteMetrics(input.athleteId);
      }),

    // Get trend data for a specific metric — only the athlete themselves or admins
    getTrend: protectedProcedure
      .input(z.object({ athleteId: z.number(), metricName: z.string() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.id !== input.athleteId && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own metrics",
          });
        }
        return await getAthleteMetricsByName(input.athleteId, input.metricName);
      }),

    // Admin: list all metrics
    admin: router({
      list: adminProcedure.query(async () => {
        return await getAllMetricsAdmin();
      }),

      record: governedProcedure("metrics.admin.record")
        .input(
          z.object({
            athleteId: z.number(),
            metricName: z.string().trim().min(1),
            category: z.enum(["speed", "power", "agility", "endurance", "strength", "flexibility", "skill"]),
            value: metricValueSchema,
            unit: z.string().trim().min(1),
            notes: z.string().optional(),
            sessionDate: z.string().transform((s) => new Date(s)),
          })
        )
        .mutation(async ({ ctx, input }) => {
          // Get previous metrics for PR comparison BEFORE recording
          const previousMetrics = await getAthleteMetricsByName(
            input.athleteId,
            input.metricName
          );

          const metric = await createAthleteMetric({
            ...input,
            recordedBy: ctx.user.id,
          });

          // PR detection — check if this is a new personal record
          let milestone: { milestoneId: number; cardUrl: string | null } | null = null;
          if (previousMetrics && previousMetrics.length > 0) {
            try {
              const { isPR, triggerMilestone } = await import("./milestones");
              const prevValues = previousMetrics.map((m: any) => parseFloat(m.value));
              const LOWER_IS_BETTER_SET = new Set([
                "40-Yard Dash", "Pro Agility (5-10-5)", "10-Yard Split",
                "L-Drill", "Mile Run", "3-Cone Drill",
              ]);
              const isLower = LOWER_IS_BETTER_SET.has(input.metricName);
              const previousBest = isLower ? Math.min(...prevValues) : Math.max(...prevValues);

              const numericValue = parseFloat(input.value as string);

              if (isPR(input.metricName, numericValue, previousBest)) {
                const improvementPct = previousBest !== 0
                  ? Math.abs(((numericValue - previousBest) / previousBest) * 100)
                  : null;
                const direction = isLower ? "faster" : "higher";
                const improvementDisplay = improvementPct != null
                  ? `${improvementPct.toFixed(1)}% ${direction} than previous best`
                  : `New PR: ${numericValue} ${input.unit}`;

                // Get athlete name for card/push
                const { getDb } = await import("./db");
                const { users } = await import("../drizzle/schema");
                const { eq } = await import("drizzle-orm");
                const db = await getDb();
                let athleteName = "Athlete";
                if (db) {
                  const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, input.athleteId)).limit(1);
                  if (user?.name) athleteName = user.name;
                }

                milestone = await triggerMilestone({
                  athleteId: input.athleteId,
                  athleteName,
                  metricName: input.metricName,
                  previousValue: previousBest,
                  newValue: numericValue,
                  unit: input.unit,
                  improvementPct: improvementPct != null ? parseFloat(improvementPct.toFixed(1)) : null,
                  improvementDisplay,
                });
              }
            } catch (err) {
              logger.error("[metrics.record] PR detection failed (non-fatal)", err);
            }
          }

          return {
            ...metric,
            milestone: milestone ? {
              id: milestone.milestoneId,
              cardUrl: milestone.cardUrl,
            } : null,
          };
        }),

      update: governedProcedure("metrics.admin.update")
        .input(
          z.object({
            id: z.number(),
            metricName: z.string().trim().min(1).optional(),
            category: z.enum(["speed", "power", "agility", "endurance", "strength", "flexibility", "skill"]).optional(),
            value: metricValueSchema.optional(),
            unit: z.string().trim().min(1).optional(),
            notes: z.string().optional(),
            sessionDate: z.string().optional().transform((s) => s ? new Date(s) : undefined),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          // Filter out undefined values so we only update provided fields
          const updates = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
          );
          return await updateAthleteMetric(id, updates);
        }),

      delete: governedProcedure("metrics.admin.delete")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await deleteAthleteMetric(input.id);
          return { success: true };
        }),
    }),
  }),

  // ============================================================================
  // ATHLETE SHOWCASES
  // ============================================================================

  showcases: router({
    active: protectedProcedure.query(async () => {
      return await getActiveShowcases();
    }),

    admin: router({
      list: adminProcedure.query(async () => {
        return await getAllShowcasesAdmin();
      }),

      create: governedProcedure("showcases.admin.create")
        .input(
          z.object({
            athleteId: z.number(),
            title: textSchema,
            description: textSchema,
            imageUrl: z.string().optional(),
            imageKey: z.string().optional(),
            sport: z.enum(["basketball", "football", "flag_football", "soccer", "multi_sport", "saq"]).optional(),
            achievements: z.string().optional(), // JSON string
            stats: z.string().optional(), // JSON string
            featuredFrom: z.string().transform((s) => new Date(s)),
            featuredUntil: z.string().optional().transform((s) => s ? new Date(s) : undefined),
          })
        )
        .mutation(async ({ ctx, input }) => {
          return await createShowcase({
            ...input,
            createdBy: ctx.user.id,
          });
        }),

      update: governedProcedure("showcases.admin.update")
        .input(
          z.object({
            id: z.number(),
            title: textSchema.optional(),
            description: textSchema.optional(),
            imageUrl: z.string().optional(),
            sport: z.enum(["basketball", "football", "flag_football", "soccer", "multi_sport", "saq"]).optional(),
            achievements: z.string().optional(),
            stats: z.string().optional(),
            isActive: z.boolean().optional(),
            featuredUntil: z.string().optional().transform((s) => s ? new Date(s) : undefined),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await updateShowcase(id, data);
        }),

      delete: governedProcedure("showcases.admin.delete")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await deleteShowcase(input.id);
          return { success: true };
        }),
    }),
  }),

  // ============================================================================
  // MERCH DROPS
  // ============================================================================

  merchDrops: router({
    upcoming: protectedProcedure.query(async () => {
      return await getUpcomingDrops();
    }),

    trackView: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await incrementDropView(input.id);
        return { success: true };
      }),

    trackClick: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await incrementDropClick(input.id);
        return { success: true };
      }),

    admin: router({
      list: adminProcedure.query(async () => {
        return await getAllDropsAdmin();
      }),

      create: governedProcedure("merchDrops.admin.create")
        .input(
          z.object({
            title: textSchema,
            description: z.string().optional(),
            dropType: z.enum(["product", "program", "content", "event"]),
            referenceId: z.number().optional(),
            imageUrl: z.string().optional(),
            scheduledAt: z.string().transform((s) => new Date(s)),
          })
        )
        .mutation(async ({ ctx, input }) => {
          return await createMerchDrop({
            ...input,
            createdBy: ctx.user.id,
          });
        }),

      update: governedProcedure("merchDrops.admin.update")
        .input(
          z.object({
            id: z.number(),
            title: textSchema.optional(),
            description: z.string().optional(),
            dropType: z.enum(["product", "program", "content", "event"]).optional(),
            imageUrl: z.string().optional(),
            scheduledAt: z.string().optional().transform((s) => s ? new Date(s) : undefined),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await updateMerchDrop(id, data);
        }),

      sendNow: governedProcedure("merchDrops.admin.sendNow")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          // Mark as sent — push notification delivery handled by notification worker
          return await markDropSent(input.id);
        }),

      delete: governedProcedure("merchDrops.admin.delete")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await deleteMerchDrop(input.id);
          return { success: true };
        }),
    }),
  }),

  // ============================================================================
  // GAMES & REWARDS
  // ============================================================================

  games: router({
    // Get current user's points
    myPoints: protectedProcedure.query(async ({ ctx }) => {
      return await getOrCreateUserPoints(ctx.user.id);
    }),

    // Get play history
    myHistory: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(50).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await getUserGameHistory(ctx.user.id, input?.limit ?? 20);
      }),

    // Check daily plays remaining
    dailyPlaysRemaining: protectedProcedure
      .input(z.object({ gameType: z.enum(["spin_wheel", "trivia", "scratch_card"]) }))
      .query(async ({ ctx, input }) => {
        const plays = await getUserDailyPlays(ctx.user.id, input.gameType);
        const maxPlays = input.gameType === "trivia" ? 5 : 3;
        return { played: plays, remaining: Math.max(0, maxPlays - plays), max: maxPlays };
      }),

    // Leaderboard
    leaderboard: protectedProcedure.query(async () => {
      return await getPointsLeaderboard(20);
    }),

    // Play spin wheel
    spinWheel: protectedProcedure.mutation(async ({ ctx }) => {
      // Weighted random outcomes
      const outcomes = [
        { rewardType: "points" as const, value: "10", points: 10, weight: 30 },
        { rewardType: "points" as const, value: "25", points: 25, weight: 25 },
        { rewardType: "points" as const, value: "50", points: 50, weight: 15 },
        { rewardType: "points" as const, value: "100", points: 100, weight: 8 },
        { rewardType: "points" as const, value: "Free Spin", points: 0, weight: 10, freeSpin: true },
        { rewardType: "points" as const, value: "2 Free Spins", points: 0, weight: 5, freeSpin: true, freeSpinCount: 2 },
        { rewardType: "badge" as const, value: "Lucky Spinner", points: 15, weight: 5 },
        { rewardType: "none" as const, value: "", points: 0, weight: 2 },
      ];

      const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedOutcome = outcomes[0];
      for (const outcome of outcomes) {
        random -= outcome.weight;
        if (random <= 0) {
          selectedOutcome = outcome;
          break;
        }
      }

      try {
        // Atomic check+insert — returns null if daily limit (3) reached
        const entry = await createGameEntryWithLimit({
          userId: ctx.user.id,
          gameType: "spin_wheel",
          rewardType: selectedOutcome.rewardType,
          rewardValue: selectedOutcome.value,
          pointsEarned: selectedOutcome.points,
          metadata: JSON.stringify({ outcome: selectedOutcome }),
        }, 3);

        if (!entry) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Daily spin limit reached (3/day)" });
        }

        if (selectedOutcome.points > 0) {
          await addUserPoints(ctx.user.id, selectedOutcome.points);
        }
        await refreshUserStreak(ctx.user.id);

        return {
          entry,
          reward: {
            type: selectedOutcome.rewardType,
            value: selectedOutcome.value,
            points: selectedOutcome.points,
          },
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        logger.error("[Games] spinWheel error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to play spin wheel. Please try again." });
      }
    }),

    // Get trivia questions
    triviaQuestions: protectedProcedure
      .input(z.object({ count: z.number().int().min(1).max(10).optional(), category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const questions = await getRandomTriviaQuestions(input?.count ?? 5, input?.category);
        // Don't send correct answers to client — just the questions and options
        return questions.map((q) => ({
          id: q.id,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          category: q.category,
          difficulty: q.difficulty,
          pointValue: q.pointValue,
        }));
      }),

    // Submit trivia answers
    submitTrivia: protectedProcedure
      .input(
        z.object({
          answers: z.array(
            z.object({
              questionId: z.number(),
              selectedOption: z.enum(["a", "b", "c", "d"]),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Deduplicate answers by questionId — only keep the first answer per question
        const seen = new Set<number>();
        const dedupedAnswers = input.answers.filter((a) => {
          if (seen.has(a.questionId)) return false;
          seen.add(a.questionId);
          return true;
        });

        // Fetch only the submitted questions (not the entire bank)
        const questionIds = dedupedAnswers.map((a) => a.questionId);
        const questions = await getTriviaByIds(questionIds);
        const questionMap = new Map(questions.map((q) => [q.id, q]));

        let totalPoints = 0;
        let correct = 0;
        const results = dedupedAnswers.map((answer) => {
          const question = questionMap.get(answer.questionId);
          if (!question) return { questionId: answer.questionId, correct: false, points: 0 };
          const isCorrect = question.correctOption === answer.selectedOption;
          if (isCorrect) {
            totalPoints += question.pointValue;
            correct++;
          }
          return {
            questionId: answer.questionId,
            correct: isCorrect,
            correctOption: question.correctOption,
            points: isCorrect ? question.pointValue : 0,
          };
        });

        try {
          // Atomic check+insert — returns null if daily limit (5) reached
          const entry = await createGameEntryWithLimit({
            userId: ctx.user.id,
            gameType: "trivia",
            rewardType: totalPoints > 0 ? "points" : "none",
            rewardValue: String(totalPoints),
            pointsEarned: totalPoints,
            metadata: JSON.stringify({ results, correct, total: dedupedAnswers.length }),
          }, 5);

          if (!entry) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Daily trivia limit reached (5/day)" });
          }

          if (totalPoints > 0) {
            await addUserPoints(ctx.user.id, totalPoints);
          }
          await refreshUserStreak(ctx.user.id);

          return { entry, results, totalPoints, correct, total: dedupedAnswers.length };
        } catch (err) {
          if (err instanceof TRPCError) throw err;
          logger.error("[Games] submitTrivia error:", err);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to submit trivia answers. Please try again." });
        }
      }),

    // Scratch card
    scratchCard: protectedProcedure.mutation(async ({ ctx }) => {
      // Random prize pool
      const prizes = [
        { rewardType: "points" as const, value: "5", points: 5, weight: 35 },
        { rewardType: "points" as const, value: "15", points: 15, weight: 25 },
        { rewardType: "points" as const, value: "30", points: 30, weight: 15 },
        { rewardType: "points" as const, value: "75", points: 75, weight: 8 },
        { rewardType: "points" as const, value: "Free Spin", points: 0, weight: 8, freeSpin: true },
        { rewardType: "points" as const, value: "2 Free Spins", points: 0, weight: 4, freeSpin: true, freeSpinCount: 2 },
        { rewardType: "badge" as const, value: "Scratch Master", points: 10, weight: 3 },
        { rewardType: "none" as const, value: "Try Again", points: 0, weight: 2 },
      ];

      const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedPrize = prizes[0];
      for (const prize of prizes) {
        random -= prize.weight;
        if (random <= 0) {
          selectedPrize = prize;
          break;
        }
      }

      try {
        // Atomic check+insert — returns null if daily limit (3) reached
        const entry = await createGameEntryWithLimit({
          userId: ctx.user.id,
          gameType: "scratch_card",
          rewardType: selectedPrize.rewardType,
          rewardValue: selectedPrize.value,
          pointsEarned: selectedPrize.points,
          metadata: JSON.stringify({ prize: selectedPrize }),
        }, 3);

        if (!entry) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Daily scratch card limit reached (3/day)" });
        }

        if (selectedPrize.points > 0) {
          await addUserPoints(ctx.user.id, selectedPrize.points);
        }
        await refreshUserStreak(ctx.user.id);

        return {
          entry,
          reward: {
            type: selectedPrize.rewardType,
            value: selectedPrize.value,
            points: selectedPrize.points,
          },
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        logger.error("[Games] scratchCard error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to play scratch card. Please try again." });
      }
    }),

    // Admin: trivia management
    admin: router({
      triviaList: adminProcedure.query(async () => {
        return await getAllTriviaAdmin();
      }),

      createTrivia: governedProcedure("games.admin.createTrivia")
        .input(
          z.object({
            question: textSchema,
            optionA: textSchema,
            optionB: textSchema,
            optionC: textSchema,
            optionD: textSchema,
            correctOption: z.enum(["a", "b", "c", "d"]),
            category: z.string().optional(),
            difficulty: z.enum(["easy", "medium", "hard"]).optional(),
            pointValue: z.number().int().min(1).optional(),
          })
        )
        .mutation(async ({ input }) => {
          return await createTriviaQuestion(input);
        }),

      updateTrivia: governedProcedure("games.admin.updateTrivia")
        .input(
          z.object({
            id: z.number(),
            question: textSchema.optional(),
            optionA: textSchema.optional(),
            optionB: textSchema.optional(),
            optionC: textSchema.optional(),
            optionD: textSchema.optional(),
            correctOption: z.enum(["a", "b", "c", "d"]).optional(),
            isActive: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await updateTriviaQuestion(id, data);
        }),

      deleteTrivia: governedProcedure("games.admin.deleteTrivia")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await deleteTriviaQuestion(input.id);
          return { success: true };
        }),
    }),
  }),

  // ============================================================================
  // FAMILY / HOUSEHOLD ACCOUNTS
  // ============================================================================

  family: router({
    getMembers: protectedProcedure.query(async ({ ctx }) => {
      return await getFamilyMembers(ctx.user.id);
    }),

    getChildData: protectedProcedure
      .input(z.object({ childId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify parent-child relationship
        const members = await getFamilyMembers(ctx.user.id);
        const isParent = members.some((m: any) => m.id === input.childId);
        if (!isParent && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view this child's data" });
        }
        const [metrics, attendance, schedules] = await Promise.all([
          getFamilyChildMetrics(input.childId),
          getFamilyChildAttendance(input.childId),
          getFamilyChildSchedules(input.childId),
        ]);
        return { metrics, attendance, schedules };
      }),

    addMember: protectedProcedure
      .input(z.object({ childId: z.number(), relationshipType: z.string().max(50).optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id === input.childId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot add yourself as a family member" });
        }
        return await addFamilyMember(ctx.user.id, input.childId, input.relationshipType ?? "parent");
      }),

    removeMember: protectedProcedure
      .input(z.object({ childId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeFamilyMember(ctx.user.id, input.childId);
        return { success: true };
      }),

    getParents: protectedProcedure.query(async ({ ctx }) => {
      return await getParentsForChild(ctx.user.id);
    }),
  }),

  // ============================================================================
  // WAITLIST
  // ============================================================================

  waitlist: router({
    myEntries: protectedProcedure.query(async ({ ctx }) => {
      return await getUserWaitlistEntries(ctx.user.id);
    }),

    join: protectedProcedure
      .input(z.object({
        scheduleId: z.number().optional(),
        programId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!input.scheduleId && !input.programId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Either scheduleId or programId is required" });
        }
        return await addToWaitlist({ userId: ctx.user.id, ...input });
      }),

    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await cancelWaitlistEntry(input.id, ctx.user.id);
      }),

    // Admin routes
    forSchedule: adminProcedure
      .input(z.object({ scheduleId: z.number() }))
      .query(async ({ input }) => {
        return await getWaitlistForSchedule(input.scheduleId);
      }),

    forProgram: adminProcedure
      .input(z.object({ programId: z.number() }))
      .query(async ({ input }) => {
        return await getWaitlistForProgram(input.programId);
      }),

    notifyNext: governedProcedure("waitlist.notifyNext")
      .input(z.object({ scheduleId: z.number().optional(), programId: z.number().optional() }))
      .mutation(async ({ input }) => {
        return await notifyNextOnWaitlist(input.scheduleId, input.programId);
      }),

    enrollFromWaitlist: governedProcedure("waitlist.enrollFromWaitlist")
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await enrollFromWaitlist(input.id);
      }),
  }),

  // ============================================================================
  // REFERRAL PROGRAM
  // ============================================================================

  referrals: router({
    getMyCode: protectedProcedure.query(async ({ ctx }) => {
      return await getUserReferralCode(ctx.user.id);
    }),

    getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
      return await getUserReferrals(ctx.user.id);
    }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      return await getReferralStats(ctx.user.id);
    }),

    invite: protectedProcedure
      .input(z.object({ email: z.string().email().max(320) }))
      .mutation(async ({ ctx, input }) => {
        const referral = await createReferral(ctx.user.id, input.email);
        // Send referral email
        try {
          await sendEmail({
            to: input.email,
            subject: "You've been invited to The Academy!",
            html: `
              <h2>You're Invited!</h2>
              <p>${ctx.user.name || "A member"} has invited you to join The Academy in Gallatin, TN.</p>
              <p>Use referral code <strong>${referral.referralCode}</strong> when you sign up to get started.</p>
              <p><a href="https://academytn.com">Learn more about The Academy</a></p>
            `,
          });
        } catch (e) {
          logger.error("[Referral] Failed to send invite email:", e);
        }
        return referral;
      }),

    validateCode: publicQueryProcedure
      .input(z.object({ code: z.string().max(20) }))
      .query(async ({ input }) => {
        const referral = await getReferralByCode(input.code);
        return { valid: !!referral };
      }),

    convert: protectedProcedure
      .input(z.object({ code: z.string().max(20) }))
      .mutation(async ({ ctx, input }) => {
        return await convertReferral(input.code, ctx.user.id);
      }),
  }),

  // ============================================================================
  // SCHEDULE TEMPLATES (Admin)
  // ============================================================================

  scheduleTemplates: router({
    list: adminProcedure.query(async () => {
      return await getAllScheduleTemplates();
    }),

    create: governedProcedure("scheduleTemplates.create")
      .input(z.object({
        name: z.string().max(255),
        programId: z.number().optional(),
        dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
        startHour: z.number().min(0).max(23),
        startMinute: z.number().min(0).max(59).default(0),
        endHour: z.number().min(0).max(23),
        endMinute: z.number().min(0).max(59).default(0),
        location: z.string().max(255).optional(),
        maxParticipants: z.number().min(1).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createScheduleTemplate({ ...input, createdBy: ctx.user.id });
      }),

    update: governedProcedure("scheduleTemplates.update")
      .input(z.object({
        id: z.number(),
        name: z.string().max(255).optional(),
        programId: z.number().optional(),
        dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]).optional(),
        startHour: z.number().min(0).max(23).optional(),
        startMinute: z.number().min(0).max(59).optional(),
        endHour: z.number().min(0).max(23).optional(),
        endMinute: z.number().min(0).max(59).optional(),
        location: z.string().max(255).optional(),
        maxParticipants: z.number().min(1).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateScheduleTemplate(id, data);
      }),

    delete: governedProcedure("scheduleTemplates.delete")
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteScheduleTemplate(input.id);
        return { success: true };
      }),

    generate: governedProcedure("scheduleTemplates.generate")
      .input(z.object({ weekStartDate: z.string().transform(s => new Date(s)) }))
      .mutation(async ({ input }) => {
        return await generateSchedulesFromTemplates(input.weekStartDate);
      }),
  }),

  // ============================================================================
  // BILLING & PAYMENT REMINDERS
  // ============================================================================

  billing: router({
    myReminders: protectedProcedure.query(async ({ ctx }) => {
      return await getUserBillingReminders(ctx.user.id);
    }),

    adminActiveReminders: adminProcedure.query(async () => {
      return await getActiveBillingReminders();
    }),

    resolve: governedProcedure("billing.resolve")
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await resolveBillingReminder(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // ONBOARDING
  // ============================================================================

  onboarding: router({
    getProgress: protectedProcedure.query(async ({ ctx }) => {
      const steps = await getOnboardingProgress(ctx.user.id);
      return {
        steps,
        completed: steps.some((s: any) => s.step === "complete"),
      };
    }),

    completeStep: protectedProcedure
      .input(z.object({
        step: z.enum(["select_sport", "set_goals", "choose_program", "schedule_first_session", "complete"]),
      }))
      .mutation(async ({ ctx, input }) => {
        return await completeOnboardingStep(ctx.user.id, input.step);
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        sport: z.string().max(50).optional(),
        goals: z.string().max(1000).optional(),
        dateOfBirth: z.string().optional().transform(s => s ? new Date(s) : undefined),
        extendedRole: z.enum(["parent", "athlete"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await updateUserOnboardingProfile(ctx.user.id, input);
      }),

    complete: protectedProcedure.mutation(async ({ ctx }) => {
      await completeOnboarding(ctx.user.id);
      return { success: true };
    }),
  }),

  // ============================================================================
  // RBAC / EXTENDED ROLES
  // ============================================================================

  roles: router({
    getMyRole: protectedProcedure.query(async ({ ctx }) => {
      return await getUserExtendedRole(ctx.user.id);
    }),

    setRole: governedProcedure("roles.setRole")
      .input(z.object({
        userId: z.number(),
        role: z.enum(["owner", "admin", "head_coach", "assistant_coach", "front_desk", "parent", "athlete"]),
      }))
      .mutation(async ({ input }) => {
        return await setUserExtendedRole(input.userId, input.role);
      }),

    listByRole: adminProcedure
      .input(z.object({
        role: z.enum(["owner", "admin", "head_coach", "assistant_coach", "front_desk", "parent", "athlete"]),
      }))
      .query(async ({ input }) => {
        return await getUsersByExtendedRole(input.role);
      }),
  }),

  // ============================================================================
  // AI WEEKLY PROGRESS REPORTS
  // ============================================================================

  progressReports: router({
    generate: protectedProcedure
      .input(z.object({ athleteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Auth check: only the athlete, their parents, or admins can generate
        if (ctx.user.id !== input.athleteId && ctx.user.role !== "admin") {
          const parents = await getParentsForChild(input.athleteId);
          if (!parents.some((p: any) => p.id === ctx.user.id)) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view this report" });
          }
        }

        const data = await getAthleteReportData(input.athleteId);
        if (!data) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Athlete not found" });
        }

        try {
          const result = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a youth sports training analyst for The Academy, a training facility in Gallatin, TN. Generate a concise, encouraging weekly progress report for a young athlete's parent. Include: performance trends, attendance summary, achievements, and actionable next steps. Keep it positive and motivating. Format in clean HTML suitable for email.`,
              },
              {
                role: "user",
                content: JSON.stringify({
                  athleteName: data.athlete.name ?? "Athlete",
                  sport: data.athlete.sport,
                  recentMetrics: data.metrics.slice(0, 10).map((m: any) => ({
                    name: m.metricName,
                    value: m.value,
                    unit: m.unit,
                    category: m.category,
                    date: m.sessionDate,
                  })),
                  attendanceRecent: data.attendance.slice(0, 10).map((a: any) => ({
                    status: a.status,
                    date: a.markedAt,
                  })),
                  showcases: data.showcases.map((s: any) => s.title),
                  points: data.points ? { total: data.points.totalPoints, streak: data.points.currentStreak } : null,
                }),
              },
            ],
          });

          const reportHtml = typeof result.choices?.[0]?.message?.content === "string"
            ? result.choices[0].message.content
            : "Unable to generate report at this time.";

          return { report: reportHtml, athleteName: data.athlete.name };
        } catch (e) {
          logger.error("[ProgressReport] LLM generation failed:", e);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate report" });
        }
      }),

    sendToParents: governedProcedure("progressReports.sendToParents")
      .input(z.object({ athleteId: z.number(), reportHtml: z.string().max(50000) }))
      .mutation(async ({ input }) => {
        const parents = await getParentsForChild(input.athleteId);
        const data = await getAthleteReportData(input.athleteId);
        const athleteName = data?.athlete?.name ?? "Your athlete";
        let sent = 0;
        for (const parent of parents) {
          if (parent.email) {
            const success = await sendEmail({
              to: parent.email,
              subject: `Weekly Progress Report: ${athleteName}`,
              html: input.reportHtml,
            });
            if (success) sent++;
          }
        }
        return { sent, total: parents.length };
      }),
  }),

  // ============================================================================
  // AI CONTENT QUEUE
  // ============================================================================

  contentQueue: router({
    list: adminProcedure
      .input(z.object({ status: z.enum(["all", "draft", "approved", "rejected"]).default("all") }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { contentQueue, schedules } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) return [];

        let query = db
          .select({
            id: contentQueue.id,
            content: contentQueue.content,
            platform: contentQueue.platform,
            status: contentQueue.status,
            scheduleId: contentQueue.scheduleId,
            reviewedBy: contentQueue.reviewedBy,
            reviewedAt: contentQueue.reviewedAt,
            generatedAt: contentQueue.generatedAt,
            sessionTitle: schedules.title,
          })
          .from(contentQueue)
          .leftJoin(schedules, eq(contentQueue.scheduleId, schedules.id))
          .orderBy(desc(contentQueue.generatedAt))
          .$dynamic();

        if (input.status !== "all") {
          query = query.where(eq(contentQueue.status, input.status));
        }

        return await query;
      }),

    review: governedProcedure("contentQueue.review")
      .input(z.object({
        id: z.number(),
        status: z.enum(["approved", "rejected"]),
        content: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { contentQueue } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const updateData: Record<string, any> = {
          status: input.status,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        };
        if (input.content !== undefined) {
          updateData.content = input.content;
        }

        await db.update(contentQueue).set(updateData).where(eq(contentQueue.id, input.id));
        return { success: true };
      }),
  }),

  // ============================================================================
  // MILESTONES (PR Celebration Engine)
  // ============================================================================

  milestones: router({
    listForAthlete: protectedProcedure
      .input(z.object({ athleteId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.id !== input.athleteId && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own milestones",
          });
        }
        const { getDb } = await import("./db");
        const { milestones } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) return [];

        return await db
          .select()
          .from(milestones)
          .where(eq(milestones.athleteId, input.athleteId))
          .orderBy(desc(milestones.createdAt));
      }),

    recent: publicQueryProcedure
      .input(z.object({ limit: z.number().int().min(1).max(20).optional() }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit ?? 10;
        const { getDb } = await import("./db");
        const { milestones, users } = await import("../drizzle/schema");
        const { desc, eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) return [];

        return await db
          .select({
            id: milestones.id,
            athleteId: milestones.athleteId,
            metricName: milestones.metricName,
            newValue: milestones.newValue,
            unit: milestones.unit,
            improvementDisplay: milestones.improvementDisplay,
            cardImageUrl: milestones.cardImageUrl,
            createdAt: milestones.createdAt,
            athleteName: users.name,
          })
          .from(milestones)
          .leftJoin(users, eq(milestones.athleteId, users.id))
          .orderBy(desc(milestones.createdAt))
          .limit(limit);
      }),

    trackShare: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { milestones } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        await db
          .update(milestones)
          .set({ sharedCount: sql`COALESCE(${milestones.sharedCount}, 0) + 1` })
          .where(eq(milestones.id, input.id));

        return { success: true };
      }),
  }),

  // ============================================================================
  // SOCIAL POSTS (Gallery)
  // ============================================================================

  socialPosts: router({
    list: publicQueryProcedure.query(async () => {
      try {
        return await getVisibleSocialPosts();
      } catch (err) {
        logger.error("[socialPosts.list] Unhandled error:", err);
        return [];
      }
    }),

    admin: router({
      list: adminProcedure.query(async () => {
        return await getAllSocialPostsAdmin();
      }),

      create: governedProcedure("socialPosts.admin.create")
        .input(
          z.object({
            platform: z.enum(["instagram", "tiktok", "twitter", "facebook", "youtube"]),
            postUrl: z.string().url(),
            embedHtml: z.string().max(10000).optional(),
            thumbnailUrl: z.string().max(500).optional(),
            caption: z.string().max(2000).optional(),
            postedAt: z.string().optional().transform((s) => s ? new Date(s) : undefined),
          })
        )
        .mutation(async ({ ctx, input }) => {
          return await createSocialPost({
            ...input,
            addedBy: ctx.user.id,
          });
        }),

      update: governedProcedure("socialPosts.admin.update")
        .input(
          z.object({
            id: z.number(),
            platform: z.enum(["instagram", "tiktok", "twitter", "facebook", "youtube"]).optional(),
            postUrl: z.string().url().optional(),
            embedHtml: z.string().max(10000).optional(),
            thumbnailUrl: z.string().max(500).optional(),
            caption: z.string().max(2000).optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await updateSocialPost(id, data);
        }),

      toggleVisibility: governedProcedure("socialPosts.admin.toggleVisibility")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          return await toggleSocialPostVisibility(input.id);
        }),

      reorder: governedProcedure("socialPosts.admin.reorder")
        .input(z.object({ orderedIds: z.array(z.number()) }))
        .mutation(async ({ input }) => {
          await reorderSocialPosts(input.orderedIds);
          return { success: true };
        }),

      delete: governedProcedure("socialPosts.admin.delete")
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await deleteSocialPost(input.id);
          return { success: true };
        }),
    }),
  }),

  // =========================================================================
  // VISION CAPTURE — AI metric extraction from voice memos and photos
  // =========================================================================
  visionCapture: router({
    extract: adminProcedure
      .input(
        z.object({
          mediaUrl: z.string().url(),
          mediaType: z.enum([
            "image/jpeg",
            "image/png",
            "image/webp",
            "audio/mp4",
            "audio/wav",
            "audio/mpeg",
            "audio/webm",
            "audio/m4a",
          ]),
          mode: z.enum(["voice", "photo"]),
          scheduleId: z.number().optional(),
          drillContext: z.string().max(200).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { extractFromVoice, extractFromPhoto } = await import(
          "./vision-capture"
        );
        const { visionCaptures } = await import("../drizzle/schema");
        const { getDb } = await import("./db");

        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });

        // Create capture record in processing state
        const [capture] = await db
          .insert(visionCaptures)
          .values({
            scheduleId: input.scheduleId || null,
            capturedBy: ctx.user.id,
            mode: input.mode,
            mediaUrl: input.mediaUrl,
            mediaType: input.mediaType,
            status: "processing",
          })
          .returning();

        try {
          const startTime = Date.now();
          let result;

          if (input.mode === "voice") {
            result = await extractFromVoice(input.mediaUrl, input.drillContext);
          } else {
            result = await extractFromPhoto(input.mediaUrl, input.drillContext);
          }

          const processingTime = Date.now() - startTime;
          const athleteCount = result.athletes.length;
          const metricCount = result.athletes.reduce(
            (sum: number, a: any) => sum + a.metrics.length,
            0
          );

          // Update capture with results
          const { eq } = await import("drizzle-orm");
          await db
            .update(visionCaptures)
            .set({
              extractionJson: result,
              status: "ready",
              athleteCount,
              metricCount,
              processingTimeMs: processingTime,
              aiObservations: result.sessionNotes || null,
            })
            .where(eq(visionCaptures.id, capture.id));

          return {
            captureId: capture.id,
            ...result,
            processingTimeMs: processingTime,
          };
        } catch (err: any) {
          const { eq } = await import("drizzle-orm");
          await db
            .update(visionCaptures)
            .set({
              status: "failed",
              errorMessage: err.message || String(err),
            })
            .where(eq(visionCaptures.id, capture.id));

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: err.message || "Extraction failed. Please try again.",
          });
        }
      }),

    confirm: adminProcedure
      .input(
        z.object({
          captureId: z.number(),
          metrics: z.array(
            z.object({
              athleteId: z.number(),
              metricName: z.string().trim().min(1),
              category: z.enum([
                "speed",
                "power",
                "agility",
                "endurance",
                "strength",
                "flexibility",
                "skill",
              ]),
              value: metricValueSchema,
              unit: z.string().trim().min(1),
              notes: z.string().optional(),
              sessionDate: z.string().transform((s) => new Date(s)),
            })
          ),
          sessionNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { visionCaptures } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { getDb } = await import("./db");

        const results = [];
        let prCount = 0;

        for (const metric of input.metrics) {
          const created = await createAthleteMetric({
            athleteId: metric.athleteId,
            metricName: metric.metricName,
            category: metric.category,
            value: metric.value,
            unit: metric.unit,
            notes: metric.notes || undefined,
            sessionDate: metric.sessionDate,
            recordedBy: ctx.user.id,
          });

          // PR detection (same logic as metrics.admin.record)
          try {
            const previousMetrics = await getAthleteMetricsByName(
              metric.athleteId,
              metric.metricName
            );
            // Filter out the one we just created
            const prevOnly = (previousMetrics || []).filter(
              (m: any) => m.id !== created.id
            );

            if (prevOnly.length > 0) {
              const { isPR, triggerMilestone } = await import("./milestones");
              const prevValues = prevOnly.map((m: any) => parseFloat(m.value));
              const LOWER_IS_BETTER_SET = new Set([
                "40-Yard Dash",
                "Pro Agility (5-10-5)",
                "10-Yard Split",
                "L-Drill",
                "Mile Run",
                "3-Cone Drill",
              ]);
              const isLower = LOWER_IS_BETTER_SET.has(metric.metricName);
              const previousBest = isLower
                ? Math.min(...prevValues)
                : Math.max(...prevValues);
              const numericValue = parseFloat(metric.value as string);

              if (isPR(metric.metricName, numericValue, previousBest)) {
                const improvementPct =
                  previousBest !== 0
                    ? Math.abs(
                        ((numericValue - previousBest) / previousBest) * 100
                      )
                    : null;
                const direction = isLower ? "faster" : "higher";
                const improvementDisplay =
                  improvementPct != null
                    ? `${improvementPct.toFixed(1)}% ${direction} than previous best`
                    : `New PR: ${numericValue} ${metric.unit}`;

                const db = await getDb();
                let athleteName = "Athlete";
                if (db) {
                  const { users } = await import("../drizzle/schema");
                  const [user] = await db
                    .select({ name: users.name })
                    .from(users)
                    .where(eq(users.id, metric.athleteId))
                    .limit(1);
                  if (user?.name) athleteName = user.name;
                }

                await triggerMilestone({
                  athleteId: metric.athleteId,
                  athleteName,
                  metricName: metric.metricName,
                  previousValue: previousBest,
                  newValue: numericValue,
                  unit: metric.unit,
                  improvementPct:
                    improvementPct != null
                      ? parseFloat(improvementPct.toFixed(1))
                      : null,
                  improvementDisplay,
                });
                prCount++;
              }
            }
          } catch (prErr) {
            logger.error(
              "[vision-capture/confirm] PR detection failed for metric",
              prErr
            );
          }

          results.push(created);
        }

        // Mark capture as confirmed
        const db = await getDb();
        if (db) {
          await db
            .update(visionCaptures)
            .set({
              status: "confirmed",
              confirmedAt: new Date(),
              metricCount: input.metrics.length,
            })
            .where(eq(visionCaptures.id, input.captureId));
        }

        return {
          metricsCreated: results.length,
          prsDetected: prCount,
          results,
        };
      }),

    listRecent: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { visionCaptures } = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) return [];

        return await db
          .select()
          .from(visionCaptures)
          .orderBy(desc(visionCaptures.createdAt))
          .limit(input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
