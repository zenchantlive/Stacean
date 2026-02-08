/**
 * Project Management Script
 * 
 * Usage:
 * bun run scripts/manage-projects.ts --id=my-app --label="My App" --emoji="🚀"
 * bun run scripts/manage-projects.ts --list
 * bun run scripts/manage-projects.ts --delete=my-app
 */

import { projectTracker } from '../lib/integrations/kv/tracker';

async function main() {
    const args = process.argv.slice(2);
    const params: Record<string, string> = {};

    args.forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            params[key] = value || 'true';
        }
    });

    if (params.list) {
        console.log('Fetching projects...');
        const projects = await projectTracker.listProjects();
        console.table(projects);
        process.exit(0);
    }

    if (params.delete) {
        console.log(`Deleting project: ${params.delete}...`);
        const success = await projectTracker.deleteProject(params.delete);
        console.log(success ? 'Success' : 'Failed (not found)');
        process.exit(0);
    }

    if (params.id && params.label) {
        console.log(`Registering project: ${params.label} (${params.id})...`);
        await projectTracker.setProject({
            id: params.id,
            label: params.label,
            emoji: params.emoji,
            color: params.color,
        });
        console.log('Success!');
        process.exit(0);
    }

    console.log('Usage:');
    console.log('  bun run scripts/manage-projects.ts --id=my-app --label="My App" --emoji="🚀"');
    console.log('  bun run scripts/manage-projects.ts --list');
    console.log('  bun run scripts/manage-projects.ts --delete=my-app');
}

main().catch(console.error);
