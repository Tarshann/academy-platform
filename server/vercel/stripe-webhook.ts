import "dotenv/config";
import express from "express";
import { handleStripeWebhook } from "../stripe-webhook";

const app = express();

// Stripe webhook needs raw body for signature verification
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    return handleStripeWebhook(req, res);
  }
);

export default app;
