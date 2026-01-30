// Playwright E2E Tests for Beads Integration
// Tests all API routes with real browser automation

import { test, expect } from '@playwright/test';
import path from 'path';

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ============================================================================
// Helper Functions
// ============================================================================

function generateTaskId() {
  return `test-task-${Date.now()}`;
}

function generateAgentCodeName() {
  const adjectives = ['Cosmic', 'Quantum', 'Neon', 'Solar', 'Cyber', 'Neural'];
  const animals = ['Falcon', 'Hawk', 'Bear', 'Wolf', 'Eagle', 'Phoenix', 'Dragon', 'Titan'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const anim = animals[Math.floor(Math.random() * animals.length)];
  return `${adj}-${anim}`;
}

// ============================================================================
// Tasks API Tests
// ============================================================================

test.describe('Tasks API - GET /api/tracker/tasks', () => {
  test('should list all tasks', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/tracker/tasks`);

    expect(response.status()).toBe(200);

    const tasks = await response.json();

    expect(Array.isArray(tasks)).toBeTruthy();
    expect(tasks.length).toBeGreaterThan(0);
  });

  test('should create a new task', async ({ page }) => {
    const taskTitle = `E2E Test Task ${Date.now()}`;
    const createResponse = await page.request.post(`${BASE_URL}/api/tracker/tasks`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        title: taskTitle,
        priority: 'high',
      }),
    });

    expect(createResponse.status()).toBe(201);

    const createdTask = await createResponse.json();
    expect(createdTask.id).toBeDefined();
    expect(createdTask.title).toBe(taskTitle);
  });

  test('should update task status', async ({ page }) => {
    // First create a task
    const createResponse = await page.request.post(`${BASE_URL}/api/tracker/tasks`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        title: `E2E Update Task ${Date.now()}`,
        priority: 'medium',
      }),
    });

    expect(createResponse.status()).toBe(201);
    const createdTask = await createResponse.json();

    // Update it to 'in-progress'
    const updateResponse = await page.request.patch(`${BASE_URL}/api/tracker/tasks/${createdTask.id}`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        status: 'in-progress',
      }),
    });

    expect(updateResponse.status()).toBe(200);

    const updatedTask = await updateResponse.json();
    expect(updatedTask.status).toBe('in-progress');
  });

  test('should mark task as done', async ({ page }) => {
    // First create a task
    const createResponse = await page.request.post(`${BASE_URL}/api/tracker/tasks`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        title: `E2E Done Task ${Date.now()}`,
        priority: 'medium',
      }),
    });

    expect(createResponse.status()).toBe(201);
    const createdTask = await createResponse.json();

    // Update it to 'done'
    const updateResponse = await page.request.patch(`${BASE_URL}/api/tracker/tasks/${createdTask.id}`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        status: 'done',
      }),
    });

    expect(updateResponse.status()).toBe(200);

    const updatedTask = await updateResponse.json();
    expect(updatedTask.status).toBe('done');

    // Verify task is gone from 'in-progress' list
    const listResponse = await page.request.get(`${BASE_URL}/api/tracker/tasks?status=in-progress`);
    expect(listResponse.status()).toBe(200);

    const inProgressTasks = await listResponse.json();
    const taskIds = inProgressTasks.map((t: any) => t.id);
    expect(taskIds).not.toContain(createdTask.id);
  });

  test('should delete a task', async ({ page }) => {
    // First create a task
    const createResponse = await page.request.post(`${BASE_URL}/api/tracker/tasks`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        title: `E2E Delete Task ${Date.now()}`,
        priority: 'low',
      }),
    });

    expect(createResponse.status()).toBe(201);
    const createdTask = await createResponse.json();

    // Delete it
    const deleteResponse = await page.request.delete(`${BASE_URL}/api/tracker/tasks/${createdTask.id}`);

    expect(deleteResponse.status()).toBe(200);

    // Verify it's gone
    const listResponse = await page.request.get(`${BASE_URL}/api/tracker/tasks`);
    expect(listResponse.status()).toBe(200);

    const tasks = await listResponse.json();
    const taskIds = tasks.map((t: any) => t.id);
    expect(taskIds).not.toContain(createdTask.id);
  });
});

// ============================================================================
// Agents API Tests
// ============================================================================

test.describe('Agents API - GET /api/tracker/agents', () => {
  test('should list all agents', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/tracker/agents`);

    expect(response.status()).toBe(200);

    const agents = await response.json();

    expect(Array.isArray(agents)).toBeTruthy();
  });

  test('should create a new agent', async ({ page }) => {
    const codeName = generateAgentCodeName();
    const createResponse = await page.request.post(`${BASE_URL}/api/tracker/agents`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        codeName,
        initials: 'TST',
        spawnedBy: 'E2E Test Suite',
      }),
    });

    expect(createResponse.status()).toBe(200);

    const agent = await createResponse.json();

    expect(agent.id).toBeDefined();
    expect(agent.codeName).toBe(codeName);
    expect(agent.status).toBe('idle');
  });

  test('should update agent status to working', async ({ page }) => {
    // First create an agent
    const createResponse = await page.request.post(`${BASE_URL}/api/tracker/agents`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        codeName: generateAgentCodeName(),
        initials: 'WRK',
        spawnedBy: 'E2E Test Suite',
      }),
    });

    expect(createResponse.status()).toBe(200);
    const agent = await createResponse.json();

    // Update to 'working'
    const updateResponse = await page.request.patch(`${BASE_URL}/api/tracker/agents/${agent.id}`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        status: 'working',
        currentAction: 'Testing task assignment',
      }),
    });

    expect(updateResponse.status()).toBe(200);

    const updatedAgent = await updateResponse.json();
    expect(updatedAgent.status).toBe('working');
    expect(updatedAgent.currentAction).toBe('Testing task assignment');
  });

  test('should update agent heartbeat', async ({ page }) => {
    // First create an agent
    const createResponse = await page.request.post(`${BASE_URL}/api/tracker/agents`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        codeName: generateAgentCodeName(),
        initials: 'HBT',
        spawnedBy: 'E2E Test Suite',
      }),
    });

    expect(createResponse.status()).toBe(200);
    const agent = await createResponse.json();

    // Send heartbeat
    const updateResponse = await page.request.patch(`${BASE_URL}/api/tracker/agents/${agent.id}`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        currentAction: 'E2E heartbeat test',
      }),
    });

    expect(updateResponse.status()).toBe(200);

    const updatedAgent = await updateResponse.json();
    expect(updatedAgent.heartbeat).toBeDefined();
  });
});

