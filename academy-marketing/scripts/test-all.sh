#!/usr/bin/env bash
set -e

echo "============================================"
echo "  Academy Marketing — Pre-Deploy Test Gate"
echo "============================================"
echo ""

# Stage 1: TypeScript Check
echo "▶ Stage 1/4: TypeScript Check"
echo "  Running tsc --noEmit..."
npx tsc --noEmit
echo "  ✅ TypeScript check passed"
echo ""

# Stage 2: Production Build
echo "▶ Stage 2/4: Production Build"
echo "  Running next build..."
npx next build
echo "  ✅ Production build passed"
echo ""

# Stage 3: Build Validation
echo "▶ Stage 3/4: Build Output Validation"
echo "  Running validate-build.mjs..."
node scripts/validate-build.mjs
echo "  ✅ Build validation passed"
echo ""

# Stage 4: Playwright E2E Tests
echo "▶ Stage 4/4: Playwright E2E Tests"
echo "  Starting server and running tests..."
npx playwright test
echo "  ✅ All E2E tests passed"
echo ""

echo "============================================"
echo "  ✅ ALL STAGES PASSED — Safe to deploy"
echo "============================================"
