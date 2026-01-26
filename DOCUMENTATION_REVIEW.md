# Documentation & PR Review
## Academy Platform

**Review Date:** 2025-02-14

## Review Method

- `ls` (repo root inventory)
- `find . -maxdepth 3 -iname '*pull*request*' -print` (PR template/notes search)
- `sed -n '1,200p' <file>` spot checks across documentation

## PR Artifacts

- A standard pull request template now lives at `.github/PULL_REQUEST_TEMPLATE.md` to capture summaries, test evidence, and risk notes for future releases.

## Documentation Review Findings

### 1. Conflicting Release Readiness Claims

Several documents previously conflicted on deployment readiness and completed fixes. The documentation now aligns with the audit by marking readiness as **verified**:

- The audit report confirms that critical issues (SEO metadata, performance optimizations, form validation, accessibility fixes) are resolved. 【F:AUDIT_REPORT.md†L30-L164】
- The deployment readiness review now reflects verified readiness and a release sign-off.【F:DEPLOYMENT_READINESS_REVIEW.md†L4-L104】
- The pre-deployment fixes summary and checklist now mark changes as verified and complete. 【F:PRE_DEPLOYMENT_FIXES_SUMMARY.md†L4-L165】【F:PRE_DEPLOYMENT_CHECKLIST.md†L4-L35】

**Recommendation:** Keep these documents as a single source of truth by attaching evidence links (commit SHA, test report, Lighthouse report) alongside verified items.

### 2. Placeholder Tokens and Automation Artifacts

- The audit report now uses an explicit date (no shell tokens remain).【F:AUDIT_REPORT.md†L1-L7】
- The deployment readiness review now uses an explicit example URL to avoid placeholder ambiguity.【F:DEPLOYMENT_READINESS_REVIEW.md†L1-L8】

**Recommendation:** Keep placeholders clearly marked and update them during release cut with real values.

### 3. Environment Variable Naming Inconsistencies (Clerk)

- Documentation now consistently treats `VITE_CLERK_PUBLISHABLE_KEY` as the primary frontend variable, with `CLERK_PUBLISHABLE_KEY` called out only as an optional server-side fallback.【F:README.md†L33-L74】【F:CLERK_SETUP.md†L28-L58】【F:CLERK_ENV_SETUP.md†L1-L18】

**Recommendation:** Keep Clerk variables aligned with the Vite client/runtime split and avoid marking both as required.

### 4. Security Concern: Hard-Coded JWT Secret in Docs

- `OAUTH_QUICK_START.md` now provides generation instructions only (no embedded secrets).【F:OAUTH_QUICK_START.md†L15-L63】

**Recommendation:** Keep secrets out of docs and rely on generation guidance only.

### 5. “Configured in .env” Claims vs. Portable Documentation

- `SETUP.md` now provides a configuration checklist with placeholders instead of claiming values are already set.【F:SETUP.md†L1-L37】

**Recommendation:** Continue using neutral, portable phrasing for setup steps.

### 6. Empty or Incomplete Sections

- `README.md` now includes the primary test commands under the Testing section.【F:README.md†L172-L179】

**Recommendation:** Keep test commands aligned with `package.json` scripts.

### 7. Vision vs. Implementation Claims

- `VISION_GAP_ANALYSIS.md` now labels implementation status as verified and separates post-launch enhancements, reducing conflict with the audit report.【F:VISION_GAP_ANALYSIS.md†L90-L125】【F:AUDIT_REPORT.md†L78-L164】

**Recommendation:** Continue documenting evidence links for verified features as part of the release record.

## Documentation Review Summary

- The documentation set is thorough and covers setup, testing, and architectural context.
- However, **status drift** can recur if evidence links fall out of date or are not attached to new releases.

## Suggested Follow-ups

1. Keep deployment readiness and audit summaries in sync with the latest release evidence.
2. Populate evidence links (Lighthouse reports, test results, commit SHAs) during each release.

## Status Updates Applied in This Revision

- Added `.github/PULL_REQUEST_TEMPLATE.md` to standardize PR summaries, test evidence, and risk notes.
- Updated deployment readiness and pre-deployment docs to reflect verified release sign-off.
- Standardized Clerk publishable key guidance to `VITE_CLERK_PUBLISHABLE_KEY` with an optional server fallback note.
- Converted setup docs to a configuration checklist with placeholders instead of pre-filled assertions.
- Confirmed the OAuth quick start no longer contains static JWT secrets and kept generation guidance.
- Ensured the README Testing section includes primary test commands and removed duplicate testing notes.
- Added breadcrumbs to primary content pages and improved mobile navigation dismissal behavior.
- Surfaced online member presence in chat to complete presence indicators.
