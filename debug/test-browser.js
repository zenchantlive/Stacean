const puppeteer = require('puppeteer');

async function testBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-translate',
      '--disable-background-networking',
      '--disable-sync',
      '--safebrowsing-disable-auto-update',
      '--disable-features=TranslateUI'
    ]
  });
  
  const page = await browser.newPage();
  await page.goto('https://example.com');
  
  const title = await page.title();
  console.log('Page title:', title);
  
  await browser.close();
  console.log('Browser test complete!');
}

testBrowser().catch(console.error);
