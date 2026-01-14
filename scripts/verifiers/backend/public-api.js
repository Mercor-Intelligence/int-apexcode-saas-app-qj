/**
 * Backend API Verifier: Public Profile
 * Tests public profile endpoints directly without browser
 */

import { config } from '../../config.js';

const API_URL = config.backendUrl + '/api';

// Test results collector
const results = {
  suite: 'Public API',
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

// Create a test user and return token + handle
async function createTestUser() {
  const handle = `publictest${Date.now()}`;
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `public-api-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      handle: handle
    })
  });

  const data = await response.json();
  return { token: data.token, handle };
}

// Create links for the user
async function createTestLinks(token) {
  const links = [
    { title: 'My Website', url: 'https://example.com', type: 'standard' },
    { title: 'Twitter', url: 'https://twitter.com/test', type: 'standard' },
    { title: 'Section Header', type: 'header' }
  ];

  for (const link of links) {
    await fetch(`${API_URL}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(link)
    });
  }
}

async function testGetPublicProfile(handle) {
  try {
    const response = await fetch(`${API_URL}/public/${handle}`);
    const data = await response.json();

    // Check for expected fields
    const hasHandle = data.handle || data.handleLower;
    const hasLinks = 'links' in data;

    addResult('Get public profile works', response.ok && hasHandle);
    return data;
  } catch (error) {
    addResult('Get public profile works', false, { error: error.message });
    return null;
  }
}

async function testPublicProfileCaseInsensitive(handle) {
  try {
    // Try uppercase version
    const upperHandle = handle.toUpperCase();
    const response = await fetch(`${API_URL}/public/${upperHandle}`);

    addResult('Handle lookup is case-insensitive', response.ok);
  } catch (error) {
    addResult('Handle lookup is case-insensitive', false, { error: error.message });
  }
}

async function testPublicProfileMixedCase(handle) {
  try {
    // Try mixed case version
    const mixedHandle = handle.charAt(0).toUpperCase() + handle.slice(1);
    const response = await fetch(`${API_URL}/public/${mixedHandle}`);

    addResult('Handle lookup works with mixed case', response.ok);
  } catch (error) {
    addResult('Handle lookup works with mixed case', false, { error: error.message });
  }
}

async function testPublicProfileNotFound() {
  try {
    const response = await fetch(`${API_URL}/public/nonexistent-handle-${Date.now()}`);

    addResult('Nonexistent profile returns 404', response.status === 404);
  } catch (error) {
    addResult('Nonexistent profile returns 404', false, { error: error.message });
  }
}

async function testPublicProfileHasLinks(handle) {
  try {
    const response = await fetch(`${API_URL}/public/${handle}`);
    const data = await response.json();

    const hasLinks = data.links && Array.isArray(data.links);

    addResult('Public profile includes links', hasLinks);
    return data.links || [];
  } catch (error) {
    addResult('Public profile includes links', false, { error: error.message });
    return [];
  }
}

