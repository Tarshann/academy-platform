# Rate Limits — Academy Platform

> All public endpoints are rate-limited. Authenticated endpoints use Clerk session validation as implicit throttle.

---

## tRPC Public Procedures (Portal + Mobile)

| Procedure Type | Window | Max Requests | Scope | Error Code |
|---|---|---|---|---|
| **Public Queries** (`publicQueryProcedure`) | 1 minute | 120 | Per IP (or per user if authenticated) | `TOO_MANY_REQUESTS` |
| **Public Mutations** (`publicMutationProcedure`) | 15 minutes | 10 | Per IP (or per user if authenticated) | `TOO_MANY_REQUESTS` |

### Public Query Endpoints (120 req/min)

- `auth.me` — current user session
- `programs.list` — program catalog
- `programs.getBySlug` — program detail
- `announcements.campaigns` — active campaigns
- `merchandise.catalog` — merch catalog
- `shop.products` — shop product list
- `shop.productById` — shop product detail
- `gallery.list` — gallery items
- `gallery.byId` — gallery item detail
- `gallery.byCategory` — gallery by category
- `videos.list` — video catalog
- `videos.byId` — video detail
- `videos.byCategory` — videos by category
- `locations.list` — facility locations
- `coaches.list` — coach directory
- `blog.list` — blog posts
- `blog.getBySlug` — blog post detail
- `feed.list` — social feed
- `referral.validateCode` — referral code check
- `milestones.recent` — recent milestones
- `notifications.getVapidPublicKey` — VAPID key for web push
- `socialPosts.list` — social posts

### Public Mutation Endpoints (10 req/15min)

- `leads.submit` — lead form submission
- `leads.unsubscribe` — email unsubscribe
- `contact.submit` — contact form submission
- `videos.trackView` — video view tracking
- `shop.createGuestCheckout` — guest checkout session
- `booking.submitPrivateSessionBooking` — private session booking

---

## REST Endpoints (Express Middleware)

| Endpoint | Limiter | Window | Max | Notes |
|---|---|---|---|---|
| `POST /api/skills-lab-register` | `contactFormRateLimiter` | 15 min | 5 | Registration form |
| `POST /api/performance-lab-apply` | `contactFormRateLimiter` | 15 min | 5 | Application form |

---

## Pre-configured Limiters (`server/_core/rateLimiter.ts`)

| Limiter | Window | Max | Used By |
|---|---|---|---|
| `contactFormRateLimiter` | 15 min | 5 | REST registration/application endpoints |
| `apiRateLimiter` | 1 min | 60 | Available for general API use |
| `authRateLimiter` | 15 min | 5 | Authentication attempts |
| `chatSendRateLimiter` | 1 min | 20 | Chat message sending |

---

## Implementation Details

- **Store**: In-memory `Record<string, { count, resetTime }>` (per-instance; does not share across Vercel serverless instances)
- **Cleanup**: Expired entries purged every 5 minutes via `setInterval`
- **Client ID**: Authenticated users keyed by `user:{id}`, anonymous by `ip:{address}` (respects `X-Forwarded-For`)
- **Serverless caveat**: Each Vercel function instance has its own store. Under high traffic, effective limits are multiplied by active instance count. For stricter enforcement, consider Vercel KV or Upstash Redis in the future.
