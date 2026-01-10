# BioLink v2 - Link-in-Bio Platform

A full-stack link-in-bio platform built with React and Node.js, based on the product requirements document and knowledge base specifications.

## Features

- **Authentication**: Email/password signup with handle reservation
- **Link Management**: CRUD operations, drag & drop reordering, visibility toggle
- **Profile Customization**: 7 themes, 6 button styles, 6 fonts, avatar upload
- **Analytics**: Page views, link clicks, referrers, devices, CTR
- **Public Profiles**: Mobile-optimized pages with animations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router, @dnd-kit |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL (Neon for production) |
| Auth | JWT, bcryptjs |
| Hosting | Vercel (Serverless) |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd app_v2/backend
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
PORT=3001
FRONTEND_URL="http://localhost:5173"
EOF

# Initialize database
npx prisma db push

# Start server
npm run dev
```

### Frontend Setup

```bash
cd app_v2/frontend
npm install
npm run dev
```

Access the app at http://localhost:5173

## Project Structure

```
app_v2/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.js         # Signup, login, password
│   │   │   ├── links.js        # Link CRUD
│   │   │   ├── profile.js      # Profile management
│   │   │   ├── analytics.js    # Analytics data
│   │   │   ├── public.js       # Public profile API
│   │   │   └── social.js       # Social icons
│   │   └── index.js            # Express server
│   └── vercel.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LinksTab.jsx
│   │   │   ├── AppearanceTab.jsx
│   │   │   ├── AnalyticsTab.jsx
│   │   │   ├── SettingsTab.jsx
│   │   │   └── ProfilePreview.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── PublicProfile.jsx
│   │   ├── styles/
│   │   │   └── global.css
│   │   └── utils/
│   │       └── api.js
│   └── vercel.json
│
└── README.md
```

## Design Specifications

From the knowledge base:

- **Default Theme**: Dark mode
- **Primary Color**: #FF6B35 (vibrant orange)
- **Secondary Colors**: #764ba2 (purple), #f093fb (pink)
- **Background**: #0a0a0a (dark), #1a1a1a (cards)
- **Fonts**: Inter (body), Poppins (headings)
- **Animations**: Subtle, staggered fade-ins (300ms max)

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/auth/check-handle/:handle | Check availability |

### Links
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/links | List user's links |
| POST | /api/links | Create link |
| PUT | /api/links/:id | Update link |
| DELETE | /api/links/:id | Soft-delete link |
| POST | /api/links/reorder | Reorder links |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/profile | Get profile |
| PUT | /api/profile | Update profile |
| POST | /api/profile/avatar | Upload avatar |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/summary | Get summary stats |
| GET | /api/analytics/links | Get per-link stats |

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/public/:handle | Get public profile |
| POST | /api/public/:handle/view | Track page view |
| POST | /api/public/click/:linkId | Track link click |

## Deployment (Vercel)

### Backend
1. Create Vercel project
2. Set root directory: `app_v2/backend`
3. Environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Secret key for tokens

### Frontend
1. Create Vercel project
2. Set root directory: `app_v2/frontend`
3. Framework preset: Vite
4. Environment variables:
   - `VITE_API_URL` - Backend URL (e.g., `https://your-backend.vercel.app/api`)

## Knowledge Base Implementations

| Requirement | Implementation |
|-------------|----------------|
| Dark mode default | Theme state defaults to 'dark' |
| Soft delete links | 30-day recovery window via `isDeleted` + `deletedAt` |
| Password requirements | Min 8 chars, uppercase, lowercase, number |
| Handle rules | 3-30 chars, starts with letter, alphanumeric + _.  |
| Bio length | 150 characters max |
| Avatar size | 5MB max, resized to 400x400 |
| View deduplication | IP hash + 30-minute window |
| Free badge | Shown on free tier profiles |

## License

MIT

