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
});

export type AppRouter = typeof appRouter;
