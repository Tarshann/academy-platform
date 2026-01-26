# Clerk Authentication Setup Guide

## Why Clerk?

Clerk is a modern authentication service that provides:
- ✅ Easy setup (5 minutes)
- ✅ Free tier (10,000 MAU)
- ✅ Multiple sign-in methods (Email, Google, GitHub, etc.)
- ✅ Built-in user management
- ✅ Session management
- ✅ Great documentation

## Step 1: Create Clerk Account

1. Go to https://clerk.com
2. Sign up for a free account
3. Create a new application
4. Choose your application name (e.g., "Academy Platform")

## Step 2: Get Your Clerk Keys

After creating your application:

1. Go to **API Keys** in the Clerk dashboard
2. Copy these values:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

## Step 3: Configure Environment Variables

Add these to your `.env` file:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_ADMIN_EMAIL=your-email@example.com
```

**Note**: `CLERK_ADMIN_EMAIL` is the email of the user who should have admin access. After first login, we'll set their role to admin.

## Step 4: Install Dependencies

```bash
pnpm install
```

## Step 5: Configure Redirect URLs

In Clerk Dashboard:
1. Go to **Paths** settings
2. Set **Sign-in redirect URL**: `http://localhost:3000/`
3. Set **Sign-up redirect URL**: `http://localhost:3000/`
4. Set **After sign-out URL**: `http://localhost:3000/`

For production, also add:
- `https://your-domain.com/`

## Step 6: Test the Setup

1. Restart your dev server: `pnpm dev`
2. Click "Login" button
3. Should see Clerk's sign-in interface
4. Sign up with your email
5. After first login, you'll be redirected back

## Step 7: Set Admin User

After your first login:

1. Check your database:
   ```sql
   SELECT id, email, "openId", role FROM users WHERE email = 'your-email@example.com';
   ```

2. Update your role to admin:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

Or use the admin email environment variable - the code will automatically set the first user with that email as admin.

## What Changed?

The implementation now uses Clerk instead of the custom OAuth system:
- ✅ Frontend uses Clerk React components
- ✅ Backend verifies Clerk sessions
- ✅ Automatic user sync to database
- ✅ Same role-based access (user/admin)

## Troubleshooting

### "Clerk not configured"
- Check that `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set in `.env`
- Restart dev server after adding env vars

### "Invalid session"
- Make sure redirect URLs match in Clerk dashboard
- Check that you're using the correct keys (test vs live)

### User not created in database
- Check server logs for errors
- Verify database connection
- Check that Clerk webhook is configured (if using webhooks)

## Next Steps

- Configure additional sign-in methods (Google, GitHub) in Clerk dashboard
- Customize Clerk's UI theme to match your brand
- Set up email templates in Clerk
- Configure user metadata and custom fields
