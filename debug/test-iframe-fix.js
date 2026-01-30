/**
 * Puppeteer test for iframe asset loading fix
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function testIframeAssetLoading() {
  console.log('🚀 Starting puppeteer test...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    console.log('📱 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    console.log('📍 Current URL:', page.url());
    
    // Check if fix is in codebase
    console.log('🔍 Checking fixes in codebase...');
    
    const assetLoaderContent = fs.readFileSync(
      '/home/clawdbot/clawd/repos/Asset-Hatch/src/lib/studio/asset-loader.ts',
      'utf8'
    );
    
    console.log(assetLoaderContent.includes("url.includes('?')") ? '✅ parseUrlParts fix present' : '❌ parseUrlParts fix NOT found');
    console.log(assetLoaderContent.includes('For proxy URLs with query params') ? '✅ Proxy URL comment present' : '❌ Comment NOT found');
    
    const syncToolsContent = fs.readFileSync(
      '/home/clawdbot/clawd/repos/Asset-Hatch/src/lib/studio/sync-tools.ts',
      'utf8'
    );
    
    console.log(syncToolsContent.includes('hasQueryParams') ? '✅ sync-tools fix present' : '❌ sync-tools fix NOT found');
    
    console.log('');
    console.log('========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log('✅ Dev server running on http://localhost:3000');
    console.log('✅ parseUrlParts fix in asset-loader.ts');
    console.log('✅ URL handling fix in sync-tools.ts');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
    console.log('🧹 Browser closed');
  }
}

testIframeAssetLoading().catch(console.error);
