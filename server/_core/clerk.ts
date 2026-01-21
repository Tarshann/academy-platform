import { clerkClient } from "@clerk/clerk-sdk-node";
import { getAuth } from "@clerk/express";
import { ENV } from "./env";
import * as db from "../db";
import { ONE_YEAR_MS } from "@shared/const";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";

/**
 * Clerk-based authentication implementation
 * Replaces the custom OAuth system with Clerk
 */

// Initialize Clerk client
if (!ENV.clerkSecretKey) {
  console.warn("[Clerk] CLERK_SECRET_KEY not configured. Authentication will not work.");
}

/**
 * Create a session token for a Clerk user
 * Uses the same JWT format as before for compatibility
 */
export async function createSessionToken(
  clerkUserId: string,
  options: { expiresInMs?: number; name?: string } = {}
): Promise<string> {
  const issuedAt = Date.now();
  const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
  const secretKey = new TextEncoder().encode(ENV.cookieSecret);

  return new SignJWT({
    openId: clerkUserId, // Use Clerk user ID as openId for compatibility
    appId: "clerk", // Identifier that we're using Clerk
    name: options.name || "",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

/**
 * Verify a session token and return the user ID
 */
export async function verifySessionToken(
  token: string
): Promise<{ openId: string; appId: string; name: string } | null> {
  try {
    const { jwtVerify } = await import("jose");
    const secretKey = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    const { openId, appId, name } = payload as Record<string, unknown>;

    if (
      typeof openId !== "string" ||
      typeof appId !== "string" ||
      typeof name !== "string"
    ) {
      return null;
    }

    return { openId, appId, name };
  } catch (error) {
    console.warn("[Clerk] Session verification failed:", error);
    return null;
  }
}

/**
 * Get user info from Clerk and sync to database
 */
export async function syncClerkUserToDatabase(clerkUserId: string) {
  try {
    const user = await clerkClient.users.getUser(clerkUserId);
    
    // Use Clerk user ID as openId for compatibility with existing schema
    const openId = user.id;
    const email = user.emailAddresses[0]?.emailAddress || null;
    const name = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || email?.split("@")[0] || null;

    // Check if this user should be admin
    let role: "user" | "admin" = "user";
    if (ENV.clerkAdminEmail && email === ENV.clerkAdminEmail) {
      role = "admin";
    } else if (ENV.ownerOpenId && openId === ENV.ownerOpenId) {
      role = "admin";
    }

    await db.upsertUser({
      openId,
      name,
      email,
      loginMethod: "clerk",
      lastSignedIn: new Date(),
      role,
    });

    return await db.getUserByOpenId(openId);
  } catch (error) {
    console.error("[Clerk] Failed to sync user:", error);
    throw error;
  }
}

/**
 * Authenticate a request using Clerk
 * Clerk middleware adds auth info to req.auth
 */
export async function authenticateClerkRequest(req: Request & { auth?: any }) {
  if (!ENV.clerkSecretKey) {
    return null;
  }

  try {
    // Get Clerk auth from request (set by Clerk middleware)
    const auth = getAuth(req);
    
    if (!auth?.userId) {
      return null;
    }

    const clerkUserId = auth.userId;
    const signedInAt = new Date();

    // Get or create user in database
    let user = await db.getUserByOpenId(clerkUserId);

    // If user doesn't exist, sync from Clerk
    if (!user) {
      try {
        user = await syncClerkUserToDatabase(clerkUserId);
      } catch (error) {
        console.error("[Clerk] Failed to sync user:", error);
        return null;
      }
    }

    // Update last signed in
    if (user) {
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: signedInAt,
      });
    }

    return user;
  } catch (error) {
    // Authentication is optional for public routes
    console.warn("[Clerk] Authentication failed:", error);
    return null;
  }
}

/**
 * Parse cookies from cookie header
 */
function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  const { parse } = require("cookie");
  const parsed = parse(cookieHeader);
  return new Map(Object.entries(parsed));
}
