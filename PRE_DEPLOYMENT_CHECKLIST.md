# Pre-Deployment Checklist
## The Academy Platform

## ✅ Completed Items

### 1. Color Contrast Testing
- **Status**: ✅ **FIXED**
- **Changes Made**:
  - Improved gradient text contrast by using lighter amber/yellow shades (amber-300, yellow-200 instead of amber-400, yellow-300)
  - Added text drop shadows to gradient text for better readability on dark backgrounds
  - Updated accent text colors from amber-400 to amber-300 for better contrast
- **Verification Needed**: 
  - Test with browser DevTools contrast checker
  - Use online tool: https://webaim.org/resources/contrastchecker/
  - Target: 4.5:1 contrast ratio for normal text, 3:1 for large text

### 2. Logo File Verification
- **Status**: ✅ **VERIFIED**
- **Location**: `client/public/academy-logo.jpeg` exists
- **Action**: No action needed - logo file is present

### 3. Console Statements
- **Status**: ✅ **FIXED**
- **Changes Made**:
  - All console.log statements wrapped in `if (process.env.NODE_ENV === "development")` checks
  - console.error in ErrorBoundary kept (errors should always be logged)
  - All other console statements now only log in development mode
- **Files Updated**:
  - `client/src/pages/Chat.tsx`
  - `client/src/main.tsx`
  - `client/src/components/ErrorBoundary.tsx` (kept error logging)
  - `client/src/const.ts`
  - `client/src/pages/ComponentShowcase.tsx`
  - `client/src/components/Map.tsx`

## 📋 Testing Requirements

### 4. Playwright Gatekeeper Crawl (Automated)

**Goal:** Verify critical public routes, nav/footer links, deep-link anchors, and route protections with a browser runner.

**How to Run:**
1. Install Playwright browsers (first time only):
   ```bash
   pnpm exec playwright install --with-deps
   ```
2. Run against a local dev server or a deployed URL:
   ```bash
   E2E_BASE_URL="https://your-preview-url.vercel.app" pnpm test:e2e
   ```

**What It Covers:**
- Public routes render main content
- Header + footer links resolve
- /signup remains public
- /member redirects or shows auth configuration messaging
- Deep-link anchor validation for programs/shop/gallery/videos
- 404 handling

### 5. Lighthouse Performance Audit

**How to Run:**
1. Build the production version:
   ```bash
   pnpm build
   ```

2. Start the production server:
   ```bash
   pnpm start
   ```

3. Open Chrome DevTools (F12)
4. Go to "Lighthouse" tab
5. Select:
   - Performance
   - Accessibility
   - Best Practices
   - SEO
6. Click "Generate report"

**Target Scores:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 95

**Common Issues to Check:**
- First Contentful Paint < 1.8s
- Largest Contentful Paint < 2.5s
- Time to Interactive < 3.8s
- Total Blocking Time < 200ms
- Cumulative Layout Shift < 0.1

**If Performance Score is Low:**
1. Check image sizes - ensure images are optimized
2. Verify code splitting is working (check Network tab)
3. Check for render-blocking resources
4. Verify service worker is caching properly

### 6. Cross-Browser Testing

**Required Browsers:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest - macOS/iOS)
- [ ] Edge (latest)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

**Testing Checklist:**

#### Desktop Browsers
- [ ] **Navigation**
  - [ ] All links work correctly
  - [ ] Mobile menu opens/closes properly
  - [ ] Search bar functions correctly
  - [ ] Active route indication (if implemented)

- [ ] **Forms**
  - [ ] Contact form validation works
  - [ ] Form submission succeeds
  - [ ] Error messages display correctly
  - [ ] Required field indicators visible

- [ ] **Authentication**
  - [ ] Login works
  - [ ] Logout works
  - [ ] Protected routes redirect correctly
  - [ ] User session persists

- [ ] **E-commerce**
  - [ ] Add to cart works
  - [ ] Cart persists on page refresh
  - [ ] Checkout flow completes
  - [ ] Payment success page displays

- [ ] **Interactive Features**
  - [ ] Chat loads and sends messages
  - [ ] Online status updates
  - [ ] Gallery images load with lazy loading
  - [ ] Videos play correctly
  - [ ] Search returns results

