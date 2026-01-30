const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
    devtools: true
  });

  const page = await browser.newPage();

  // Capture EVERYTHING
  const allConsoleMessages = [];
  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const info = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      args: msg.args ? msg.args().map(arg => arg.toString()) : []
    };
    allConsoleMessages.push(info);
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    if (msg.location()) {
      console.log(`   at ${msg.location().url}:${msg.location().lineNumber}`);
    }
  });

  page.on('pageerror', error => {
    const info = {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
    errors.push(info);
    console.log('\n===== PAGE ERROR =====');
    console.log(`Name: ${error.name}`);
    console.log(`Message: ${error.message}`);
    console.log(`Stack:\n${error.stack}`);
    console.log('=========================\n');
  });

  page.on('requestfailed', request => {
    const failure = request.failure();
    if (failure) {
      console.log(`\n===== REQUEST FAILED =====`);
      console.log(`URL: ${request.url()}`);
      console.log(`Error: ${failure.errorText}`);
      console.log('=========================\n');
    }
  });

  page.on('response', response => {
    if (!response.ok()) {
      console.log(`\n===== BAD RESPONSE =====`);
      console.log(`URL: ${response.url()}`);
      console.log(`Status: ${response.status()}`);
      console.log('=========================\n');
    }
  });

  // Navigate to deployed site
  console.log('\n=== NAVIGATING TO DEPLOYED SITE ===\n');
  console.log('URL: https://blog-wheat-mu-85.vercel.app\n');
  await page.goto('https://blog-wheat-mu-85.vercel.app', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for page to fully load
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Get the current page content
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  console.log(`\nPage HTML length: ${bodyHTML.length} characters`);

  // Check if FleetBar exists
  const hasFleetBar = await page.evaluate(() => {
    return document.querySelector('[class*="FleetBar"]') !== null;
  });
  console.log(`Has FleetBar: ${hasFleetBar}`);

  // Find agent buttons
  console.log('\n=== FINDING AGENT BUTTONS ===\n');
  
  // Try to find any button that looks like an agent button
  const allButtons = await page.$$('button');
  console.log(`Total buttons found: ${allButtons.length}`);

  let agentButton = null;
  let buttonText = '';

  for (let i = 0; i < allButtons.length; i++) {
    const text = await allButtons[i].evaluate(el => el.textContent?.trim() || '');
    console.log(`Button ${i}: "${text}"`);
    
    if (text.includes('ME') || text.includes('YOU') || text.includes('MEYOU')) {
      agentButton = allButtons[i];
      buttonText = text;
      console.log(`>>> Found agent button: "${text}"`);
    }
  }

  if (agentButton) {
    console.log(`\n=== CLICKING AGENT BUTTON ===\n`);
    console.log(`Button text: "${buttonText}"\n`);

    // Click the button
    await agentButton.click();

    // Wait for any reactions
    await new Promise(resolve => setTimeout(resolve, 3000));
  } else {
    console.log('\n=== NO AGENT BUTTON FOUND ===\n');
  }

  // Check for any React errors in DOM
  console.log('\n=== CHECKING FOR REACT ERRORS ===\n');
  const reactErrors = await page.evaluate(() => {
    const results = [];
    
    // Look for elements with error-related classes
    const errorElements = document.querySelectorAll('[class*="error"]');
    errorElements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.display !== 'none') {
        results.push({
          tag: el.tagName,
          class: el.className,
          text: el.textContent?.substring(0, 100)
        });
      }
    });
    
    // Look for React error boundaries
    const reactRoot = document.querySelector('[data-reactroot], [data-fiber-root]');
    if (reactRoot) {
      results.push({ type: 'react-root-found' });
    }
    
    return results;
  });

  if (reactErrors.length > 0) {
    console.log('Found error-related elements:');
    reactErrors.forEach((err, i) => {
      console.log(`${i + 1}. ${JSON.stringify(err)}`);
    });
  } else {
    console.log('No obvious error elements in DOM');
  }

  // Take screenshot
  await page.screenshot({ path: '/home/clawdbot/clawd/agent-click-final.png', fullPage: true });
  console.log('\n=== Screenshot saved to /home/clawdbot/clawd/agent-click-final.png ===\n');

  // Summary
  console.log('\n========================================');
  console.log('FINAL SUMMARY');
  console.log('========================================\n');
  console.log(`Console messages: ${allConsoleMessages.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}\n`);

  if (errors.length > 0) {
    console.log('--- ALL PAGE ERRORS ---');
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.name}: ${err.message}`);
    });
    console.log('');
  }

  const errorLogs = allConsoleMessages.filter(m => m.type === 'error' && !m.text.includes('404'));
  if (errorLogs.length > 0) {
    console.log('--- ALL CONSOLE ERRORS ---');
    errorLogs.forEach((err, i) => {
      console.log(`${i + 1}. ${err.text}`);
      if (err.location) {
        console.log(`   at ${err.location.url}:${err.location.lineNumber}`);
      }
    });
    console.log('');
  }

  await browser.close();
})();
