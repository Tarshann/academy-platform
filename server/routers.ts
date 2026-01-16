import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getAllPrograms, 
  getProgramBySlug,
  getPublishedAnnouncements,
  createContactSubmission,
  getContactSubmissions,
  getUpcomingSchedules
} from "./db";
import { notifyOwner } from "./_core/notification";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
        const { createSessionRegistration } = await import('./db');
        
        await createSessionRegistration(ctx.user.id, input.scheduleId);
        
        return { success: true };
      }),
  }),

  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        subject: z.string().min(1),
        message: z.string().min(10),
        type: z.enum(['general', 'volunteer']).default('general'),
      }))
      .mutation(async ({ input }) => {
        await createContactSubmission({
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          subject: input.subject,
          message: input.message,
          type: input.type,
          status: 'new',
        });

        // Notify owner
        await notifyOwner({
          title: `New ${input.type === 'volunteer' ? 'Volunteer' : 'Contact'} Inquiry`,
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
        const { getAllProgramsAdmin } = await import('./db');
        return await getAllProgramsAdmin();
      }),
      create: adminProcedure
        .input(z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string(),
          price: z.string(),
          category: z.enum(['group', 'individual', 'shooting', 'league', 'camp', 'membership']),
          ageMin: z.number().default(8),
          ageMax: z.number().default(18),
          maxParticipants: z.number().nullable(),
        }))
        .mutation(async ({ input }) => {
          const { createProgram } = await import('./db');
          await createProgram({ ...input, isActive: 1 });
          return { success: true };
        }),
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          pricePerSession: z.number().nullable().optional(),
          pricePerMonth: z.number().nullable().optional(),
          isActive: z.number().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          const { updateProgram } = await import('./db');
          await updateProgram(id, updates);
          return { success: true };
        }),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteProgram } = await import('./db');
          await deleteProgram(input.id);
          return { success: true };
        }),
    }),

    // Announcement management
    announcements: router({
      list: adminProcedure.query(async () => {
        const { getAllAnnouncementsAdmin } = await import('./db');
        return await getAllAnnouncementsAdmin();
      }),
      create: adminProcedure
        .input(z.object({
          title: z.string().min(1),
          content: z.string().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
          const { createAnnouncement } = await import('./db');
          await createAnnouncement({ ...input, authorId: ctx.user.id, isPublished: 0, publishedAt: null });
          return { success: true };
        }),
      publish: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { publishAnnouncement } = await import('./db');
          await publishAnnouncement(input.id);
          return { success: true };
        }),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteAnnouncement } = await import('./db');
          await deleteAnnouncement(input.id);
          return { success: true };
        }),
    }),

    // Schedule management
    schedules: router({
      list: adminProcedure.query(async () => {
        const { getAllSchedulesAdmin } = await import('./db');
        return await getAllSchedulesAdmin();
      }),
      create: adminProcedure
        .input(z.object({
          programId: z.number(),
          title: z.string().min(1),
          description: z.string().optional(),
          startTime: z.date(),
          endTime: z.date(),
          location: z.string(),
          maxParticipants: z.number().nullable(),
        }))
        .mutation(async ({ input }) => {
          const { createSchedule } = await import('./db');
          await createSchedule(input);
          return { success: true };
        }),
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          title: z.string().optional(),
          startTime: z.date().optional(),
          endTime: z.date().optional(),
          location: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          const { updateSchedule } = await import('./db');
          await updateSchedule(id, updates);
          return { success: true };
        }),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteSchedule } = await import('./db');
          await deleteSchedule(input.id);
          return { success: true };
        }),
    }),

    // Contact submissions
    contacts: router({
      markRead: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { markContactAsRead } = await import('./db');
          await markContactAsRead(input.id);
          return { success: true };
        }),
      markResponded: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { markContactAsResponded } = await import('./db');
          await markContactAsResponded(input.id);
          return { success: true };
        }),
    }),
  }),

  payment: router({
    createCheckout: protectedProcedure
      .input(z.object({
        productId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { ENV } = await import('./_core/env');
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(ENV.stripeSecretKey);
        const { getProduct } = await import('./products');

        const product = getProduct(input.productId);
        if (!product) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
        }

        const origin = ctx.req.headers.origin || 'http://localhost:3000';

        const sessionParams: any = {
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: product.name,
                  description: product.description,
                },
                unit_amount: product.priceInCents,
                ...(product.type === 'recurring' && {
                  recurring: {
                    interval: product.interval,
                  },
                }),
              },
              quantity: 1,
            },
          ],
          mode: product.type === 'recurring' ? 'subscription' : 'payment',
          success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/signup`,
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || '',
            customer_name: ctx.user.name || '',
          },
          allow_promotion_codes: true,
        };

        const session = await stripe.checkout.sessions.create(sessionParams);

        return { url: session.url };
      }),
    
    myPayments: protectedProcedure.query(async ({ ctx }) => {
      const { getUserPayments } = await import('./db');
      return await getUserPayments(ctx.user.id);
    }),

    mySubscriptions: protectedProcedure.query(async ({ ctx }) => {
      const { getUserSubscriptions } = await import('./db');
      return await getUserSubscriptions(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
