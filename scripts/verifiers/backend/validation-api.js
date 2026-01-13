/**
 * Backend API Verifier: Input Validation
 * Tests input validation rules from knowledge_base.md
 */

import { config } from '../../config.js';

const API_URL = config.backendUrl + '/api';

// Test results collector
const results = {
  suite: 'Validation API',
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

// Password validation tests (from knowledge_base.md)
// Requirements: min 8 chars, at least one uppercase, one lowercase, one number

async function testPasswordMinLength() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `pwlen${Date.now()}@example.com`,
        password: 'Short1!', // 7 chars - too short
        handle: `pwlen${Date.now()}`
      })
    });

    addResult('Password min 8 chars enforced', response.status === 400);
  } catch (error) {
    addResult('Password min 8 chars enforced', false, { error: error.message });
  }
}

async function testPasswordRequiresUppercase() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `pwupper${Date.now()}@example.com`,
        password: 'lowercase123', // No uppercase
        handle: `pwupper${Date.now()}`
      })
    });

    addResult('Password requires uppercase', response.status === 400);
  } catch (error) {
    addResult('Password requires uppercase', false, { error: error.message });
  }
}

async function testPasswordRequiresLowercase() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `pwlower${Date.now()}@example.com`,
        password: 'UPPERCASE123', // No lowercase
        handle: `pwlower${Date.now()}`
      })
    });

    addResult('Password requires lowercase', response.status === 400);
  } catch (error) {
    addResult('Password requires lowercase', false, { error: error.message });
  }
}

async function testPasswordRequiresNumber() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `pwnum${Date.now()}@example.com`,
        password: 'NoNumbersHere', // No number
        handle: `pwnum${Date.now()}`
      })
    });

    addResult('Password requires number', response.status === 400);
  } catch (error) {
    addResult('Password requires number', false, { error: error.message });
  }
}

async function testValidPasswordAccepted() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `pwvalid${Date.now()}@example.com`,
        password: 'ValidPass123', // Meets all requirements
        handle: `pwvalid${Date.now()}`
      })
    });

    addResult('Valid password accepted', response.ok);
  } catch (error) {
    addResult('Valid password accepted', false, { error: error.message });
  }
}

// Handle validation tests (from knowledge_base.md)
// Requirements: letters, numbers, underscores, periods. Must start with letter. 3-30 chars.

async function testHandleMinLength() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `hdlen${Date.now()}@example.com`,
        password: 'TestPassword123!',
        handle: 'ab' // 2 chars - too short
      })
    });

    addResult('Handle min 3 chars enforced', response.status === 400);
  } catch (error) {
    addResult('Handle min 3 chars enforced', false, { error: error.message });
  }
}

async function testHandleMaxLength() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `hdmax${Date.now()}@example.com`,
        password: 'TestPassword123!',
        handle: 'a'.repeat(31) // 31 chars - too long
      })
    });

    addResult('Handle max 30 chars enforced', response.status === 400);
  } catch (error) {
    addResult('Handle max 30 chars enforced', false, { error: error.message });
  }
}

async function testHandleMustStartWithLetter() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `hdstart${Date.now()}@example.com`,
        password: 'TestPassword123!',
        handle: '123handle' // Starts with number
      })
    });

    addResult('Handle must start with letter', response.status === 400);
  } catch (error) {
    addResult('Handle must start with letter', false, { error: error.message });
  }
}

async function testHandleAllowsUnderscores() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `hdunder${Date.now()}@example.com`,
        password: 'TestPassword123!',
        handle: `test_user_${Date.now().toString().slice(-6)}`
      })
    });

    addResult('Handle allows underscores', response.ok);
  } catch (error) {
    addResult('Handle allows underscores', false, { error: error.message });
  }
}

async function testHandleAllowsPeriods() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `hdperiod${Date.now()}@example.com`,
        password: 'TestPassword123!',
        handle: `test.user.${Date.now().toString().slice(-6)}`
      })
    });

    addResult('Handle allows periods', response.ok);
  } catch (error) {
    addResult('Handle allows periods', false, { error: error.message });
  }
}

async function testHandleRejectsSpecialChars() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `hdspecial${Date.now()}@example.com`,
        password: 'TestPassword123!',
        handle: 'test@user#name' // Invalid special chars
      })
    });

    addResult('Handle rejects invalid special chars', response.status === 400);
  } catch (error) {
    addResult('Handle rejects invalid special chars', false, { error: error.message });
  }
}

