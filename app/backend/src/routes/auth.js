const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Check handle availability
router.get('/check-handle/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    
    // Validate handle format
    if (!/^[a-zA-Z0-9_.]{1,30}$/.test(handle)) {
      return res.json({ available: false, reason: 'Invalid format. Use only letters, numbers, underscores, and periods (max 30 chars)' });
    }
    
    // Must start with a letter
    if (!/^[a-zA-Z]/.test(handle)) {
      return res.json({ available: false, reason: 'Handle must start with a letter' });
    }
    
    // No consecutive periods or underscores
    if (/[_.]{2}/.test(handle)) {
      return res.json({ available: false, reason: 'No consecutive periods or underscores allowed' });
    }
    
    // Minimum 3 characters
    if (handle.length < 3) {
      return res.json({ available: false, reason: 'Handle must be at least 3 characters' });
    }
    
    const existing = await prisma.user.findUnique({ where: { handleLower: handle.toLowerCase() } });
    
    if (existing) {
      // Suggest alternatives
      const suggestions = [];
      for (let i = 1; i <= 3; i++) {
        const suggested = `${handle}${i}`;
        const exists = await prisma.user.findUnique({ where: { handleLower: suggested.toLowerCase() } });
        if (!exists) suggestions.push(suggested);
      }
      return res.json({ available: false, suggestions });
    }
    
    res.json({ available: true });
  } catch (error) {
    console.error('Check handle error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, handle, category } = req.body;
    
    // Validate
    if (!email || !password || !handle) {
      return res.status(400).json({ error: 'Email, password, and handle are required' });
    }
    
    // Validate handle format
    if (!/^[a-zA-Z][a-zA-Z0-9_.]{2,29}$/.test(handle)) {
      return res.status(400).json({ error: 'Invalid handle format. Must start with letter, 3-30 chars, only letters/numbers/underscores/periods' });
    }
    
    // No consecutive periods or underscores
    if (/[_.]{2}/.test(handle)) {
      return res.status(400).json({ error: 'No consecutive periods or underscores allowed' });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    // Check if email or handle exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const existingHandle = await prisma.user.findUnique({ where: { handleLower: handle.toLowerCase() } });
    if (existingHandle) {
      return res.status(400).json({ error: 'Handle already taken' });
    }
    
    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        handle: handle, // Preserve original case
        handleLower: handle.toLowerCase(), // For case-insensitive lookups
        category,
        bioTitle: handle,
      },
    });
    
    const token = generateToken(user);
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        category: user.category,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        planTier: user.planTier,
        avatarUrl: user.avatarUrl,
        bioTitle: user.bioTitle,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        handle: true,
        planTier: true,
        avatarUrl: true,
        bioTitle: true,
        bioDescription: true,
        category: true,
        theme: true,
        backgroundColor: true,
        buttonStyle: true,
        fontFamily: true,
        displayName: true,
        backgroundType: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

