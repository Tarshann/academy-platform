/**
 * One-off script to clear all chat messages.
 * Usage: npx tsx scripts/clear-chat.ts
 * Requires DATABASE_URL env var.
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(url);

async function main() {
  const result = await sql`TRUNCATE TABLE "chatMessages" RESTART IDENTITY`;
  console.log("All chat messages cleared.");
  await sql.end();
}

main().catch((err) => {
  console.error("Failed to clear chat messages:", err);
  process.exit(1);
});
