const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Listen for console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('[Console Error]', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('[Page Error]', error.message);
    consoleErrors.push(error.message);
  });

  // Navigate to local dev
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Wait for widget to load
  await page.waitForSelector('[class*="TaskWidget"]', { timeout: 10000 }).catch(e => console.log('Widget not found yet'));

  // Find an agent button and click it
  const agents = await page.$$('button');
  console.log('Found', agents.length, 'buttons');

  // Look for agent buttons (based on FleetBar structure)
  const agentBtns = await page.$$(`button[aria-label*="agent"], button[aria-label*="YOU"], button[class*="Agent"]`);
  console.log('Found', agentBtns.length, 'potential agent buttons');

  if (agentBtns.length > 0) {
    console.log('Clicking first agent button...');
    await agentBtns[0].click();

    // Wait for any errors
    await page.waitForTimeout(2000);

    console.log('\n=== Console Errors ===');
    consoleErrors.forEach(err => console.log(err));
  } else {
    console.log('No agent buttons found, trying to find FleetBar...');
    const fleetBar = await page.$(`[class*="FleetBar"]`);
    if (fleetBar) {
      console.log('FleetBar found');
      const buttons = await fleetBar.$$('button');
      console.log('FleetBar has', buttons.length, 'buttons');
      if (buttons.length > 1) {
        console.log('Clicking second button (first agent)...');
        await buttons[1].click();
        await page.waitForTimeout(2000);

        console.log('\n=== Console Errors ===');
        consoleErrors.forEach(err => console.log(err));
      }
    }
  }

  // Take a screenshot
  await page.screenshot({ path: '/home/clawdbot/clawd/browser-debug.png', fullPage: true });
  console.log('Screenshot saved to /home/clawdbot/clawd/browser-debug.png');

  await browser.close();
})();
