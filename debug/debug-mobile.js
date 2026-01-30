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
  const logs = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      if (!text.includes('404')) { // Ignore 404 errors
        errors.push(text);
        console.log(`[ERROR] ${text}`);
      }
    } else if (type === 'warning') {
      warnings.push(text);
      console.log(`[WARN] ${text}`);
    } else if (text.includes('Error') || text.includes('error')) {
      if (!text.includes('404')) {
        logs.push(text);
        console.log(`[LOG] ${text}`);
      }
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`[PAGE ERROR] ${error.message}\n  Stack: ${error.stack}`);
  });

  page.on('requestfailed', request => {
    const url = request.url();
    if (!url.includes('localhost') && !url.includes('vercel')) {
      console.log(`[FAILED REQUEST] ${url} - ${request.failure()?.errorText}`);
    }
  });

  // Navigate to local dev
  console.log('\n=== Navigating to http://localhost:3000 ===\n');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

  console.log('\n=== Page loaded, checking content ===\n');

  // Get page title
  const title = await page.title();
  console.log(`Page title: ${title}`);

  // Get HTML content
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  
  // Check if TaskWidget is in the HTML
  if (bodyHTML.includes('TaskWidget') || bodyHTML.includes('task') || bodyHTML.includes('Task')) {
    console.log('Task-related content found in HTML');
  } else {
    console.log('NO Task-related content found');
  }

  // Check for FleetBar
  if (bodyHTML.includes('FleetBar') || bodyHTML.includes('fleet') || bodyHTML.includes('agent')) {
    console.log('Fleet-related content found in HTML');
  } else {
    console.log('NO Fleet-related content found');
  }

  // Check for error messages in the DOM
  const errorText = await page.evaluate(() => {
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    return Array.from(errorElements).map(el => el.textContent).join('\n');
  });
  
  if (errorText) {
    console.log(`\n=== ERROR TEXT IN DOM ===\n${errorText}`);
  }

  // Check for alert
  const alertText = await page.evaluate(() => {
    const alertElements = document.querySelectorAll('[role="alert"]');
    return Array.from(alertElements).map(el => el.textContent).join('\n');
  });
  
  if (alertText) {
    console.log(`\n=== ALERT TEXT IN DOM ===\n${alertText}`);
  }

  // Take screenshot
  await page.screenshot({ path: '/home/clawdbot/clawd/debug-mobile.png', fullPage: true });
  console.log('\n=== Screenshot saved to /home/clawdbot/clawd/debug-mobile.png ===\n');

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
