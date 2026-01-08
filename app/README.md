# BioLink - Your Link in Bio Platform

A full-stack Linktree clone built with React and Node.js. Create a beautiful landing page to share all your content, social links, and digital products.

![BioLink Preview](https://via.placeholder.com/800x400?text=BioLink+Preview)

## Features

- 🔗 **Unlimited Links** - Add and manage multiple links with drag & drop reordering
- 🎨 **Full Customization** - Choose from multiple themes, button styles, and fonts
- 📊 **Analytics Dashboard** - Track views, clicks, referrers, and devices
- 📱 **Mobile Optimized** - Fast-loading, responsive design
- 🔐 **User Authentication** - Secure signup/login with JWT
- 👁️ **Live Preview** - See changes in real-time as you edit

## Tech Stack

### Frontend
- React 18 with Vite
- React Router DOM for routing
- @dnd-kit for drag & drop
- Lucide React for icons
- Pure CSS with custom properties

### Backend
- Node.js with Express
- Prisma ORM with PostgreSQL (Neon)
- JWT authentication
- Multer for file uploads
- bcryptjs for password hashing

### Deployment
- Vercel (Frontend & Backend)
- Neon PostgreSQL (Database)

## Live Demo

- **Frontend**: Deployed on Vercel
- **Backend API**: Deployed as Vercel Serverless Functions
- **Database**: Neon PostgreSQL

## Deployment on Vercel

### Prerequisites

- [Vercel account](https://vercel.com/signup)
- [Neon account](https://neon.tech/) for PostgreSQL database
- GitHub repository with this code

### Step 1: Set Up Database

1. Create a new project on [Neon](https://neon.tech/)
2. Copy your PostgreSQL connection string

### Step 2: Deploy Backend

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Root Directory**: `app/backend`
   - **Framework Preset**: Other
5. Add Environment Variables:
   ```
   DATABASE_URL=your-neon-connection-string
   JWT_SECRET=your-secret-key-here
   ```
6. Click "Deploy"

### Step 3: Deploy Frontend

1. Create another new project in Vercel
2. Import the same GitHub repository
3. Configure the project:
   - **Root Directory**: `app/frontend`
   - **Framework Preset**: Vite
4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-deployment.vercel.app/api
   ```
5. Click "Deploy"

### Step 4: Initialize Database

After backend deployment, run Prisma migrations:

```bash
cd app/backend
npx prisma db push
```

Or use Vercel's build command to run migrations automatically by updating `vercel.json`.

## Local Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and navigate to the app folder:**
   ```bash
   cd app
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Create .env file
   echo "DATABASE_URL=file:./dev.db" > .env
   echo "JWT_SECRET=dev-secret-key" >> .env
   ```

4. **Set up the database:**
   ```bash
   npx prisma db push
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   Backend runs on http://localhost:3001

6. **In a new terminal, install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

7. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   Frontend runs on http://localhost:5173

## Project Structure

```
app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── index.js           # Express server entry
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authentication
│   │   └── routes/
│   │       ├── auth.js        # Authentication routes
│   │       ├── links.js       # Link CRUD operations
│   │       ├── profile.js     # Profile management
│   │       ├── analytics.js   # Analytics data
│   │       ├── public.js      # Public profile & tracking
│   │       └── social.js      # Social icons management
│   ├── vercel.json            # Vercel serverless config
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/        # Reusable UI components
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
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vercel.json            # Vercel build config
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/check-handle/:handle` - Check handle availability

### Links
- `GET /api/links` - Get all user links
- `POST /api/links` - Create new link
- `PUT /api/links/:id` - Update link
- `DELETE /api/links/:id` - Delete link
- `POST /api/links/reorder` - Reorder links

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/avatar` - Upload avatar

### Analytics
- `GET /api/analytics/summary` - Get analytics summary
- `GET /api/analytics/links` - Get link statistics

### Public
- `GET /api/public/:handle` - Get public profile
- `POST /api/public/:handle/view` - Track page view
- `POST /api/public/click/:linkId` - Track link click

### Social Icons
- `GET /api/social` - Get social icons
- `POST /api/social` - Add social icon
- `PUT /api/social/:id` - Update social icon
- `DELETE /api/social/:id` - Delete social icon

## Environment Variables

### Backend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key-here` |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-api.vercel.app/api` |

## Usage

1. **Create an account** - Visit the landing page and claim your unique handle
2. **Add links** - Use the dashboard to add links to your profile
3. **Customize** - Change themes, button styles, fonts, and upload an avatar
4. **Share** - Your profile is live at `https://your-app.vercel.app/@yourhandle`
5. **Track** - Monitor views and clicks in the Analytics tab

## Troubleshooting

### Common Issues

**Database connection errors:**
- Ensure your Neon database is active
- Check that `DATABASE_URL` is correctly set in Vercel

**API not responding:**
- Verify `VITE_API_URL` points to your backend deployment
- Check Vercel function logs for errors

**File uploads not working:**
- Vercel serverless functions have read-only filesystems
- Avatar uploads use in-memory storage; for production, integrate with cloud storage (S3, Cloudinary)

## License

MIT License - feel free to use this project for learning or building your own link-in-bio platform!
