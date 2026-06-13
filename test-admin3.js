const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[CONSOLE ${msg.type()}]`, msg.text());
    }
  });
  
  // Login first
  await page.goto('https://dakkho-admin.pages.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.$('input[type="email"], input[type="text"]').then(el => el?.fill('himadrient@proton.me'));
  await page.$('input[type="password"]').then(el => el?.fill('admin123'));
  await page.$('button:has-text("Sign")').then(el => el?.click());
  await page.waitForTimeout(5000);
  console.log('Logged in');
  
  // Now navigate directly to /courses
  console.log('\n=== Direct navigation to /courses ===');
  await page.goto('https://dakkho-admin.pages.dev/courses', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // Check what page is showing
  const mainText = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? main.innerText.substring(0, 300) : 'NO MAIN';
  });
  console.log('Main content:', mainText);
  
  // Check header text
  const headerText = await page.evaluate(() => {
    const h = document.querySelector('header h2, header h1, [class*="header"] h2, [class*="Header"] h2');
    return h ? h.textContent : 'NO HEADER';
  });
  console.log('Header text:', headerText);
  
  // Check URL
  console.log('URL:', page.url());
  
  // Check sidebar active item
  const activeItem = await page.evaluate(() => {
    const active = document.querySelector('button[class*="bg-blue"]');
    return active ? active.textContent : 'NO ACTIVE';
  });
  console.log('Active sidebar item:', activeItem);
  
  // Try /support 
  console.log('\n=== Direct navigation to /support ===');
  await page.goto('https://dakkho-admin.pages.dev/support', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  const mainText2 = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? main.innerText.substring(0, 300) : 'NO MAIN';
  });
  console.log('Main content:', mainText2);
  console.log('URL:', page.url());
  
  await browser.close();
})();
