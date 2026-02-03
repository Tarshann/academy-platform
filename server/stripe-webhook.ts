import type { Request, Response } from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { logger } from "./_core/logger";
import { getDb } from "./db";
import {
  payments,
  stripeWebhookEvents,
  subscriptions,
  users,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2025-12-15.clover",
});

/**
 * Stripe webhook handler
 * Processes payment events and updates database accordingly
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    logger.error("[Webhook] No signature provided");
    return res.status(400).send("No signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      ENV.stripeWebhookSecret
    );
  } catch (err) {
    logger.error("[Webhook] Signature verification failed:", err);
    return res
      .status(400)
      .send(
        `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    logger.info(
      "[Webhook] Test event detected, returning verification response"
    );
    return res.json({
      verified: true,
    });
  }

  logger.info(`[Webhook] Processing event: ${event.type} (${event.id})`);

  const db = await getDb();
  if (!db) {
    logger.error("[Webhook] Database not available");
    return res.status(500).json({ error: "Database not available" });
  }

  const existingEvent = await db
    .select()
    .from(stripeWebhookEvents)
    .where(eq(stripeWebhookEvents.eventId, event.id))
    .limit(1);

  if (existingEvent[0]?.status === "processed") {
    logger.info(`[Webhook] Duplicate event ignored: ${event.id}`);
    return res.json({ received: true, duplicate: true });
  }

  if (existingEvent[0]?.status === "processing") {
    logger.warn(`[Webhook] Event already processing: ${event.id}`);
    return res.json({ received: true, processing: true });
  }

  if (existingEvent.length === 0) {
    await db.insert(stripeWebhookEvents).values({
      eventId: event.id,
      eventType: event.type,
      status: "processing",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else if (existingEvent[0]?.status === "failed") {
    await db
      .update(stripeWebhookEvents)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(stripeWebhookEvents.eventId, event.id));
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.info(`[Webhook] Unhandled event type: ${event.type}`);
    }

    await db
      .update(stripeWebhookEvents)
      .set({ status: "processed", updatedAt: new Date() })
      .where(eq(stripeWebhookEvents.eventId, event.id));

    res.json({ received: true });
  } catch (error) {
    logger.error("[Webhook] Error processing event:", error);
    await db
      .update(stripeWebhookEvents)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(stripeWebhookEvents.eventId, event.id));
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  logger.info(`[Webhook] Checkout session completed: ${session.id}`);

  const db = await getDb();
  if (!db) {
    logger.error("[Webhook] Database not available");
    return;
  }

  // Import email functions
  const { sendPaymentConfirmationEmail, sendGuestPaymentConfirmationEmail } = await import("./email");
  
  // Get product name from line items or metadata
  const productName = session.metadata?.product_name || 
    session.line_items?.data[0]?.description || 
    "Academy Program";

  // Check if this is a guest checkout
  const isGuestCheckout = session.metadata?.guest_checkout === "true";
  const guestEmail = session.metadata?.guest_email || session.customer_email;
  
  const userId = session.client_reference_id
    ? parseInt(session.client_reference_id)
    : null;

  if (isGuestCheckout || !userId) {
    // Handle guest checkout - send email to guest
    if (guestEmail && session.amount_total) {
      logger.info(`[Webhook] Sending guest confirmation email to: ${guestEmail}`);
      await sendGuestPaymentConfirmationEmail({
        to: guestEmail,
        productName,
        amount: session.amount_total,
        currency: session.currency || "usd",
      });
    } else {
      logger.warn("[Webhook] Guest checkout but no email available");
    }
    return;
  }

  // Handle logged-in user checkout
  const { getUserById } = await import("./db");
  const user = await getUserById(userId);
  
  if (user && user.email && session.amount_total) {
    await sendPaymentConfirmationEmail({
      to: user.email,
      userName: user.name || "Member",
      productName,
      amount: session.amount_total,
      currency: session.currency || "usd",
    });
  }

  // Update user's Stripe customer ID if not already set
  if (session.customer && typeof session.customer === "string") {
    await db
      .update(users)
      .set({ stripeCustomerId: session.customer })
      .where(eq(users.id, userId));
  }

  // Payment will be recorded via payment_intent.succeeded event
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  logger.info(`[Webhook] Payment intent succeeded: ${paymentIntent.id}`);

  const db = await getDb();
  if (!db) {
    logger.error("[Webhook] Database not available");
    return;
  }

  const metadata = paymentIntent.metadata;
  const userId = metadata.user_id ? parseInt(metadata.user_id) : null;

  if (!userId) {
    logger.error("[Webhook] No user ID in payment intent metadata");
    return;
  }

  // Check if payment already recorded
  const existing = await db
    .select()
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, paymentIntent.id))
    .limit(1);

  if (existing.length > 0) {
    // Update existing payment
    await db
      .update(payments)
      .set({
        status: "succeeded",
      })
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id));
  } else {
    // Create new payment record
    await db.insert(payments).values({
      userId,
      stripePaymentIntentId: paymentIntent.id,
      amount: (paymentIntent.amount / 100).toFixed(2),
      currency: paymentIntent.currency,
      status: "succeeded",
      type: metadata.payment_type === "recurring" ? "recurring" : "one_time",
      description:
        metadata.product_name || metadata.product_id || "Stripe Payment",
      createdAt: new Date(),
    });
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.info(`[Webhook] Payment intent failed: ${paymentIntent.id}`);

  const db = await getDb();
  if (!db) return;

  await db
    .update(payments)
    .set({
      status: "failed",
    })
    .where(eq(payments.stripePaymentIntentId, paymentIntent.id));
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  logger.info(`[Webhook] Subscription updated: ${subscription.id}`);

  const db = await getDb();
  if (!db) return;

  const metadata = subscription.metadata;
  const userId = metadata.user_id ? parseInt(metadata.user_id) : null;

  if (!userId) {
    logger.error("[Webhook] No user ID in subscription metadata");
    return;
  }

  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);

  const subscriptionData = {
    userId,
    stripeSubscriptionId: subscription.id,
    status: subscription.status as
      | "active"
      | "canceled"
      | "past_due"
      | "incomplete",
    currentPeriodStart: (subscription as any).current_period_start
      ? new Date((subscription as any).current_period_start * 1000)
      : null,
    currentPeriodEnd: (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000)
      : null,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  } else {
    await db.insert(subscriptions).values(subscriptionData);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info(`[Webhook] Subscription deleted: ${subscription.id}`);

  const db = await getDb();
  if (!db) return;

  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  logger.info(`[Webhook] Invoice paid: ${invoice.id}`);
  // Invoice payments are already tracked via payment_intent.succeeded
  // This is here for logging and potential future use
}
