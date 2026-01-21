# Neon Postgres Setup Guide

## ✅ Migration Complete!

Your codebase has been successfully migrated from MySQL to Postgres (Neon). Here's what was changed:

### Changes Made:
1. ✅ Schema converted from MySQL to Postgres (`drizzle/schema.ts`)
2. ✅ Drizzle config updated to use `postgresql` dialect
3. ✅ Package.json updated: `mysql2` → `postgres`
4. ✅ Database connection updated to use `drizzle-orm/postgres-js`
5. ✅ All MySQL-specific queries converted:
   - `onDuplicateKeyUpdate` → `onConflictDoUpdate`
   - Boolean fields: `int (0/1)` → `boolean (true/false)`
   - Insert IDs: `insertId` → `.returning({ id })`
6. ✅ Seed scripts updated

## 🚀 Next Steps: Set Up Neon Database

### 1. Create Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Sign in to your account
3. Click **"Create Project"**
4. Name it: `academy-platform`
5. Choose a region close to you
6. Click **"Create Project"**

### 2. Get Connection String

1. In your Neon project dashboard, click **"Connection Details"**
2. Copy the **Connection String** (it looks like):
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### 3. Update .env File

Add the connection string to your `.env` file:

```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Important**: Replace the connection string with your actual Neon connection string!

### 4. Install Dependencies

```bash
pnpm install
```

This will install the `postgres` package we added.

### 5. Run Database Migrations

```bash
pnpm db:push
```

This will create all the tables in your Neon database.

### 6. (Optional) Seed Initial Data

```bash
node seed-programs.mjs
```

This will populate your database with initial program data.

### 7. Test the Connection

Start your development server:

```bash
pnpm dev
```

If everything is working, you should see:
```
Server running on http://localhost:3000/
```

## 🔍 Troubleshooting

### Connection Issues

If you get connection errors:
1. **Check your connection string** - Make sure it's the full string from Neon
2. **Check SSL mode** - Neon requires SSL, so make sure `?sslmode=require` is in the URL
3. **Check network** - Make sure you can reach Neon's servers

### Migration Errors

If `pnpm db:push` fails:
1. Check that `DATABASE_URL` is set correctly
2. Make sure you have the latest dependencies: `pnpm install`
3. Check Neon dashboard to see if the database was created

### Type Errors

If you see TypeScript errors:
1. Run `pnpm check` to see all type errors
2. Make sure all imports are updated (no more `mysql2` imports)

## 📝 Notes

- **Boolean Fields**: All boolean fields now use `true`/`false` instead of `1`/`0`
- **Enums**: Postgres uses proper ENUM types (better than MySQL's enum)
- **Timestamps**: Postgres handles timestamps slightly differently, but Drizzle abstracts this
- **Auto-increment**: Postgres uses `SERIAL` instead of `AUTO_INCREMENT`

## 🎉 You're All Set!

Once you've:
1. Created your Neon database
2. Added the connection string to `.env`
3. Run `pnpm install`
4. Run `pnpm db:push`

Your application will be ready to use with Neon Postgres!
