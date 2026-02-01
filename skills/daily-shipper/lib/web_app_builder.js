/**
 * Web App Builder - builds a real Express + vanilla UI app from concept
 */

const fs = require('fs');
const path = require('path');

async function buildWebApp(appPath, concept) {
  writePackage(appPath, concept);
  writeServer(appPath, concept);
  writeClient(appPath, concept);
  writeTests(appPath, concept);
  writeReadme(appPath, concept);
}

function writePackage(appPath, concept) {
  const pkg = {
    name: slug(concept.appName),
    version: '0.1.0',
    type: 'commonjs',
    scripts: {
      start: 'node server.js',
      test: 'node test/index.test.js'
    },
    dependencies: {
      express: '^4.19.2'
    }
  };
  fs.writeFileSync(path.join(appPath, 'package.json'), JSON.stringify(pkg, null, 2));
}

function writeServer(appPath, concept) {
  const fields = concept.dataFields || [];
  const fieldList = fields.map(f => `'${f.name}'`).join(', ');

  const server = `const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_PATH = path.join(__dirname, 'data.json');
function readData(){
  if (!fs.existsSync(DATA_PATH)) return [];
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}
function writeData(data){
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

app.get('/api/${concept.resourcePlural}', (req, res) => {
  res.json(readData());
});

app.post('/api/${concept.resourcePlural}', (req, res) => {
  const data = readData();
  const item = { id: Date.now().toString(36), ...req.body };
  data.push(item);
  writeData(data);
  res.status(201).json(item);
});

app.delete('/api/${concept.resourcePlural}/:id', (req, res) => {
  const data = readData().filter(x => x.id !== req.params.id);
  writeData(data);
  res.json({ ok: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running on ' + port));

module.exports = app;`;

  fs.writeFileSync(path.join(appPath, 'server.js'), server);
}

function writeClient(appPath, concept) {
  const publicDir = path.join(appPath, 'public');
  fs.mkdirSync(publicDir, { recursive: true });

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${concept.appName}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="app">
    <h1>${concept.appName}</h1>
    <p>${concept.appDescription}</p>

    <form id="createForm">
      ${concept.dataFields.map(f => `<input name="${f.name}" placeholder="${f.name}" ${f.required ? 'required' : ''} />`).join('')}
      <button type="submit">Add ${concept.resourceSingular}</button>
    </form>

    <div id="list"></div>
  </div>
  <script src="app.js"></script>
</body>
</html>`;

  const js = `async function fetchItems(){
  const res = await fetch('/api/${concept.resourcePlural}');
  return res.json();
}
async function render(){
  const list = document.getElementById('list');
  const items = await fetchItems();
  list.innerHTML = items.map(i => 
    '<div class="card"><pre>' + JSON.stringify(i, null, 2) + '</pre><button data-id="'+i.id+'">Delete</button></div>'
  ).join('');
  document.querySelectorAll('button[data-id]').forEach(btn => {
    btn.onclick = async () => {
      await fetch('/api/${concept.resourcePlural}/' + btn.dataset.id, { method: 'DELETE' });
      render();
    }
  });
}

document.getElementById('createForm').onsubmit = async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  await fetch('/api/${concept.resourcePlural}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  e.target.reset();
  render();
}

render();`;

  const css = `body{font-family:Arial;margin:40px;background:#f6f6f6;}
.app{max-width:800px;margin:auto;background:#fff;padding:24px;border-radius:8px;}
.card{background:#fafafa;border:1px solid #ddd;padding:12px;margin:10px 0;}
input{margin-right:8px;padding:6px;}
button{padding:6px 12px;}`;

  fs.writeFileSync(path.join(publicDir, 'index.html'), html);
  fs.writeFileSync(path.join(publicDir, 'app.js'), js);
  fs.writeFileSync(path.join(publicDir, 'style.css'), css);
}

function writeTests(appPath, concept) {
  const testDir = path.join(appPath, 'test');
  fs.mkdirSync(testDir, { recursive: true });

  const test = `const assert = require('assert');
const fetch = global.fetch;
const { spawn } = require('child_process');

let server;
const PORT = 3100 + Math.floor(Math.random() * 500);

async function wait(ms){return new Promise(r=>setTimeout(r,ms));}

(async () => {
  server = spawn('node', ['server.js'], { stdio: 'inherit', env: { ...process.env, PORT } });
  await wait(1200);

  const base = 'http://localhost:' + PORT;

  const res1 = await fetch(base + '/api/${concept.resourcePlural}');
  const list1 = await res1.json();
  assert(Array.isArray(list1));

  const res2 = await fetch(base + '/api/${concept.resourcePlural}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ${concept.dataFields.map(f => `${f.name}: "test"`).join(', ')} })
  });
  const created = await res2.json();
  assert(created.id);

  const res3 = await fetch(base + '/api/${concept.resourcePlural}/' + created.id, { method: 'DELETE' });
  const del = await res3.json();
  assert(del.ok === true);

  server.kill();
  console.log('Tests passed');
})();`;

  fs.writeFileSync(path.join(testDir, 'index.test.js'), test);
}

function writeReadme(appPath, concept) {
  const readme = `# ${concept.appName}

${concept.appDescription}

## Problem
${concept.problem}

## Solution
${concept.solution}

## Run

\`\`\`bash
npm install
npm start
\`\`\`

## Test
\`\`\`bash
npm test
\`\`\`
`;
  fs.writeFileSync(path.join(appPath, 'README.md'), readme);
}

function slug(s){
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

module.exports = { buildWebApp };
