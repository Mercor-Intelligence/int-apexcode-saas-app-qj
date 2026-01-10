/**
 * Profile Management Routes
 * Handles profile updates and avatar uploads
 */

import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Memory storage for serverless environment
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB from knowledge base
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed'));
  }
});

// Get profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
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
        createdAt: true
      }
    });
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const {
      displayName,
      bioTitle,
      bioDescription,
      theme,
      buttonStyle,
      fontFamily,
      backgroundColor,
      backgroundType
    } = req.body;
    
    const updateData = {};
    
    // Validate and set fields
    if (displayName !== undefined) {
      updateData.displayName = displayName.substring(0, 50);
    }
    
    if (bioTitle !== undefined) {
      // Max 60 chars from PRD
      updateData.bioTitle = bioTitle.substring(0, 60);
    }
    
    if (bioDescription !== undefined) {
      // Max 150 chars from knowledge base
      updateData.bioDescription = bioDescription.substring(0, 150);
    }
    
    if (theme !== undefined) {
      const validThemes = ['dark', 'light', 'sunset', 'ocean', 'forest', 'neon', 'minimal'];
      if (validThemes.includes(theme)) {
        updateData.theme = theme;
      }
    }
    
    if (buttonStyle !== undefined) {
      const validStyles = ['rounded', 'rectangular', 'pill', 'outline', 'shadow', 'gradient'];
      if (validStyles.includes(buttonStyle)) {
        updateData.buttonStyle = buttonStyle;
      }
    }
    
    if (fontFamily !== undefined) {
      const validFonts = ['Inter', 'Poppins', 'Roboto', 'Playfair Display', 'Montserrat', 'Open Sans', 'Lato', 'Space Grotesk'];
      if (validFonts.includes(fontFamily)) {
        updateData.fontFamily = fontFamily;
      }
    }
    
    if (backgroundColor !== undefined) {
      updateData.backgroundColor = backgroundColor;
    }
    
    if (backgroundType !== undefined) {
      const validTypes = ['solid', 'gradient', 'image'];
      if (validTypes.includes(backgroundType)) {
        updateData.backgroundType = backgroundType;
      }
    }
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        handle: true,
        displayName: true,
        bioTitle: true,
        bioDescription: true,
        avatarUrl: true,
        theme: true,
        buttonStyle: true,
        fontFamily: true,
        backgroundColor: true,
        backgroundType: true
      }
    });
    
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    // For now, store as base64 data URL
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: dataUrl },
      select: {
        id: true,
        avatarUrl: true
      }
    });
    
    res.json({ 
      success: true, 
      avatarUrl: user.avatarUrl 
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove avatar
router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: null }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Remove avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available themes
router.get('/themes', (req, res) => {
  const themes = [
    { id: 'dark', name: 'Dark', colors: { bg: '#0a0a0a', text: '#ffffff', primary: '#FF6B35' } },
    { id: 'light', name: 'Light', colors: { bg: '#ffffff', text: '#1a1a1a', primary: '#FF6B35' } },
    { id: 'sunset', name: 'Sunset', colors: { bg: 'linear-gradient(135deg, #764ba2, #f093fb)', text: '#ffffff', primary: '#ffffff' } },
    { id: 'ocean', name: 'Ocean', colors: { bg: 'linear-gradient(135deg, #1a2a6c, #2980B9)', text: '#ffffff', primary: '#00d4ff' } },
    { id: 'forest', name: 'Forest', colors: { bg: 'linear-gradient(135deg, #134E5E, #71B280)', text: '#ffffff', primary: '#9fffe0' } },
    { id: 'neon', name: 'Neon', colors: { bg: '#0a0014', text: '#ffffff', primary: '#ff00ff' } },
    { id: 'minimal', name: 'Minimal', colors: { bg: '#f5f5f5', text: '#333333', primary: '#333333' } }
  ];
  
  res.json(themes);
});

// Get available fonts
router.get('/fonts', (req, res) => {
  const fonts = [
    { id: 'Inter', name: 'Inter', category: 'sans-serif' },
    { id: 'Poppins', name: 'Poppins', category: 'sans-serif' },
    { id: 'Roboto', name: 'Roboto', category: 'sans-serif' },
    { id: 'Playfair Display', name: 'Playfair Display', category: 'serif' },
    { id: 'Montserrat', name: 'Montserrat', category: 'sans-serif' },
    { id: 'Open Sans', name: 'Open Sans', category: 'sans-serif' },
    { id: 'Lato', name: 'Lato', category: 'sans-serif' },
    { id: 'Space Grotesk', name: 'Space Grotesk', category: 'sans-serif' }
  ];
  
  res.json(fonts);
});

export default router;

