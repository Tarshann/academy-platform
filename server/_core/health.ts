import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { logger } from "./logger";

export type HealthStatus = {
  ok: boolean;
  timestamp: string;
  uptime: number;
  checks: {
    database: "ok" | "unavailable" | "error";
  };
};

export async function getHealthStatus(): Promise<HealthStatus> {
  const status: HealthStatus = {
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: "unavailable",
    },
  };

  const db = await getDb();
  if (!db) {
    status.ok = false;
    return status;
  }

  try {
    await db.execute(sql`select 1`);
    status.checks.database = "ok";
  } catch (error) {
    status.ok = false;
    status.checks.database = "error";
    logger.error("[Health] Database check failed:", error);
  }

  return status;
}
