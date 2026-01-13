/**
 * Backend API Verifier: Authentication
 * Tests auth endpoints directly without browser
 */

import { config } from '../../config.js';

const API_URL = config.backendUrl + '/api';

// Test results collector
const results = {
  suite: 'Auth API',
  tests: [],
  passed: 0,
  failed: 0,
  total: 0
};

function addResult(name, passed, details = {}) {
  results.tests.push({ name, passed, ...details });
  results.total++;
  if (passed) results.passed++;
  else results.failed++;
  console.log(`  ${passed ? '✓' : '✗'} ${name}`);
  if (details.error) console.log(`    Error: ${details.error}`);
}

async function testSignup() {
  const testEmail = `api-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testHandle = `apitest${Date.now()}`;

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        handle: testHandle
      })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      addResult('Signup returns token', true);
      return { token: data.token, email: testEmail, password: testPassword, handle: testHandle };
    } else {
      addResult('Signup returns token', false, { error: data.error || 'No token returned' });
      return null;
    }
  } catch (error) {
    addResult('Signup returns token', false, { error: error.message });
    return null;
  }
}

async function testSignupDuplicateEmail(email) {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: 'TestPassword123!',
        handle: `dup${Date.now()}`
      })
    });

    const data = await response.json();

    // Should fail with 400
    addResult('Duplicate email rejected', response.status === 400, {
      error: response.ok ? 'Should have rejected duplicate email' : null
    });
  } catch (error) {
    addResult('Duplicate email rejected', false, { error: error.message });
  }
}

async function testSignupDuplicateHandle(handle) {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `unique${Date.now()}@example.com`,
        password: 'TestPassword123!',
        handle: handle
      })
    });

    const data = await response.json();

    // Should fail with 400
    addResult('Duplicate handle rejected', response.status === 400, {
      error: response.ok ? 'Should have rejected duplicate handle' : null
    });
  } catch (error) {
    addResult('Duplicate handle rejected', false, { error: error.message });
  }
}

async function testSignupWeakPassword() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `weak${Date.now()}@example.com`,
        password: '123', // Too short
        handle: `weak${Date.now()}`
      })
    });

    addResult('Weak password rejected', response.status === 400);
  } catch (error) {
    addResult('Weak password rejected', false, { error: error.message });
  }
}

async function testSignupInvalidEmail() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'TestPassword123!',
        handle: `invalid${Date.now()}`
      })
    });

    addResult('Invalid email rejected', response.status === 400);
  } catch (error) {
    addResult('Invalid email rejected', false, { error: error.message });
  }
}

async function testLogin(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      addResult('Login returns token', true);
      return data.token;
    } else {
      addResult('Login returns token', false, { error: data.error || 'No token' });
      return null;
    }
  } catch (error) {
    addResult('Login returns token', false, { error: error.message });
    return null;
  }
}

async function testLoginWrongPassword(email) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'WrongPassword123!' })
    });

    addResult('Wrong password rejected', response.status === 401);
  } catch (error) {
    addResult('Wrong password rejected', false, { error: error.message });
  }
}

async function testLoginNonexistentUser() {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `nonexistent${Date.now()}@example.com`,
        password: 'TestPassword123!'
      })
    });

    addResult('Nonexistent user rejected', response.status === 401);
  } catch (error) {
    addResult('Nonexistent user rejected', false, { error: error.message });
  }
}

async function testTokenValidation(token) {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    addResult('Token validation works', response.ok && data.email);
  } catch (error) {
    addResult('Token validation works', false, { error: error.message });
  }
}

async function testInvalidToken() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': 'Bearer invalid-token-12345' }
    });

    addResult('Invalid token rejected', response.status === 401 || response.status === 403);
  } catch (error) {
    addResult('Invalid token rejected', false, { error: error.message });
  }
}

async function testNoToken() {
  try {
    const response = await fetch(`${API_URL}/auth/me`);

    addResult('No token rejected', response.status === 401 || response.status === 403);
  } catch (error) {
    addResult('No token rejected', false, { error: error.message });
  }
}

export async function verifyAuthAPI() {
  console.log('\n  Auth API Tests');
  console.log('  ' + '─'.repeat(40));

  // Test signup
  const signupResult = await testSignup();

  if (signupResult) {
    // Test duplicate email
    await testSignupDuplicateEmail(signupResult.email);

    // Test duplicate handle
    await testSignupDuplicateHandle(signupResult.handle);

    // Test login
    const loginToken = await testLogin(signupResult.email, signupResult.password);

    // Test wrong password
    await testLoginWrongPassword(signupResult.email);

    // Test token validation
    if (loginToken) {
      await testTokenValidation(loginToken);
    }
  }

  // Test weak password
  await testSignupWeakPassword();

  // Test invalid email
  await testSignupInvalidEmail();

  // Test nonexistent user login
  await testLoginNonexistentUser();

  // Test invalid token
  await testInvalidToken();

  // Test no token
  await testNoToken();

  results.overallPassed = results.failed === 0;
  return results;
}

export default verifyAuthAPI;

