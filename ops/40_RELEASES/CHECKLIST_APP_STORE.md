# App Store Submission Checklist — v1.3.0

> Complete every checkbox before submitting to App Store Connect.
> Version: **1.3.0** | Build Number: **17** | Bundle ID: **com.academytn.app**

---

## 1. Pre-Build Verification

### Version & Config
- [ ] `app.json` → `expo.version` is `1.3.0`
- [ ] `app.json` → `expo.ios.buildNumber` is `17`
- [ ] `app.json` → `expo.ios.bundleIdentifier` is `com.academytn.app`
- [ ] `app.json` → `expo.android.package` is `com.academytn.app`
- [ ] `app.json` → `ITSAppUsesNonExemptEncryption` is `false`
- [ ] `eas.json` → production profile has correct `channel` for EAS Update
- [ ] Profile screen footer shows "v1.3.0" (dynamic from `Constants.expoConfig`)

### Feature Completeness
- [ ] MOB-001: Version bump + foundation dependencies — DONE
- [ ] MOB-002: All 4 chat rooms enabled — DONE
- [ ] MOB-003: Coach contacts from API — DONE
- [ ] MOB-004: In-app Stripe checkout for programs — DONE
- [ ] MOB-005: Payments & subscription screen — DONE
- [ ] MOB-006: Merchandise shop — DONE
- [ ] MOB-007: Enhanced dashboard — DONE
- [ ] MOB-008: Attendance tracking — DONE
- [ ] MOB-009: Notification preferences — DONE
- [ ] MOB-010: Chat image upload — DONE

### Quality Gates
- [ ] `CHECKLIST_QA.md` — all mobile sections (A through M) passed
- [ ] No CRITICAL or HIGH bugs open in `STATUS.md`
- [ ] `npx expo start` runs without errors
- [ ] `npx expo export` succeeds for both iOS and Android bundles
- [ ] All existing v1.2 features still work (auth, dashboard, schedule, chat, DM, programs, profile)

---

## 2. Build

### Commands
```bash
cd academy-app
npm install
eas build --platform ios --profile production
```

### Verification
- [ ] EAS build completes without errors
- [ ] Build artifact available in EAS dashboard
- [ ] Bundle ID in build artifact matches `com.academytn.app`
- [ ] Version in build artifact matches `1.3.0`
- [ ] Build number matches `17`
- [ ] Build size is reasonable (compare to v1.2.0 build size)

---

## 3. App Store Connect — Metadata

### App Information
- [ ] App name: "The Academy"
- [ ] Subtitle: (keep existing or update to reflect new features)
- [ ] Category: Sports (primary), Health & Fitness (secondary)
- [ ] Age rating: 4+ (no objectionable content)
- [ ] Content rating questionnaire re-reviewed (no changes expected)

### Version Information
- [ ] "What's New" text for v1.3.0 (see below)
- [ ] App description updated to reflect new features (see below)
- [ ] Keywords updated if targeting new terms
- [ ] No references to "test", "debug", "beta", or "demo" in any metadata

### What's New Text (v1.3.0)
```
New in v1.3.0:

- Enroll in programs and buy merchandise directly in the app
- View your payment history and manage subscriptions
- Enhanced dashboard with attendance stats and quick actions
- Track your attendance history with a monthly calendar view
- Customize your notification preferences and set quiet hours
- Share images in group chat and direct messages
- All 4 chat rooms now available: General, Coaches, Parents, Announcements
- Numerous performance and stability improvements
```

### Updated App Description
```
The Academy is the official app for The Academy athletic training facility in Gallatin, Tennessee.

Members can:
• Browse and enroll in training programs with secure in-app checkout
• Shop for Academy merchandise
• View your schedule and register for sessions
• Track your attendance history and stats
• Chat with coaches, parents, and fellow members in real-time
• Send and receive direct messages with image sharing
• Manage your subscription and view payment history
• Customize push notification preferences
• Contact coaches directly from the app

Stay connected with your training community — everything you need in one place.
```

