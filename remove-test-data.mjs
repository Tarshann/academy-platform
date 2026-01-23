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

try {
  console.log("Removing test data...");
  
  // Remove test products (using raw SQL)
  const testProductsResult = await db.execute(sql`
    SELECT id, name FROM products 
    WHERE name ILIKE '%Test%' OR description ILIKE '%Test%'
  `);
  
  if (testProductsResult.length > 0) {
    for (const product of testProductsResult) {
      await db.execute(sql`DELETE FROM products WHERE id = ${product.id}`);
      console.log(`✓ Removed test product: ${product.name}`);
    }
  } else {
    console.log("No test products found");
  }
  
  // Remove test campaigns (using raw SQL to avoid schema mismatch)
  const testCampaignsResult = await db.execute(sql`
    SELECT id, name FROM campaigns 
    WHERE name ILIKE '%Test%' OR description ILIKE '%Test%'
  `);
  
  if (testCampaignsResult.length > 0) {
    for (const campaign of testCampaignsResult) {
      await db.execute(sql`DELETE FROM campaigns WHERE id = ${campaign.id}`);
      console.log(`✓ Removed test campaign: ${campaign.name}`);
    }
  } else {
    console.log("No test campaigns found");
  }
  
  console.log(`\n✅ Cleanup complete!`);
  
  process.exit(0);
} catch (error) {
  console.error("Error removing test data:", error);
  process.exit(1);
}
