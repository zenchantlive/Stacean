#!/usr/bin/env node

/**
 * Trend Cron Runner
 * - Generates 3 ideas per trend
 * - Avoids repeats (tracks last idea names)
 * - If no new ideas, delivers 1 different idea
 */

const fs = require('fs');
const path = require('path');
const { scanTrends } = require('./trend_scanner');
const { selectTrend } = require('./selector');
const { pickBestConcept, generateConcepts } = require('./concept_generator');

const STATE_PATH = path.join(__dirname, 'state.json');

async function main() {
  const trends = await scanTrends();
  if (!trends || trends.length === 0) {
    console.log('No trends found.');
    return;
  }

  const top = trends.slice(0, 8);
  const multi = top.filter(t => (t.providers || t.sources || []).length >= 2);
  const selectionPool = multi.length ? multi : top;
  const selected = selectTrend(selectionPool) || selectionPool[0];

  let concept = await pickBestConcept(selected);
  concept = generateSpecificConcept(selected) || concept;

  const concepts = buildConceptSet(selected, concept);
  const uniqueConcepts = filterAgainstHistory(concepts);

  const outputConcepts = uniqueConcepts.length ? uniqueConcepts.slice(0, 3) : [pickDifferent(concepts)];
  saveHistory(outputConcepts);

  const report = buildReport(selected, outputConcepts, selectionPool);
  console.log(report);
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
  } catch {
    return { lastIdeas: [] };
  }
}

