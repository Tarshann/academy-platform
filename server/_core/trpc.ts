import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '../../shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Strip stack traces in production to prevent information leakage
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Rate limiting store for tRPC procedures
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore: Record<string, RateLimitEntry> = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

function getClientIp(ctx: TrpcContext): string {
  // Try to get user ID if authenticated
  if (ctx.user?.id) {
    return `user:${ctx.user.id}`;
  }

  // Fall back to IP address
  const forwarded = ctx.req.headers["x-forwarded-for"];
  const ip = forwarded
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0])
    : ctx.req.socket?.remoteAddress || "unknown";

  return `ip:${ip}`;
}

function createRateLimitMiddleware(windowMs: number, maxRequests: number) {
  return t.middleware(async (opts) => {
    const { ctx } = opts;
    const clientId = getClientIp(ctx);
    const now = Date.now();

    // Get or create entry
    let entry = rateLimitStore[clientId];

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore[clientId] = entry;
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Please try again later.",
      });
    }

    // Increment counter
    entry.count++;

    return opts.next();
  });
}

// Rate limiting middleware instances
const queryRateLimitMiddleware = createRateLimitMiddleware(
  60 * 1000, // 1 minute window
  120 // 120 requests per minute
);

const mutationRateLimitMiddleware = createRateLimitMiddleware(
  15 * 60 * 1000, // 15 minute window
  10 // 10 requests per 15 minutes
);

// Public procedures with rate limiting
export const publicQueryProcedure = t.procedure.use(queryRateLimitMiddleware);
export const publicMutationProcedure = t.procedure.use(mutationRateLimitMiddleware);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
