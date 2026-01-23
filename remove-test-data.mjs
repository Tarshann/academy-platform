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
  
  // Remove test products (direct delete)
  const deletedProducts = await db.execute(sql`
    DELETE FROM products
    WHERE name ILIKE '%test%' OR description ILIKE '%test%'
    RETURNING id, name
  `);

  if (deletedProducts.length > 0) {
    deletedProducts.forEach((product) => {
      console.log(`✓ Removed test product: ${product.name}`);
    });
  } else {
    console.log("No test products found");
  }

  // Remove test campaigns (direct delete)
  const deletedCampaigns = await db.execute(sql`
    DELETE FROM campaigns
    WHERE name ILIKE '%test%' OR description ILIKE '%test%'
    RETURNING id, name
  `);

  if (deletedCampaigns.length > 0) {
    deletedCampaigns.forEach((campaign) => {
      console.log(`✓ Removed test campaign: ${campaign.name}`);
    });
  } else {
    console.log("No test campaigns found");
  }
  
  console.log(`\n✅ Cleanup complete!`);
  
  process.exit(0);
} catch (error) {
  console.error("Error removing test data:", error);
  process.exit(1);
}
