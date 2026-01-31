import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Fleet Commander / Task Tracker', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for the widget to load (TaskGrid + ActiveTaskBar)
    await expect(page.getByText('To Do')).toBeVisible();
  });

  test('should create a new task via Quick Add', async ({ page }) => {
    const taskTitle = `Test Task ${Date.now()}`;
    
    // Find input and type
    const input = page.getByPlaceholder('New objective...');
    await input.fill(taskTitle);
    
    // Wait for the response after pressing enter (POST returns 201 created)
    const responsePromise = page.waitForResponse(resp => 
      resp.url().includes('/api/tracker/tasks') && (resp.status() === 200 || resp.status() === 201)
    );
    
    await input.press('Enter');
    await responsePromise;

    // Verify task appears in "To Do" column
    await expect(page.getByText(taskTitle)).toBeVisible();
  });

  test('should expand task inline for editing on click', async ({ page }) => {
    const taskTitle = `Edit Test Task ${Date.now()}`;
    
    // 1. Create Task
    const input = page.getByPlaceholder('New objective...');
    await input.fill(taskTitle);
    
    const createResponsePromise = page.waitForResponse(resp => 
      resp.url().includes('/api/tracker/tasks') && (resp.status() === 200 || resp.status() === 201)
    );
    await input.press('Enter');
    await createResponsePromise;
    
    // Wait for task to appear in UI
    await page.waitForTimeout(1000);
    
    const taskCard = page.getByText(taskTitle).first();
    await expect(taskCard).toBeVisible();

    // 2. Click to expand inline
    await taskCard.click();
    
    // Verify inline editor is visible
    await expect(page.locator(`input[value="${taskTitle}"]`)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Description')).toBeVisible();
  });

  test('should show Active Task Bar', async ({ page }) => {
    // New Task button should be visible
    await expect(page.getByText('New Task')).toBeVisible();
  });

  test('should display in-progress task in Active Task Bar', async ({ page }) => {
    const taskTitle = `Active Task ${Date.now()}`;

    // Create task via API
    const createResponse = await page.request.post(`${BASE_URL}/api/tracker/tasks`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        title: taskTitle,
        priority: 'high',
      }),
    });
    expect(createResponse.status()).toBe(201);
    const createdTask = await createResponse.json();

    // Update to in-progress
    const updateResponse = await page.request.patch(`${BASE_URL}/api/tracker/tasks/${createdTask.id}`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ status: 'in-progress' }),
    });
    expect(updateResponse.status()).toBe(200);

    // Refresh UI and verify task appears in Active Task Bar
    await page.reload();
    await expect(page.getByText(taskTitle)).toBeVisible();
  });

});
