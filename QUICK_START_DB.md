# Quick Database Setup

## Choose Your Path:

### 🚀 Path A: Neon Postgres (Recommended)
**Best for**: Fast setup with managed Postgres

1. Go to https://neon.tech and sign up (free)
2. Create a new project (name it `academy-platform`)
3. Copy the connection string
4. Add to `.env`:
   ```env
   DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
5. Run migrations: `pnpm db:push`

### 🏠 Path B: Local Postgres (Development)
**Best for**: Offline development

1. Install Postgres: https://www.postgresql.org/download/
2. Create database:
   ```sql
   CREATE DATABASE academy_platform;
   ```
3. Add to `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/academy_platform
   ```
4. Run migrations: `pnpm db:push`

### ☁️ Path C: Managed Postgres (Production)
**Best for**: Production deployments

- AWS RDS Postgres: https://aws.amazon.com/rds
- Railway Postgres: https://railway.app
- Supabase Postgres: https://supabase.com

**Add your connection string** to `.env` and run `pnpm db:push`.
