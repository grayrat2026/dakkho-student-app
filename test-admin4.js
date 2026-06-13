const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login first
  await page.goto('https://dakkho-admin.pages.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.$('input[type="email"], input[type="text"]').then(el => el?.fill('himadrient@proton.me'));
  await page.$('input[type="password"]').then(el => el?.fill('admin123'));
  await page.$('button:has-text("Sign")').then(el => el?.click());
  await page.waitForTimeout(5000);
  
  // Navigate using sidebar
  console.log('=== Sidebar navigation to Courses ===');
  const coursesBtn = await page.$('button:has-text("Courses")');
  await coursesBtn?.click();
  await page.waitForTimeout(3000);
  
  const mainText = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? main.innerText.substring(0, 500) : 'NO MAIN';
  });
  console.log('After sidebar Courses click:', mainText.substring(0, 200));
  
  // Now test direct load after being logged in
  console.log('\n=== Direct load /courses while logged in ===');
  await page.goto('https://dakkho-admin.pages.dev/courses', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000); // Wait longer for JS hydration
  
  const mainText2 = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? main.innerText.substring(0, 500) : 'NO MAIN';
  });
  console.log('After direct load:', mainText2.substring(0, 200));
  
  // Check React state
  const reactState = await page.evaluate(() => {
    // Try to find React fiber
    const mainEl = document.querySelector('main');
    if (!mainEl) return 'No main element';
    
    // Get all React instances
    const keys = Object.keys(mainEl);
    const fiberKey = keys.find(k => k.startsWith('__reactFiber'));
    if (!fiberKey) return 'No React fiber found';
    
    return 'React fiber found';
  });
  console.log('React state:', reactState);
  
  // Wait even longer and check again
  await page.waitForTimeout(5000);
  const mainText3 = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? main.innerText.substring(0, 500) : 'NO MAIN';
  });
  console.log('After longer wait:', mainText3.substring(0, 200));
  
  await browser.close();
})();
