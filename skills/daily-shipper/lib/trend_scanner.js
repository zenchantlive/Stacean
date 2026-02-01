/**
 * Trend Scanner - Multi-source trend gathering (HN, Reddit, Product Hunt, GitHub, Indie Hackers, X optional)
 */

const { execSync } = require('child_process');

const SOURCE_WEIGHTS = {
  hn: 3,
  hn_algolia: 3,
  reddit: 1.5,
  producthunt: 2,
  github: 1.5,
  indiehackers: 1.5,
  x: 1,
  mock: 1
};

const STOPWORDS = new Set([
  'the','a','an','and','or','of','to','in','for','with','on','by','from','at','as','is','are','be','how','why','what','when','new','using','use','app','apps','tool','tools','platform','service','launch','launches','build','building','built'
]);

async function scanTrends() {
  const items = [];

  items.push(...(await fetchHackerNewsRSS()));
  items.push(...(await fetchHackerNewsAlgolia()));
  items.push(...(await fetchReddit([ 'SideProject', 'SaaS', 'Entrepreneur', 'startups', 'Artificial', 'MachineLearning', 'devtools', 'datascience', 'devops' ])));
  items.push(...(await fetchProductHunt()));
  items.push(...(await fetchGitHubTrending()));
  items.push(...(await fetchIndieHackers()));
  items.push(...(await fetchXTrendsOptional()));

  const filtered = items.filter(isRelevant);
  if (filtered.length === 0) return getMockTrends();

  const clusters = clusterItems(filtered);
  const scored = scoreClusters(clusters);

  return scored.slice(0, 12);
}

async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'daily-shipper/1.0' } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'daily-shipper/1.0' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchHackerNewsRSS() {
  const xml = await fetchText('https://news.ycombinator.com/rss');
  if (!xml) return [];
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml))) {
    const block = match[1];
    const title = extractXml(block, 'title');
    const link = extractXml(block, 'link');
    const pubDate = extractXml(block, 'pubDate');
    if (!title) continue;
    items.push({
      id: `hn-${hash(title)}`,
      title: clean(title),
      description: `HN: ${clean(title)}`,
      url: link || 'https://news.ycombinator.com',
      engagement: 120,
      ageHours: ageHoursFromDate(pubDate),
      source: 'hn'
    });
  }
  return items;
}

async function fetchHackerNewsAlgolia() {
  const json = await fetchJson('https://hn.algolia.com/api/v1/search?tags=front_page');
  if (!json || !Array.isArray(json.hits)) return [];
  return json.hits.map(hit => ({
    id: `hna-${hit.objectID}`,
    title: clean(hit.title || hit.story_title || ''),
    description: `HN front page: ${clean(hit.title || hit.story_title || '')}`,
    url: hit.url || hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    engagement: hit.points || 100,
    ageHours: ageHoursFromDate(hit.created_at),
    source: 'hn_algolia'
  })).filter(t => t.title);
}

async function fetchReddit(subs) {
  const all = [];
  for (const sub of subs) {
    const json = await fetchJson(`https://www.reddit.com/r/${sub}/.json?limit=25`);
    const children = json?.data?.children || [];
    for (const child of children) {
      const data = child.data || {};
      if (!data.title) continue;
      all.push({
        id: `rd-${data.id}`,
        title: clean(data.title),
        description: data.selftext ? trim(data.selftext, 200) : `Reddit r/${sub}`,
        url: `https://www.reddit.com${data.permalink}`,
        engagement: (data.score || 0) + (data.num_comments || 0) * 2,
        ageHours: ageHoursFromUnix(data.created_utc),
        source: 'reddit',
        subreddit: sub
      });
    }
  }
  return all;
}

