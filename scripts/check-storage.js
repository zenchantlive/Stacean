/**
 * Check Vercel Storage Dashboard
 */

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Navigate to storage dashboard
  await page.goto('https://vercel.com/zenchantlives-projects/blog/storage', {
    waitUntil: 'networkidle2'
  });
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Get page content
  const content = await page.content();
  
  // Check if KV/Blob sections exist
  const hasKV = content.includes('KV') || content.includes('kv') || content.includes('Database');
  const hasBlob = content.includes('Blob') || content.includes('blob') || content.includes('Storage');
  
  console.log('\n=== Storage Dashboard Status ===');
  console.log('KV Section:', hasKV ? 'Found' : 'Not found');
  console.log('Blob Section:', hasBlob ? 'Found' : 'Not found');
  console.log('\nPage title:', await page.title());
  
  // Try to find specific elements
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== Relevant Text ===');
  console.log(bodyText.slice(0, 2000));
  
  await browser.close();
})();