const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Track all console messages
  const errors = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error' && !text.includes('404')) {
      errors.push(text);
      console.log(`[CONSOLE ERROR] ${text}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`\n=== PAGE ERROR ===`);
    console.log(error.message);
    console.log(error.stack);
  });

  // Navigate to new deployment URL
  console.log('\n=== Navigating to NEW deployment ===\n');
  await page.goto('https://blog-enli728am-zenchantlives-projects.vercel.app', { waitUntil: 'networkidle2', timeout: 30000 });

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Find and click agent button
  console.log('\n=== Finding agent buttons ===\n');
  const fleetBar = await page.$('[class*="FleetBar"]');
  
  if (fleetBar) {
    console.log('FleetBar found!');
    const buttons = await fleetBar.$$('button');
    console.log(`Found ${buttons.length} buttons`);
    
    if (buttons.length > 0) {
      console.log('Clicking first agent button...');
      await buttons[0].click();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Take screenshot
  await page.screenshot({ path: '/home/clawdbot/clawd/new-deployment-test.png', fullPage: true });

  // Summary
  console.log('\n=== ERROR SUMMARY ===');
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nAll errors:');
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  await browser.close();
})();