async function fetchProductHunt() {
  const xml = await fetchText('https://www.producthunt.com/feed?category=ai');
  if (!xml) return [];
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml))) {
    const block = match[1];
    const title = extractXml(block, 'title');
    const link = extractAtomLink(block);
    const summary = extractXml(block, 'summary') || extractXml(block, 'content');
    const published = extractXml(block, 'published') || extractXml(block, 'updated');
    if (!title) continue;
    entries.push({
      id: `ph-${hash(title)}`,
      title: clean(title),
      description: summary ? clean(stripHtml(summary)) : `Product Hunt launch: ${clean(title)}`,
      url: link || 'https://www.producthunt.com',
      engagement: 140,
      ageHours: ageHoursFromDate(published),
      source: 'producthunt'
    });
  }
  return entries;
}

async function fetchGitHubTrending() {
  const html = await fetchText('https://github.com/trending');
  if (!html) return [];
  const items = [];
  const repoRegex = /<h2 class="h3 lh-condensed">[\s\S]*?<a href="\/(.*?)"/g;
  let match;
  while ((match = repoRegex.exec(html))) {
    const repo = match[1];
    const title = repo.replace(/\s+/g, '').replace(/\//g, ' / ');
    items.push({
      id: `gh-${hash(repo)}`,
      title: clean(title),
      description: `GitHub trending repo: ${repo}`,
      url: `https://github.com/${repo}`,
      engagement: 90,
      ageHours: 12,
      source: 'github'
    });
    if (items.length >= 20) break;
  }
  return items;
}

async function fetchIndieHackers() {
  const html = await fetchText('https://www.indiehackers.com/');
  if (!html) return [];
  const items = [];
  const titleRegex = /<h2[^>]*>([^<]+)<\/h2>/g;
  let match;
  while ((match = titleRegex.exec(html))) {
    const title = clean(match[1]);
    if (!title || title.length < 10) continue;
    items.push({
      id: `ih-${hash(title)}`,
      title,
      description: `Indie Hackers discussion: ${title}`,
      url: 'https://www.indiehackers.com/',
      engagement: 80,
      ageHours: 12,
      source: 'indiehackers'
    });
    if (items.length >= 20) break;
  }
  return items;
}

async function fetchXTrendsOptional() {
  const authToken = process.env.AUTH_TOKEN;
  const ct0 = process.env.CT0;
  if (!authToken || !ct0) return [];

  const sources = [
    `AUTH_TOKEN="${authToken}" CT0="${ct0}" bunx @steipete/bird news -n 40 --json`,
    `AUTH_TOKEN="${authToken}" CT0="${ct0}" bunx @steipete/bird trending -n 40 --json`,
    `AUTH_TOKEN="${authToken}" CT0="${ct0}" bunx @steipete/bird search "developer tools" -n 20 --json`,
    `AUTH_TOKEN="${authToken}" CT0="${ct0}" bunx @steipete/bird search "AI tools" -n 20 --json`
  ];

  const items = [];
  for (const cmd of sources) {
    try {
      const raw = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) items.push(...parsed);
    } catch {
      // ignore
    }
  }

  const map = new Map();
  for (const t of items) {
    const headline = t.headline || t.text || t.title || '';
    if (!headline) continue;
    if (map.has(headline)) continue;

    map.set(headline, {
      id: t.id || t.rest_id || headline.slice(0, 20),
      title: clean(headline),
      description: `Trending on X: ${clean(headline)} (${t.postCount || t.retweet_count || 'many'} posts)`,
      engagement: t.postCount || t.retweet_count || 100,
      ageHours: parseTimeAgo(t.timeAgo),
      url: t.url || t.permalink || '',
      source: 'x'
    });
  }

  return Array.from(map.values());
}

function clusterItems(items) {
  const clusters = [];
  for (const item of items) {
    const tokens = tokenize(item.title + ' ' + item.description);
    let placed = false;
    for (const cluster of clusters) {
      const similarity = jaccard(tokens, cluster.tokens);
      if (similarity >= 0.45) {
        cluster.items.push(item);
        cluster.tokens = union(cluster.tokens, tokens);
        placed = true;
        break;
      }
    }
    if (!placed) {
      clusters.push({
        id: `cluster-${clusters.length + 1}`,
        title: item.title,
        description: item.description,
        items: [item],
        tokens
      });
    }
  }
  return clusters;
}

