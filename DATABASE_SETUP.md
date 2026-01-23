# Database Setup Guide

## Current Situation

The project is configured for **PostgreSQL** with Drizzle ORM. Use a Postgres provider (recommended) or run Postgres locally.

## Option 1: Managed Postgres (Recommended)

### Recommended Providers

1. **Neon** (Serverless Postgres)
   - Free tier available
   - Scales automatically
   - Easy branching for previews
   - Sign up: https://neon.tech

2. **Railway** (Postgres)
   - Simple setup
   - Free tier available
   - Sign up: https://railway.app

3. **AWS RDS Postgres** (Production-ready)
   - More complex setup
   - Pay-as-you-go
   - Sign up: https://aws.amazon.com/rds

### Quick Setup with Neon (Recommended)

1. **Create a Neon project**
2. **Copy the connection string**
3. **Add to `.env`**:
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
   ```
4. **Run migrations**:
   ```bash
   pnpm db:push
   ```

## Option 2: Local Postgres (Development)

1. Install Postgres: https://www.postgresql.org/download/
2. Create a database:
   ```sql
   CREATE DATABASE academy_platform;
   ```
3. Add to `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/academy_platform
   ```
4. Run migrations:
   ```bash
   pnpm db:push
   ```

## Next Steps

1. Set your `DATABASE_URL`
2. Run migrations with `pnpm db:push`
3. Start the app with `pnpm dev`