function saveHistory(concepts) {
  const state = loadState();
  const lastIdeas = concepts.map(c => c.appName).filter(Boolean);
  state.lastIdeas = Array.from(new Set([...(state.lastIdeas || []), ...lastIdeas])).slice(-20);
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function filterAgainstHistory(concepts) {
  const state = loadState();
  const seen = new Set((state.lastIdeas || []).map(s => s.toLowerCase()));
  return concepts.filter(c => !seen.has((c.appName || '').toLowerCase()));
}

function pickDifferent(concepts) {
  return concepts[0] || {
    appName: 'Trend Operations Suite',
    appDescription: 'Operationalize trend evidence into workflows and measurable outcomes.',
    primaryWorkflow: ['Ingest', 'Assign', 'Execute', 'Measure'],
    dataFields: [
      { name: 'title', type: 'string', required: true },
      { name: 'owner', type: 'string', required: true },
      { name: 'status', type: 'string', required: true }
    ]
  };
}

function buildReport(trend, concepts, topTrends) {
  const evidence = (trend.evidence || []).map(e => `- ${e.title} (${e.source}) ${e.url || ''}`).join('\n') || '- (no evidence items)';
  const sources = (trend.providers || trend.sources || [trend.source]).join(', ');
  const topList = topTrends.map(t => `- ${t.title} (${(t.providers || t.sources || [t.source]).join(', ')})`).join('\n');
  const ideasBlock = formatIdeas(trend, concepts);

  return `# Trend Report (Auto)

## Top Trend Candidates
${topList}

---

## Selected Trend
**${trend.title}**

**Sources:** ${sources}
**Score:** ${trend.finalScore?.toFixed(1) || 'N/A'}

### Evidence
${evidence}

---

## Robust App Ideas

${ideasBlock}
`;
}

function formatIdeas(trend, concepts) {
  const pain = formatPain(trend);
  return concepts.map((concept, idx) => {
    const mechanics = concept?.primaryWorkflow?.length
      ? concept.primaryWorkflow.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '1. Ingest data\n2. Process\n3. Deliver output';

    const dataFields = (concept?.dataFields || []).map(f => `- ${f.name} (${f.type})${f.required ? ' *' : ''}`).join('\n') || '- title (string) *\n- owner (string) *\n- status (string) *';

    const businessModel = inferBusinessModel(trend, concept);
    const difficulty = concept?.difficulty || 'Medium';

    return `### Idea ${idx + 1}: ${concept?.appName || 'Trend Operations Suite'}

**Difficulty:** ${difficulty}

**Pain**
${pain}

**Solution**
${concept?.appDescription || 'Provide a focused product that operationalizes this trend into workflows.'}

**Core Mechanics**
${mechanics}

**Data Model (core fields)**
${dataFields}

**Business Model**
${businessModel}
`;
  }).join('\n');
}

function buildConceptSet(trend, defaultConcept) {
  const specific = generateSpecificConcept(trend);
  const generic = generateConcepts(trend).slice(0, 3);

  const pool = [specific, ...generic, defaultConcept].filter(Boolean);
  const unique = [];
  const seen = new Set();
  for (const c of pool) {
    const key = (c.appName || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(c);
  }

  return unique.slice(0, 3).map(c => ({
    ...c,
    difficulty: c.difficulty || inferDifficulty(c)
  }));
}

function inferDifficulty(concept) {
  const name = `${concept?.appName || ''} ${concept?.appDescription || ''}`.toLowerCase();
  if (/(security|zero trust|network|auth|access|compliance)/i.test(name)) return 'Hard';
  if (/(agent|automation|eval|pipeline|monitoring)/i.test(name)) return 'Medium';
  return 'Medium';
}

function formatPain(trend) {
  const sourceLine = (trend.sources || [trend.source]).join(', ');
  return `Teams are seeing repeated signals around "${trend.title}" (${sourceLine}), but lack a structured way to validate the signal, assign ownership, and operationalize it. This leads to scattered experiments, duplicated work, and missed windows.`;
}

function generateSpecificConcept(trend) {
  const text = `${trend.title} ${trend.description}`.toLowerCase();

  if (/(zero trust|network|vpn|security|auth|access)/i.test(text)) {
    return {
      appName: 'Zero‑Trust Access Orchestrator',
      appDescription: 'Policy simulator + rollout manager for zero‑trust networking (device posture, access rules, audit).',
      dataFields: [
        { name: 'policyName', type: 'string', required: true },
        { name: 'resource', type: 'string', required: true },
        { name: 'userGroup', type: 'string', required: true },
        { name: 'devicePosture', type: 'string', required: true },
        { name: 'exceptionWindow', type: 'string', required: false }
      ],
      primaryWorkflow: ['Discover devices', 'Model access policy', 'Simulate impact', 'Roll out + audit'],
      uiPages: ['Policy Simulator', 'Device Posture', 'Access Requests', 'Audit Log'],
      nonTrivialityCheck: 'Includes simulation + enforcement + audit; not a wrapper.'
    };
  }

  if (/(agent|coding agent|autonomous|llm|ai tool)/i.test(text)) {
    return {
      appName: 'Agent Runbook Manager',
      appDescription: 'Define, test, and govern AI agent workflows with guardrails and measurable outcomes.',
      dataFields: [
        { name: 'runbook', type: 'string', required: true },
        { name: 'owner', type: 'string', required: true },
        { name: 'evalSuite', type: 'string', required: true },
        { name: 'budgetLimit', type: 'number', required: false },
        { name: 'status', type: 'string', required: true }
      ],
      primaryWorkflow: ['Draft runbook', 'Attach evals', 'Dry‑run + measure', 'Promote to prod'],
      uiPages: ['Runbooks', 'Eval Results', 'Deployments', 'Budgets'],
      nonTrivialityCheck: 'Includes evals + promotion workflow; not a demo.'
    };
  }

  if (/(api|sdk|docs|documentation)/i.test(text)) {
    return {
      appName: 'API Docs Quality Gate',
      appDescription: 'Continuously lint, diff, and validate API docs against real requests and SDKs.',
      dataFields: [
        { name: 'endpoint', type: 'string', required: true },
        { name: 'status', type: 'string', required: true },
        { name: 'docVersion', type: 'string', required: true },
        { name: 'requestSample', type: 'string', required: false }
      ],
      primaryWorkflow: ['Ingest docs', 'Replay requests', 'Flag mismatches', 'Open PRs'],
      uiPages: ['Coverage', 'Diffs', 'Failures', 'PRs'],
      nonTrivialityCheck: 'Validation pipeline + auto‑PRs; not a wrapper.'
    };
  }

  return null;
}

function inferBusinessModel(trend, concept) {
  const text = `${trend.title} ${trend.description}`.toLowerCase();
  if (text.includes('dev') || text.includes('developer') || text.includes('api')) {
    return '- B2B SaaS: $29–$149/seat/month\n- Team plan with audit, SSO, export\n- Usage‑based tier for automation volume';
  }
  if (text.includes('consumer') || text.includes('creator')) {
    return '- Freemium with paid pro tier\n- $9–$19/month for power users\n- Add‑on marketplace or templates';
  }
  return '- B2B SaaS: per‑seat pricing + usage tier\n- Paid integrations + compliance features';
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main };
