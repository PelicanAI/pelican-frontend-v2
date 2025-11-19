#!/usr/bin/env node

/**
 * Standalone Sentry Integration Test
 * Tests Sentry without needing the full Next.js server
 */

const https = require('https');

console.log('\n🔍 Pelican Sentry Integration Test\n');
console.log('=' .repeat(50));

// Test 1: Verify Sentry DSN is configured
console.log('\n✓ TEST 1: Sentry Configuration Check');
console.log('-'.repeat(50));

const sentryDSN = 'https://d77e0a5be44d5c1dddfddebe2ac38a90@o4510343032799232.ingest.us.sentry.io/4510343040663552';

if (sentryDSN && sentryDSN.includes('sentry.io')) {
  console.log('✅ Sentry DSN is configured');
  console.log(`   DSN: ${sentryDSN.replace(/:\w+@/, ':***@')}`);
  
  // Parse DSN
  const match = sentryDSN.match(/https:\/\/(.+)@(.+)\/(\d+)/);
  if (match) {
    const [, key, host, projectId] = match;
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Host: ${host}`);
  }
} else {
  console.log('❌ Sentry DSN not found or invalid');
  process.exit(1);
}

// Test 2: Verify Sentry configs exist
console.log('\n✓ TEST 2: Configuration Files Check');
console.log('-'.repeat(50));

const fs = require('fs');
const path = require('path');

const configFiles = [
  'sentry.server.config.ts',
  'sentry.edge.config.ts',
  'instrumentation-client.ts',
  'instrumentation.ts',
  'lib/sentry-helper.ts',
  'components/sentry-error-boundary.tsx',
  'app/api/monitoring/sentry/route.ts'
];

let allFilesExist = true;
configFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  if (exists) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - NOT FOUND`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n⚠️  Some configuration files are missing');
  process.exit(1);
}

// Test 3: Check Sentry package
console.log('\n✓ TEST 3: Sentry Package Check');
console.log('-'.repeat(50));

try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const sentryVersion = packageJson.dependencies['@sentry/nextjs'];
  
  if (sentryVersion) {
    console.log(`✅ @sentry/nextjs installed: ${sentryVersion}`);
  } else {
    console.log('❌ @sentry/nextjs not found in dependencies');
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Error reading package.json: ${error.message}`);
  process.exit(1);
}

// Test 4: Verify integration in key files
console.log('\n✓ TEST 4: Integration Verification');
console.log('-'.repeat(50));

const filesToCheck = {
  'app/layout.tsx': 'SentryErrorBoundary',
  'app/api/conversations/[id]/route.ts': 'Sentry.captureException',
  'app/api/conversations/route.ts': 'Sentry.captureException',
  'hooks/use-conversations.ts': 'captureError',
};

let allIntegrated = true;
Object.entries(filesToCheck).forEach(([file, searchString]) => {
  try {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    if (content.includes(searchString)) {
      console.log(`✅ ${file} - uses ${searchString}`);
    } else {
      console.log(`❌ ${file} - missing ${searchString}`);
      allIntegrated = false;
    }
  } catch (error) {
    console.log(`❌ ${file} - file not found`);
    allIntegrated = false;
  }
});

// Test 5: Test Sentry connectivity (optional - requires internet)
console.log('\n✓ TEST 5: Sentry Connectivity Test');
console.log('-'.repeat(50));
console.log('Testing connection to Sentry ingest endpoint...');

const testEnvelope = JSON.stringify({
  event_id: 'test-' + Date.now(),
  sent_at: new Date().toISOString(),
  sdk: {
    name: 'test-script',
    version: '1.0.0'
  }
});

const match = sentryDSN.match(/https:\/\/(.+)@(.+)\/(\d+)/);
if (match) {
  const [, key, host, projectId] = match;
  
  const options = {
    hostname: host,
    port: 443,
    path: `/api/${projectId}/envelope/`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
      'X-Sentry-Auth': `Sentry sentry_key=${key.split(':')[0]}, sentry_version=7`
    }
  };

  const req = https.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Sentry is reachable (HTTP 200)');
    } else if (res.statusCode === 429) {
      console.log('✅ Sentry is reachable (rate limited - this is normal)');
    } else {
      console.log(`⚠️  Sentry responded with status: ${res.statusCode}`);
    }
    
    printSummary(allFilesExist && allIntegrated);
  });

  req.on('error', (error) => {
    console.log(`⚠️  Network error (this is OK if you're offline): ${error.message}`);
    printSummary(allFilesExist && allIntegrated);
  });

  req.write(testEnvelope);
  req.end();
} else {
  console.log('❌ Could not parse Sentry DSN');
  printSummary(false);
}

function printSummary(success) {
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 SUMMARY');
  console.log('='.repeat(50));
  
  if (success) {
    console.log('\n✅ All tests passed! Sentry integration is complete.\n');
    console.log('Next steps:');
    console.log('1. Start your app: npm run dev');
    console.log('2. Visit: http://localhost:3007/test-sentry.html');
    console.log('3. Or test endpoints directly:');
    console.log('   GET  http://localhost:3007/api/monitoring/sentry');
    console.log('   POST http://localhost:3007/api/monitoring/sentry');
    console.log('4. Check your Sentry dashboard for captured errors');
    console.log('\n');
  } else {
    console.log('\n❌ Some tests failed. Please review the output above.\n');
    process.exit(1);
  }
}

