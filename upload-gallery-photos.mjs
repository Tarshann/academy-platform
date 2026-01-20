import { storagePut } from './server/storage.js';
import { db } from './server/db.js';
import { gallery } from './drizzle/schema.js';
import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';

const photos = [
  {
    path: '/home/ubuntu/upload/AcademyBasketball6-11-202497.jpeg',
    caption: 'Player working on ball handling fundamentals',
    category: 'training'
  },
  {
    path: '/home/ubuntu/upload/AcademyBasketball6-11-202489.jpeg',
    caption: 'Youth athletes practicing defensive positioning',
    category: 'training'
  },
  {
    path: '/home/ubuntu/upload/AcademyBasketball6-11-2024161(2).jpeg',
    caption: 'Coach providing one-on-one technique instruction',
    category: 'training'
  }
];

async function uploadPhotos() {
  console.log('Starting photo upload to S3 and database...\n');
  
  for (const photo of photos) {
    try {
      // Read the file
      const fileBuffer = readFileSync(photo.path);
      
      // Generate unique filename
      const randomSuffix = randomBytes(8).toString('hex');
      const filename = `gallery/training-${randomSuffix}.jpeg`;
      
      // Upload to S3
      console.log(`Uploading ${photo.path}...`);
      const { url } = await storagePut(filename, fileBuffer, 'image/jpeg');
      console.log(`✓ Uploaded to S3: ${url}`);
      
      // Add to database
      await db.insert(gallery).values({
        url: url,
        caption: photo.caption,
        category: photo.category,
        uploadedAt: Date.now()
      });
      console.log(`✓ Added to database: ${photo.caption}\n`);
      
    } catch (error) {
      console.error(`✗ Error uploading ${photo.path}:`, error.message);
    }
  }
  
  console.log('All photos uploaded successfully!');
  process.exit(0);
}

uploadPhotos();
