/**
 * Concept Generator (model-driven, non-repetitive)
 * Generates multiple distinct concepts and scores them.
 */

function generateConcepts(trend) {
  const text = `${trend.title} ${trend.description}`.toLowerCase();
  const keywords = extractKeywords(text);

  const base = {
    problem: `Developers lack tools to act on: ${trend.title}.`,
    solution: `Provide a focused product that operationalizes this trend into daily workflows.`
  };

  const concepts = [
    makeCostGuardConcept(trend, keywords, base),
    makeWorkflowDashboardConcept(trend, keywords, base),
    makeAuditTrailConcept(trend, keywords, base),
    makeAlertingConcept(trend, keywords, base),
    makePlaybookConcept(trend, keywords, base)
  ];

  return concepts.filter(Boolean);
}

function pickBestConcept(trend) {
  const concepts = generateConcepts(trend);
  const scored = concepts.map(c => ({
    concept: c,
    score: scoreConcept(c, trend)
  })).sort((a,b) => b.score - a.score);

  return scored[0]?.concept || null;
}

function scoreConcept(c, trend) {
  let score = 0;
  score += (c.uiPages?.length || 0) * 10;
  score += (c.dataFields?.length || 0) * 5;
  score += /dashboard|monitor|alert|audit|playbook/i.test(c.appName) ? 10 : 0;
  score += c.appDescription?.length > 60 ? 10 : 0;
  score += c.nonTrivialityCheck ? 10 : 0;
  score += c.appName.toLowerCase().includes(extractPrimaryTerm(trend)) ? 5 : 0;
  return score;
}

function makeCostGuardConcept(trend, keywords, base) {
  if (!/cost|drain|bill|spend|budget/i.test(`${trend.title} ${trend.description}`)) return null;
  return {
    appName: 'Agent Cost Guard',
    appDescription: 'Dashboard to monitor agent spend, alert on spikes, and enforce budget limits.',
    ...base,
    resourceSingular: 'agent',
    resourcePlural: 'agents',
    dataFields: [
      { name: 'name', type: 'string', required: true },
      { name: 'owner', type: 'string', required: true },
      { name: 'hourlyCost', type: 'number', required: true },
      { name: 'dailyBudget', type: 'number', required: true },
      { name: 'status', type: 'string', required: true }
    ],
    primaryWorkflow: ['Register agent', 'Track cost', 'Set limits', 'Alert + pause'],
    uiPages: ['Dashboard', 'Agents', 'Alerts', 'Settings'],
    apiEndpoints: [
      { method: 'GET', path: '/api/agents', description: 'List agents' },
      { method: 'POST', path: '/api/agents', description: 'Create agent' },
      { method: 'DELETE', path: '/api/agents/:id', description: 'Delete agent' }
    ],
    nonTrivialityCheck: 'Includes monitoring, alerts, and budgets; not a script.',
    tests: ['Create agent', 'List agents', 'Delete agent']
  };
}

function makeWorkflowDashboardConcept(trend, keywords, base) {
  return {
    appName: `${capitalize(extractPrimaryTerm(trend))} Workflow Dashboard`,
    appDescription: 'Operational dashboard to track tasks, owners, and statuses tied to this trend.',
    ...base,
    resourceSingular: 'task',
    resourcePlural: 'tasks',
    dataFields: [
      { name: 'title', type: 'string', required: true },
      { name: 'owner', type: 'string', required: true },
      { name: 'status', type: 'string', required: true },
      { name: 'priority', type: 'string', required: false }
    ],
    primaryWorkflow: ['Create task', 'Assign owner', 'Update status', 'Resolve'],
    uiPages: ['Dashboard', 'Task Board', 'Task Detail'],
    apiEndpoints: [
      { method: 'GET', path: '/api/tasks', description: 'List tasks' },
      { method: 'POST', path: '/api/tasks', description: 'Create task' },
      { method: 'DELETE', path: '/api/tasks/:id', description: 'Delete task' }
    ],
    nonTrivialityCheck: 'Includes UI, API, workflow board; not a script.',
    tests: ['Create task', 'List tasks', 'Delete task']
  };
}

