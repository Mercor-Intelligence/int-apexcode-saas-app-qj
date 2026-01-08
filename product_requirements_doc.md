# Product Requirements Document: "BioLink" (Linktree Clone)

**Version:** 1.0  
**Status:** Ready for Development  
**Objective:** Build a scalable "Link-in-Bio" platform that allows users to host a personalized landing page containing multiple links, social icons, and monetization tools.

---

## 1. Product Overview
"BioLink" solves the "one link in bio" problem on social media platforms (Instagram, TikTok). It provides a single URL (e.g., `biolink.com/username`) that directs followers to a mobile-optimized landing page hosting all of a creator's important content.

### Core Value Propositions
1.  **Centralization:** One link for all content.
2.  **Customization:** Brand alignment via themes, colors, and fonts.
3.  **Analytics:** Insight into audience behavior and click-through rates (CTR).
4.  **Monetization:** Native ability to sell products and collect tips.

---

## 2. User Personas

| Persona | Description | Primary Goals |
| :--- | :--- | :--- |
| **The Creator** | Influencers, businesses, artists. | Maximizing traffic to specific URLs, capturing emails, selling merchandise, tracking clicks. |
| **The Visitor** | Followers of the Creator. | Quickly finding the content mentioned in a post, loading the page instantly on mobile. |
| **The Admin** | Internal platform staff. | Managing user subscriptions, banning illegal content/users, viewing platform metrics. |

---

## 3. Functional Requirements & Feature Sets

### 3.1 Authentication & Onboarding
* **Sign Up/Login:** Email/Password, Google OAuth, Apple Sign-in.
* **Handle Reservation:** Users must claim a unique URL (`biolink.com/handle`) during signup.
    * *Constraint:* Alphanumeric, underscores allowed, max 30 chars. No spaces.
* **Category Selection:** User selects niche (e.g., Fashion, Tech) to help with template recommendations.

### 3.2 Link Management (The "Links" Tab)
* **CRUD Links:** Create, Read, Update, Delete link blocks.
* **Toggle Visibility:** Hide/Show links without deleting them.
* **Drag & Drop Reordering:** Change the order of links on the profile.
* **Link Types:**
    * *Standard:* URL + Title.
    * *Header:* Text-only block to separate sections.
    * *Music/Video:* Embeds (YouTube, Spotify) that play in-line.
    * *Commerce:* Shopify product embed or Tip Jar.
* **Link Features:**
    * *Thumbnail:* Upload icon for specific link.
    * *Gating:* "Sensitive Content" warning or "Password Protected."
    * *Scheduling:* Set start/end date for link visibility.
    * *Analytics:* View click count per link.

### 3.3 Profile Customization (The "Appearance" Tab)
* **Profile Details:** Upload Avatar (1:1 aspect ratio), Bio Title (max 60 chars), Bio Description (max 80 chars).
* **Themes:** Pre-set color/font combinations.
* **Backgrounds:** Solid color, Gradient, or Image/Video upload (Paid feature).
* **Button Styles:** Rounded, Rectangular, Shadow, Outline.
* **Fonts:** Selection of Google Fonts.

### 3.4 Analytics (The "Insights" Tab)
* **Metrics:**
    * Total Views (Page loads).
    * Total Clicks (Link clicks).
    * CTR (Clicks / Views).
    * Top Referrers (Instagram, TikTok, Direct).
    * Top Locations (Country/City).
    * Device Type (Mobile/Desktop).

### 3.5 Settings
* **SEO:** Set Meta Title and Meta Description for the profile.
* **Social Icons:** Add icons to the bottom of the profile (Email, Insta, TikTok, X, etc.).
* **Integrations:** Mailchimp (for email capture links), Facebook Pixel (for retargeting).

---

## 4. Comprehensive User Flows

### Flow 1: Creator Onboarding (The "First 5 Minutes")
**Goal:** User signs up and publishes their first link.

1.  **Landing Page:** User clicks "Claim your Linktree."
2.  **Input Handle:** User types desired handle (e.g., `janedoe`).
    * *System Check:* Is `janedoe` available?
    * *If Yes:* Proceed. *If No:* Suggest `janedoe1`.
