# Human Knowledge Base - BioLink Project

This document contains answers to potential clarifying questions that may arise during development of the BioLink application. It serves as a reference for stakeholder decisions and preferences not explicitly covered in the PRD.

---

## User Interface & Design

### Q: Do we need a dark mode?
**A:** Yes, dark mode should be the default theme. The application targets creators and influencers who often work late hours. However, users should be able to switch to light mode in their profile settings.

### Q: What color scheme should we use?
**A:** Primary color is a vibrant orange (#FF6B35) to convey energy and creativity. Secondary colors include deep purple (#764ba2) and pink (#f093fb) for gradients. The dark theme background should be #0a0a0a with card backgrounds at #1a1a1a.

### Q: Should animations be enabled by default?
**A:** Yes, but keep them subtle and performant. Include a "Reduce motion" option in settings for accessibility. Page load animations should be staggered fade-ins, not more than 300ms total.

### Q: What fonts should we use?
**A:** Default to Inter for body text and Poppins for headings. Users can customize fonts in the appearance settings from a curated list of web-safe and Google Fonts options.

---

## Data Management

### Q: Should deleted items be soft-deleted or hard-deleted?
**A:** Soft-delete for links with a 30-day recovery window. Hard-delete for user accounts after a 14-day grace period following deletion request. Analytics data is anonymized but retained.

### Q: How long should we retain analytics data?
**A:** Retain detailed analytics for 90 days, then aggregate into monthly summaries. Users can export their data at any time. GDPR compliance is required.

### Q: Should we support data export?
**A:** Yes, users should be able to export all their data (profile, links, analytics) in JSON and CSV formats from the Settings page.

### Q: What's the maximum number of links per user?
**A:** Free tier: 10 links. Premium tier: Unlimited. For MVP, treat all users as premium (unlimited links).

---

## Authentication & Security

### Q: Should we require email verification?
**A:** Yes, but allow users to access the dashboard immediately. Unverified accounts cannot publish their public profile page until email is verified.

### Q: What password requirements should we enforce?
**A:** Minimum 8 characters, at least one uppercase, one lowercase, and one number. No special character requirement. Show password strength indicator during signup.

### Q: Should we support two-factor authentication (2FA)?
**A:** Not for MVP. Plan for future implementation with TOTP (authenticator apps) support.

### Q: How should we handle OAuth account linking?
**A:** If a user signs up with email and later tries to sign in with Google using the same email, link the accounts automatically. Show a notification explaining this.

### Q: What should happen if a user forgets their password?
**A:** Send a password reset email with a link valid for 1 hour. Maximum 3 reset requests per hour to prevent abuse.

---

## Link Management

### Q: Should links open in a new tab or same tab?
**A:** New tab by default, but provide a toggle in link settings for users who prefer same-tab navigation.

### Q: What URL validation should we perform?
**A:** Validate URL format and optionally check if the URL is reachable. Don't block invalid URLs but show a warning. Support deep links for mobile apps.

### Q: Should we support link thumbnails?
**A:** Yes, auto-fetch Open Graph images when available. Allow manual override with custom image upload (max 2MB, JPG/PNG/WebP).

### Q: How should link scheduling work?
**A:** Allow users to set start and end dates for link visibility. Links outside their scheduled window are hidden from the public profile but visible (greyed out) in the dashboard.

### Q: What link types should we support?
**A:** Standard (URL), Header (text divider), Social (auto-icon detection), Music (Spotify/Apple Music embed), Video (YouTube/TikTok embed). For MVP, focus on Standard and Header.

---

## Profile & Public Page

### Q: What's the maximum bio length?
**A:** 150 characters, same as Instagram. Show character count during editing.

### Q: Should usernames/handles be case-sensitive?
**A:** No, handles are case-insensitive but preserve the case the user entered. "JohnDoe" and "johndoe" resolve to the same profile.

### Q: What characters are allowed in handles?
**A:** Letters, numbers, underscores, and periods. Must start with a letter. Length: 3-30 characters. No consecutive periods or underscores.

### Q: Should we show a 404 or redirect for non-existent profiles?
**A:** Show a styled 404 page with a suggestion to claim the handle if they want it. Include a link to sign up.

### Q: Can users have custom domains?
**A:** Not for MVP. Plan for premium feature where users can map their own domain to their profile.

---

## Analytics

### Q: What counts as a "view"?
**A:** A view is counted when the public profile page loads. Deduplicate by IP + user agent combination within a 30-minute window.

### Q: What counts as a "click"?
**A:** A click is counted when a user clicks on any link. Track which link was clicked and the click timestamp.

### Q: Should we track geographic data?
**A:** Yes, derive country from IP address using a GeoIP database. Don't store precise location. Show top 5 countries in analytics dashboard.

### Q: What referrer data should we track?
**A:** Track the HTTP referrer header. Categorize into: Direct, Social (Twitter, Instagram, TikTok, etc.), Search, and Other.

### Q: Should analytics be real-time?
**A:** Near real-time (within 5 minutes). Don't optimize for true real-time in MVP to keep infrastructure simple.

---

## Mobile & Responsive

### Q: What's the minimum supported screen width?
**A:** 320px (iPhone SE). The public profile should be fully functional at this width. Dashboard can require minimum 768px.

### Q: Should we build native mobile apps?
**A:** Not for MVP. The web app should be a PWA (Progressive Web App) that can be installed on mobile home screens.

### Q: Should we support offline mode?
**A:** No, internet connection is required. Show a friendly offline message rather than broken UI.

---

## Performance & Limits

### Q: What's the maximum file size for avatar uploads?
**A:** 5MB. Resize on server to 400x400px max. Store original and thumbnail versions.

### Q: What's the rate limit for API requests?
**A:** 100 requests per minute per user for authenticated endpoints. 30 requests per minute per IP for public endpoints.

### Q: Should we implement caching?
**A:** Yes, cache public profiles for 1 minute at the CDN level. User dashboard should always be fresh.

---

## Business Logic

### Q: Should we show ads?
**A:** No ads. Revenue model will be premium subscriptions (not implemented in MVP).

### Q: Should we have a "powered by BioLink" badge on free profiles?
**A:** Yes, a small, tasteful badge at the bottom of free user profiles. Premium users can remove it.

### Q: Can users see who viewed their profile?
**A:** No, we don't track individual viewers. Only aggregate analytics (view counts, not viewer identities).

### Q: Should we support team/organization accounts?
**A:** Not for MVP. Plan for future feature where multiple users can manage one profile.

---

## Error Handling

### Q: How should we handle server errors?
**A:** Show a friendly error message with an option to retry. Log all 5xx errors to monitoring. Include a support email link.

### Q: What happens if a third-party service (OAuth, image hosting) is down?
**A:** Graceful degradation. Show cached data where possible. Disable affected features with a message explaining the issue.

### Q: Should we have a status page?
**A:** Not for MVP. Plan for future implementation at status.biolink.com.

---

## Internationalization

### Q: Should we support multiple languages?
**A:** MVP is English only. Plan for i18n support in future. Store all user-facing strings in a way that supports translation.

### Q: What date/time format should we use?
**A:** Use the user's browser locale for formatting. Store all dates in UTC. Show relative times (e.g., "2 hours ago") for recent activity.

---

## Compliance & Legal

### Q: Do we need a cookie consent banner?
**A:** Yes, for GDPR compliance. Use essential cookies only without consent. Analytics cookies require opt-in.

### Q: Do we need Terms of Service and Privacy Policy?
**A:** Yes, required before launch. For MVP, use placeholder links. Content will be provided by legal team.

### Q: Should we implement GDPR data deletion requests?
**A:** Yes, users can request full account deletion from Settings. Process within 30 days as required by GDPR.

---

## Development Preferences

### Q: Should we use TypeScript?
**A:** JavaScript for MVP to move fast. Plan migration to TypeScript after MVP is stable.

### Q: What testing coverage do we need?
**A:** For MVP, focus on critical path tests: authentication, link CRUD, profile display. Target 60% coverage. Full test suite for production.

### Q: Should we use a UI component library?
**A:** No, custom CSS for unique branding. Can use utility classes similar to Tailwind patterns.

### Q: What database should we use?
**A:** PostgreSQL for production (via Neon serverless). SQLite for local development to keep setup simple.

---

*Last updated: January 8, 2026*
*Stakeholder: Product Team*

