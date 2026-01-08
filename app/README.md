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
- Prisma ORM with SQLite
- JWT authentication
- Multer for file uploads
- bcryptjs for password hashing

## Getting Started

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

3. **Set up the database:**
   ```bash
   npx prisma db push
   ```

4. **Start the backend server:**
   ```bash
   npm run dev
   ```
   Backend runs on http://localhost:3001

5. **In a new terminal, install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

6. **Start the frontend development server:**
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

Create a `.env` file in the backend folder:

```env
JWT_SECRET=your-secret-key-here
PORT=3001
```

## Usage

1. **Create an account** - Visit the landing page and claim your unique handle
2. **Add links** - Use the dashboard to add links to your profile
3. **Customize** - Change themes, button styles, fonts, and upload an avatar
4. **Share** - Your profile is live at `http://localhost:5173/yourhandle`
5. **Track** - Monitor views and clicks in the Analytics tab

## License

MIT License - feel free to use this project for learning or building your own link-in-bio platform!

