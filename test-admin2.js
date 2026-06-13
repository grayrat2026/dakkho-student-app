const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect ALL console messages
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]`, msg.text());
  });
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));
  
  // Login first at root to set auth token
  console.log('=== Logging in ===');
  await page.goto('https://dakkho-admin.pages.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  const emailInput = await page.$('input[type="email"], input[type="text"]');
  await emailInput.fill('himadrient@proton.me');
  const passInput = await page.$('input[type="password"]');
  await passInput.fill('admin123');
  const submitBtn = await page.$('button:has-text("Sign")');
  await submitBtn.click();
  await page.waitForTimeout(5000);
  console.log('Logged in. URL:', page.url());
  
  // Check localStorage for auth token
  const token = await page.evaluate(() => localStorage.getItem('dakkho_admin_token'));
  console.log('Auth token in localStorage:', token ? token.substring(0, 20) + '...' : 'NULL');
  
  // Now navigate directly to /courses (simulating page refresh)
  console.log('\n=== Navigating directly to /courses ===');
  await page.goto('https://dakkho-admin.pages.dev/courses', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // Check what's visible
  const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || 'EMPTY');
  console.log('Body text:', bodyText.substring(0, 300));
  
  // Check if loading spinner is visible
  const loadingSpinner = await page.$('text=Loading DAKKHO Admin');
  console.log('Loading spinner visible:', !!loadingSpinner);
  
  // Check if login form is visible
  const loginForm = await page.$('input[type="password"]');
  console.log('Login form visible:', !!loginForm);
  
  // Check if sidebar is visible (means we're logged in)
  const sidebar = await page.$('button:has-text("Courses")');
  console.log('Sidebar visible:', !!sidebar);
  
  // Check auth token again
  const token2 = await page.evaluate(() => localStorage.getItem('dakkho_admin_token'));
  console.log('Auth token after navigation:', token2 ? token2.substring(0, 20) + '...' : 'NULL');
  
  // Check the main content area
  const mainContent = await page.$('main');
  if (mainContent) {
    const mainText = await mainContent.innerText();
    console.log('Main content text:', mainText.substring(0, 200));
  } else {
    console.log('No <main> element found');
  }
  
  await page.screenshot({ path: '/tmp/admin-courses-direct.png' });
  
  await browser.close();
})();
