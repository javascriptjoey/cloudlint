// Global teardown for Playwright tests

async function globalTeardown(config) {
  console.log('🧹 Cleaning up after Playwright tests...');
  
  // Any cleanup operations can go here
  // For example, clearing test data, stopping test services, etc.
  
  console.log('✅ Playwright teardown complete');
}

export default globalTeardown;