/**
 * One-off script to reset game turns for a specific user.
 * Usage: npx tsx server/reset-game-turns.ts
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import { users, gameEntries, userPoints } from "../drizzle/schema";

const EMAIL = "csisam13@gmail.com";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set. Export it first.");
    process.exit(1);
  }

  const client = postgres(databaseUrl, { ssl: "require" });
  const db = drizzle(client);

  // Find the user
  const [user] = await db.select().from(users).where(eq(users.email, EMAIL)).limit(1);
  if (!user) {
    console.error(`User with email ${EMAIL} not found.`);
    await client.end();
    process.exit(1);
  }

  console.log(`Found user: id=${user.id}, name=${user.name}, email=${user.email}`);

  // Delete all game entries for this user
  const deletedEntries = await db
    .delete(gameEntries)
    .where(eq(gameEntries.userId, user.id))
    .returning();
  console.log(`Deleted ${deletedEntries.length} game entries.`);

  // Points intentionally NOT reset — only game entries (turns) cleared.
  console.log("Done! Game turns reset for", EMAIL, "(points preserved).");
  await client.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