3.  **Account Creation:** User enters Email/Password.
4.  **Category:** User selects "Creative" -> "Music."
5.  **Plan Selection:** User selects "Free Forever."
6.  **Dashboard Land:** User is dropped into the "Links" tab.
7.  **Add Link:**
    * User clicks giant purple button "+ Add Link."
    * Input URL: `spotify.com/album/...`
    * Input Title: "Listen to my new Single."
    * System auto-fetches favicon as thumbnail (optional).
8.  **Publish:** User toggles the "Active" switch (ON by default).
9.  **Preview:** User sees the mobile preview on the right update in real-time.

### Flow 2: Visitor Experience (The Consumption)
**Goal:** Visitor finds specific content quickly.

1.  **Entry:** Visitor clicks `biolink.com/janedoe` from Instagram Bio.
2.  **Load:** Page loads in <1.5s (Critical Requirement).
    * *Visuals:* Profile Pic, Bio, List of Buttons, Social Icons at bottom.
3.  **Interaction:** Visitor taps "Listen to my new Single."
4.  **Tracking:**
    * Frontend fires event `link_click` with `{link_id: 123, referrer: 'instagram'}`.
    * Backend increments `click_count` for Link 123.
5.  **Redirect:** Browser opens `spotify.com/album/...` in a new tab.

### Flow 3: Monetization (Setting up a "Tip Jar")
**Goal:** Creator allows fans to send money.

1.  **Navigation:** Creator goes to "Settings" -> "Monetization."
2.  **Provider Connect:** Creator clicks "Connect Stripe" or "Connect PayPal."
    * *OAuth Flow:* Redirects to Stripe/PayPal login -> Authorize -> Redirect back.
3.  **Add Link:** Go to "Links" tab -> "+ Add Link" -> Select "View all apps" -> "Tip Jar."
4.  **Configuration:**
    * Set Title: "Buy me a coffee."
    * Set Amounts: $5, $10, $20 buttons.
    * Set Description: "Thanks for the support!"
5.  **Save:** Tip Jar appears as a special module on the profile.

### Flow 4: Gated Content (Age/Password)
**Goal:** Restrict access to a sensitive link.

1.  **Select Link:** User clicks "Edit" on an existing link.
2.  **Settings:** Click "Lock" icon.
3.  **Choose Logic:** Select "Sensitive Content (18+)."
4.  **Visitor View:**
    * Visitor sees link covered with a blur or warning icon.
    * Visitor clicks link.
    * **Modal:** "This content may be sensitive. Are you 18+?" (Yes/No).
    * *If Yes:* Unlock and redirect.

---

## 5. Data Models (Schema Recommendation)

**Users Table**
* `id` (UUID)
* `email` (String)
* `password_hash` (String)
* `handle` (String, Unique, Indexed)
* `plan_tier` (Enum: Free, Pro)
* `avatar_url` (String)

**Links Table**
* `id` (UUID)
* `user_id` (FK)
* `url` (String)
* `title` (String)
* `thumbnail_url` (String)
* `position` (Int) - *For ordering*
* `is_active` (Boolean)
* `type` (Enum: CLASSIC, MUSIC, HEADER, COMMERCE)
* `settings` (JSONB) - *Stores gating, scheduling, animation config*

**Analytics_Events Table**
* `id` (UUID)
* `link_id` (FK, Nullable if page view)
* `user_id` (FK, Owner of profile)
* `event_type` (Enum: PAGE_VIEW, LINK_CLICK)
* `referrer` (String)
* `country_code` (String)
* `device` (String)
* `timestamp` (DateTime)

---

## 6. Non-Functional Requirements

### 6.1 Performance
* **Time to Interactive (TTI):** Profile pages must load in under 1.5 seconds on 4G networks.
* **Caching:** Extensive use of Redis to cache public profiles (profiles are read-heavy, write-light).

### 6.2 Scalability
* System must handle "Viral Spikes" (e.g., a celebrity posts their link).
* **CDN:** All static assets (thumbnails, avatars) served via Cloudflare/AWS CloudFront.

### 6.3 Security
* **Bot Protection:** Rate limiting on profile views to prevent analytics spam.
* **Sanitization:** All user inputs (Titles, URLs) must be sanitized to prevent XSS attacks.
