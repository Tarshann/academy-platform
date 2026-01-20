import { db } from './server/db.ts';
import { gallery } from './drizzle/schema.ts';

async function queryGallery() {
  const photos = await db.select().from(gallery);
  console.log(`Gallery photos: ${photos.length}`);
  photos.forEach(p => console.log(`- ${p.caption} (${p.category})`));
  process.exit(0);
}

queryGallery();
