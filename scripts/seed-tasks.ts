// Seed script for mock KV tasks
import { taskTracker } from '../lib/integrations/kv/tracker';

const testTasks = [
  {
    title: 'Set up agent-swarm-workflow skill',
    description: 'Configure NTM and Agent Mail for parallel agent execution',
    priority: 'high' as const,
    project: 'clawd',
    agentCodeName: 'Neon-Hawk',
  },
  {
    title: 'Design unified dashboard UI',
    description: 'Create tabbed interface with Tasks | Projects | Notes | Ledger',
    priority: 'urgent' as const,
    project: 'stacean',
    agentCodeName: 'Crimson-Wolf',
  },
  {
    title: 'Implement KV↔Beads sync',
    description: 'Mirror task changes between KV storage and Beads issue tracker',
    priority: 'medium' as const,
    project: 'clawd',
    agentCodeName: 'Azure-Fox',
  },
  {
    title: 'Add responsive mobile nav',
    description: 'Implement sticky bottom nav with safe area support',
    priority: 'low' as const,
    project: 'stacean',
    agentCodeName: 'Neon-Hawk',
  },
  {
    title: 'Write integration tests',
    description: 'Create e2e tests for task tracker API endpoints',
    priority: 'medium' as const,
    project: 'clawd',
  },
];

async function seed() {
  console.log('🌱 Seeding mock KV with test tasks...');
  
  for (const task of testTasks) {
    const created = await taskTracker.createTask(task);
    console.log(`  ✓ Created: ${created.title} (${created.id.slice(0,8)})`);
  }

  // List all tasks to verify
  const all = await taskTracker.listTasks();
  console.log(`\n📊 Total tasks: ${all.length}`);
  
  console.log('\n✅ Seed complete!');
  console.log('\nTask IDs for reference:');
  for (const t of all) {
    console.log(`  - ${t.title}: ${t.id}`);
  }
}

seed().catch(console.error);
