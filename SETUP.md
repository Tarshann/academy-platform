# Setup & Configuration Summary

## ✅ Configuration Checklist

Configure the following environment variables in your `.env` file (values shown here are placeholders):

### Stripe Payment Integration
- **STRIPE_SECRET_KEY** - Stripe secret key (test or live)
- **STRIPE_PUBLISHABLE_KEY** - Stripe publishable key (reserved for future frontend use)
- **STRIPE_WEBHOOK_SECRET** - Stripe webhook signing secret

### Email Service
- **RESEND_API_KEY** - Resend API key

### Forge API
- **VITE_FRONTEND_FORGE_API_URL** - Forge API URL for frontend
- **BUILT_IN_FORGE_API_URL** - Forge API URL for backend
- **VITE_FRONTEND_FORGE_API_KEY** - Forge API key for frontend
- **BUILT_IN_FORGE_API_KEY** - Forge API key for backend

## ⚠️ Required Configuration (Still Needed)

You need to fill in the following environment variables in your `.env` file:

### 1. Database Configuration
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```
**Action Required**: Set up your PostgreSQL database and provide the connection string.

### 2. Authentication & OAuth
```env
VITE_APP_ID=your_app_id
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
OAUTH_SERVER_URL=https://your-oauth-api.com
JWT_SECRET=your_secure_random_string
OWNER_OPEN_ID=your_admin_user_openid
```
**Action Required**: 
- Get these values from your OAuth provider
- Generate a secure random string for `JWT_SECRET` (e.g., using `openssl rand -base64 32`)
- Set `OWNER_OPEN_ID` to the OpenID of the user who should have admin access

### 3. Forge API Keys
```env
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
BUILT_IN_FORGE_API_KEY=your_backend_key
```
**Action Required**: Get these API keys from your Forge service provider.

## 🔧 Next Steps

1. **Fill in missing environment variables** in `.env`
2. **Set up your database**:
   ```bash
   # After DATABASE_URL is set
   pnpm db:push
   ```
3. **Configure Stripe Webhook**:
   - Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Copy the webhook signing secret (already in `.env` for test mode)
4. **Test the setup**:
   ```bash
   pnpm dev
   ```

## 📝 Notes

- **Stripe Keys**: Use test keys for development. For production, replace with live keys from Stripe Dashboard.
- **Stripe Publishable Key**: Not currently used in the frontend. Payments use Stripe Checkout (hosted by Stripe), so the publishable key is reserved for future use if you want to implement embedded payment forms.
- **Environment Files**: 
  - `.env` - Your actual configuration (DO NOT COMMIT)
  - `.env.example` - Template for other developers (safe to commit)

## 🔐 Security Reminders

- ✅ `.env` is already in `.gitignore` - your secrets are safe
- ⚠️ Never commit `.env` to version control
- ⚠️ Use different keys for development and production
- ⚠️ Rotate keys if they're ever exposed

## 🚀 Quick Verification

After filling in all required variables, verify your setup:

```bash
# Check TypeScript compilation
pnpm check

# Start development server
pnpm dev

# If database is configured, test migrations
pnpm db:push
```

## 📞 Support

If you encounter issues:
1. Check that all required environment variables are set
2. Verify database connection string format
3. Ensure OAuth provider is accessible
4. Check server logs for specific error messages
