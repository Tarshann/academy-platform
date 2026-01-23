import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { products } from "./drizzle/schema.js";
import { eq, sql } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set in environment variables");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

const imageUpdates = {
  "Academy Wristbands Pair": "https://source.unsplash.com/800x800/?wristband,fitness",
  "Academy Headband": "https://source.unsplash.com/800x800/?headband,fitness",
  "Academy Compression Sleeve": "https://source.unsplash.com/800x800/?compression-sleeve,athlete",
  "Academy Jump Rope": "https://source.unsplash.com/800x800/?jump-rope,fitness",
  "Academy Resistance Bands Set": "https://source.unsplash.com/800x800/?resistance-bands,fitness",
};

try {
  console.log("Updating product images...");
  
  const allProducts = await db.select().from(products);
  let updated = 0;
  
  for (const product of allProducts) {
    if (imageUpdates[product.name]) {
      await db.execute(sql`
        UPDATE products 
        SET "imageUrl" = ${imageUpdates[product.name]}
        WHERE id = ${product.id}
      `);
      console.log(`✓ Updated: ${product.name}`);
      updated++;
    }
  }
  
  console.log(`\n✅ Update complete!`);
  console.log(`   - Updated: ${updated} products`);
  
  process.exit(0);
} catch (error) {
  console.error("Error updating products:", error);
  process.exit(1);
}
