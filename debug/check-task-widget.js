const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Track all console messages
  const errors = [];
  const pageErrors = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      if (!text.includes('404')) {
        errors.push(text);
        console.log(`[CONSOLE ERROR] ${text}`);
      }
    }
  });

  page.on('pageerror', error => {
    pageErrors.push({ message: error.message, stack: error.stack });
    console.log(`\n=== PAGE ERROR ===`);
    console.log(error.message);
    console.log(`Stack:\n${error.stack}`);
  });

  // Navigate to deployed site
  console.log('\n=== Navigating to https://blog-wheat-mu-85.vercel.app ===\n');
  await page.goto('https://blog-wheat-mu-85.vercel.app', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for page to fully render
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Click on the Task Widget button (index 5 - the last button in nav)
  console.log('\n=== Clicking Task Widget button (6th nav button) ===\n');
  
  // Try to find nav buttons and click the 6th one (CheckSquare icon)
  const navButtons = await page.$$('nav button');
  console.log(`Found ${navButtons.length} nav buttons`);
  
  if (navButtons.length >= 6) {
    console.log('Clicking 6th button (Task Widget)...');
    await navButtons[5].click();
    
    // Wait for scroll/animation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log('Not enough nav buttons found');
  }

  // Check for errors in the new view
  console.log('\n=== Checking for errors after navigation ===\n');
  
  // Get current body text
  const bodyText = await page.evaluate(() => document.body.textContent);
  
  // Check if task-related content exists
  const hasTaskContent = bodyText.toLowerCase().includes('task') || 
                         bodyText.toLowerCase().includes('fleet') ||
                         bodyText.toLowerCase().includes('agent');
  
  if (hasTaskContent) {
    console.log('Task/Fleet content found after navigation');
  } else {
    console.log('NO Task/Fleet content found - this might be the error!');
  }

  // Check for error indicators in DOM
  const errorInDOM = await page.evaluate(() => {
    const body = document.body.textContent.toLowerCase();
    return body.includes('error') || 
           body.includes('failed') || 
           body.includes('exception') ||
           body.includes('crash');
  });
  
  if (errorInDOM) {
    console.log('ERROR INDICATORS FOUND IN DOM!');
  }

  // Take screenshot
  await page.screenshot({ path: '/home/clawdbot/clawd/task-widget-view.png', fullPage: true });
  console.log('\n=== Screenshot saved to /home/clawdbot/clawd/task-widget-view.png ===\n');

  // Summary
  console.log('\n=== ERROR SUMMARY ===');
  console.log(`Console errors: ${errors.length}`);
  console.log(`Page errors: ${pageErrors.length}`);

  if (errors.length > 0) {
    console.log('\nConsole errors:');
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  if (pageErrors.length > 0) {
    console.log('\nPage errors:');
    pageErrors.forEach((err, i) => console.log(`${i + 1}. ${err.message}`));
  }

  await browser.close();
})();
