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
        const { createSessionRegistration, getScheduleById } = await import('./db');
        const { sendSessionRegistrationEmail } = await import('./email');
        
        // Get schedule details for email
        const schedule = await getScheduleById(input.scheduleId);
        
        await createSessionRegistration(ctx.user.id, input.scheduleId);
        
        // Send confirmation email
        if (schedule && ctx.user.email) {
          await sendSessionRegistrationEmail({
            to: ctx.user.email,
            userName: ctx.user.name || 'Member',
            sessionTitle: schedule.title,
            sessionDate: schedule.startTime,
            sessionLocation: schedule.location || 'TBA',
          });
        }
        
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
          await createProgram({ ...input, isActive: true });
          return { success: true };
        }),
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          pricePerSession: z.number().nullable().optional(),
          pricePerMonth: z.number().nullable().optional(),
          isActive: z.boolean().optional(),
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
          await createAnnouncement({ ...input, authorId: ctx.user.id, isPublished: false, publishedAt: null });
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

  gallery: router({
    list: publicProcedure.query(async () => {
      const { getAllGalleryPhotos } = await import('./db');
      return await getAllGalleryPhotos();
    }),
    
    byCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        const { getGalleryPhotosByCategory } = await import('./db');
        return await getGalleryPhotosByCategory(input.category);
      }),
    
    admin: router({
      upload: adminProcedure
        .input(z.object({
          title: z.string(),
          description: z.string().optional(),
          imageUrl: z.string(),
          imageKey: z.string(),
          category: z.enum(["training", "teams", "events", "facilities", "other"]),
        }))
        .mutation(async ({ ctx, input }) => {
          const { createGalleryPhoto } = await import('./db');
          await createGalleryPhoto({
            ...input,
            uploadedBy: ctx.user.id,
          });
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteGalleryPhoto } = await import('./db');
          await deleteGalleryPhoto(input.id);
          return { success: true };
        }),
      
      toggleVisibility: adminProcedure
        .input(z.object({ id: z.number(), isVisible: z.boolean() }))
        .mutation(async ({ input }) => {
          const { toggleGalleryPhotoVisibility } = await import('./db');
          await toggleGalleryPhotoVisibility(input.id, input.isVisible);
          return { success: true };
        }),
    }),
  }),
  
  blog: router({
    list: publicProcedure.query(async () => {
      const { getAllPublishedBlogPosts } = await import('./db');
      return await getAllPublishedBlogPosts();
    }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const { getBlogPostBySlug } = await import('./db');
        return await getBlogPostBySlug(input.slug);
      }),
    
    admin: router({
      list: adminProcedure.query(async () => {
        const { getAllBlogPostsAdmin } = await import('./db');
        return await getAllBlogPostsAdmin();
      }),
      
      create: adminProcedure
        .input(z.object({
          title: z.string(),
          slug: z.string(),
          excerpt: z.string().optional(),
          content: z.string(),
          featuredImage: z.string().optional(),
          category: z.enum(["training_tips", "athlete_spotlight", "news", "events", "other"]),
          tags: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const { createBlogPost } = await import('./db');
          await createBlogPost({
            ...input,
            authorId: ctx.user.id,
          });
          return { success: true };
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          title: z.string().optional(),
          excerpt: z.string().optional(),
          content: z.string().optional(),
          featuredImage: z.string().optional(),
          category: z.enum(["training_tips", "athlete_spotlight", "news", "events", "other"]).optional(),
          tags: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const { updateBlogPost } = await import('./db');
          const { id, ...updates } = input;
          await updateBlogPost(id, updates);
          return { success: true };
        }),
      
      publish: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { publishBlogPost } = await import('./db');
          await publishBlogPost(input.id);
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteBlogPost } = await import('./db');
          await deleteBlogPost(input.id);
          return { success: true };
        }),
    }),
  }),

  shop: router({
    // Public shop endpoints
    products: publicProcedure.query(async () => {
      const { getAllProducts } = await import('./db');
      return await getAllProducts();
    }),
    
    productById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getProductById } = await import('./db');
        return await getProductById(input.id);
      }),
    
    campaigns: publicProcedure.query(async () => {
      const { getActiveCampaigns } = await import('./db');
      return await getActiveCampaigns();
    }),
    
    // Protected shop endpoints
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      const { getUserOrders } = await import('./db');
      return await getUserOrders(ctx.user.id);
    }),
    
    createCheckout: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          productId: z.number(),
          variantId: z.number().optional(),
          quantity: z.number().min(1),
        })),
        shippingAddress: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { ENV } = await import('./_core/env');
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(ENV.stripeSecretKey);
        const { getProductById, createOrder, createOrderItem } = await import('./db');
        
        // Calculate total and prepare line items
        const lineItems = [];
        let totalAmount = 0;
        
        for (const item of input.items) {
          const product = await getProductById(item.productId);
          if (!product) {
            throw new TRPCError({ code: 'NOT_FOUND', message: `Product ${item.productId} not found` });
          }
          
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: product.name,
                description: product.description || '',
              },
              unit_amount: product.price,
            },
            quantity: item.quantity,
          });
          
          totalAmount += product.price * item.quantity;
        }
        
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: `${origin}/shop/order-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/shop`,
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || '',
            customer_name: ctx.user.name || '',
            order_items: JSON.stringify(input.items),
            shipping_address: input.shippingAddress,
          },
          allow_promotion_codes: true,
        });
        
        return { url: session.url };
      }),
    
    // Admin shop endpoints
    admin: router({
      products: router({
        list: adminProcedure.query(async () => {
          const { getAllProducts } = await import('./db');
          return await getAllProducts();
        }),
        
        create: adminProcedure
          .input(z.object({
            name: z.string(),
            description: z.string().optional(),
            price: z.number().min(0),
            imageUrl: z.string().optional(),
            imageKey: z.string().optional(),
            category: z.enum(["apparel", "accessories", "equipment"]),
            stock: z.number().min(0),
          }))
          .mutation(async ({ input }) => {
            const { createProduct } = await import('./db');
            await createProduct(input);
            return { success: true };
          }),
        
        update: adminProcedure
          .input(z.object({
            id: z.number(),
            name: z.string().optional(),
            description: z.string().optional(),
            price: z.number().optional(),
            imageUrl: z.string().optional(),
            stock: z.number().optional(),
            isActive: z.boolean().optional(),
          }))
          .mutation(async ({ input }) => {
            const { updateProduct } = await import('./db');
            const { id, ...updates } = input;
            await updateProduct(id, updates);
            return { success: true };
          }),
        
        delete: adminProcedure
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input }) => {
            const { deleteProduct } = await import('./db');
            await deleteProduct(input.id);
            return { success: true };
          }),
      }),
      
      campaigns: router({
        list: adminProcedure.query(async () => {
          const { getAllCampaigns } = await import('./db');
          return await getAllCampaigns();
        }),
        
        create: adminProcedure
          .input(z.object({
            name: z.string(),
            description: z.string().optional(),
            bannerImageUrl: z.string().optional(),
            bannerImageKey: z.string().optional(),
            startDate: z.date(),
            endDate: z.date(),
          }))
          .mutation(async ({ input }) => {
            const { createCampaign } = await import('./db');
            await createCampaign(input);
            return { success: true };
          }),
        
        update: adminProcedure
          .input(z.object({
            id: z.number(),
            name: z.string().optional(),
            description: z.string().optional(),
            startDate: z.date().optional(),
            endDate: z.date().optional(),
            isActive: z.boolean().optional(),
          }))
          .mutation(async ({ input }) => {
            const { updateCampaign } = await import('./db');
            const { id, ...updates } = input;
            await updateCampaign(id, updates);
            return { success: true };
          }),
        
        delete: adminProcedure
          .input(z.object({ id: z.number() }))
          .mutation(async ({ input }) => {
            const { deleteCampaign } = await import('./db');
            await deleteCampaign(input.id);
            return { success: true };
          }),
      }),
    }),
  }),

  videos: router({
    list: publicProcedure.query(async () => {
      const { getAllVideos } = await import('./db');
      return await getAllVideos(true); // Only published videos for public
    }),
    
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getVideoById, incrementVideoViewCount } = await import('./db');
        const video = await getVideoById(input.id);
        if (video && video.isPublished) {
          await incrementVideoViewCount(input.id);
        }
        return video;
      }),
    
    byCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        const { getVideosByCategory } = await import('./db');
        return await getVideosByCategory(input.category, true);
      }),
    
    admin: router({
      list: adminProcedure.query(async () => {
        const { getAllVideos } = await import('./db');
        return await getAllVideos(false); // All videos for admin
      }),
      
      create: adminProcedure
        .input(z.object({
          title: z.string(),
          description: z.string().optional(),
          videoUrl: z.string(),
          thumbnailUrl: z.string().optional(),
          category: z.enum(["drills", "technique", "conditioning", "games", "other"]),
          duration: z.number().optional(),
        }))
        .mutation(async ({ input }) => {
          const { createVideo } = await import('./db');
          await createVideo(input);
          return { success: true };
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          videoUrl: z.string().optional(),
          thumbnailUrl: z.string().optional(),
          category: z.enum(["drills", "technique", "conditioning", "games", "other"]).optional(),
          duration: z.number().optional(),
          isPublished: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { updateVideo } = await import('./db');
          const { id, ...updates } = input;
          const dbUpdates: any = { ...updates };
          if (updates.isPublished !== undefined) {
            dbUpdates.isPublished = updates.isPublished;
          }
          await updateVideo(id, dbUpdates);
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const { deleteVideo } = await import('./db');
          await deleteVideo(input.id);
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

  attendance: router({    
    markAttendance: adminProcedure
      .input(z.object({
        scheduleId: z.number(),
        userId: z.number(),
        status: z.enum(['present', 'absent', 'excused', 'late']),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { markAttendance } = await import('./db');
        const id = await markAttendance({
          ...input,
          markedBy: ctx.user.id,
        });
        return { success: true, id };
      }),
    
    getBySchedule: adminProcedure
      .input(z.object({ scheduleId: z.number() }))
      .query(async ({ input }) => {
        const { getAttendanceBySchedule } = await import('./db');
        return await getAttendanceBySchedule(input.scheduleId);
      }),
    
    getMyAttendance: protectedProcedure
      .query(async ({ ctx }) => {
        const { getAttendanceByUser } = await import('./db');
        return await getAttendanceByUser(ctx.user.id);
      }),
    
    getMyStats: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const { getAttendanceStats } = await import('./db');
        return await getAttendanceStats(
          ctx.user.id,
          input?.startDate,
          input?.endDate
        );
      }),
    
    updateAttendance: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['present', 'absent', 'excused', 'late']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateAttendance } = await import('./db');
        const { id, ...updates } = input;
        await updateAttendance(id, updates);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
