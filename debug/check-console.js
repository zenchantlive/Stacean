const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Track all console messages
  const allLogs = [];
  const errors = [];

  page.on('console', msg => {
    allLogs.push({ type: msg.type(), text: msg.text() });
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push({ message: error.message, stack: error.stack });
    console.log(`\n=== PAGE ERROR ===`);
    console.log(error.message);
    console.log(error.stack);
  });

  page.on('requestfailed', request => {
    const url = request.url();
    console.log(`\n=== FAILED REQUEST ===`);
    console.log(`URL: ${url}`);
    console.log(`Error: ${request.failure()?.errorText}`);
  });

  // Navigate to deployed site
  console.log('\n=== Navigating to https://blog-wheat-mu-85.vercel.app ===\n');
  try {
    await page.goto('https://blog-wheat-mu-85.vercel.app', { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    console.log('\n=== NAVIGATION ERROR ===');
    console.log(e.message);
  }

  // Wait a bit for delayed errors
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Get body content
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  
  // Look for error patterns in HTML
  const errorPatterns = [
    /error/i,
    /Error/i,
    /failed/i,
    /exception/i,
    /undefined/i,
    /NaN/i,
    /null/i
  ];

  console.log('\n=== BODY HTML LENGTH ===');
  console.log(`${bodyHTML.length} characters`);

  // Check for common error indicators
  const hasErrorIndicators = errorPatterns.some(pattern => pattern.test(bodyHTML));
  if (hasErrorIndicators) {
    console.log('\n=== ERROR INDICATORS FOUND IN HTML ===');
    
    // Extract text that might indicate errors
    const errorTexts = [];
    errorPatterns.forEach(pattern => {
      const matches = bodyHTML.match(pattern);
      if (matches) {
        errorTexts.push(...matches);
      }
    });
    
    if (errorTexts.length > 0) {
      console.log(errorTexts.slice(0, 20).join('\n'));
    }
  } else {
    console.log('\n=== NO ERROR INDICATORS IN HTML ===');
  }

  // Check for React error boundaries
  const reactError = await page.evaluate(() => {
    const errorElements = document.querySelectorAll('[data-reactroot], [data-fiber-root]');
    return {
      hasReact: errorElements.length > 0,
      bodyText: document.body.textContent.substring(0, 500)
    };
  });
  
  console.log('\n=== BODY TEXT SAMPLE ===');
  console.log(reactError.bodyText);

  // Take screenshot
  await page.screenshot({ path: '/home/clawdbot/clawd/console-check.png', fullPage: true });

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total logs: ${allLogs.length}`);
  console.log(`Errors: ${errors.length}`);
  
  const errorLogs = allLogs.filter(l => l.type === 'error');
  console.log(`Console errors: ${errorLogs.length}`);

  if (errorLogs.length > 0) {
    console.log('\n=== CONSOLE ERRORS ===');
    errorLogs.forEach(l => console.log(`- ${l.text}`));
  }

  if (errors.length > 0) {
    console.log('\n=== PAGE ERRORS ===');
    errors.forEach(e => console.log(`- ${e.message}`));
  }

  await browser.close();
})();