### URLs
- [ ] Privacy Policy URL valid and accessible: (verify current URL in App Store Connect)
- [ ] Support URL valid and accessible: (verify current URL)
- [ ] Marketing URL valid (if set): `https://academytn.com`

### Screenshots
- [ ] iPhone 6.7" screenshots (iPhone 15 Pro Max / 16 Pro Max) — required
  - [ ] Dashboard screen
  - [ ] Programs screen with enrollment
  - [ ] Chat with image message
  - [ ] Attendance calendar
  - [ ] Profile with coach contacts
- [ ] iPhone 6.1" screenshots (iPhone 15 Pro / 16 Pro) — required
  - [ ] Same 5 screens as above
- [ ] iPad screenshots — NOT required (`supportsTablet: false`)

### Review Notes for Apple Reviewers
```
Demo Account:
- Email: [provide test account email]
- Password: [provide test account password]

Payment Testing:
This app uses Stripe for payments. In the review environment,
payments are in test mode. Use Stripe test card 4242 4242 4242 4242
with any future expiry date and any CVC to complete test purchases.

Chat:
The app includes real-time group chat and direct messaging.
The chat rooms are shared between members of the athletic
training facility. Image upload in chat is limited to 5MB.

Push Notifications:
The app requests push notification permission for chat messages,
direct messages, and announcements. This is optional and can be
configured in Notification Settings.

Location:
The app does not request location permissions.

Camera/Photos:
Camera and photo library access is requested only when the user
initiates an image upload in chat. Images are used solely for
sharing in conversations between members.
```

---

## 4. Submission

### Pre-Submit Final Checks
- [ ] App runs on TestFlight build for at least 24 hours without reported crashes
- [ ] All screenshots are current and match v1.3.0 UI
- [ ] Review notes include valid test credentials
- [ ] Export compliance: `ITSAppUsesNonExemptEncryption` = `false`
- [ ] No IDFA usage (no advertising SDK)

### Submit
- [ ] Run `eas submit --platform ios`
- [ ] Submission accepted by App Store Connect (status: "Waiting for Review")
- [ ] Release type set: **Manual Release** (review, then we release)
- [ ] Submitted early in the week (Mon-Tue) to avoid weekend review delays

---

## 5. Post-Submission

### Review Monitoring
- [ ] Monitor App Store Connect for review status changes
- [ ] If rejected: document reason in `STATUS.md`, fix, resubmit
- [ ] Average review time: 24-48 hours

### Pre-Release (After Approval)
- [ ] Download approved build from TestFlight
- [ ] Smoke test on TestFlight: sign in → dashboard → programs → chat → payments
- [ ] Verify all 10 new features work on the approved build
- [ ] Verify push notifications still work

### Release
- [ ] Release to production in App Store Connect
- [ ] Verify app appears in App Store with correct version
- [ ] Download from App Store on a test device
- [ ] Smoke test: sign in → dashboard → navigate all tabs

### Post-Release
- [ ] Update `RELEASE_NOTES.md` with actual release date
- [ ] Update `STATUS.md` with release confirmation
- [ ] Monitor App Store reviews for the first 48 hours
- [ ] Monitor crash reports (manual check until Sentry is added)
- [ ] Announce release to team if appropriate

---

## 6. Android (Future — Not Part of v1.3.0 Initial Submission)

When ready for Google Play:
- [ ] `eas build --platform android --profile production`
- [ ] Build succeeds
- [ ] `eas submit --platform android`
- [ ] Google Play Console: listing updated with v1.3.0 description
- [ ] Screenshots updated for Android form factors
- [ ] Content rating updated
- [ ] Review/approval
- [ ] Staged rollout (10% → 50% → 100%)

---

## 7. Rollback Plan

If critical issues discovered after release:
1. **OTA patch** (JS-only changes): Push fix via `eas update --channel production`
2. **App Store revert**: Previous v1.2.0 (build 16) remains available; can request expedited review for hotfix v1.3.1
3. **Server-side**: Portal backend changes are independent and can be rolled back via Vercel deployment revert
