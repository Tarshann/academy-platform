# Clerk Environment Variables Setup

Add these to your `.env` file:

```env
# Clerk Authentication (Alternative to OAuth)
# Get these from https://dashboard.clerk.com
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_ADMIN_EMAIL=your-email@example.com
```

## How to Get Your Clerk Keys

1. Go to https://clerk.com and sign up
2. Create a new application
3. Go to **API Keys** in the dashboard
4. Copy:
   - **Publishable Key** → `VITE_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`
5. Set `CLERK_ADMIN_EMAIL` to the email of the user who should have admin access

## After Setup

1. Restart your dev server: `pnpm dev`
2. Click "Login" - you'll see Clerk's sign-in interface
3. Sign up with your email
4. The first user with `CLERK_ADMIN_EMAIL` will automatically get admin role

## Note

If Clerk is configured, it will be used instead of the legacy OAuth system. The app automatically detects which one to use based on environment variables.
