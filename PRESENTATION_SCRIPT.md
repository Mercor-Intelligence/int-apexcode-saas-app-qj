# APEX Code V2: SaaS App Evaluation Dataset
## Presentation Script

---

## 🎬 Opening (2 minutes)

### Slide 1: Title

> "Today I'm presenting APEX Code V2 - a new evaluation dataset that measures whether AI agents can build real, enterprise-grade SaaS applications from scratch."

> "This isn't about testing if an agent can write a function or pass unit tests. We're asking a bigger question: **Can an AI build software that's ready for the market?**"

---

## 📊 The Problem (3 minutes)

### Slide 2: Current Benchmarks Fall Short

> "Existing benchmarks like Vibe Code Bench test whether an agent can build *functional* applications - things like a breathing exercise tool or a simple social clone."

> "But there's a gap. These benchmarks don't answer the real question enterprises care about:
> - Can it handle authentication securely?
> - Can it deploy to production infrastructure?
> - Can it build something with actual commercial value?"

### Slide 3: What We're Measuring

> "APEX Code V2 fills this gap. We evaluate whether an agent can architect **high-value enterprise systems** - applications like Zapier, Linktree, or Salesforce - with:
> - Professional deployment infrastructure
> - Secure authentication
> - Real database integration
> - Production-ready polish"

> "We're not just testing if code runs. We're testing if it could **compete in the market**."

---

## 🔧 The Expert Workflow (4 minutes)

### Slide 4: Three-Phase Process

> "Our evaluation dataset is built through a rigorous three-phase expert workflow."

**Phase 1: Expert Defines the Product**

> "First, an expert selects a target application. For this demonstration, we chose **Linktree** - a bio-link tool used by millions of creators."

> "The expert drafts a comprehensive Product Requirements Document covering:
> - User authentication flows
> - Feature specifications
> - Database schema requirements
> - UI/UX expectations"

**[DEMO: Show `product_requirements_doc.md`]**

> "We also seed a Knowledge Base with answers to potential clarifying questions - simulating a real stakeholder."

**[DEMO: Show `knowledge_base.md`]**

> "Questions like 'Do we need dark mode?' or 'Should deleted items be soft-deleted?' are pre-answered, so the agent has clear guidance."

---

### Slide 5: Phase 2 - Agent Builds

**Phase 2: Agent Builds the Application**

> "In phase two, an AI agent receives the PRD and builds the complete application."

> "For our demonstration, the agent built **BioLink** - a full Linktree clone with:"

