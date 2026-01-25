# Academy Platform

A full-stack platform for The Academy - a youth sports training organization. Built with React, TypeScript, Express, tRPC, and PostgreSQL.

## 🏗️ Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + tRPC + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom OAuth system
- **Payments**: Stripe integration
- **Realtime**: Socket.IO for chat
- **Storage**: AWS S3 via Forge API
- **Email**: Resend for transactional emails

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 10+
- PostgreSQL 12+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tarshann/academy-platform.git
   cd academy-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and fill in all required values (see [Environment Variables](#environment-variables) below).

4. **Set up the database**
   ```bash
   # Make sure PostgreSQL is running and DATABASE_URL is set in .env
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## 📋 Environment Variables

The following environment variables are required. Copy `.env.example` to `.env` and fill in the values:

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Your database provider |
| `JWT_SECRET` | Secret key for JWT tokens | Generate a secure random string |
| `CLERK_SECRET_KEY` | Clerk secret key (if using Clerk) | Clerk dashboard |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (if using Clerk, must be valid `pk_test_` or `pk_live_`) | Clerk dashboard |
| `CLERK_ADMIN_EMAIL` | Admin email for Clerk role assignment | Your admin user |
| `VITE_APP_ID` | OAuth application ID (if using OAuth) | OAuth provider |
| `VITE_OAUTH_PORTAL_URL` | OAuth portal URL (if using OAuth) | OAuth provider |
| `OAUTH_SERVER_URL` | OAuth API server URL (if using OAuth) | OAuth provider |
| `OWNER_OPEN_ID` | OpenID of the admin user (OAuth flow) | OAuth provider |
| `STRIPE_SECRET_KEY` | Stripe secret key | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | [Stripe Dashboard](https://dashboard.stripe.com/webhooks) |
| `RESEND_API_KEY` | Resend API key for emails | [Resend Dashboard](https://resend.com/api-keys) |
| `BUILT_IN_FORGE_API_URL` | Forge API URL for backend | Forge service |
| `BUILT_IN_FORGE_API_KEY` | Forge API key for backend | Forge service |
| `VITE_FRONTEND_FORGE_API_URL` | Forge API URL for frontend | Forge service |
| `VITE_FRONTEND_FORGE_API_KEY` | Forge API key for frontend | Forge service |
| `VITE_SITE_URL` | Public site URL for SEO/canonical tags | Deployment URL |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (for future frontend use) | - |

## 🛠️ Available Scripts

- `pnpm dev` - Start development server (Vite + Express with hot reload)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests with Vitest
- `pnpm check` - Type check with TypeScript
- `pnpm format` - Format code with Prettier
- `pnpm db:push` - Generate and push database migrations

## 📁 Project Structure

```
academy-platform/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
│   └── public/      # Static assets
│
├── server/          # Express backend
│   ├── _core/       # Core infrastructure
│   ├── routers.ts   # tRPC route definitions
│   ├── db.ts        # Database queries
│   └── ...
│
├── shared/          # Shared code
│   ├── const.ts     # Shared constants
│   └── types.ts     # Shared types
│
└── drizzle/         # Database schema & migrations
    ├── schema.ts    # Drizzle schema
    └── migrations/  # SQL migrations
```

## 🔐 Authentication

The platform uses a custom OAuth system. Users authenticate through an external OAuth provider and receive a JWT session token stored in a cookie.

- **Public routes**: Accessible to everyone
- **Member routes**: Require authentication (role: `user` or `admin`)
- **Admin routes**: Require admin role

## 💳 Payment Integration

Stripe is integrated for:
- Program purchases (one-time payments)
- Membership subscriptions (recurring payments)
- Merchandise shop purchases

Webhook endpoint: `/api/stripe/webhook`

## 📧 Email Notifications

Resend is used for transactional emails:
- Session registration confirmations
- Payment confirmations
- Contact form notifications

## 🗄️ Database

The database uses Drizzle ORM with PostgreSQL. Schema is defined in `drizzle/schema.ts`.

To create a new migration:
```bash
pnpm db:push
```

**Note**: For production deployments, use Drizzle Kit migrations instead of `db:push` to track migration history and enable rollbacks.

## 🧪 Testing

## 🚢 Deployment Notes (Vercel)

If the deployed site renders a blank page, ensure the Vercel project is set to **Public** (no password protection or SSO gate). Vercel protections can return a 401 and prevent the SPA from loading. Disable deployment protection for production or add the correct access configuration before launch. Also verify `VITE_CLERK_PUBLISHABLE_KEY` is a valid Clerk publishable key; an invalid key will stop the app from rendering.

Run tests with:
```bash
pnpm test
```

## 🚢 Deployment

1. Build the application:
   ```bash
   pnpm build
   ```

2. Set production environment variables

3. Start the server:
   ```bash
   pnpm start
   ```

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For questions or issues, please contact the development team.

---

**Note**: Make sure to never commit `.env` files to version control. The `.env.example` file serves as a template for required environment variables.
