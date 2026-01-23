# OAuth Quick Start Guide

## What You Need

This app uses a **custom OAuth system**. You need 5 values:

1. **VITE_APP_ID** - Your app's ID from OAuth provider
2. **VITE_OAUTH_PORTAL_URL** - Where users log in (e.g., `https://oauth.example.com`)
3. **OAUTH_SERVER_URL** - OAuth API endpoint (e.g., `https://api.oauth.example.com`)
4. **JWT_SECRET** - A secure random string (I'll generate one for you)
5. **OWNER_OPEN_ID** - Your user's OpenID for admin access

## Quick Setup

### Step 1: Generate JWT Secret

I've generated one for you:
```
gbI1K8l6t4MFjxI7GKM5t3xHm1Wn/sLlG41wPFG2RJk=
```

Or generate a new one:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 2: Get OAuth Credentials

**If you have access to the OAuth provider dashboard:**
1. Log in to your OAuth provider
2. Find "Application Settings" or "OAuth Apps"
3. Copy:
   - Application ID → `VITE_APP_ID`
   - Portal URL → `VITE_OAUTH_PORTAL_URL`
   - API Server URL → `OAUTH_SERVER_URL`

**If you DON'T have OAuth credentials yet:**
- Contact whoever set up the OAuth system
- Or check if there's documentation for your OAuth provider
- Or consider using an alternative OAuth provider (see below)

### Step 3: Get Your OpenID

**Option A: From OAuth Provider**
- Log in to OAuth portal
- Check your profile/settings
- Look for "OpenID", "User ID", or "Subject ID"

**Option B: After First Login**
1. Set up OAuth (steps 1-2)
2. Log in as a regular user
3. Check database: `SELECT openId FROM users WHERE email = 'your@email.com'`
4. Copy that `openId` → `OWNER_OPEN_ID`
5. Update your role: `UPDATE users SET role = 'admin' WHERE openId = 'your_openid'`

### Step 4: Update .env File

Add these to your `.env`:

```env
# OAuth Configuration
VITE_APP_ID=your_app_id_from_provider
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
OAUTH_SERVER_URL=https://your-oauth-api-server.com
JWT_SECRET=gbI1K8l6t4MFjxI7GKM5t3xHm1Wn/sLlG41wPFG2RJk=
OWNER_OPEN_ID=your_openid_here
```

### Step 5: Configure Redirect URI

In your OAuth provider's dashboard, add this redirect URI:
```
http://localhost:3000/api/oauth/callback
```

For production, also add:
```
https://your-domain.com/api/oauth/callback
```

### Step 6: Test

1. Restart dev server: `pnpm dev`
2. Click "Login" button
3. Should redirect to OAuth portal (not show error)

## Don't Have OAuth Credentials?

### Option 1: Contact Your Team
- Ask whoever set up the project
- Check internal documentation
- Look for OAuth provider credentials in password manager

### Option 2: Use Alternative OAuth Provider

You can integrate a different provider, but it requires code changes:

**Popular Options:**
- **Auth0** - Easy setup, free tier
- **Clerk** - Modern, developer-friendly
- **Supabase Auth** - Open source, free tier
- **Google OAuth** - Free, widely used
- **GitHub OAuth** - Free for public repos

**To integrate:**
1. Sign up for chosen provider
2. Create OAuth app
3. Modify `server/_core/oauth.ts` and `server/_core/sdk.ts`
4. Update environment variables

### Option 3: Skip Authentication (Development Only)

For development/testing without OAuth:
- The app will work for public pages
- Login/authentication features won't work
- Admin features won't be accessible

## Current Status

✅ **App works without OAuth** - Public pages load fine
⚠️ **Authentication disabled** - Login button shows warning
⚠️ **Admin features unavailable** - Need OAuth + admin user

## Need More Help?

See `OAUTH_SETUP.md` for detailed documentation.
