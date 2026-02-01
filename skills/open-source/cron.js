#!/usr/bin/env node

/**
 * Open Source Discovery (daily)
 * - Finds good first issues/help wanted
 * - Prefers Ruby/Rails, Next.js/JS/TS, Python
 * - Discovery only
 */

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, 'state.json');

const LANG_WEIGHTS = {
  Ruby: 4,
  JavaScript: 3,
  TypeScript: 3,
  Python: 3
};

const QUERIES = [
  'is:issue is:open label:"good first issue" language:Ruby rails',
  'is:issue is:open label:"help wanted" language:Ruby rails',
  'is:issue is:open label:"good first issue" language:Ruby',
  'is:issue is:open label:"help wanted" language:Ruby',
  'is:issue is:open label:"good first issue" language:JavaScript',
  'is:issue is:open label:"good first issue" language:TypeScript',
  'is:issue is:open label:"good first issue" language:Python',
  'is:issue is:open label:"help wanted" language:JavaScript',
  'is:issue is:open label:"help wanted" language:TypeScript',
  'is:issue is:open label:"help wanted" language:Python'
];

async function main() {
  const issues = await fetchIssues();
  if (!issues.length) {
    console.log('No issues found.');
    return;
  }

  const ranked = await rankIssues(issues);
  const { fresh, repeats } = filterFresh(ranked);

  const output = fresh.length ? fresh.slice(0, 8) : repeats.slice(0, 5).map(i => ({ ...i, repeat: true }));
  saveSeen(output);

  console.log(formatReport(output, fresh.length > 0));
}

async function fetchIssues() {
  const all = [];
  for (const q of QUERIES) {
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&per_page=15`;
    const json = await fetchJson(url);
    const items = json?.items || [];
    all.push(...items);
  }

  const map = new Map();
  for (const item of all) {
    if (!item?.id) continue;
    if (map.has(item.id)) continue;
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

async function rankIssues(issues) {
  const ranked = [];
  for (const issue of issues) {
    if (!passesQualityFilters(issue)) continue;

    const repo = await fetchRepo(issue.repository_url);
    const labels = (issue.labels || []).map(l => (typeof l === 'string' ? l : l.name)).filter(Boolean);
    const lang = repo?.language || 'Unknown';
    const stars = repo?.stargazers_count || 0;
    const updatedDays = daysAgo(issue.updated_at);

    let score = 0;
    if (labels.some(l => /good first issue/i.test(l))) score += 20;
    if (labels.some(l => /help wanted/i.test(l))) score += 12;
    score += Math.min(issue.comments || 0, 8);
    score += Math.max(0, 14 - updatedDays); // recent activity bonus
    score += LANG_WEIGHTS[lang] || 0;
    score += Math.min(Math.log10(stars + 1) * 5, 15);

    ranked.push({
      id: issue.id,
      title: issue.title,
      url: issue.html_url,
      repo: repo?.full_name || extractRepo(issue.repository_url),
      language: lang,
      stars,
      labels,
      updated_at: issue.updated_at,
      comments: issue.comments || 0,
      score
    });
  }

  const limited = capPerRepo(ranked.sort((a, b) => b.score - a.score));
  return limited;
}

function filterFresh(ranked) {
  const state = loadState();
  const seen = new Set((state.seenIssueIds || []).map(String));
  const fresh = ranked.filter(i => !seen.has(String(i.id)));
  const repeats = ranked.filter(i => seen.has(String(i.id)));
  return { fresh, repeats };
}

function saveSeen(issues) {
  const state = loadState();
  const next = new Set([...(state.seenIssueIds || []).map(String), ...issues.map(i => String(i.id))]);
  state.seenIssueIds = Array.from(next).slice(-200);
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function formatReport(issues, hasFresh) {
  if (!issues.length) return 'No issues found.';

  const header = hasFresh
    ? '✅ Fresh open‑source issues (discovery‑only)'
    : '⚠️ No new issues found — sending best repeats';

  const lines = issues.map((i, idx) => {
    const labelLine = i.labels.slice(0, 3).join(', ');
    const updated = daysAgo(i.updated_at);
    const repeatTag = i.repeat ? ' (repeat)' : '';
    return `**${idx + 1}. ${i.title}**${repeatTag}\n- Repo: ${i.repo} (${i.language}, ★${i.stars})\n- Labels: ${labelLine || '—'}\n- Comments: ${i.comments} | Updated: ${updated}d ago\n- ${i.url}`;
  }).join('\n\n');

  return `# Open Source Issue Radar\n\n${header}\n\n${lines}\n`;
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
  } catch {
    return { seenIssueIds: [] };
  }
}

async function fetchRepo(url) {
  if (!url) return null;
  return await fetchJson(url);
}

async function fetchJson(url) {
  try {
    const headers = { 'user-agent': 'open-source-radar/1.0' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function extractRepo(repoUrl) {
  if (!repoUrl) return 'unknown';
  const m = repoUrl.match(/repos\/(.*)$/);
  return m ? m[1] : 'unknown';
}

function daysAgo(iso) {
  if (!iso) return 999;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return 999;
  return Math.floor((Date.now() - ms) / 86400000);
}

function passesQualityFilters(issue) {
  const title = (issue.title || '').trim();
  if (title.length < 12) return false;
  if (/^https?:\/\//i.test(title)) return false;
  if (/(add new trivia|add new grammar|add famous|add cultural|add .* fact|add .* quote)/i.test(title)) return false;
  const body = (issue.body || '').trim();
  if (body && body.length < 60) return false;
  return true;
}

function capPerRepo(ranked) {
  const counts = new Map();
  const out = [];
  for (const item of ranked) {
    const repo = item.repo || 'unknown';
    const count = counts.get(repo) || 0;
    if (count >= 2) continue;
    counts.set(repo, count + 1);
    out.push(item);
  }
  return out;
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main };
