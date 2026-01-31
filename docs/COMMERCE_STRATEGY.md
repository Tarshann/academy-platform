# Commerce Strategy

## Overview

The Academy Platform uses a hybrid commerce model designed for simplicity, reliability, and future scalability.

## Current Model (Phase 5)

### Native Checkout (Stripe)
Programs and training sessions are handled through the platform's native checkout system:

- **Group Training Sessions** - $25/session
- **Private Training Sessions** - $75/session (1-on-1), $100/session (small group)
- **Skills Classes** - $15/class
- **Special Programs** - Summer Camp, Team Academy, On Field Workouts

Benefits:
- Direct integration with existing user accounts
- Seamless booking and scheduling
- Full control over the checkout experience
- Lower transaction fees than third-party platforms

### Shopify (Merch Only - Phase 5+)
Merchandise sales will be handled through Shopify integration in a future phase:

- Academy apparel (shirts, hoodies, shorts)
- Training gear
- Branded accessories

Integration options (to be decided):
1. **Shopify Buy Button** - Embed product widgets directly on the Shop page
2. **Storefront API** - Headless integration maintaining current UI
3. **External redirect** - Link to standalone Shopify store

## Why Hybrid?

This approach provides:

1. **Simplicity** - Parents see one checkout flow for training, another for merch
2. **Reliability** - Core revenue (training) stays on proven infrastructure
3. **Flexibility** - Merch can scale independently without affecting bookings
4. **Cost efficiency** - No Shopify fees on high-volume training transactions

## Page Responsibilities

| Page | Purpose | Commerce Type |
|------|---------|---------------|
| Programs | Discovery & exploration | None (informational) |
| Register | Booking & payment | Native (Stripe) |
| Shop | Merchandise | Shopify (future) |
| Private Sessions | Premium booking | Native (Stripe) |

## Deferred Items

The following are explicitly deferred to post-launch:

- Shopify integration implementation
- Inventory management system
- Subscription/membership billing
- Gift cards or promo codes
- Multi-currency support

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-31 | Hybrid model adopted | Separates training revenue from merch complexity |
| 2026-01-31 | Shopify deferred to Phase 5+ | Focus on core training business first |
