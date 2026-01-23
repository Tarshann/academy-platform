import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set in environment variables");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

try {
  console.log("Removing test gallery photos...");

  const testPhotos = await db.execute(sql`
    SELECT id, title, imagekey, imageurl
    FROM "galleryPhotos"
    WHERE
      title ILIKE '%test%' OR
      description ILIKE '%test%' OR
      imagekey ILIKE '%test%' OR
      imageurl ILIKE '%test%'
  `);

  if (testPhotos.length === 0) {
    console.log("No test gallery photos found");
    process.exit(0);
  }

  for (const photo of testPhotos) {
    await db.execute(sql`DELETE FROM "galleryPhotos" WHERE id = ${photo.id}`);
    console.log(`✓ Removed: ${photo.title ?? "Untitled"} (id: ${photo.id})`);
  }

  console.log(`\n✅ Cleanup complete! Removed ${testPhotos.length} photo(s).`);
  process.exit(0);
} catch (error) {
  console.error("Error removing test gallery photos:", error);
  process.exit(1);
}
