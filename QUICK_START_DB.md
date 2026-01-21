# Quick Database Setup

## Choose Your Path:

### 🚀 Path A: PlanetScale MySQL (5 minutes - Recommended)
**Best for**: Getting started quickly, no code changes needed

1. Go to https://planetscale.com and sign up (free)
2. Create a new database (name it `academy-platform`)
3. Copy the connection string
4. Add to `.env`:
   ```env
   DATABASE_URL=mysql://your_connection_string_here
   ```
5. Run migrations: `pnpm db:push`

### 🐘 Path B: Neon Postgres (15-30 minutes)
**Best for**: Using your existing Neon account, but requires code migration

I'll help you:
1. Convert MySQL schema to Postgres
2. Update Drizzle config
3. Update database queries
4. Set up connection string

### 🏠 Path C: Local MySQL (10 minutes)
**Best for**: Development, offline work

1. Install MySQL: https://dev.mysql.com/downloads/installer/
2. Create database:
   ```sql
   CREATE DATABASE academy_platform;
   ```
3. Add to `.env`:
   ```env
   DATABASE_URL=mysql://root:your_password@localhost:3306/academy_platform
   ```
4. Run migrations: `pnpm db:push`

---

**Which path do you want to take?** Let me know and I'll guide you through it step-by-step!
