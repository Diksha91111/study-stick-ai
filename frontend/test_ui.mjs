import { chromium } from 'playwright-chromium';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/login');
  
  // click Auto-fill test credentials
  await page.click('button:has-text("Auto-fill Test Credentials")');
  
  // click Sign In
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/auth/login')),
    page.click('button:has-text("Sign In")')
  ]).then(async ([resp]) => {
    console.log('Login Response Status:', resp.status());
    console.log('Login Response Body:', await resp.json());
  });

  // check if navigated to dashboard
  await page.waitForTimeout(2000);
  console.log('Current URL:', page.url());
  
  // capture a screenshot
  await page.screenshot({ path: 'login_result.png' });

  await browser.close();
})();
