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
  "Academy Wristbands Pair": "https://images.unsplash.com/photo-YIviYiVIINc?w=800&h=800&fit=crop&auto=format",
  "Academy Headband": "https://images.unsplash.com/photo-vMsEBCvxHU0?w=800&h=800&fit=crop&auto=format",
  "Academy Compression Sleeve": "https://images.unsplash.com/photo-Clv9DfJLwac?w=800&h=800&fit=crop&auto=format",
  "Academy Jump Rope": "https://images.unsplash.com/photo-7QYd1VxLRbM?w=800&h=800&fit=crop&auto=format",
  "Academy Resistance Bands Set": "https://images.unsplash.com/photo-1UwtOlER8Fo?w=800&h=800&fit=crop&auto=format",
  "Academy Sweat Towel": "https://images.unsplash.com/photo-IrJVpN-hme4?w=800&h=800&fit=crop&auto=format",
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
