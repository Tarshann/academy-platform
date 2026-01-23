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
  const campaigns = await db.execute(sql`
    SELECT id, name, description, "startDate", "endDate"
    FROM campaigns
    ORDER BY id DESC
  `);
  console.log(`Campaigns: ${campaigns.length}`);
  campaigns.forEach((c) => {
    console.log(`- #${c.id} ${c.name} | ${c.description ?? "no description"}`);
  });

  const products = await db.execute(sql`
    SELECT id, name, description, price
    FROM products
    ORDER BY id DESC
  `);
  console.log(`\nProducts: ${products.length}`);
  products.forEach((p) => {
    console.log(`- #${p.id} ${p.name} | ${p.description ?? "no description"} | ${p.price}`);
  });

  process.exit(0);
} catch (error) {
  console.error("Error listing shop data:", error);
  process.exit(1);
}
