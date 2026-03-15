import app from "../../dist/serverless-stripe.js";
export default app;

// Disable Vercel's built-in body parser so the raw body is available
// for Stripe webhook signature verification.
export const config = {
  api: {
    bodyParser: false,
  },
};
