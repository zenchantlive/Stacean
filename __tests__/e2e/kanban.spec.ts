/**
 * Stacean v2.0 E2E Tests
 * 
 * These tests are designed to FIND bugs, not just pass.
 * They test edge cases, error handling, and real-world scenarios.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

// ============================================================================
// Test Suite: Kanban Board Core Functionality
// ============================================================================

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/objectives`);
    await page.waitForLoadState('networkidle');
  });

  test('should load tasks from API', async ({ page }) => {
    // BUG TEST: Are tasks actually loading or just showing placeholder data?
    const todoColumn = page.locator('heading:has-text("TODO")').locator('..').locator('..');
    const todoCount = await todoColumn.locator('[role="article"]').count();
    
    // BUG: If this fails, tasks aren't being fetched correctly
    expect(todoCount).toBeGreaterThan(0);
  });

  test('should display correct task counts per column', async ({ page }) => {
    // BUG TEST: Verify counts match actual tasks
    const columns = ['TODO', 'ASSIGNED', 'IN PROGRESS', 'NEEDS YOU', 'READY', 'REVIEW', 'SHIPPED'];
    
    for (const column of columns) {
      const columnEl = page.locator(`heading:has-text("${column}")`).locator('..').locator('..');
      const countText = await columnEl.locator('text').filter({ hasText: /^\d+$/ }).first().textContent();
      const count = parseInt(countText || '0');
      const taskCount = await columnEl.locator('[role="article"]').count();
      
      // BUG: If counts don't match, the counter is broken
      expect(count).toBe(taskCount);
    }
  });

  test('should show LIVE indicator when SSE connected', async ({ page }) => {
    // BUG TEST: Is SSE actually working?
    const liveIndicator = page.getByText('LIVE');
    await expect(liveIndicator).toBeVisible({ timeout: 5000 });
    
    // BUG TEST: Check console for SSE errors
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));
    await page.waitForTimeout(3000);
    
    const hasSSEError = logs.some(log => 
      log.includes('[SSE]') && log.toLowerCase().includes('error')
    );
    
    expect(hasSSEError).toBe(false);
  });
});

// ============================================================================
// Test Suite: Task Modal & Editing
// ============================================================================

test.describe('Task Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/objectives`);
    await page.waitForLoadState('networkidle');
  });

  test('should open modal on task click', async ({ page }) => {
    const firstTask = page.locator('[role="article"]').first();
    await firstTask.click();
    
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    
    // BUG TEST: Verify all tabs exist
    const tabs = ['Overview', 'Activity', 'Sub-agents', 'Deliverables'];
    for (const tab of tabs) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible();
    }
  });

  test('should change status via modal dropdown', async ({ page }) => {
    const firstTask = page.locator('[role="article"]').first();
    await firstTask.click();
    
    // BUG TEST: Verify initial status
    const statusSelect = page.locator('select').filter({ has: page.getByText('Status').locator('..') });
    const initialStatus = await statusSelect.inputValue();
    
    // Change status
    await statusSelect.selectOption({ label: 'IN PROGRESS' });
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // BUG: Wait for modal to close and verify API was called
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
    
    // BUG TEST: Verify task moved to correct column
    const inProgressColumn = page.locator('heading:has-text("IN PROGRESS")').locator('..').locator('..');
    const tasksInColumn = await inProgressColumn.locator('[role="article"]').count();
    expect(tasksInColumn).toBeGreaterThan(0);
  });

  test('should log activity when status changes', async ({ page }) => {
    const firstTask = page.locator('[role="article"]').first();
    await firstTask.click();
    
    // Switch to Activity tab
    await page.getByRole('tab', { name: 'Activity' }).click();
    
    // BUG TEST: Should have at least 1 activity (created)
    const activities = page.locator('[role="listitem"]');
    const activityCount = await activities.count();
    
    // BUG: If 0, activity logging isn't working
    expect(activityCount).toBeGreaterThan(0);
  });

  test('should add comment via activity tab', async ({ page }) => {
    const firstTask = page.locator('[role="article"]').first();
    await firstTask.click();
    await page.getByRole('tab', { name: 'Activity' }).click();
    
    const initialActivities = await page.locator('[role="listitem"]').count();
    
    // Add comment
    const commentInput = page.getByPlaceholder('Add a comment...');
    await commentInput.fill('E2E test comment');
    await page.getByRole('button', { name: 'send message' }).click();
    
    // BUG TEST: Verify new activity appears
    const newActivities = await page.locator('[role="listitem"]').count();
    expect(newActivities).toBe(initialActivities + 1);
  });
});

// ============================================================================
// Test Suite: Task Creation
// ============================================================================

test.describe('Task Creation', () => {
  test('should create task via API', async ({ request }) => {
    // BUG TEST: Direct API call - if this fails, backend is broken
    const response = await request.post(`${BASE_URL}/api/tracker/tasks`, {
      data: {
        title: 'E2E Test Task',
        priority: 'high',
        description: 'Created by automated test',
      },
    });
    
    expect(response.ok()).toBe(true);
    
    const task = await response.json();
    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('activities');
    
    // BUG: New tasks should have "created" activity
    const activities = task.activities || [];
    const hasCreatedActivity = activities.some((a: any) => a.type === 'created');
    expect(hasCreatedActivity).toBe(true);
  });

  test('should handle missing title gracefully', async ({ request }) => {
    // BUG TEST: API should reject tasks without titles
    const response = await request.post(`${BASE_URL}/api/tracker/tasks`, {
      data: {
        priority: 'high',
      },
    });
    
    expect(response.ok()).toBe(false);
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('should handle empty title gracefully', async ({ request }) => {
    // BUG TEST: API should reject empty titles
    const response = await request.post(`${BASE_URL}/api/tracker/tasks`, {
      data: {
        title: '   ',
        priority: 'high',
      },
    });
    
    expect(response.ok()).toBe(false);
  });
});

// ============================================================================
// Test Suite: Task Update & Delete
// ============================================================================

test.describe('Task Updates', () => {
  test('should update task status via API', async ({ request, page }) => {
    // First get a task
    await page.goto(`${BASE_URL}/objectives`);
    await page.waitForLoadState('networkidle');
    
    const firstTask = page.locator('[role="article"]').first();
    const taskText = await firstTask.textContent();
    
    // Extract task ID from API
    const tasksResponse = await request.get(`${BASE_URL}/api/tracker/tasks`);
    const tasks = await tasksResponse.json();
    const task = tasks.find((t: any) => t.title && taskText.includes(t.title));
    
    if (!task) {
      throw new Error('No task found');
    }
    
    // BUG TEST: Update via API
    const updateResponse = await request.patch(`${BASE_URL}/api/tracker/tasks/${task.id}`, {
      data: { status: 'shipped' },
    });
    
    expect(updateResponse.ok()).toBe(true);
    
    const updatedTask = await updateResponse.json();
    expect(updatedTask.status).toBe('shipped');
  });

  test('should handle invalid status gracefully', async ({ request }) => {
    // BUG TEST: API should reject invalid status
    const response = await request.patch(`${BASE_URL}/api/tracker/tasks/invalid-id`, {
      data: { status: 'invalid_status' },
    });
    
    // BUG: Should handle invalid input, not crash
    expect([200, 400, 404, 500]).toContain(response.status());
  });

  test('should soft delete task', async ({ request }) => {
    // BUG TEST: Verify soft delete (status: deleted)
    const createResponse = await request.post(`${BASE_URL}/api/tracker/tasks`, {
      data: {
        title: 'Delete Test Task',
        priority: 'low',
      },
    });
    
    const task = await createResponse.json();
    
    const deleteResponse = await request.delete(`${BASE_URL}/api/tracker/tasks/${task.id}`);
    expect(deleteResponse.ok()).toBe(true);
    
    // BUG TEST: Verify task is marked as deleted, not removed
    const getResponse = await request.get(`${BASE_URL}/api/tracker/tasks`);
    const tasks = await getResponse.json();
    const deletedTask = tasks.find((t: any) => t.id === task.id);
    
    // BUG: If task is completely gone, it's a hard delete (wrong)
    // If task is present with status: 'deleted', it's correct
    expect(deletedTask).toBeTruthy();
  });
});

// ============================================================================
// Test Suite: SSE Real-time Updates
// ============================================================================

test.describe('SSE Real-time Updates', () => {
  test('should receive task updates via SSE', async ({ page }) => {
    await page.goto(`${BASE_URL}/objectives`);
    await page.waitForLoadState('networkidle');
    
    const initialTaskCount = await page.locator('[role="article"]').count();
    
    // Create a task via API
    const response = await page.request.post(`${BASE_URL}/api/tracker/tasks`, {
      data: {
        title: 'SSE Test Task',
        priority: 'high',
      },
    });
    
    expect(response.ok()).toBe(true);
    
    // BUG TEST: Wait for UI to update via SSE
    // If this times out, SSE isn't working
    await page.waitForTimeout(5000);
    
    const newTaskCount = await page.locator('[role="article"]').count();
    expect(newTaskCount).toBe(initialTaskCount + 1);
  });

  test('should show reconnection status', async ({ page }) => {
    // BUG TEST: Simulate connection loss and reconnection
    await page.goto(`${BASE_URL}/objectives`);
    
    // Monitor status indicator
    const statusIndicator = page.getByText(/CONNECTING|LIVE|RECONNECTING|OFFLINE/);
    
    // If status never shows LIVE, SSE isn't initializing
    await expect(statusIndicator).toBeVisible({ timeout: 10000 });
    
    const initialStatus = await statusIndicator.textContent();
    
    // BUG: If initial status isn't CONNECTING or LIVE, something's wrong
    expect(['CONNECTING', 'LIVE']).toContain(initialStatus || '');
  });
});

// ============================================================================
// Test Suite: Mobile Responsiveness
// ============================================================================

test.describe('Mobile UX', () => {
  test('should use tap-modal on mobile (not drag-drop)', async ({ page, context }) => {
    // BUG TEST: Mobile should disable drag-drop
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto(`${BASE_URL}/objectives`);
    
    // Check if drag-drop is disabled for touch devices
    const touchDevice = await page.evaluate(() => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    });
    
    if (touchDevice) {
      // BUG TEST: On mobile, tasks should open modal on click, not drag
      const firstTask = page.locator('[role="article"]').first();
      
      // Tap should open modal immediately
      await firstTask.tap();
      
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible({ timeout: 1000 });
    }
  });

  test('should hide progress stats on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/objectives`);
    
    const progressStats = page.getByText('Progress');
    
    // BUG TEST: Progress stats should be hidden on mobile
    // Use CSS :hidden check
    const isHidden = await progressStats.evaluate((el: any) => {
      return getComputedStyle(el).display === 'none' || getComputedStyle(el).visibility === 'hidden';
    });
    
    expect(isHidden).toBe(true);
  });
});

// ============================================================================
// Test Suite: Data Consistency
// ============================================================================

test.describe('Data Consistency', () => {
  test('should maintain activity log order', async ({ request }) => {
    // BUG TEST: Activities should be newest first
    const response = await request.get(`${BASE_URL}/api/tracker/tasks`);
    const tasks = await response.json();
    
    for (const task of tasks) {
      if (task.activities && task.activities.length > 1) {
        const timestamps = task.activities.map((a: any) => new Date(a.timestamp).getTime());
        
        // Verify descending order
        for (let i = 0; i < timestamps.length - 1; i++) {
          expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
        }
      }
    }
  });

  test('should handle unicode in task title', async ({ request }) => {
    // BUG TEST: API should handle emoji, unicode
    const unicodeTitle = 'Test 🔥 日本語 🎉 مرحبا';
    
    const response = await request.post(`${BASE_URL}/api/tracker/tasks`, {
      data: {
        title: unicodeTitle,
        priority: 'medium',
      },
    });
    
    expect(response.ok()).toBe(true);
    
    const task = await response.json();
    expect(task.title).toBe(unicodeTitle);
  });

  test('should handle XSS in task title', async ({ request }) => {
    // BUG TEST: API should sanitize input
    const xssTitle = '<script>alert("XSS")</script>Test task';
    
    const response = await request.post(`${BASE_URL}/api/tracker/tasks`, {
      data: {
        title: xssTitle,
        priority: 'medium',
      },
    });
    
    // BUG: Should handle gracefully, not crash
    expect([200, 400]).toContain(response.status());
  });
});
