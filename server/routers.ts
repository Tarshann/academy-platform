import { COOKIE_NAME } from "../shared/const";
import { toCents } from "../shared/money";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { buildCheckoutUrl, resolveCheckoutOrigin } from "./_core/checkout";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllPrograms,
  getProgramBySlug,
  getPublishedAnnouncements,
  createContactSubmission,
  getContactSubmissions,
  getUpcomingSchedules,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { TRPCError } from "@trpc/server";

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

const textSchema = z.string().trim().min(1);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .transform(slugify)
  .refine(value => value.length > 0, "Slug must include letters or numbers");

const ageSchema = z.number().int().min(1).max(99);
const maxParticipantsSchema = z.number().int().min(1).nullable();


const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

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

  const products = productIds.map((productId) => {
    const product = getProduct(productId);
    if (!product) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    }
    return product;
  });

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
  const cancelUrl = buildCheckoutUrl(origin, "/signup");

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

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  programs: router({
    list: publicProcedure.query(async () => {
      return await getAllPrograms();
    }),
    getBySlug: publicProcedure
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
          await sendSessionRegistrationEmail({
            to: ctx.user.email,
            userName: ctx.user.name || "Member",
            sessionTitle: schedule.title,
            sessionDate: schedule.startTime,
            sessionLocation: schedule.location || "TBA",
          });
        }

        return { success: true };
      }),
  }),

  // Lead capture — public endpoint for the marketing site (academytn.com)
  leads: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().optional(),
          email: z.string().email(),
          phone: z.string().optional(),
          source: z.string().default("quiz"),
          athleteAge: z.string().optional(),
          sport: z.string().optional(),
          goal: z.string().optional(),
          recommendedProgram: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
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
    unsubscribe: publicProcedure
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
    processNurture: adminProcedure.mutation(async () => {
      const { processNurtureQueue } = await import("./nurture");
      return await processNurtureQueue();
    }),
  }),

  contact: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          phone: z.string().optional(),
          subject: z.string().min(1),
          message: z.string().min(10),
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
      create: adminProcedure
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
      update: adminProcedure
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
      delete: adminProcedure
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
      create: adminProcedure
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
      publish: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { publishAnnouncement } = await import("./db");
          await publishAnnouncement(input.id);
          return { success: true };
        }),
      delete: adminProcedure
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
      create: adminProcedure
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
      update: adminProcedure
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
      delete: adminProcedure
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

        const programMap = new Map(allPrograms.map((p: any) => [p.id, p]));

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

      assignProgram: adminProcedure
        .input(z.object({ userId: z.number(), programId: z.number() }))
        .mutation(async ({ input }) => {
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
        }),

      removeProgram: adminProcedure
        .input(z.object({ enrollmentId: z.number() }))
        .mutation(async ({ input }) => {
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
        }),

      updateRole: adminProcedure
        .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
        .mutation(async ({ input }) => {
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
        }),

      create: adminProcedure
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
      markRead: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { markContactAsRead } = await import("./db");
          await markContactAsRead(input.id);
          return { success: true };
        }),
      markResponded: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { markContactAsResponded } = await import("./db");
          await markContactAsResponded(input.id);
          return { success: true };
        }),
    }),
  }),

  gallery: router({
    list: publicProcedure.query(async () => {
      const { getAllGalleryPhotos } = await import("./db");
      return await getAllGalleryPhotos();
    }),

    byCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        const { getGalleryPhotosByCategory } = await import("./db");
        return await getGalleryPhotosByCategory(input.category);
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

      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            title: z.string().optional(),
            description: z.string().optional(),
            category: z.enum(["training", "highlights"]).optional(),
            isVisible: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { getDb } = await import("./db");
          const { galleryPhotos } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          const { id, ...updates } = input;
          await db.update(galleryPhotos).set(updates).where(eq(galleryPhotos.id, id));
          return { success: true };
        }),

      upload: adminProcedure
        .input(
          z.object({
            title: z.string(),
            description: z.string().optional(),
            imageUrl: z.string(),
            imageKey: z.string(),
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

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteGalleryPhoto } = await import("./db");
          await deleteGalleryPhoto(input.id);
          return { success: true };
        }),

      toggleVisibility: adminProcedure
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
    products: publicProcedure.query(async () => {
      const { getAllProducts } = await import("./db");
      return await getAllProducts();
    }),

    productById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getProductById } = await import("./db");
        return await getProductById(input.id);
      }),

    campaigns: publicProcedure.query(async () => {
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

        create: adminProcedure
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

        update: adminProcedure
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

        delete: adminProcedure
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

        create: adminProcedure
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

        update: adminProcedure
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

        delete: adminProcedure
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
    list: publicProcedure.query(async () => {
      const { getAllVideos } = await import("./db");
      return await getAllVideos(true); // Only published videos for public
    }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getVideoById, incrementVideoViewCount } = await import("./db");
        const video = await getVideoById(input.id);
        if (video && video.isPublished) {
          await incrementVideoViewCount(input.id);
        }
        return video;
      }),

    byCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        const { getVideosByCategory } = await import("./db");
        return await getVideosByCategory(input.category, true);
      }),

    trackView: publicProcedure
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

      create: adminProcedure
        .input(
          z.object({
            title: z.string(),
            description: z.string().optional(),
            url: z.string(),
            thumbnail: z.string().optional(),
            category: z.enum(["training", "highlights"]),
            platform: z.enum(["tiktok", "instagram"]),
          })
        )
        .mutation(async ({ input }) => {
          const { createVideo } = await import("./db");
          await createVideo(input);
          return { success: true };
        }),

      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            title: z.string().optional(),
            description: z.string().optional(),
            url: z.string().optional(),
            thumbnail: z.string().optional(),
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

      delete: adminProcedure
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

    createGuestCheckout: publicProcedure
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

    myPayments: protectedProcedure.query(async ({ ctx }) => {
      const { getUserPayments } = await import("./db");
      return await getUserPayments(ctx.user.id);
    }),

    mySubscriptions: protectedProcedure.query(async ({ ctx }) => {
      const { getUserSubscriptions } = await import("./db");
      return await getUserSubscriptions(ctx.user.id);
    }),

    getCheckoutSessionDetails: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const { ENV } = await import("./_core/env");
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(ENV.stripeSecretKey);
        const { getProduct } = await import("./products");

        try {
          const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
            expand: ["line_items", "payment_intent"],
          });

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

    updateBookingStatus: protectedProcedure
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

    submitPrivateSessionBooking: publicProcedure
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
          console.error("Booking submission error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to submit booking request",
          });
        }
      }),
  }),

  attendance: router({
    markAttendance: adminProcedure
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

    getMyAttendance: protectedProcedure.query(async ({ ctx }) => {
      const { getAttendanceByUser } = await import("./db");
      return await getAttendanceByUser(ctx.user.id);
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

    updateAttendance: adminProcedure
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
    list: publicProcedure.query(async () => {
      const { getAllLocations } = await import("./db");
      return await getAllLocations();
    }),
    admin: router({
      list: adminProcedure.query(async () => {
        const { getAllLocationsAdmin } = await import("./db");
        return await getAllLocationsAdmin();
      }),
      create: adminProcedure
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
      update: adminProcedure
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
      delete: adminProcedure
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
    list: publicProcedure.query(async () => {
      const { getAllCoaches } = await import("./db");
      return await getAllCoaches();
    }),
    admin: router({
      list: adminProcedure.query(async () => {
        const { getAllCoachesAdmin } = await import("./db");
        return await getAllCoachesAdmin();
      }),
      create: adminProcedure
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
      update: adminProcedure
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
      delete: adminProcedure
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
        create: adminProcedure
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
        delete: adminProcedure
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
      const { getUserConversations } = await import("./db");
      return await getUserConversations(ctx.user.id);
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
        const { getConversationMessages, getUserConversations } = await import("./db");
        // Verify user is participant
        const conversations = await getUserConversations(ctx.user.id);
        const isParticipant = conversations.some(
          (c: any) => c.id === input.conversationId
        );
        if (!isParticipant) {
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
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { sendDmMessage, getUserConversations } = await import("./db");
        
        // Verify user is participant
        const conversations = await getUserConversations(ctx.user.id);
        const isParticipant = conversations.some(
          (c: any) => c.id === input.conversationId
        );
        if (!isParticipant) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
        }

        const message = await sendDmMessage(
          input.conversationId,
          ctx.user.id,
          ctx.user.name || "Unknown",
          input.content
        );
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
      const { getAvailableDmUsers } = await import("./db");
      return await getAvailableDmUsers(ctx.user.id);
    }),

    // Search messages
    searchMessages: protectedProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        const { searchDmMessages } = await import("./db");
        return await searchDmMessages(ctx.user.id, input.query);
      }),

    // Block a user
    blockUser: protectedProcedure
      .input(z.object({ userId: z.number(), reason: z.string().optional() }))
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
    setUserRole: adminProcedure
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

    // Get all users with their messaging roles
    getUsersWithRoles: adminProcedure.query(async () => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return [];
      
      const { users, userMessagingRoles } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const allUsers = await db.select().from(users);
      const result = [];
      
      for (const user of allUsers) {
        const role = await db
          .select()
          .from(userMessagingRoles)
          .where(eq(userMessagingRoles.userId, user.id))
          .limit(1);
        
        result.push({
          ...user,
          messagingRole: role[0] || null,
        });
      }
      
      return result;
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
    getVapidPublicKey: publicProcedure.query(async () => {
      // Return the VAPID public key from environment
      return { publicKey: ENV.vapidPublicKey || null };
    }),
  }),

  // Blog routes (public)
  blog: router({
    list: publicProcedure
      .input(
        z
          .object({
            category: z.string().optional(),
            limit: z.number().optional(),
            offset: z.number().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const { getAllPublishedBlogPosts } = await import("./db");
        return await getAllPublishedBlogPosts();
      }),
    getBySlug: publicProcedure
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
    create: adminProcedure
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
    update: adminProcedure
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
    publish: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { publishBlogPost } = await import("./db");
        await publishBlogPost(input.id);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteBlogPost } = await import("./db");
        await deleteBlogPost(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
