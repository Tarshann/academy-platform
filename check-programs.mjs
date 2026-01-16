import { drizzle } from "drizzle-orm/mysql2";
import { programs } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

try {
  const allPrograms = await db.select().from(programs);
  console.log(`Found ${allPrograms.length} programs in database`);
  if (allPrograms.length === 0) {
    console.log("Database is empty, seeding now...");
    
    const programData = [
      {
        name: "Group Workout",
        slug: "group-workout",
        description: "Group workouts designed to bring together a collective of players, fostering friendly competition and skill development. Limited to 8 players for maximum attention.",
        price: "25.00",
        category: "group",
        ageMin: 8,
        ageMax: 18,
        maxParticipants: 8,
        isActive: 1
      },
      {
        name: "Individual Training",
        slug: "individual-training",
        description: "Personalized basketball drills focused on each player's unique strengths, ensuring maximum improvement through one-on-one coaching.",
        price: "60.00",
        category: "individual",
        ageMin: 8,
        ageMax: 18,
        maxParticipants: 1,
        isActive: 1
      },
      {
        name: "Skills Class",
        slug: "skills-class",
        description: "Focused skill development sessions covering ball handling, shooting form, footwork, and defensive fundamentals.",
        price: "15.00",
        category: "group",
        ageMin: 8,
        ageMax: 18,
        maxParticipants: null,
        isActive: 1
      }
    ];
    
    for (const program of programData) {
      await db.insert(programs).values(program);
      console.log(`✓ Added: ${program.name}`);
    }
    console.log("✓ Seeding complete!");
  }
  process.exit(0);
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