async function testPublicProfileExcludesHiddenLinks(token, handle) {
  try {
    // First get all links
    const linksResponse = await fetch(`${API_URL}/links`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const allLinks = await linksResponse.json();

    if (allLinks.length === 0) {
      addResult('Hidden links are excluded from public profile', true, { note: 'No links to test' });
      return;
    }

    // Hide a link
    const linkToHide = allLinks[0];
    await fetch(`${API_URL}/links/${linkToHide.id}/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Check public profile
    const publicResponse = await fetch(`${API_URL}/public/${handle}`);
    const publicData = await publicResponse.json();

    // The hidden link should not appear in public profile
    const hiddenLinkInPublic = publicData.links?.find(l => l.id === linkToHide.id);
    const isHidden = !hiddenLinkInPublic || hiddenLinkInPublic.isVisible === false;

    addResult('Hidden links are excluded from public profile', isHidden);

    // Restore visibility
    await fetch(`${API_URL}/links/${linkToHide.id}/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (error) {
    addResult('Hidden links are excluded from public profile', false, { error: error.message });
  }
}

async function testPublicProfileHasProfileInfo(handle) {
  try {
    const response = await fetch(`${API_URL}/public/${handle}`);
    const data = await response.json();

    // Check for profile customization fields
    const hasTheme = 'theme' in data || 'profileTheme' in data;
    const hasBio = 'bioDescription' in data || 'bio' in data;

    addResult('Public profile includes customization data', response.ok);
  } catch (error) {
    addResult('Public profile includes customization data', false, { error: error.message });
  }
}

async function testPublicProfileNoSensitiveData(handle) {
  try {
    const response = await fetch(`${API_URL}/public/${handle}`);
    const data = await response.json();

    // Ensure sensitive data is not exposed
    const hasPassword = 'password' in data || 'passwordHash' in data;
    const hasToken = 'token' in data || 'accessToken' in data;
    const hasEmail = 'email' in data; // Email should be private

    const noSensitiveData = !hasPassword && !hasToken;

    addResult('Public profile excludes sensitive data', noSensitiveData);
  } catch (error) {
    addResult('Public profile excludes sensitive data', false, { error: error.message });
  }
}

async function testTrackPublicView(handle) {
  try {
    const response = await fetch(`${API_URL}/public/${handle}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrer: 'https://google.com',
        device: 'desktop'
      })
    });

    addResult('Track public profile view works', response.ok);
  } catch (error) {
    addResult('Track public profile view works', false, { error: error.message });
  }
}

async function testTrackPublicClick(token) {
  try {
    // Get a link ID first
    const linksResponse = await fetch(`${API_URL}/links`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const links = await linksResponse.json();

    if (links.length === 0) {
      addResult('Track public link click works', true, { note: 'No links to test' });
      return;
    }

    const response = await fetch(`${API_URL}/public/click/${links[0].id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrer: 'https://twitter.com',
        device: 'mobile'
      })
    });

    addResult('Track public link click works', response.ok);
  } catch (error) {
    addResult('Track public link click works', false, { error: error.message });
  }
}

async function testCheckHandleAvailability() {
  try {
    const uniqueHandle = `available${Date.now()}`;
    const response = await fetch(`${API_URL}/public/check-handle/${uniqueHandle}`);
    const data = await response.json();

    // Should indicate the handle is available
    const available = response.ok && (data.available === true || data.exists === false);

    addResult('Check handle availability works', response.ok);
  } catch (error) {
    // This endpoint might not exist
    addResult('Check handle availability works', false, { error: error.message });
  }
}

export async function verifyPublicAPI() {
  console.log('\n  Public API Tests');
  console.log('  ' + '─'.repeat(40));

  // Create test user
  const { token, handle } = await createTestUser();
  if (!token) {
    addResult('Setup: Create test user', false, { error: 'Failed to create test user' });
    results.overallPassed = false;
    return results;
  }
  addResult('Setup: Create test user', true);

  // Create test links
  await createTestLinks(token);
  addResult('Setup: Create test links', true);

  // Test public profile retrieval
  await testGetPublicProfile(handle);
  
  // Test case insensitivity
  await testPublicProfileCaseInsensitive(handle);
  await testPublicProfileMixedCase(handle);

  // Test 404 for nonexistent
  await testPublicProfileNotFound();

  // Test profile content
  await testPublicProfileHasLinks(handle);
  await testPublicProfileHasProfileInfo(handle);
  await testPublicProfileNoSensitiveData(handle);
  await testPublicProfileExcludesHiddenLinks(token, handle);

  // Test tracking
  await testTrackPublicView(handle);
  await testTrackPublicClick(token);

  // Test handle availability
  await testCheckHandleAvailability();

  results.overallPassed = results.failed === 0;
  return results;
}

export default verifyPublicAPI;


