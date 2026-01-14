/**
 * Authentication Routes
 * Handles signup, login, password management
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Password validation (from knowledge base)
const validatePassword = (password) => {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain a lowercase letter' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain an uppercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain a number' };
  return { valid: true };
};

// Handle validation (from PRD + knowledge base)
const validateHandle = (handle) => {
  if (handle.length < 3 || handle.length > 30) {
    return { valid: false, message: 'Handle must be 3-30 characters' };
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(handle)) {
    return { valid: false, message: 'Handle must start with a letter and contain only letters, numbers, underscores, and periods' };
  }
  if (/\.\./.test(handle) || /__/.test(handle)) {
    return { valid: false, message: 'Handle cannot have consecutive periods or underscores' };
  }
  return { valid: true };
};

// Check handle availability
router.get('/check-handle/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const handleLower = handle.toLowerCase();
    
    const validation = validateHandle(handle);
    if (!validation.valid) {
      return res.json({ available: false, message: validation.message });
    }
    
    const existing = await prisma.user.findUnique({
      where: { handleLower }
    });
    
    if (existing) {
      // Generate suggestions
      const suggestions = [];
      for (let i = 1; i <= 3; i++) {
        const suggestion = `${handle}${i}`;
        const exists = await prisma.user.findUnique({
          where: { handleLower: suggestion.toLowerCase() }
        });
        if (!exists) suggestions.push(suggestion);
      }
      
      return res.json({ 
        available: false, 
        message: 'Handle already taken',
        suggestions 
      });
    }
    
    res.json({ available: true });
  } catch (error) {
    console.error('Check handle error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, handle, category } = req.body;
    
    // Validate required fields
    if (!email || !password || !handle) {
      return res.status(400).json({ error: 'Email, password, and handle are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }
    
    // Validate handle
    const handleValidation = validateHandle(handle);
    if (!handleValidation.valid) {
      return res.status(400).json({ error: handleValidation.message });
    }
    
    const handleLower = handle.toLowerCase();
    
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Check if handle already exists
    const existingHandle = await prisma.user.findUnique({
      where: { handleLower }
    });
    if (existingHandle) {
      return res.status(400).json({ error: 'Handle already taken' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        handle,
        handleLower,
        category,
        displayName: handle,
        bioTitle: `@${handle}`,
        theme: 'dark' // Default from knowledge base
      }
    });
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        displayName: user.displayName,
        planTier: user.planTier
      }
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
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        displayName: user.displayName,
        planTier: user.planTier,
        emailVerified: user.emailVerified
      }
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
        displayName: true,
        bioTitle: true,
        bioDescription: true,
        avatarUrl: true,
        category: true,
        theme: true,
        buttonStyle: true,
        fontFamily: true,
        backgroundColor: true,
        backgroundType: true,
        planTier: true,
        emailVerified: true,
        createdAt: true
      }
    });
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }
    
    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash }
    });
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;


