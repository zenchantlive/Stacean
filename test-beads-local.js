// Test Beads integration from blog directory

import { createClient } from './lib/integrations/beads/client-cached';

async function testBeadsConnection() {
  console.log('🔍 Testing Beads Integration from blog directory...');
  
  try {
    const client = createClient();
    
    // Test 1: Create a task
    console.log('\n✅ Test 1: Creating task...');
    const task = await client.createTask({
      title: 'Test task from blog directory',
      description: 'Testing if blog directory can connect to Beads',
      priority: '1'
    });
    console.log('📝 Task created:', task);
    
    // Test 2: List tasks
    console.log('\n✅ Test 2: Listing tasks...');
    const tasks = await client.listTasks();
    console.log('📋 Tasks:', tasks);
    
    // Test 3: Get issues
    console.log('\n✅ Test 3: Listing issues...');
    const issues = await client.getIssues();
    console.log('📋 Issues:', issues);
    
    console.log('\n🎉 All tests passed! Beads integration is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

testBeadsConnection();