// ============================================================================
// Integration Tests (E2E Workflow)
// ============================================================================

test.describe('E2E Integration - Full Workflow', () => {
  test('full task lifecycle: create → update → mark done', async ({ page }) => {
    // Step 1: Create task
    const createResponse = await page.request.post(`${BASE_URL}/api/tracker/tasks`, {
      headers: { 'Content-Type': 'final application/json' },
      data: JSON.stringify({
        title: `E2E Workflow Task ${Date.now()}`,
        priority: 'urgent',
        description: 'Full E2E test task',
      }),
    });

    expect(createResponse.status()).toBe(201);
    const createdTask = await createResponse.json();
    console.log('  Created task:', createdTask.id);

    // Step 2: Verify in list
    const listResponse1 = await page.request.get(`${BASE_URL}/api/tracker/tasks`);
    expect(listResponse1.status()).toBe(200);
    const allTasks1 = await listResponse1.json();
    const taskIds1 = allTasks1.map((t: any) => t.id);
    expect(taskIds1).toContain(createdTask.id);

    // Step 3: Update to in-progress
    const updateResponse1 = await page.request.patch(`${BASE_URL}/api/tracker/tasks/${createdTask.id}`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        status: 'in-progress',
      }),
    });

    expect(updateResponse1.status()).toBe(200);
    const updatedTask1 = await updateResponse1.json();
    console.log('  Updated to in-progress:', updatedTask1.status);

    // Step 4: Mark as done
    const updateResponse2 = await page.request.patch(`${BASE_URL}/api/tracker/tasks/${createdTask.id}`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        status: 'done',
      }),
    });

    expect(updateResponse2.status()).toBe(200);
    const updatedTask2 = await updateResponse2.json();
    console.log('  Marked as done:', updatedTask2.status);

    // Step 5: Verify gone from in-progress list
    const listResponse2 = await page.request.get(`${BASE_URL}/api/tracker/tasks?status=in-progress`);
    expect(listResponse2.status()).toBe(200);
    const inProgressTasks = await listResponse2.json();
    const taskIds2 = inProgressTasks.map((t: any) => t.id);
    expect(taskIds2).not.toContain(createdTask.id);
  });

  test('full agent lifecycle: create → update → heartbeat → done', async ({ page }) => {
    // Step 1: Create agent
    const createResponse = await page.request.post(`${BASE_URL}/api/tracker/agents`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        codeName: generateAgentCodeName(),
        initials: 'WF',
        spawnedBy: 'E2E Test Suite',
      }),
    });

    expect(createResponse.status()).toBe(200);
    const agent = await createResponse.json();
    console.log('  Created agent:', agent.id);

    // Step 2: Update to working
    const updateResponse1 = await page.request.patch(`${BASE_URL}/api/tracker/agents/${agent.id}`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        status: 'working',
        currentAction: 'Working on E2E test',
      }),
    });

    expect(updateResponse1.status()).toBe(200);
    const updatedAgent1 = await updateResponse1.json();
    console.log('  Updated to working:', updatedAgent1.status);

    // Step 3: Send heartbeat
    const updateResponse2 = await page.request.patch(`${BASE_URL}/api/tracker/agents/${agent.id}`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        currentAction: 'E2E heartbeat',
      }),
    });

    expect(updateResponse2.status()).toBe(200);
    const updatedAgent2 = await updateResponse2.json();
    console.log('  Sent heartbeat:', updatedAgent2.heartbeat);

    // Step 4: Mark as done
    const updateResponse3 = await page.request.patch(`${BASE_URL}/api/tracker/agents/${agent.id}`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        status: 'done',
        currentAction: 'E2E test complete',
      }),
    });

    expect(updateResponse3.status()).toBe(200);
    const updatedAgent3 = await updateResponse3.json();
    console.log('  Marked as done:', updatedAgent3.status);

    // Step 5: Verify agent status
    const getResponse = await page.request.get(`${BASE_URL}/api/tracker/agents/${agent.id}`);
    expect(getResponse.status()).toBe(200);
    const finalAgent = await getResponse.json();
    expect(finalAgent.status).toBe('done');
    expect(finalAgent.currentAction).toBe('E2E test complete');
  });

  test('concurrent task updates', async ({ page }) => {
    // Create task 1
    const task1 = await page.request.post(`${BASE_URL}/api/tracker/tasks`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        title: `Concurrent Task 1 ${Date.now()}`,
        priority: 'high',
      }),
    });

    expect(task1.status()).toBe(201);
    const createdTask1 = await task1.json();

    // Create task 2
    const task2 = await page.request.post(`${BASE_URL}/api/tracker/tasks`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        title: `Concurrent Task 2 ${Date.now()}`,
        priority: 'high',
      }),
    });

    expect(task2.status()).toBe(201);
    const createdTask2 = await task2.json();

    // Update both in parallel
    const [result1, result2] = await Promise.all([
      page.request.patch(`${BASE_URL}/api/tracker/tasks/${createdTask1.id}`, {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ status: 'in-progress' }),
      }),
      page.request.patch(`${BASE_URL}/api/tracker/tasks/${createdTask2.id}`, {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ status: 'in-progress' }),
      }),
    ]);

    expect(result1.status()).toBe(200);
    expect(result2.status()).toBe(200);

    const updatedTask1 = await result1.json();
    const updatedTask2 = await result2.json();

    expect(updatedTask1.status).toBe('in-progress');
    expect(updatedTask2.status).toBe('in-progress');

    // Verify both are in-progress list
    const listResponse = await page.request.get(`${BASE_URL}/api/tracker/tasks?status=in-progress`);
    const inProgressTasks = await listResponse.json();
    const taskIds = inProgressTasks.map((t: any) => t.id);

    expect(taskIds).toContain(createdTask1.id);
    expect(taskIds).toContain(createdTask2.id);
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

test.describe('Error Handling', () => {
  test('should handle missing title on create', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/tracker/tasks`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        title: '',
      }),
    });

    expect(response.status()).toBe(400);

    const error = await response.json();
    expect(error.error).toBeDefined();
  });

  test('should handle invalid task ID on update', async ({ page }) => {
    const response = await page.request.patch(`${BASE_URL}/api/tracker/tasks/invalid-id`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        status: 'done',
      }),
    });

    expect(response.status()).toBe(404);
  });

  test('should handle invalid agent ID', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/tracker/agents/invalid-id`);

    expect(response.status()).toBe(404);

    const error = await response.json();
    expect(error.error).toBeDefined();
  });
});

// ============================================================================
// Configuration
// ============================================================================

test.describe('Configuration', () => {
  test('BASE_URL is configured', () => {
    expect(BASE_URL).toBeDefined();
    expect(BASE_URL).toContain('localhost');
  });
});
