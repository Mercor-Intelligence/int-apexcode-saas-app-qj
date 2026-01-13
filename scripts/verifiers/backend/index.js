/**
 * Backend API Verifiers Index
 * Exports all backend verifiers
 */

export { verifyAuthAPI } from './auth-api.js';
export { verifyLinksAPI } from './links-api.js';
export { verifyProfileAPI } from './profile-api.js';
export { verifyAnalyticsAPI } from './analytics-api.js';
export { verifyPublicAPI } from './public-api.js';
export { verifyValidationAPI } from './validation-api.js';

// Default export as array for easy iteration
export default [
  { name: 'Auth API', module: './auth-api.js' },
  { name: 'Links API', module: './links-api.js' },
  { name: 'Profile API', module: './profile-api.js' },
  { name: 'Analytics API', module: './analytics-api.js' },
  { name: 'Public API', module: './public-api.js' },
  { name: 'Validation API', module: './validation-api.js' }
];

