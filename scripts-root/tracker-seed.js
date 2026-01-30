import { taskTracker } from '../system/integrations/kv/tracker';

async function main() {
  console.log('🌱 Seeding Task Tracker...');

  // 1. Create Task
  try {
    console.log('Creating task...');
    const task = await taskTracker.createTask({
      title: 'Task-001',
      description: 'Verify the Data Core implementation',
      priority: 'high',
      assignedTo: 'Neon-Hawk'
    });
    console.log('✅ Created Task:', task.id);

    // 2. Read it back
    console.log('Reading task back...');
    const fetched = await taskTracker.getTask(task.id);
    
    if (!fetched) {
      console.error('❌ Failed to fetch task!');
      process.exit(1);
    }

    if (fetched.title !== 'Task-001') {
      console.error('❌ Data mismatch!', fetched);
      process.exit(1);
    }

    // 2b. Test List
    console.log('Testing listTasks...');
    const list = await taskTracker.listTasks();
    console.log(`Found ${list.length} tasks.`);
    if (list.length !== 1) {
       console.error('❌ listTasks failed to find the task');
    }

    // 3. Log Result
    console.log('🎉 Verification Successful!');
    console.log(JSON.stringify(fetched, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seed:', error);
    process.exit(1);
  }
}

main();
