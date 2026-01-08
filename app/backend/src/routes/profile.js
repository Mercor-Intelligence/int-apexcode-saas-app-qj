const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for avatar uploads
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

// Get profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        links: { orderBy: { position: 'asc' } },
        socialIcons: { orderBy: { position: 'asc' } },
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      handle: user.handle,
      email: user.email,
      planTier: user.planTier,
      avatarUrl: user.avatarUrl,
      bioTitle: user.bioTitle,
      bioDescription: user.bioDescription,
      category: user.category,
      theme: user.theme,
      backgroundColor: user.backgroundColor,
      buttonStyle: user.buttonStyle,
      fontFamily: user.fontFamily,
      metaTitle: user.metaTitle,
      metaDescription: user.metaDescription,
      links: user.links,
      socialIcons: user.socialIcons,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const {
      bioTitle,
      bioDescription,
      theme,
      backgroundColor,
      buttonStyle,
      fontFamily,
      metaTitle,
      metaDescription,
    } = req.body;
    
    const updateData = {};
    if (bioTitle !== undefined) updateData.bioTitle = bioTitle?.substring(0, 60);
    if (bioDescription !== undefined) updateData.bioDescription = bioDescription?.substring(0, 80);
    if (theme !== undefined) updateData.theme = theme;
    if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
    if (buttonStyle !== undefined) updateData.buttonStyle = buttonStyle;
    if (fontFamily !== undefined) updateData.fontFamily = fontFamily;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });
    
    res.json({
      id: user.id,
      handle: user.handle,
      bioTitle: user.bioTitle,
      bioDescription: user.bioDescription,
      theme: user.theme,
      backgroundColor: user.backgroundColor,
      buttonStyle: user.buttonStyle,
      fontFamily: user.fontFamily,
      metaTitle: user.metaTitle,
      metaDescription: user.metaDescription,
    });
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
    
    const avatarUrl = `/uploads/${req.file.filename}`;
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
    });
    
    res.json({ avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

