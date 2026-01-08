/**
 * Configuration for BrowserBase verification scripts
 * Uses BrowserBase cloud browsers for automated testing
 */

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // BrowserBase configuration
  browserbase: {
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID
  },
  
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
    timeout: parseInt(process.env.TIMEOUT) || 30000
  },
  
  // Verification settings
  verification: {
    screenshotOnFailure: true,
    screenshotDir: './screenshots'
  }
};

export default config;

