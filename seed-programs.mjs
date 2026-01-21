import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { programs } from "./drizzle/schema.ts";

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

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
    isActive: true
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
    isActive: true
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
    isActive: true
  },
  {
    name: "Academy Group Membership",
    slug: "academy-group-membership",
    description: "Unlimited access to group sessions throughout the month. Perfect for dedicated players who want consistent training.",
    price: "150.00",
    category: "membership",
    ageMin: 8,
    ageMax: 18,
    maxParticipants: null,
    isActive: true
  },
  {
    name: "Complete Player Membership",
    slug: "complete-player-membership",
    description: "Unlimited access to skills classes and open gyms. The most comprehensive option for serious players.",
    price: "100.00",
    category: "membership",
    ageMin: 8,
    ageMax: 18,
    maxParticipants: null,
    isActive: true
  },
  {
    name: "Academy Summer Camp",
    slug: "summer-camp",
    description: "Intensive summer training camps with full-day sessions, skill work, games, and competition.",
    price: "20.00",
    category: "camp",
    ageMin: 8,
    ageMax: 18,
    maxParticipants: null,
    isActive: true
  },
  {
    name: "Team Academy Registration",
    slug: "team-academy",
    description: "Join our competitive travel teams. Includes uniforms, coaching, and tournament fees.",
    price: "300.00",
    category: "league",
    ageMin: 8,
    ageMax: 18,
    maxParticipants: null,
    isActive: true
  },
  {
    name: "On Field Workouts",
    slug: "on-field-workouts",
    description: "Outdoor conditioning and agility training to complement basketball skills.",
    price: "30.00",
    category: "group",
    ageMin: 8,
    ageMax: 18,
    maxParticipants: null,
    isActive: true
  }
];

try {
  console.log("Seeding programs...");
  for (const program of programData) {
    await db.insert(programs).values(program);
    console.log(`✓ Added: ${program.name}`);
  }
  console.log("✓ Seeding complete!");
  process.exit(0);
} catch (error) {
  console.error("Error seeding programs:", error);
  process.exit(1);
}
