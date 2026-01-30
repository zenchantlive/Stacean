const puppeteer = require('puppeteer');

async function captureCockpit() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  // iPhone 13 Pro dimensions roughly
  await page.setViewport({ width: 390, height: 844 });
  
  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
  
  const title = await page.title();
  console.log('Page title:', title);
  
  const outputPath = '/home/clawdbot/clawd/cockpit-verification.png';
  await page.screenshot({ path: outputPath });
  console.log(`Screenshot saved to ${outputPath}`);
  
  await browser.close();
}

captureCockpit().catch(console.error);
