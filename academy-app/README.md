# The Academy - Mobile App

Expo React Native app for The Academy youth sports training platform.

## Quick Start

```bash
cd academy-app
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) to preview the app.

## Environment Setup

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (same as web `VITE_CLERK_PUBLISHABLE_KEY`) |
| `EXPO_PUBLIC_API_URL` | Backend API URL (e.g. `https://app.academytn.com`) |

## Architecture

- **Expo Router** for file-based navigation
- **Clerk** for authentication (shared instance with web)
- **tRPC** client calling the existing Express backend
- **React Query** for data fetching and caching

## Project Structure

```
academy-app/
├── app/
│   ├── _layout.tsx          # Root: ClerkProvider + tRPC + auth guard
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   └── (tabs)/
│       ├── _layout.tsx      # Tab bar
│       ├── index.tsx        # Dashboard
│       ├── chat.tsx         # Placeholder
│       ├── messages.tsx     # Placeholder
│       ├── schedule.tsx     # Schedule list
│       └── profile.tsx      # User info + sign out
├── lib/
│   ├── clerk.ts             # SecureStore token cache
│   └── trpc.tsx             # tRPC client with auth headers
├── components/
│   ├── Screen.tsx           # SafeArea wrapper
│   └── Loading.tsx          # Activity indicator
├── app.json
├── eas.json
└── package.json
```
