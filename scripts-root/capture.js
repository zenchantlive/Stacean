const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  console.log('Capturing http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
  
  const timestamp = Date.now();
  const filename = `capture-${timestamp}.png`;
  const relativePath = `/screenshots/${filename}`;
  const absolutePath = path.join(__dirname, '../blog/public/screenshots', filename);
  
  await page.screenshot({ path: absolutePath });
  console.log(`Screenshot saved to ${absolutePath}`);
  
  await browser.close();

  // Update index
  const dir = path.join(__dirname, '../blog/public/screenshots');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.png'))
    .map(f => ({
      name: f,
      url: `/screenshots/${f}`,
      time: fs.statSync(path.join(dir, f)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time)
    .slice(0, 5);

  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(files, null, 2));

  // Update state.json
  const statePath = path.join(__dirname, '../blog/public/state.json');
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state.screenshots = files.map(f => f.url);
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  }
}

capture().catch(console.error);
