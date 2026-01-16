import type { Request, Response } from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { payments, subscriptions, users } from "../drizzle/schema";
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
    console.error("[Webhook] No signature provided");
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
    console.error("[Webhook] Signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ 
      verified: true,
    });
  }

  console.log(`[Webhook] Processing event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Webhook] Checkout session completed: ${session.id}`);
  
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  const userId = session.client_reference_id ? parseInt(session.client_reference_id) : null;
  if (!userId) {
    console.error("[Webhook] No user ID in session metadata");
    return;
  }

  // Update user's Stripe customer ID if not already set
  if (session.customer && typeof session.customer === 'string') {
    await db.update(users)
      .set({ stripeCustomerId: session.customer })
      .where(eq(users.id, userId));
  }

  // Payment will be recorded via payment_intent.succeeded event
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] Payment intent succeeded: ${paymentIntent.id}`);
  
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  const metadata = paymentIntent.metadata;
  const userId = metadata.user_id ? parseInt(metadata.user_id) : null;
  
  if (!userId) {
    console.error("[Webhook] No user ID in payment intent metadata");
    return;
  }

  // Check if payment already recorded
  const existing = await db.select()
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, paymentIntent.id))
    .limit(1);

  if (existing.length > 0) {
    // Update existing payment
    await db.update(payments)
      .set({ 
        status: "succeeded",
        updatedAt: new Date(),
      })
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id));
  } else {
    // Create new payment record
    await db.insert(payments).values({
      userId,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: typeof paymentIntent.customer === 'string' ? paymentIntent.customer : null,
      productId: metadata.product_id || 'unknown',
      productName: metadata.product_name || 'Unknown Product',
      amountInCents: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: "succeeded",
      paymentType: metadata.payment_type === 'recurring' ? 'recurring' : 'one_time',
      metadata: JSON.stringify(metadata),
    });
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] Payment intent failed: ${paymentIntent.id}`);
  
  const db = await getDb();
  if (!db) return;

  await db.update(payments)
    .set({ 
      status: "failed",
      updatedAt: new Date(),
    })
    .where(eq(payments.stripePaymentIntentId, paymentIntent.id));
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log(`[Webhook] Subscription updated: ${subscription.id}`);
  
  const db = await getDb();
  if (!db) return;

  const metadata = subscription.metadata;
  const userId = metadata.user_id ? parseInt(metadata.user_id) : null;
  
  if (!userId) {
    console.error("[Webhook] No user ID in subscription metadata");
    return;
  }

  const existing = await db.select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);

  const subscriptionData = {
    userId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : '',
    productId: metadata.product_id || 'unknown',
    productName: metadata.product_name || 'Unknown Subscription',
    status: subscription.status as "active" | "canceled" | "past_due" | "incomplete",
    currentPeriodStart: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000) : null,
    currentPeriodEnd: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null,
    cancelAtPeriodEnd: (subscription as any).cancel_at_period_end ? 1 : 0,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db.update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  } else {
    await db.insert(subscriptions).values(subscriptionData);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`[Webhook] Subscription deleted: ${subscription.id}`);
  
  const db = await getDb();
  if (!db) return;

  await db.update(subscriptions)
    .set({ 
      status: "canceled",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`[Webhook] Invoice paid: ${invoice.id}`);
  // Invoice payments are already tracked via payment_intent.succeeded
  // This is here for logging and potential future use
}