function makeAuditTrailConcept(trend, keywords, base) {
  return {
    appName: `${capitalize(extractPrimaryTerm(trend))} Audit Trail`,
    appDescription: 'Track actions, changes, and events with searchable audit logs.',
    ...base,
    resourceSingular: 'event',
    resourcePlural: 'events',
    dataFields: [
      { name: 'action', type: 'string', required: true },
      { name: 'actor', type: 'string', required: true },
      { name: 'timestamp', type: 'string', required: true },
      { name: 'details', type: 'string', required: false }
    ],
    primaryWorkflow: ['Log event', 'Search audit', 'Export report'],
    uiPages: ['Audit Log', 'Event Detail', 'Export'],
    apiEndpoints: [
      { method: 'GET', path: '/api/events', description: 'List events' },
      { method: 'POST', path: '/api/events', description: 'Create event' },
      { method: 'DELETE', path: '/api/events/:id', description: 'Delete event' }
    ],
    nonTrivialityCheck: 'Includes audit log + search; not a script.',
    tests: ['Create event', 'List events', 'Delete event']
  };
}

function makeAlertingConcept(trend, keywords, base) {
  return {
    appName: `${capitalize(extractPrimaryTerm(trend))} Alerting Hub`,
    appDescription: 'Create alert rules and triage incidents related to the trend.',
    ...base,
    resourceSingular: 'alert',
    resourcePlural: 'alerts',
    dataFields: [
      { name: 'rule', type: 'string', required: true },
      { name: 'severity', type: 'string', required: true },
      { name: 'status', type: 'string', required: true },
      { name: 'channel', type: 'string', required: false }
    ],
    primaryWorkflow: ['Create rule', 'Trigger alert', 'Resolve'],
    uiPages: ['Alerts', 'Rules', 'Settings'],
    apiEndpoints: [
      { method: 'GET', path: '/api/alerts', description: 'List alerts' },
      { method: 'POST', path: '/api/alerts', description: 'Create alert' },
      { method: 'DELETE', path: '/api/alerts/:id', description: 'Delete alert' }
    ],
    nonTrivialityCheck: 'Includes rules + alerts + triage; not a script.',
    tests: ['Create alert', 'List alerts', 'Delete alert']
  };
}

function makePlaybookConcept(trend, keywords, base) {
  return {
    appName: `${capitalize(extractPrimaryTerm(trend))} Playbook Manager`,
    appDescription: 'Create and manage response playbooks with steps, owners, and checkpoints.',
    ...base,
    resourceSingular: 'playbook',
    resourcePlural: 'playbooks',
    dataFields: [
      { name: 'name', type: 'string', required: true },
      { name: 'owner', type: 'string', required: true },
      { name: 'steps', type: 'string', required: true },
      { name: 'status', type: 'string', required: false }
    ],
    primaryWorkflow: ['Create playbook', 'Run steps', 'Review'],
    uiPages: ['Playbooks', 'Create Playbook', 'Playbook Detail'],
    apiEndpoints: [
      { method: 'GET', path: '/api/playbooks', description: 'List playbooks' },
      { method: 'POST', path: '/api/playbooks', description: 'Create playbook' },
      { method: 'DELETE', path: '/api/playbooks/:id', description: 'Delete playbook' }
    ],
    nonTrivialityCheck: 'Includes playbooks + steps + ownership; not a script.',
    tests: ['Create playbook', 'List playbooks', 'Delete playbook']
  };
}

function extractKeywords(text) {
  const words = text.split(/\W+/).filter(w => w.length > 3);
  return Array.from(new Set(words));
}

function extractPrimaryTerm(trend) {
  const t = trend.title.toLowerCase();
  if (t.includes('agent')) return 'agent';
  if (t.includes('ai')) return 'ai';
  if (t.includes('openclaw')) return 'openclaw';
  if (t.includes('moltbook')) return 'moltbook';
  return 'dev';
}

function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

module.exports = { generateConcepts, pickBestConcept };