function scoreClusters(clusters) {
  return clusters.map(cluster => {
    const sources = new Set(cluster.items.map(i => i.source));
    const providers = new Set(cluster.items.map(i => normalizeSource(i.source)));
    const engagement = cluster.items.reduce((sum, i) => sum + (i.engagement || 0), 0);
    const avgAge = cluster.items.reduce((sum, i) => sum + (i.ageHours || 12), 0) / cluster.items.length;

    let weighted = 0;
    for (const item of cluster.items) {
      weighted += (item.engagement || 0) * (SOURCE_WEIGHTS[item.source] || 1);
    }

    const crossSourceBonus = providers.size >= 2 ? 200 : -200;
    const recencyBonus = Math.max(0, 24 - avgAge) * 5;

    const finalScore = weighted + crossSourceBonus + recencyBonus;

    return {
      id: cluster.id,
      title: cluster.title,
      description: cluster.description,
      engagement,
      ageHours: Math.round(avgAge),
      sources: Array.from(sources),
      providers: Array.from(providers),
      evidence: cluster.items.slice(0, 6),
      source: providers.size > 1 ? 'multi' : cluster.items[0].source,
      finalScore
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

function normalizeSource(source) {
  if (source === 'hn' || source === 'hn_algolia') return 'hn';
  return source;
}

function isRelevant(trend) {
  const text = `${trend.title} ${trend.description}`.toLowerCase();
  const exclude = ['politics','sports','celebrity','royal','crime','court','doj','epstein','election','war','memecoin','pump','dump','stock','stocks','market','gaming','nintendo','roblox','fifa','nfl','nba'];
  if (exclude.some(w => text.includes(w))) return false;

  const include = [
    'ai','agent','developer','dev','tool','framework','open source','github','api','docs','testing','debug',
    'saas','b2b','startup','growth','workflow','automation','model','llm','prompt','infra','devops',
    'consumer','productivity','commerce','creator'
  ];
  return include.some(w => text.includes(w));
}

function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w))
  );
}

function jaccard(a, b) {
  const inter = [...a].filter(x => b.has(x)).length;
  const unionSize = new Set([...a, ...b]).size;
  return unionSize === 0 ? 0 : inter / unionSize;
}

function union(a, b) {
  return new Set([...a, ...b]);
}

function extractXml(block, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(re);
  return m ? m[1].trim() : '';
}

function extractAtomLink(block) {
  const m = block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/i);
  return m ? m[1] : '';
}

function stripHtml(text) {
  return text.replace(/<[^>]+>/g, ' ');
}

function clean(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function trim(text, len) {
  const t = clean(stripHtml(text));
  return t.length > len ? `${t.slice(0, len)}…` : t;
}

function ageHoursFromDate(dateStr) {
  if (!dateStr) return 12;
  const ms = Date.parse(dateStr);
  if (Number.isNaN(ms)) return 12;
  return Math.max(1, Math.round((Date.now() - ms) / 36e5));
}

function ageHoursFromUnix(sec) {
  if (!sec) return 12;
  return Math.max(1, Math.round((Date.now() - sec * 1000) / 36e5));
}

function parseTimeAgo(timeAgo) {
  if (!timeAgo) return 6;
  const m = timeAgo.match(/(\d+)\s*(hour|day|min)/i);
  if (!m) return 6;
  const num = parseInt(m[1]);
  if (m[2].startsWith('hour')) return num;
  if (m[2].startsWith('day')) return num * 24;
  if (m[2].startsWith('min')) return num / 60;
  return 6;
}

function hash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function getMockTrends() {
  return [
    {
      id:'mock-1',
      title:'AI-powered API documentation generator',
      description:'Auto-generate docs from code with validation and changelog tracking.',
      engagement:680,
      ageHours:4,
      source:'mock',
      sources:['mock'],
      evidence: []
    },
    {
      id:'mock-2',
      title:'Test suite flakiness tracker',
      description:'Track flaky tests and auto-route owners with confidence scores.',
      engagement:520,
      ageHours:3,
      source:'mock',
      sources:['mock'],
      evidence: []
    }
  ];
}

module.exports = { scanTrends };