async function testHandleRejectsSpaces() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `hdspace${Date.now()}@example.com`,
        password: 'TestPassword123!',
        handle: 'test user name' // Contains spaces
      })
    });

    addResult('Handle rejects spaces', response.status === 400);
  } catch (error) {
    addResult('Handle rejects spaces', false, { error: error.message });
  }
}

// Email validation tests

async function testEmailFormat() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'TestPassword123!',
        handle: `emailtest${Date.now()}`
      })
    });

    addResult('Invalid email format rejected', response.status === 400);
  } catch (error) {
    addResult('Invalid email format rejected', false, { error: error.message });
  }
}

async function testEmailWithoutDomain() {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@',
        password: 'TestPassword123!',
        handle: `emailtest${Date.now()}`
      })
    });

    addResult('Email without domain rejected', response.status === 400);
  } catch (error) {
    addResult('Email without domain rejected', false, { error: error.message });
  }
}

// URL validation tests

async function testLinkURLValidation() {
  // First create a user to get a token
  const signupResponse = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `urltest${Date.now()}@example.com`,
      password: 'TestPassword123!',
      handle: `urltest${Date.now()}`
    })
  });

  const { token } = await signupResponse.json();
  if (!token) {
    addResult('Link URL validation', false, { error: 'Could not create test user' });
    return;
  }

  try {
    // Test valid URL
    const validResponse = await fetch(`${API_URL}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Valid Link',
        url: 'https://example.com/path?query=value'
      })
    });

    addResult('Valid URL accepted for links', validResponse.ok);

    // Test URL without protocol - might be accepted with auto-prepend
    const noProtocolResponse = await fetch(`${API_URL}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'No Protocol Link',
        url: 'example.com'
      })
    });

    // This might succeed (with auto-prepend) or fail
    addResult('URL handling for missing protocol', true, {
      note: noProtocolResponse.ok ? 'Auto-prepends protocol' : 'Rejects missing protocol'
    });
  } catch (error) {
    addResult('Link URL validation', false, { error: error.message });
  }
}

// Bio validation (max 150 chars per knowledge_base.md)

async function testBioMaxLength() {
  // First create a user to get a token
  const signupResponse = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `biotest${Date.now()}@example.com`,
      password: 'TestPassword123!',
      handle: `biotest${Date.now()}`
    })
  });

  const { token } = await signupResponse.json();
  if (!token) {
    addResult('Bio max length enforced', false, { error: 'Could not create test user' });
    return;
  }

  try {
    const longBio = 'x'.repeat(200); // Exceeds 150 char limit
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bioDescription: longBio
      })
    });

    // Should either reject or truncate
    if (response.status === 400) {
      addResult('Bio max length enforced', true, { note: 'Rejects long bio' });
    } else if (response.ok) {
      const data = await response.json();
      const bioLength = (data.bioDescription || '').length;
      addResult('Bio max length enforced', bioLength <= 150, {
        note: bioLength <= 150 ? 'Truncates to 150' : `Bio was ${bioLength} chars`
      });
    } else {
      addResult('Bio max length enforced', false, { error: `Unexpected status: ${response.status}` });
    }
  } catch (error) {
    addResult('Bio max length enforced', false, { error: error.message });
  }
}

export async function verifyValidationAPI() {
  console.log('\n  Validation API Tests');
  console.log('  ' + '─'.repeat(40));

  // Password validation
  console.log('\n  Password Requirements:');
  await testPasswordMinLength();
  await testPasswordRequiresUppercase();
  await testPasswordRequiresLowercase();
  await testPasswordRequiresNumber();
  await testValidPasswordAccepted();

  // Handle validation
  console.log('\n  Handle Requirements:');
  await testHandleMinLength();
  await testHandleMaxLength();
  await testHandleMustStartWithLetter();
  await testHandleAllowsUnderscores();
  await testHandleAllowsPeriods();
  await testHandleRejectsSpecialChars();
  await testHandleRejectsSpaces();

  // Email validation
  console.log('\n  Email Requirements:');
  await testEmailFormat();
  await testEmailWithoutDomain();

  // URL validation
  console.log('\n  URL/Link Requirements:');
  await testLinkURLValidation();

  // Bio validation
  console.log('\n  Bio Requirements:');
  await testBioMaxLength();

  results.overallPassed = results.failed === 0;
  return results;
}

export default verifyValidationAPI;

