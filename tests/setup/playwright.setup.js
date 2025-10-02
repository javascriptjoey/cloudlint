// Global setup for Playwright tests
import { chromium } from '@playwright/test';

async function globalSetup(config) {
  console.log('🚀 Setting up Playwright tests...');
  
  // Check if servers are running
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const backendURL = process.env.BACKEND_URL || 'http://localhost:3001';
  
  try {
    // Launch browser to check if servers are ready
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Wait for frontend to be ready
    console.log(`⏳ Waiting for frontend at ${baseURL}...`);
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('✅ Frontend is ready');
    
    // Wait for backend to be ready
    console.log(`⏳ Waiting for backend at ${backendURL}...`);
    const response = await page.request.post(`${backendURL}/validate`, {
      data: { yaml: 'test: value' }
    });
    
    if (response.ok()) {
      console.log('✅ Backend is ready');
    } else {
      console.warn('⚠️ Backend responded but not with 200 OK');
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    console.log('💡 Make sure both frontend and backend servers are running');
    console.log(`   Frontend: ${baseURL}`);
    console.log(`   Backend: ${backendURL}`);
    throw error;
  }
  
  console.log('✅ Playwright setup complete');
}

export default globalSetup;