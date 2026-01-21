# Database Setup Guide

## Current Situation

Your project is configured for **MySQL**, but Neon primarily offers **Postgres**. Here are your options:

## Option 1: Use a MySQL Provider (Recommended - Easiest)

### Recommended MySQL Providers:

1. **PlanetScale** (Serverless MySQL)
   - Free tier available
   - Serverless, scales automatically
   - Great for development
   - Sign up: https://planetscale.com

2. **Railway** (MySQL)
   - Simple setup
   - Free tier available
   - Sign up: https://railway.app

3. **AWS RDS MySQL** (Production-ready)
   - More complex setup
   - Pay-as-you-go
   - Sign up: https://aws.amazon.com/rds

4. **Local MySQL** (Development only)
   - Install MySQL locally
   - Good for offline development

### Quick Setup with PlanetScale (Recommended)

1. **Sign up at PlanetScale**: https://planetscale.com
2. **Create a new database**
3. **Get connection string** from PlanetScale dashboard
4. **Add to `.env`**:
   ```env
   DATABASE_URL=mysql://username:password@host:port/database?sslaccept=strict
   ```

## Option 2: Switch to Postgres (Use Neon)

If you want to use your Neon account, we'll need to:
1. Convert the MySQL schema to Postgres
2. Update Drizzle configuration
3. Update all database queries

**This requires code changes** - let me know if you want to go this route.

## Option 3: Local MySQL (Quick Start for Development)

If you just want to get started quickly for development:

### Windows (using MySQL Installer):
1. Download MySQL Installer: https://dev.mysql.com/downloads/installer/
2. Install MySQL Server
3. Create a database:
   ```sql
   CREATE DATABASE academy_platform;
   ```
4. Add to `.env`:
   ```env
   DATABASE_URL=mysql://root:your_password@localhost:3306/academy_platform
   ```

## Next Steps

**Which option would you like to use?**

1. **PlanetScale** (easiest, serverless MySQL)
2. **Railway** (simple MySQL hosting)
3. **Local MySQL** (for development)
4. **Switch to Neon Postgres** (requires code migration)

Once you choose, I'll help you:
- Set up the database
- Configure the connection string
- Run the migrations
- Verify everything works
