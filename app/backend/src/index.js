const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const linksRoutes = require('./routes/links');
const profileRoutes = require('./routes/profile');
const analyticsRoutes = require('./routes/analytics');
const publicRoutes = require('./routes/public');
const socialRoutes = require('./routes/social');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/social', socialRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 BioLink API running on http://localhost:${PORT}`);
});

