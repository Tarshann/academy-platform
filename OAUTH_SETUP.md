# OAuth Authentication Setup Guide

## Overview

This application uses a **custom OAuth system** for authentication. The OAuth flow works as follows:

1. User clicks "Login" → Redirected to OAuth Portal
2. User authenticates → OAuth Portal redirects back with authorization code
3. Server exchanges code for access token → Gets user info
4. Server creates JWT session token → Sets cookie
5. User is logged in

## Required Environment Variables

You need to configure these 5 environment variables in your `.env` file:

```env
VITE_APP_ID=your_app_id_here
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
OAUTH_SERVER_URL=https://your-oauth-api-server.com
JWT_SECRET=your_secure_random_string_here
OWNER_OPEN_ID=your_admin_user_openid_here
```

## Step-by-Step Configuration

### 1. Get OAuth Credentials from Your Provider

You need to obtain these from your OAuth provider:

- **VITE_APP_ID**: Your application's unique identifier
- **VITE_OAUTH_PORTAL_URL**: The URL where users will be redirected to log in
  - Example: `https://oauth.example.com`
- **OAUTH_SERVER_URL**: The API endpoint for OAuth operations
  - Example: `https://api.oauth.example.com`

**Where to find these:**
- Check your OAuth provider's dashboard/console
- Look for "Application Settings" or "OAuth Configuration"
- Contact your OAuth provider's support if you don't have access

### 2. Generate JWT Secret

The `JWT_SECRET` is used to sign and verify session tokens. Generate a secure random string:

**Option A: Using OpenSSL (Recommended)**
```bash
openssl rand -base64 32
```

**Option B: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C: Using PowerShell (Windows)**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Option D: Online Generator**
- Visit: https://generate-secret.vercel.app/32
- Copy the generated secret

**Important**: Keep this secret secure! Never commit it to version control.

### 3. Get Owner OpenID

The `OWNER_OPEN_ID` is the unique identifier of the user who should have admin access.

**How to get it:**
1. Log in to your OAuth provider
2. Check your user profile/settings
3. Look for "OpenID", "User ID", or "Subject ID"
4. This is typically a long string like: `user_abc123xyz789`

**Alternative**: If you don't have this yet, you can:
1. Set up OAuth first
2. Log in as a regular user
3. Check the database `users` table to see your `openId`
4. Update `.env` with that value
5. Manually set your role to `admin` in the database

### 4. Update Your .env File

Add these values to your `.env` file:

```env
# OAuth Configuration
VITE_APP_ID=your_actual_app_id
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
OAUTH_SERVER_URL=https://your-oauth-api-server.com
JWT_SECRET=your_generated_secret_here
OWNER_OPEN_ID=your_admin_openid_here
```

### 5. Configure OAuth Redirect URI

Make sure your OAuth provider is configured to allow this redirect URI:
```
http://localhost:3000/api/oauth/callback
```

For production, you'll also need:
```
https://your-domain.com/api/oauth/callback
```

## Testing the Configuration

1. **Restart your dev server**:
   ```bash
   pnpm dev
   ```

2. **Check the console** for OAuth initialization messages:
   - Should see: `[OAuth] Initialized with baseURL: https://...`
   - Should NOT see: `[OAuth] ERROR: OAUTH_SERVER_URL is not configured!`

3. **Test the login flow**:
   - Click "Login" button
   - Should redirect to OAuth portal (not show error)
   - After login, should redirect back to your app

## Alternative: Using a Different OAuth Provider

If you want to use a different OAuth provider (Google, GitHub, Auth0, etc.), you'll need to:

1. **Modify the OAuth implementation** in:
   - `server/_core/oauth.ts`
   - `server/_core/sdk.ts`
   - `client/src/const.ts`

2. **Or use a library** like:
   - Passport.js (for Express)
   - NextAuth.js (if migrating to Next.js)
   - Auth0 SDK
   - Clerk

This would require code changes to adapt the authentication flow.

## Troubleshooting

### Error: "Invalid URL"
- **Cause**: `VITE_OAUTH_PORTAL_URL` is empty or invalid
- **Fix**: Check your `.env` file, make sure the URL is correct and doesn't have extra quotes

### Error: "OAuth callback failed"
- **Cause**: OAuth server rejected the request
- **Fix**: 
  - Verify `VITE_APP_ID` is correct
  - Check that redirect URI is registered with OAuth provider
  - Verify `OAUTH_SERVER_URL` is correct

### Error: "openId missing from user info"
- **Cause**: OAuth provider didn't return user's OpenID
- **Fix**: Check OAuth provider configuration, ensure user info endpoint returns `openId` field

### Login button is disabled
- **Cause**: OAuth not configured (returns `#`)
- **Fix**: Fill in `VITE_APP_ID` and `VITE_OAUTH_PORTAL_URL` in `.env`

## Security Best Practices

1. ✅ **Never commit `.env` to version control**
2. ✅ **Use different secrets for development and production**
3. ✅ **Rotate JWT_SECRET periodically**
4. ✅ **Use HTTPS in production**
5. ✅ **Keep OAuth credentials secure**

## Need Help?

If you don't have OAuth credentials yet:
1. Contact your OAuth provider's support
2. Check their documentation
3. Look for "Getting Started" or "API Keys" in their dashboard

If you're building a new OAuth integration:
- Consider using a managed service like Auth0, Clerk, or Supabase Auth
- Or implement OAuth 2.0 flow manually
