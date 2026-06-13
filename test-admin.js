const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  page.on('response', resp => {
    if (resp.status() === 404) errors.push(`404: ${resp.url()}`);
  });
  
  console.log('=== Testing Admin Panel ===');
  await page.goto('https://dakkho-admin.pages.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Login
  const emailInput = await page.$('input[type="email"], input[type="text"]');
  if (emailInput) {
    await emailInput.fill('himadrient@proton.me');
    const passInput = await page.$('input[type="password"]');
    await passInput.fill('admin123');
    const submitBtn = await page.$('button:has-text("Sign")');
    await submitBtn.click();
    await page.waitForTimeout(5000);
    console.log('Logged in. URL:', page.url());
    await page.screenshot({ path: '/tmp/admin-after-login.png' });
    
    // Get main content heading (inside <main> tag)
    const mainHeading = await page.$('main h1, main h2');
    if (mainHeading) console.log('Dashboard heading:', await mainHeading.textContent());
    
    // Test sidebar navigation - click each item
    const navItems = ['Courses', 'Users', 'Support', 'Email', 'Settings', 'Analytics', 'Coupons', 'Packages', 'Events'];
    for (const item of navItems) {
      const btn = await page.$(`nav button:has-text("${item}")`);
      if (btn) {
        await btn.click();
        await page.waitForTimeout(2000);
        const url = page.url();
        const mainH = await page.$('main h1, main h2');
        const heading = mainH ? await mainH.textContent() : 'NO HEADING';
        console.log(`${item}: URL=${url}, Heading=${heading}`);
      } else {
        console.log(`${item}: Button not found`);
      }
    }
  }
  
  // Test direct page loads (refresh simulation)
  console.log('\n=== Testing Direct Page Loads ===');
  const directPages = ['dashboard', 'users', 'courses', 'videos', 'instructors', 'categories', 'subjects', 'technologies', 'institutes', 'institute-requests', 'coupons', 'discounts', 'payments', 'packages', 'enrollments', 'events', 'live-classes', 'support', 'achievements', 'push', 'notifications', 'config', 'email', 'analytics', 'settings', 'about'];
  
  for (const pg of directPages) {
    await page.goto(`https://dakkho-admin.pages.dev/${pg}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const url = page.url();
    
    // Check if we see the login form or the page content
    const hasLoginForm = await page.$('input[type="password"]');
    const mainH = await page.$('main h1, main h2');
    const heading = mainH ? await mainH.textContent() : 'NO HEADING';
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 200) || 'EMPTY');
    console.log(`/${pg}: URL=${url}, Heading=${heading}, HasLoginForm=${!!hasLoginForm}, BodyStart=${bodyText.substring(0, 80)}`);
  }
  
  if (errors.length) {
    console.log('\n=== Errors ===');
    errors.slice(0, 20).forEach(e => console.log(e));
  }
  
  await browser.close();
})();
