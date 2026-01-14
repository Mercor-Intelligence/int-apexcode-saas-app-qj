# BioLink v3 — Link-in-Bio Platform

Fresh implementation of the BioLink app (frontend + backend) based on `product_requirements_doc.md` and `knowledge_base.md`. Uses the shared Neon PostgreSQL database alongside prior versions (v1/v2) and targets Vercel for deployment.

## Tech Stack
- Frontend: React 18, Vite, React Router, @dnd-kit
- Backend: Node.js, Express, Prisma, JWT
- Database: PostgreSQL (Neon, shared with v1/v2)
- Hosting: Vercel (frontend + serverless backend)

## Local Setup

### Prerequisites
- Node.js 18+
- npm

### Backend
```bash
cd app_v3/backend
npm install

# .env (use the shared Neon connection)
cat > .env <<'EOF'
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
JWT_SECRET=dev-secret-key
PORT=3001
FRONTEND_URL=http://localhost:5173
EOF

npx prisma db push
npm run dev
```

### Frontend
```bash
cd app_v3/frontend
npm install

# .env
cat > .env <<'EOF'
VITE_API_URL=http://localhost:3001/api
EOF

npm run dev
# Opens http://localhost:5173
```

## Deployment (Vercel)
- Backend project root: `app_v3/backend`
  - Env: `DATABASE_URL` (shared Neon), `JWT_SECRET`
  - Build command: `npm run build` (includes `prisma generate`)
- Frontend project root: `app_v3/frontend`
  - Env: `VITE_API_URL=https://<v3-backend>.vercel.app/api`

## Project Structure
```
app_v3/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── index.js          # Express entry
│   │   ├── middleware/auth.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── links.js
│   │       ├── profile.js
│   │       ├── analytics.js
│   │       ├── public.js
│   │       └── social.js
│   └── vercel.json
├── frontend/
│   ├── src/
│   │   ├── components/*.jsx
│   │   ├── pages/*.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── styles/global.css
│   │   └── utils/api.js
│   ├── index.html
│   └── vercel.json
└── README.md
```

## BrowserBase Verifiers (reuse existing scripts)
- Config: `scripts/.env` (set `FRONTEND_URL`, `BACKEND_URL`, `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` for v3 deploy)
- Run all (frontend + backend) with v3 trajectory naming:
  ```bash
  node scripts/run-with-trajectory.js --all --v3
  ```
  Results will be saved to `trajectory_v3_<n>/`.
- Backend-only:
  ```bash
  node scripts/run-with-trajectory.js --backend --v3
  ```

## Notes from Knowledge Base
- Default dark theme; primary color `#FF6B35`
- Handles: 3–30 chars, start with a letter, letters/numbers/._ allowed
- Bio: max 150 chars; titles: max 60
- Links open in a new tab by default; soft-delete links with recovery window
- Track views/clicks with referrer, device, country; CTR reported in analytics

## License
MIT

