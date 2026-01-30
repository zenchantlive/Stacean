import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const statePath = path.join(__dirname, '../public/state.json');

test('Atlas Pulse reflects state.json updates', async ({ page }) => {
  // 1. Set initial state
  const initialState = {
    status: 'Testing',
    currentTask: 'Running E2E tests',
    lastUpdated: new Date().toISOString()
  };
  fs.writeFileSync(statePath, JSON.stringify(initialState, null, 2));

  // 2. Load page
  await page.goto('http://localhost:3001');
  
  // 3. Verify content
  await expect(page.locator('h2').first()).toContainText('Atlas is Testing');
  await expect(page.getByTestId('pulse-card').locator('p').last()).toContainText('Running E2E tests');

  // 4. Update state mid-session
  const updatedState = {
    status: 'Verified',
    currentTask: 'Tests Passed',
    lastUpdated: new Date().toISOString()
  };
  fs.writeFileSync(statePath, JSON.stringify(updatedState, null, 2));

  // 5. Wait for polling (5s interval in component)
  await page.waitForTimeout(6000);

  // 6. Verify update
  await expect(page.locator('h2').first()).toContainText('Atlas is Verified');
  await expect(page.getByTestId('pulse-card').locator('p').last()).toContainText('Tests Passed');
});
