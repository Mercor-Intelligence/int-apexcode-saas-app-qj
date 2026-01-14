/**
 * Backend API Verifier: Links
 * Tests link CRUD operations directly without browser
 */

import { config } from '../../config.js';

const API_URL = config.backendUrl + '/api';

// Test results collector
const results = {
  suite: 'Links API',
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

// Create a test user and return token
async function createTestUser() {
  const testEmail = `links-api-${Date.now()}@example.com`;
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'TestPassword123!',
      handle: `linkstest${Date.now()}`
    })
  });

  const data = await response.json();
  return data.token;
}

async function testCreateLink(token) {
  try {
    const response = await fetch(`${API_URL}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Link',
        url: 'https://example.com',
        type: 'standard'
      })
    });

    const data = await response.json();

    if (response.ok && data.id) {
      addResult('Create link works', true);
      return data.id;
    } else {
      addResult('Create link works', false, { error: data.error || 'No ID returned' });
      return null;
    }
  } catch (error) {
    addResult('Create link works', false, { error: error.message });
    return null;
  }
}

async function testCreateLinkNoAuth() {
  try {
    const response = await fetch(`${API_URL}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unauthorized Link',
        url: 'https://example.com'
      })
    });

    addResult('Create link requires auth', response.status === 401 || response.status === 403);
  } catch (error) {
    addResult('Create link requires auth', false, { error: error.message });
  }
}

async function testGetLinks(token) {
  try {
    const response = await fetch(`${API_URL}/links`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    addResult('Get links returns array', response.ok && Array.isArray(data));
    return data;
  } catch (error) {
    addResult('Get links returns array', false, { error: error.message });
    return [];
  }
}

async function testUpdateLink(token, linkId) {
  try {
    const response = await fetch(`${API_URL}/links/${linkId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Updated Link Title',
        url: 'https://updated-example.com'
      })
    });

    const data = await response.json();

    addResult('Update link works', response.ok && data.title === 'Updated Link Title');
  } catch (error) {
    addResult('Update link works', false, { error: error.message });
  }
}

async function testToggleVisibility(token, linkId) {
  try {
    const response = await fetch(`${API_URL}/links/${linkId}/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    addResult('Toggle visibility works', response.ok);
  } catch (error) {
    addResult('Toggle visibility works', false, { error: error.message });
  }
}

async function testDeleteLink(token, linkId) {
  try {
    const response = await fetch(`${API_URL}/links/${linkId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    addResult('Delete link works (soft delete)', response.ok);
    return response.ok;
  } catch (error) {
    addResult('Delete link works (soft delete)', false, { error: error.message });
    return false;
  }
}

async function testRestoreLink(token, linkId) {
  try {
    const response = await fetch(`${API_URL}/links/${linkId}/restore`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    addResult('Restore deleted link works', response.ok);
  } catch (error) {
    addResult('Restore deleted link works', false, { error: error.message });
  }
}

async function testReorderLinks(token, linkIds) {
  try {
    // Try POST format
    let response = await fetch(`${API_URL}/links/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ linkIds: linkIds.reverse() })
    });

    if (!response.ok) {
      // Try PUT format
      response = await fetch(`${API_URL}/links/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          links: linkIds.map((id, idx) => ({ id, position: idx }))
        })
      });
    }

    addResult('Reorder links works', response.ok);
  } catch (error) {
    addResult('Reorder links works', false, { error: error.message });
  }
}

async function testCreateHeaderLink(token) {
  try {
    const response = await fetch(`${API_URL}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Section Header',
        type: 'header'
      })
    });

    const data = await response.json();

    addResult('Create header link works', response.ok && data.type === 'header');
  } catch (error) {
    addResult('Create header link works', false, { error: error.message });
  }
}

async function testCreateLinkWithThumbnail(token) {
  try {
    const response = await fetch(`${API_URL}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Link with Thumbnail',
        url: 'https://example.com',
        thumbnail: 'https://via.placeholder.com/150'
      })
    });

    const data = await response.json();

    addResult('Create link with thumbnail works', response.ok && data.id);
  } catch (error) {
    addResult('Create link with thumbnail works', false, { error: error.message });
  }
}

async function testUpdateNonexistentLink(token) {
  try {
    const response = await fetch(`${API_URL}/links/nonexistent-id-12345`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: 'Should Fail' })
    });

    addResult('Update nonexistent link returns 404', response.status === 404);
  } catch (error) {
    addResult('Update nonexistent link returns 404', false, { error: error.message });
  }
}

async function testDeleteNonexistentLink(token) {
  try {
    const response = await fetch(`${API_URL}/links/nonexistent-id-12345`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    addResult('Delete nonexistent link returns 404', response.status === 404);
  } catch (error) {
    addResult('Delete nonexistent link returns 404', false, { error: error.message });
  }
}

export async function verifyLinksAPI() {
  console.log('\n  Links API Tests');
  console.log('  ' + '─'.repeat(40));

  // Create test user
  const token = await createTestUser();
  if (!token) {
    addResult('Setup: Create test user', false, { error: 'Failed to create test user' });
    results.overallPassed = false;
    return results;
  }
  addResult('Setup: Create test user', true);

  // Test create link without auth
  await testCreateLinkNoAuth();

  // Test create link
  const linkId1 = await testCreateLink(token);

  // Create more links for reorder test
  const linkId2 = await testCreateLink(token);

  // Test get links
  const links = await testGetLinks(token);

  if (linkId1) {
    // Test update link
    await testUpdateLink(token, linkId1);

    // Test toggle visibility
    await testToggleVisibility(token, linkId1);
  }

  // Test reorder if we have multiple links
  const linkIds = links.map(l => l.id);
  if (linkIds.length >= 2) {
    await testReorderLinks(token, linkIds);
  }

  // Test create header link
  await testCreateHeaderLink(token);

  // Test create link with thumbnail
  await testCreateLinkWithThumbnail(token);

  // Test delete and restore
  if (linkId1) {
    const deleted = await testDeleteLink(token, linkId1);
    if (deleted) {
      await testRestoreLink(token, linkId1);
    }
  }

  // Test nonexistent link operations
  await testUpdateNonexistentLink(token);
  await testDeleteNonexistentLink(token);

  results.overallPassed = results.failed === 0;
  return results;
}

export default verifyLinksAPI;


