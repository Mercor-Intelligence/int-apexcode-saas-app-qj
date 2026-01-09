# BioLink SaaS Application

A full-stack Linktree clone built with React and Node.js, featuring automated browser verification using BrowserBase.

[![Tests](https://img.shields.io/badge/tests-75%2F75%20passing-brightgreen)](app/scripts)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black)](https://vercel.com)
[![BrowserBase](https://img.shields.io/badge/verified%20with-BrowserBase-blue)](https://browserbase.com)

## 🎯 Overview

BioLink is a link-in-bio platform that allows users to create a personalized landing page to share all their important links, social profiles, and content in one place.

**Live Demo:**
- Frontend: https://frontend-ten-cyan-42.vercel.app
- Backend API: https://backend-eight-mu-60.vercel.app

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔗 **Link Management** | Add, edit, reorder (drag & drop), and delete links |
| 🎨 **Customization** | Multiple themes, button styles, fonts, and avatar upload |
| 📊 **Analytics** | Track page views, link clicks, referrers, and devices |
| 🔐 **Authentication** | Secure JWT-based signup/login with handle reservation |
| 📱 **Responsive** | Mobile-optimized public profile pages |
| 👁️ **Live Preview** | Real-time preview while editing |

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  Express API    │────▶│  PostgreSQL     │
│  (Vercel)       │     │  (Vercel)       │     │  (Neon)         │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  BrowserBase    │
│  (E2E Testing)  │
└─────────────────┘
```

## 📁 Project Structure

```
int-apexcode-saas-app-qj/
├── app/                          # Main application
│   ├── frontend/                 # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/       # Dashboard tabs & preview
│   │   │   ├── pages/            # Landing, Auth, Dashboard, Public
│   │   │   ├── context/          # Auth context
│   │   │   └── utils/            # API utilities
│   │   └── vercel.json
│   │
│   ├── backend/                  # Node.js + Express API
│   │   ├── prisma/               # Database schema
│   │   ├── src/
│   │   │   ├── routes/           # API endpoints
│   │   │   └── middleware/       # JWT auth
│   │   └── vercel.json
│   │
│   ├── scripts/                  # BrowserBase verification tests
│   │   ├── verifiers/            # Individual test suites
│   │   │   ├── signup.js
│   │   │   ├── login.js
│   │   │   ├── links.js
│   │   │   ├── profile.js
│   │   │   ├── public-profile.js
│   │   │   ├── analytics.js
│   │   │   └── full-journey.js   # Complete E2E flow
│   │   └── utils/                # BrowserBase helpers
│   │
│   └── rubric/                   # Evaluation criteria
│       ├── rubric.json
│       └── grades.json
│
├── trajectory/                   # Development trajectory logs
├── knowledge_base.md             # Stakeholder Q&A simulation
├── product_requirements_doc.md   # Original PRD
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm
- [Neon](https://neon.tech) account (PostgreSQL)
- [BrowserBase](https://browserbase.com) account (for testing)

### Local Development

```bash
# Clone the repository
git clone https://github.com/Mercor-Intelligence/int-apexcode-saas-app-qj.git
cd int-apexcode-saas-app-qj

# Start backend
cd app/backend
npm install
echo "DATABASE_URL=file:./dev.db" > .env
echo "JWT_SECRET=dev-secret" >> .env
npx prisma db push
npm run dev

# Start frontend (new terminal)
cd app/frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 🧪 Automated Testing with BrowserBase

This project includes comprehensive E2E tests using [BrowserBase](https://browserbase.com) cloud browsers.

### Setup

```bash
cd app/scripts
npm install

# Configure BrowserBase credentials
cat > .env << EOF
BROWSERBASE_API_KEY=your_api_key
BROWSERBASE_PROJECT_ID=your_project_id
FRONTEND_URL=https://frontend-ten-cyan-42.vercel.app
BACKEND_URL=https://backend-eight-mu-60.vercel.app
EOF
```

### Run Tests

```bash
# Run all test suites (75 tests)
npm test

# Run full user journey (40 tests in single session)
npm run test:full

# Run individual suites
npm run verify:signup
npm run verify:login
npm run verify:links
npm run verify:profile
npm run verify:public
npm run verify:analytics
```

### Test Coverage

| Suite | Tests | Description |
|-------|-------|-------------|
| Signup | 12 | Multi-step registration wizard |
| Login | 10 | Authentication & token storage |
| Links | 15 | CRUD, reorder, toggle visibility |
| Profile | 13 | Appearance customization |
| Public Profile | 14 | Public page display & tracking |
| Analytics | 11 | Views, clicks, dashboard |
| **Full Journey** | **40** | **Complete E2E in single session** |

Every test generates a BrowserBase session recording for debugging:
```
🔗 Watch replay: https://browserbase.com/sessions/{session_id}
```

## 🌐 Deployment

### Vercel Deployment

#### Backend
1. Create new Vercel project
2. Set root directory: `app/backend`
3. Add environment variables:
   - `DATABASE_URL` - Neon PostgreSQL connection string
   - `JWT_SECRET` - Secret key for JWT tokens
4. Deploy

#### Frontend
1. Create new Vercel project
2. Set root directory: `app/frontend`
3. Set framework preset: Vite
4. Add environment variables:
   - `VITE_API_URL` - Backend URL (e.g., `https://your-backend.vercel.app/api`)
5. Deploy

## 📚 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/check-handle/:handle` | Check availability |

### Links
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/links` | List all links |
| POST | `/api/links` | Create link |
| PUT | `/api/links/:id` | Update link |
| DELETE | `/api/links/:id` | Delete link |
| POST | `/api/links/reorder` | Reorder links |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get profile |
| PUT | `/api/profile` | Update profile |
| POST | `/api/profile/avatar` | Upload avatar |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Get summary stats |
| GET | `/api/analytics/links` | Get per-link stats |

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/:handle` | Get public profile |
| POST | `/api/public/:handle/view` | Track page view |
| POST | `/api/public/click/:linkId` | Track link click |

## 🎨 Themes

Built-in themes for public profiles:

| Theme | Description |
|-------|-------------|
| Sunset | Purple to pink gradient |
| Ocean | Deep blue to teal |
| Forest | Green gradient |
| Violet | Red to yellow to pink |
| Light | Minimal white/gray |

## 📊 Evaluation Rubric

The project includes a comprehensive evaluation rubric (`app/rubric/`) covering:

- **Correctness (45 criteria)** - Feature implementation
- **Code Quality (10 criteria)** - Best practices
- **Deployment (10 criteria)** - Production readiness

## 📖 Additional Documentation

- [`app/README.md`](app/README.md) - Detailed app documentation
- [`app/scripts/README.md`](app/scripts/README.md) - BrowserBase testing guide
- [`knowledge_base.md`](knowledge_base.md) - Stakeholder Q&A
- [`product_requirements_doc.md`](product_requirements_doc.md) - Original requirements

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router, @dnd-kit |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL (Neon) |
| Auth | JWT, bcryptjs |
| Hosting | Vercel (Serverless) |
| Testing | BrowserBase, Playwright |

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ using React, Node.js, and BrowserBase

