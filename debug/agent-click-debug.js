const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Track ALL console messages
  const allErrors = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    if (type === 'error' && !text.includes('404')) {
      const errorInfo = { text, location };
      consoleErrors.push(errorInfo);
      console.log(`\n=== CONSOLE ERROR ===`);
      console.log(`Text: ${text}`);
      if (location) {
        console.log(`File: ${location.url}:${location.lineNumber}`);
      }
    }
  });

  page.on('pageerror', error => {
    const errorInfo = { message: error.message, name: error.name };
    pageErrors.push(errorInfo);
    console.log(`\n=== PAGE ERROR (Runtime) ===`);
    console.log(`Message: ${error.message}`);
    console.log(`Name: ${error.name}`);
    console.log(`Stack:\n${error.stack}`);
  });

  page.on('requestfailed', request => {
    const url = request.url();
    const failure = request.failure();
    if (failure && !url.includes('localhost')) {
      console.log(`\n=== FAILED REQUEST ===`);
      console.log(`URL: ${url}`);
      console.log(`Error: ${failure.errorText}`);
    }
  });

  // Navigate to deployed site
  console.log('\n=== Navigating to https://blog-wheat-mu-85.vercel.app ===\n');
  await page.goto('https://blog-wheat-mu-85.vercel.app', { waitUntil: 'networkidle2', timeout: 30000 });

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n=== Finding Fleet Bar agent buttons ===\n');
  
  // Find Fleet Bar section (should be above TaskWidget)
  const fleetBarSelector = '[class*="FleetBar"]';
  const fleetBar = await page.$(fleetBarSelector);
  
  if (fleetBar) {
    console.log('FleetBar found!');
    const buttons = await fleetBar.$$('button');
    console.log(`Found ${buttons.length} agent buttons in FleetBar`);

    // Click the "ME/YOU" button (first one)
    if (buttons.length > 0) {
      console.log('\n=== Clicking "ME/YOU" button (first agent) ===\n');
      await buttons[0].click();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Click a sub-agent button (second one)
    if (buttons.length > 1) {
      console.log('\n=== Clicking sub-agent button (second agent) ===\n');
      await buttons[1].click();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  } else {
    console.log('FleetBar NOT found - looking for agent buttons elsewhere...');
    // Try to find any button with "ME" or "YOU" text
    const allButtons = await page.$$('button');
    for (let i = 0; i < allButtons.length; i++) {
      const text = await allButtons[i].evaluate(el => el.textContent);
      if (text.includes('ME') || text.includes('YOU')) {
        console.log(`Found button with text: "${text}"`);
        console.log('Clicking it...');
        await allButtons[i].click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        break;
      }
    }
  }

  // Take screenshot after clicks
  await page.screenshot({ path: '/home/clawdbot/clawd/agent-click-debug.png', fullPage: true });
  console.log('\n=== Screenshot saved to /home/clawdbot/clawd/agent-click-debug.png ===\n');

  // Summary
  console.log('\n=== ERROR SUMMARY ===');
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Page runtime errors: ${pageErrors.length}`);

  if (consoleErrors.length > 0) {
    console.log('\n--- All Console Errors ---');
    consoleErrors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.text}`);
      if (err.location) {
        console.log(`   at ${err.location.url}:${err.location.lineNumber}`);
      }
    });
  }

  if (pageErrors.length > 0) {
    console.log('\n--- All Page Errors ---');
    pageErrors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.name}: ${err.message}`);
    });
  }

  await browser.close();
})();
