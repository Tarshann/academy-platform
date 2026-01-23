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

const productData = [
  // Apparel (5 items)
  {
    name: "Academy Performance T-Shirt",
    description: "Premium performance t-shirt made with moisture-wicking fabric. Perfect for training sessions and everyday wear. Features The Academy logo and comfortable fit.",
    price: "25.00",
    category: "apparel",
    stock: 50,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
  },
  {
    name: "Academy Hoodie",
    description: "Warm and comfortable hoodie for cool weather training. Features a front pocket, adjustable hood, and The Academy branding. Made with premium cotton blend.",
    price: "45.00",
    category: "apparel",
    stock: 30,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a4?w=800&h=800&fit=crop",
  },
  {
    name: "Academy Training Shorts",
    description: "Lightweight and breathable training shorts designed for maximum mobility. Perfect for basketball, football, and soccer training. Features moisture-wicking technology.",
    price: "30.00",
    category: "apparel",
    stock: 40,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1591047134859-26740c81b586?w=800&h=800&fit=crop",
  },
  {
    name: "Academy Long Sleeve Shirt",
    description: "Versatile long sleeve shirt for training in any weather. Features stretch fabric for unrestricted movement and The Academy logo. Great for layering.",
    price: "35.00",
    category: "apparel",
    stock: 35,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=800&fit=crop",
  },
  {
    name: "Academy Tank Top",
    description: "Cool and comfortable tank top for intense training sessions. Made with breathable fabric and designed for maximum airflow. Features The Academy logo.",
    price: "22.00",
    category: "apparel",
    stock: 45,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop",
  },
  // Equipment (4 items)
  {
    name: "Official Academy Basketball",
    description: "Professional-grade basketball with official Academy branding. Perfect for training and games. Made with premium composite leather for superior grip and durability.",
    price: "35.00",
    category: "equipment",
    stock: 25,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=800&fit=crop",
  },
  {
    name: "Academy Training Bag",
    description: "Spacious training bag with multiple compartments for gear, water bottles, and personal items. Features durable construction and The Academy logo. Perfect for athletes on the go.",
    price: "55.00",
    category: "equipment",
    stock: 20,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
  },
  {
    name: "Academy Jump Rope",
    description: "Professional speed jump rope for agility and conditioning training. Adjustable length, ball-bearing handles, and durable cable. Essential for SAQ training programs.",
    price: "15.00",
    category: "equipment",
    stock: 60,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-7QYd1VxLRbM?w=800&h=800&fit=crop&auto=format",
  },
  {
    name: "Academy Resistance Bands Set",
    description: "Complete resistance band set with multiple resistance levels. Perfect for strength training, warm-ups, and rehabilitation. Includes carrying case and exercise guide.",
    price: "28.00",
    category: "equipment",
    stock: 30,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1UwtOlER8Fo?w=800&h=800&fit=crop&auto=format",
  },
  // Accessories (6 items)
  {
    name: "Academy Water Bottle",
    description: "Durable stainless steel water bottle with The Academy logo. Keeps drinks cold for hours. BPA-free, leak-proof design. Perfect for training sessions and games.",
    price: "18.00",
    category: "accessories",
    stock: 75,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop",
  },
  {
    name: "Academy Wristbands Pair",
    description: "Moisture-wicking wristbands to keep you dry during intense training. Made with premium terry cloth. Features The Academy logo. Sold as a pair.",
    price: "12.00",
    category: "accessories",
    stock: 80,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-YIviYiVIINc?w=800&h=800&fit=crop&auto=format",
  },
  {
    name: "Academy Headband",
    description: "Comfortable and stylish headband to keep sweat out of your eyes. Made with moisture-wicking fabric. Features The Academy logo. One size fits all.",
    price: "15.00",
    category: "accessories",
    stock: 70,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-vMsEBCvxHU0?w=800&h=800&fit=crop&auto=format",
  },
  {
    name: "Academy Backpack",
    description: "Versatile backpack for school, training, and travel. Multiple compartments, padded straps, and The Academy branding. Perfect for student-athletes.",
    price: "48.00",
    category: "accessories",
    stock: 25,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
  },
  {
    name: "Academy Compression Sleeve",
    description: "Supportive compression sleeve for arm or leg. Helps improve circulation and reduce muscle fatigue. Made with breathable, moisture-wicking fabric.",
    price: "20.00",
    category: "accessories",
    stock: 50,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-Clv9DfJLwac?w=800&h=800&fit=crop&auto=format",
  },
  {
    name: "Academy Sweat Towel",
    description: "Premium microfiber sweat towel for training sessions. Ultra-absorbent and quick-drying. Features The Academy logo. Compact and easy to carry.",
    price: "15.00",
    category: "accessories",
    stock: 90,
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-IrJVpN-hme4?w=800&h=800&fit=crop&auto=format",
  },
];

try {
  console.log("Starting product seeding...");
  
  // Check if products already exist
  const existingProducts = await db.select().from(products);
  console.log(`Found ${existingProducts.length} existing products`);
  
  // Insert products (skip if they already exist by name)
  let inserted = 0;
  let skipped = 0;
  
  for (const product of productData) {
    const existing = existingProducts.find(p => p.name === product.name);
    if (existing) {
      console.log(`⏭️  Skipped: ${product.name} (already exists)`);
      skipped++;
    } else {
      // Use raw SQL to insert with proper numeric type handling
      await db.execute(sql`
        INSERT INTO products (name, description, price, "imageUrl", category, stock, "isActive")
        VALUES (${product.name}, ${product.description}, ${product.price}::numeric, ${product.imageUrl}, ${product.category}, ${product.stock}, ${product.isActive})
      `);
      console.log(`✓ Added: ${product.name} - $${product.price}`);
      inserted++;
    }
  }
  
  console.log(`\n✅ Seeding complete!`);
  console.log(`   - Inserted: ${inserted} products`);
  console.log(`   - Skipped: ${skipped} products`);
  console.log(`   - Total: ${existingProducts.length + inserted} products in database`);
  
  process.exit(0);
} catch (error) {
  console.error("Error seeding products:", error);
  process.exit(1);
}