**[DEMO: Open browser to https://frontend-ten-cyan-42.vercel.app]**

> "Let me show you what the agent built:"

1. **Landing Page** - "A polished marketing page with clear value proposition"
2. **Signup Flow** - "Multi-step wizard with handle availability checking"
3. **Dashboard** - "Full link management with drag-and-drop reordering"
4. **Appearance Tab** - "Theme customization, fonts, button styles"
5. **Analytics** - "Real-time tracking of views and clicks"
6. **Public Profile** - "Beautiful, responsive public pages"

> "This isn't a mockup. This is a **fully functional application** deployed on Vercel with a PostgreSQL database."

---

### Slide 6: Architecture Overview

**[DEMO: Show architecture diagram from README]**

> "The agent built a complete full-stack architecture:"

```
React Frontend (Vercel) → Express API (Vercel Serverless) → PostgreSQL (Neon)
```

> "Key technical achievements:
> - JWT authentication with secure token handling
> - Prisma ORM for type-safe database access
> - RESTful API with 20+ endpoints
> - Real-time preview updates
> - Analytics tracking system"

---

## 🧪 Automated Verification (5 minutes)

### Slide 7: Phase 3 - BrowserBase Testing

**Phase 3: Verification with BrowserBase**

> "Here's where it gets interesting. How do we verify the agent built everything correctly?"

> "Traditional unit tests aren't enough. We need to test the **actual user experience**."

> "We use **BrowserBase** - cloud browser infrastructure that lets us simulate real users interacting with the application."

**[DEMO: Show `app/scripts/` directory]**

> "We've written comprehensive verification scripts that:"

1. Create real user accounts
2. Navigate the UI like a human would
3. Fill forms, click buttons, drag items
4. Verify data persists correctly
5. Check analytics are tracked

---

### Slide 8: Live Test Demonstration

> "Let me run the full journey test - 40 verification steps in a single BrowserBase session."

**[DEMO: Run the test]**

```bash
cd app/scripts
npm run test:full
```

> "Watch this - we're launching a cloud browser that will:"
> - Sign up a new user
> - Create and manage links  
> - Customize the profile appearance
> - Visit the public profile
> - Verify analytics tracking
> - Log out and back in

**[While test runs, narrate the phases]**

> "Phase 1: Signup - The browser is filling the multi-step wizard..."
> "Phase 3: Links - Adding links, toggling visibility..."
> "Phase 5: Public Profile - Verifying the public page looks correct..."

**[When complete]**

> "**40 tests passed.** And here's the best part:"

**[Show session recording URL]**

> "Every test generates a **full video recording**. You can watch exactly what the browser did, see network requests, console logs - complete observability."

**[Open BrowserBase session recording in browser]**

---

### Slide 9: Test Coverage

> "Our test suite includes 75 individual verifications across 6 suites:"

| Suite | Tests | What It Verifies |
|-------|-------|------------------|
| Signup | 12 | Multi-step registration, handle checking |
| Login | 10 | Authentication, token storage |
| Links | 15 | CRUD operations, drag-drop reorder |
| Profile | 13 | Appearance customization |
| Public Profile | 14 | Public page display, link visibility |
| Analytics | 11 | View/click tracking, dashboard |

> "Plus the **Full Journey** test that runs all 40 critical steps in sequence."

---

## 📋 Evaluation Rubric (3 minutes)

### Slide 10: Comprehensive Rubric

> "Beyond automated testing, we have a detailed rubric for human evaluation."

**[DEMO: Show `app/rubric/rubric.json`]**

> "65 evaluation criteria across three categories:"

**Correctness (45 criteria)**
> "Does the app actually work? User can sign up, create links, customize appearance, view analytics..."

**Code Quality (10 criteria)**  
> "Is the code well-structured? Proper error handling, consistent patterns, no hardcoded values..."

**Deployment (10 criteria)**
> "Is it production-ready? Environment variables configured, database connected, API endpoints working..."

---

## 📊 Dataset Taxonomy (2 minutes)

### Slide 11: Complexity Levels

> "APEX Code V2 categorizes applications by complexity:"

| Level | Examples | Target Pass Rate |
|-------|----------|------------------|
| **Less Complex** | Linktree, Trello, Typeform | ≥30% |
| **Moderately Complex** | Squarespace, Zapier, Canva | 10-30% |
| **More Complex** | Salesforce, Okta, Tableau | <10% |

> "BioLink falls into the 'Less Complex' category - but as you've seen, 'less complex' still means:
> - Full authentication system
> - Relational database
> - Real deployment infrastructure
> - Professional UI/UX"

> "Our target distribution is 40% less complex, 40% moderate, 20% more complex."

---

## 🔮 Looking Forward (2 minutes)

### Slide 12: Future Applications

> "This dataset enables several valuable analyses:"

1. **Failure Mode Analysis**
   > "Where do agents struggle? Infrastructure setup? API integration? UI polish?"

2. **Model Comparison**
   > "How does GPT-5 compare to Claude? To Gemini? On different complexity levels?"

3. **Infrastructure Partnerships**
   > "We're exploring co-branding with Vercel and BrowserBase to maximize credibility and realism."

---

## 🎯 Summary (1 minute)

### Slide 13: Key Takeaways

> "To summarize APEX Code V2:"

1. **Real Applications** - Not toy examples, but market-ready SaaS products
2. **End-to-End Verification** - BrowserBase tests that simulate actual users
3. **Comprehensive Rubrics** - 65 criteria covering correctness, quality, and deployment
4. **Scalable Taxonomy** - From Linktree to Salesforce complexity levels

> "We're not just asking 'Can AI code?' We're asking 'Can AI build businesses?'"

---

## 💬 Q&A Preparation

### Common Questions

**Q: Why BrowserBase instead of Playwright locally?**
> "BrowserBase provides cloud infrastructure, session recordings, and scales for parallel testing. It's how a real QA team would operate."

**Q: How do you handle API keys and secrets?**
> "We use environment variables and mock servers where appropriate. The agent learns to work with real deployment patterns."

**Q: What if the agent takes a different architectural approach?**
> "Our rubric focuses on outcomes, not specific implementations. If it works, deploys, and passes tests - it passes."

**Q: How long does a typical evaluation take?**
> "The BioLink application took approximately 2 hours of agent time. Full verification suite runs in under 2 minutes."

---

## 🖥️ Demo Commands Reference

```bash
# Show the live application
open https://frontend-ten-cyan-42.vercel.app

# Run individual test suites
cd app/scripts
npm run verify:signup
npm run verify:login
npm run verify:links

# Run full journey test (recommended for demo)
npm run test:full

# Run all 75 tests
npm test
```

---

## 📁 Key Files to Reference

| File | Purpose |
|------|---------|
| `product_requirements_doc.md` | Original PRD given to agent |
| `knowledge_base.md` | Stakeholder Q&A simulation |
| `app/rubric/rubric.json` | 65 evaluation criteria |
| `app/scripts/verifiers/full-journey.js` | Complete E2E test |
| `README.md` | Project overview |

---

## 🎬 Presentation Timeline

| Section | Duration | Cumulative |
|---------|----------|------------|
| Opening | 2 min | 2 min |
| The Problem | 3 min | 5 min |
| Expert Workflow | 4 min | 9 min |
| Automated Verification | 5 min | 14 min |
| Evaluation Rubric | 3 min | 17 min |
| Dataset Taxonomy | 2 min | 19 min |
| Looking Forward | 2 min | 21 min |
| Summary | 1 min | 22 min |
| Q&A | 8 min | 30 min |

**Total: 30 minutes**

