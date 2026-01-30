// Test against deployed site
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Track all console messages
  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      if (!text.includes('404')) {
        errors.push(text);
        console.log(`[ERROR] ${text}`);
      }
    } else if (type === 'warning') {
      warnings.push(text);
      console.log(`[WARN] ${text}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`[PAGE ERROR] ${error.message}\n  Stack: ${error.stack}`);
  });

  // Navigate to deployed site
  console.log('\n=== Navigating to https://blog-wheat-mu-85.vercel.app ===\n');
  await page.goto('https://blog-wheat-mu-85.vercel.app', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for page to fully render
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Try clicking on TaskWidget
  console.log('\n=== Looking for TaskWidget ===\n');
  const taskWidget = await page.$('[class*="TaskWidget"]');
  if (taskWidget) {
    console.log('TaskWidget found');
  } else {
    console.log('TaskWidget NOT found');
  }

  // Try clicking on Fleet Bar agent button
  console.log('\n=== Trying to click Fleet Bar agent ===\n');
  const fleetBar = await page.$('[class*="FleetBar"]');
  if (fleetBar) {
    console.log('FleetBar found');
    const buttons = await fleetBar.$$('button');
    console.log(`Found ${buttons.length} buttons in FleetBar`);

    // Click the second button (first sub-agent)
    if (buttons.length > 1) {
      console.log('Clicking second button...');
      await buttons[1].click();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  } else {
    console.log('FleetBar NOT found');
  }

  // Check for error messages in DOM
  console.log('\n=== Checking for errors in DOM ===\n');
  const errorText = await page.evaluate(() => {
    // Look for common error indicators
    const selectors = [
      '[class*="error"]',
      '[class*="Error"]',
      '[role="alert"]',
      '.error',
      '.error-message',
      '[data-testid="error"]'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        return Array.from(elements).map(el => el.textContent).join('\n');
      }
    }
    return null;
  });
  
  if (errorText) {
    console.log(`Error text found:\n${errorText}`);
  } else {
    console.log('No error text in DOM');
  }

  // Get body text for debugging
  const bodyText = await page.evaluate(() => document.body.textContent);
  
  // Check if Task-related content exists
  if (bodyText.toLowerCase().includes('task') || bodyText.toLowerCase().includes('fleet')) {
    console.log('Task/Fleet content exists in page');
  } else {
    console.log('NO Task/Fleet content in page!');
  }

  // Take screenshot
  await page.screenshot({ path: '/home/clawdbot/clawd/debug-prod.png', fullPage: true });
  console.log('\n=== Screenshot saved to /home/clawdbot/clawd/debug-prod.png ===\n');

  // Summary
  console.log('\n=== ERROR SUMMARY ===');
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\nAll errors:');
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  await browser.close();
})();
