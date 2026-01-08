/**
 * Configuration for browser verification scripts
 * Supports both local development and production (Vercel) environments
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Base URLs - override with environment variables for production testing
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
  
  // Test user credentials (generated for each test run)
  testUser: {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `testuser${Date.now()}`,
    displayName: 'Test User',
    bio: 'This is a test bio for automated verification'
  },
  
  // Browser settings
  browser: {
    headless: process.env.HEADLESS !== 'false', // Default to headless
    slowMo: parseInt(process.env.SLOW_MO) || 0, // Slow down for debugging
    timeout: parseInt(process.env.TIMEOUT) || 30000
  },
  
  // Verification settings
  verification: {
    screenshotOnFailure: true,
    screenshotDir: './screenshots'
  }
};

export default config;