- [ ] **Visual**
  - [ ] All images load
  - [ ] Animations work smoothly
  - [ ] Colors display correctly
  - [ ] Layout doesn't break at different screen sizes

#### Mobile Browsers
- [ ] **Touch Interactions**
  - [ ] All buttons are tappable (minimum 44x44px)
  - [ ] Forms are easy to fill on mobile
  - [ ] Mobile menu works with touch
  - [ ] Swipe gestures work (if applicable)

- [ ] **Performance**
  - [ ] Pages load quickly on 3G/4G
  - [ ] Images load progressively
  - [ ] No horizontal scrolling
  - [ ] Text is readable without zooming

- [ ] **Mobile-Specific**
  - [ ] Input types trigger correct keyboards (tel, email)
  - [ ] Viewport meta tag works correctly
  - [ ] PWA install prompt appears (if applicable)
  - [ ] Service worker works offline

**Browser-Specific Issues to Watch For:**
- **Safari**: 
  - Service worker support
  - CSS backdrop-filter support
  - Date input formatting
- **Firefox**: 
  - CSS Grid support
  - Flexbox behavior
- **Edge**: 
  - Generally good compatibility (Chromium-based)
- **Mobile Safari**: 
  - Viewport height issues (100vh)
  - Touch event handling
  - Safe area insets

### 7. Additional Verification

#### Accessibility Testing
- [ ] **Screen Reader Testing**
  - [ ] Test with NVDA (Windows) or VoiceOver (Mac)
  - [ ] All interactive elements are announced
  - [ ] Form errors are announced
  - [ ] Navigation is logical

- [ ] **Keyboard Navigation**
  - [ ] Tab through entire site
  - [ ] All interactive elements are reachable
  - [ ] Focus indicators are visible
  - [ ] Skip-to-content link works
  - [ ] Modals trap focus

- [ ] **Color Contrast**
  - [ ] Use browser DevTools contrast checker
  - [ ] Test gradient text on homepage
  - [ ] Verify all text meets WCAG AA (4.5:1 for normal, 3:1 for large)

#### Performance Testing
- [ ] **Network Conditions**
  - [ ] Test on 3G throttling
  - [ ] Test on 4G
  - [ ] Test offline (service worker)

- [ ] **Device Testing**
  - [ ] Test on actual mobile devices (not just browser dev tools)
  - [ ] Test on tablets
  - [ ] Test on different screen sizes

#### Functional Testing
- [ ] **Payment Flow**
  - [ ] Complete end-to-end payment test
  - [ ] Verify Stripe webhook receives events
  - [ ] Check payment records in database
  - [ ] Verify confirmation emails sent

- [ ] **Admin Features**
  - [ ] Create/edit programs
  - [ ] Create/edit schedules
  - [ ] Create/edit announcements
  - [ ] View contact submissions

- [ ] **Member Features**
  - [ ] View dashboard
  - [ ] Register for sessions
  - [ ] View announcements
  - [ ] Use chat

## 🚀 Deployment Steps

1. **Pre-Deployment**
   - [ ] All checklist items completed
   - [ ] Environment variables configured
   - [ ] Database migrations run
   - [ ] SSL certificate configured
   - [ ] Domain DNS configured

2. **Build**
   - [ ] Run `pnpm build`
   - [ ] Verify build succeeds without errors
   - [ ] Check dist folder contains all assets

3. **Deploy**
   - [ ] Deploy to production server
   - [ ] Verify server starts correctly
   - [ ] Check logs for errors

4. **Post-Deployment**
   - [ ] Run Lighthouse audit on production
   - [ ] Test all critical user flows
   - [ ] Monitor error logs
   - [ ] Verify analytics tracking
   - [ ] Test payment flow with test cards

## 📝 Notes

- **Color Contrast**: Gradient text now uses lighter shades and drop shadows. Visual testing recommended.
- **Console Logs**: All non-error console statements now only log in development mode.
- **Performance**: Code splitting and lazy loading implemented. Lighthouse audit will verify effectiveness.
- **Browser Testing**: Manual testing required as automated cross-browser testing tools have limitations.

## ✅ Sign-Off

Once all items are checked and verified, the site is ready for production deployment.
