const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('=== Testing Instructor Panel ===');
  await page.goto('https://dakkho-instructor.pages.dev/', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Login
  const emailInput = await page.$('input[type="email"], input[type="text"]');
  if (emailInput) {
    await emailInput.fill('hsr2882008@gmail.com');
    const passInput = await page.$('input[type="password"]');
    await passInput.fill('Sr5051380@');
    const submitBtn = await page.$('button:has-text("Sign")');
    if (submitBtn) await submitBtn.click();
    else {
      const anyBtn = await page.$('button[type="submit"]');
      if (anyBtn) await anyBtn.click();
    }
    await page.waitForTimeout(5000);
    console.log('Logged in. URL:', page.url());
    
    // Test sidebar navigation
    const navItems = ['Courses', 'Videos', 'Schedule', 'Earnings', 'Analytics'];
    for (const item of navItems) {
      const btn = await page.$(`nav button:has-text("${item}"), aside button:has-text("${item}")`);
      if (btn) {
        await btn.click();
        await page.waitForTimeout(2000);
        console.log(`${item}: URL=${page.url()}`);
      }
    }
  }
  
  // Test direct page loads
  console.log('\n=== Testing Direct Page Loads ===');
  const pages_to_test = ['dashboard', 'courses', 'videos', 'schedule', 'earnings', 'analytics'];
  for (const pg of pages_to_test) {
    await page.goto(`https://dakkho-instructor.pages.dev/${pg}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 200) || 'EMPTY');
    console.log(`/${pg}: Body=${bodyText.substring(0, 100)}`);
  }
  
  await browser.close();
})();
