# Performance Lab Landing Page Blueprint — Critique & Optimizations Applied

## What the Original Blueprint Got Right

The suggested blueprint nails the strategic bones: single-page flow, "Apply" language over "Sign Up" (premium positioning), problem-solution-proof-CTA structure, and keeping the FAQ tight at 6 questions. The enrollment flow (Application → Coach Call → Enrollment Link) is exactly right for a capped, premium program. Don't change that.

---

## What Needed Fixing (and What I Changed)

### 1. Too Many Sections, Not Enough Momentum

**Problem:** The blueprint had 8+ distinct content sections before the CTA. Rural parents on mobile (your primary audience) won't scroll through a mini-website. Every section that doesn't drive toward "Apply" is friction.

**Fix:** Consolidated from 8 sections to 6 purposeful blocks. Merged "The Solution" into the Promise banner (it was redundant). Combined "At-Home Plan" and "Parent Confidence Package" into one card instead of two — parents don't distinguish between these, they just want to know someone's got a plan. Killed the separate "Schedule" section entirely.

### 2. The Schedule Section is a Conversion Killer

**Problem:** The blueprint included a full weekly schedule grid on the landing page. This is an operational detail that raises more questions than it answers ("Wait, what if Tuesdays don't work?"). It also makes the page feel like a school catalog, not a premium membership pitch.

**Fix:** Replaced with one line: "Each athlete attends three sessions per week: Performance + Skill + Sunday session." The specific days get discussed on the coach call — which is the whole point of the Application flow. The schedule creates a reason for that conversation.

### 3. Pricing Comparison Needed to Hit Harder

**Problem:** The blueprint lists "$280/month" with a text note about value. At this price point in Gallatin, you need the comparison to be visual and immediate — not something parents have to calculate in their heads.

**Fix:** Built a pricing card with the cost comparison baked directly in: "Most families spend $340–$440+/month across 3–4 fragmented programs. Performance Lab replaces all of it." This is now inside the pricing section, not a separate block they might never scroll to.

### 4. The "3 Locations" Section Was Underselling Your Advantage

**Problem:** The blueprint listed all three spaces with one-line descriptions. This is one of your biggest differentiators — most local competitors have *one gym* — and it was getting the same visual weight as the FAQ.

**Fix:** Each space now gets a full card with a color-coded tag (Performance HQ / Skill Expression / Athletic Translation), a role statement, and a capability list. The section header is "Every Space Has a Job" which reinforces the *system* positioning without you having to say "we're a system."

### 5. The Hero Was Trying to Do Too Much

**Problem:** The blueprint had headline + subheadline + 3 bullets + CTA + secondary CTA + micro-proof line, all above the fold. That's 7 elements competing for attention. On mobile, it's a wall.

**Fix:** Stripped to the essentials: badge (location + age), headline, one subheadline, three stats (3 sessions, 3 environments, 6–8 per group), CTA, and scarcity micro-line. The stats replace the bullets — they communicate the same info in a faster, more scannable format.

### 6. No Social Proof Section (Yet) — And That's Fine

**Problem:** The blueprint included a testimonial strip. You don't have Performance Lab-specific testimonials yet because the product doesn't exist yet.

**Fix:** Removed the social proof section entirely from the launch version. Fake or generic testimonials kill trust faster than no testimonials. Instead, the school names from your existing site carry forward as implied trust. Add real Performance Lab testimonials after the first 30 days and they'll be 10x more powerful.

### 7. The FAQ Needed a Pricing Objection Reframe

**Problem:** The "$280 seems expensive" FAQ answer in the blueprint was defensive. It led with "We understand the reaction" which validates the objection before countering it.

**Fix:** Kept the same answer structure but the page itself now pre-handles this objection in the pricing section's comparison block. By the time parents reach the FAQ, they've already seen the math. The FAQ becomes reinforcement, not the first time they're hearing the defense.

---

## What I Did NOT Include (Intentionally)

- **No embedded form on the landing page.** The "Apply for Performance Lab" button links to your contact page with a pre-filled subject. This keeps the landing page clean and fast. Build a dedicated `/adm/apply` form as a Phase 2 optimization once you validate demand.

- **No sibling pricing or annual options visible.** These are enrollment-stage conversations, not landing-page information. Mentioning them too early creates decision paralysis ("Should I wait for the annual option?").

- **No coach bios.** They're already on your homepage. Repeating them here dilutes the Performance Lab-specific message. The landing page is about the *program*, not the people — the coach call handles the personal connection.

---

## Recommended Enrollment Flow (Unchanged from Blueprint)

This part was correct. Don't overcomplicate it:

1. Parent lands on `/adm` page
2. Clicks "Apply for Performance Lab" → goes to application form
3. Submits form → sees thank you message ("Coach Mac will call within 24 hours")
4. Coach Mac calls (5–10 min) → confirms fit, assigns group
5. Sends Stripe enrollment link ($280/mo recurring)
6. Parent completes payment → Welcome email fires automatically
7. Athlete starts at next scheduled session

---

## Next Steps

The HTML file I built is the complete, production-ready landing page. To deploy it:

1. Add it as a new page at `academytn.com/adm`
2. Update the "Apply for Performance Lab" button href to point to your actual application form (either a new `/adm/apply` page or your existing `/contact` with pre-filled subject)
3. Add a nav link to `/adm` from your main site
4. Start the 60-day rollout (Phase 1 from your Performance Lab doc)

The page is fully responsive, works on mobile, and matches your brand's navy + orange color system.
