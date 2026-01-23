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
  const photos = await db.execute(sql`
    SELECT id, title, description, "imageUrl", "imageKey", category, "createdAt"
    FROM "galleryPhotos"
    ORDER BY "createdAt" DESC
  `);

  console.log(`Gallery photos: ${photos.length}`);
  for (const photo of photos) {
    console.log(
      `- #${photo.id} | ${photo.title ?? "Untitled"} | ${photo.category} | ${photo.imageUrl ?? "no image"}`
    );
  }
  process.exit(0);
} catch (error) {
  console.error("Error listing gallery photos:", error);
  process.exit(1);
}
