# App Store Submission Checklist

> Complete before every iOS App Store submission.

---

## Pre-Build

- [ ] Version bumped in `app.json` (`expo.version`)
- [ ] Build number incremented in `app.json` (`expo.ios.buildNumber`)
- [ ] All features in scope are complete and QA'd (CHECKLIST_QA.md)
- [ ] No CRITICAL or HIGH bugs open
- [ ] Release notes drafted (RELEASE_NOTES.md)

## Build

- [ ] Run `cd academy-app && npm install`
- [ ] Run `eas build --platform ios --profile production`
- [ ] Build completes without errors
- [ ] Build artifact downloaded and verified (size, bundle ID)

## App Store Connect

- [ ] App Store screenshots current (if UI changed significantly)
- [ ] App description accurate (if features added)
- [ ] Keywords updated (if targeting new terms)
- [ ] "What's New" text written for this version
- [ ] Privacy policy URL valid
- [ ] Support URL valid
- [ ] Age rating accurate
- [ ] No references to test/debug modes in metadata

## Submission

- [ ] Run `eas submit --platform ios`
- [ ] Submission accepted by App Store Connect
- [ ] Set release type: Manual (review then release) or Automatic
- [ ] Submitted early in the week (Mon-Tue) to avoid weekend review delays

## Post-Submission

- [ ] Monitor App Store Connect for review status
- [ ] If rejected: document reason, fix, resubmit
- [ ] Once approved: verify app in TestFlight before releasing
- [ ] Release to production
- [ ] Verify live app works (sign in, dashboard, critical flows)
- [ ] Update RELEASE_NOTES.md with actual release date
- [ ] Announce release if appropriate

---

## Android (Future — When Google Play Submission Begins)

- [ ] Version bumped in `app.json`
- [ ] `eas build --platform android --profile production`
- [ ] Build succeeds
- [ ] `eas submit --platform android`
- [ ] Google Play Console: listing updated
- [ ] Review/approval
- [ ] Staged rollout or full release
