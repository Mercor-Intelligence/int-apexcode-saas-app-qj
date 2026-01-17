/**
 * Frontend Browser Verifiers Index
 * Exports all frontend/browser verifiers
 */

// Basic verifiers
export { default as verifySignup } from './signup.js';
export { default as verifyLogin } from './login.js';
export { default as verifyLinks } from './links.js';
export { default as verifyProfile } from './profile.js';
export { default as verifyPublicProfile } from './public-profile.js';
export { default as verifyAnalytics } from './analytics.js';
export { default as verifyFullJourney } from './full-journey.js';

// Advanced verifiers
export { default as verifyPasswordValidation } from './password-validation.js';
export { default as verifyHandleValidation } from './handle-validation.js';
export { default as verifyBioLimits } from './bio-limits.js';
export { default as verifyLinkBehavior } from './link-behavior.js';
export { default as verifyThemeAnd404 } from './theme-and-404.js';
export { default as verifyAnalyticsAdvanced } from './analytics-advanced.js';
export { default as verifyResponsiveA11y } from './responsive-a11y.js';

// Primitive-based verifiers (for harness demo)
export { default as verifyNetworkIntercept } from './network-intercept.js';
export { default as verifyScreenshotEval } from './screenshot-eval.js';

// Grouped exports for easy iteration
export const basicVerifiers = [
  { name: 'Signup', module: './signup.js' },
  { name: 'Login', module: './login.js' },
  { name: 'Links', module: './links.js' },
  { name: 'Profile', module: './profile.js' },
  { name: 'Public Profile', module: './public-profile.js' },
  { name: 'Analytics', module: './analytics.js' }
];

export const advancedVerifiers = [
  { name: 'Password Validation', module: './password-validation.js' },
  { name: 'Handle Validation', module: './handle-validation.js' },
  { name: 'Bio Limits', module: './bio-limits.js' },
  { name: 'Link Behavior', module: './link-behavior.js' },
  { name: 'Theme & 404', module: './theme-and-404.js' },
  { name: 'Advanced Analytics', module: './analytics-advanced.js' },
  { name: 'Responsive & A11y', module: './responsive-a11y.js' }
];

export const primitiveVerifiers = [
  { name: 'Network Intercept', module: './network-intercept.js' },
  { name: 'Screenshot Eval', module: './screenshot-eval.js' }
];

export default [...basicVerifiers, ...advancedVerifiers, ...primitiveVerifiers];


