import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

function getClientIdentifier(req: Request): string {
  // Try to get user ID if authenticated
  const userId = (req as any).user?.id || (req as any).auth?.userId;
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0])
    : req.socket.remoteAddress || "unknown";
  
  return `ip:${ip}`;
}

export function createRateLimiter(options: {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests
  message?: string;
  skipSuccessfulRequests?: boolean;
}) {
  const { windowMs, max, message = "Too many requests, please try again later.", skipSuccessfulRequests = false } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = getClientIdentifier(req);
    const now = Date.now();

    // Get or create entry
    let entry = store[identifier];
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      store[identifier] = entry;
    }

    // Check if limit exceeded
    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.status(429).json({
        error: message,
        retryAfter,
      });
      return;
    }

    // Increment counter
    entry.count++;

    // Track response status if needed
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function (body) {
        if (res.statusCode < 400) {
          entry.count = Math.max(0, entry.count - 1);
        }
        return originalSend.call(this, body);
      };
    }

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - entry.count));
    res.setHeader("X-RateLimit-Reset", new Date(entry.resetTime).toISOString());

    next();
  };
}

// Pre-configured rate limiters
export const contactFormRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: "Too many contact form submissions. Please try again later.",
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: "API rate limit exceeded. Please slow down.",
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: "Too many authentication attempts. Please try again later.",
});

export const chatSendRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: "You are sending messages too fast. Please slow down.",
});
