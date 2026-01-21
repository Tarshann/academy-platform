import type { Express, Request, Response } from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { ENV } from "./env";
import * as db from "../db";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { createSessionToken, syncClerkUserToDatabase } from "./clerk";

/**
 * Clerk OAuth callback handler
 * Handles the redirect from Clerk after authentication
 */
export async function handleClerkCallback(req: Request, res: Response) {
  const { code, state } = req.query;

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Authorization code is required" });
    return;
  }

  try {
    // Exchange code for session token using Clerk
    // Note: Clerk handles this differently - we need to verify the session
    // For now, we'll use Clerk's built-in session handling
    
    // Get the Clerk user from the session
    // Clerk sets a session token in a cookie automatically
    // We need to extract it and verify it
    
    res.redirect(302, "/");
  } catch (error) {
    console.error("[Clerk] Callback failed:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Register Clerk OAuth routes
 * Note: Clerk typically handles OAuth through their own endpoints
 * This is a simplified integration
 */
export function registerClerkRoutes(app: Express) {
  // Clerk handles OAuth through their own system
  // We mainly need to handle webhooks and session verification
  app.get("/api/auth/callback", handleClerkCallback);
}
