import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Dashboard Edge Cases - Null Safety', () => {

  test('Bug regression: FleetBar should not crash with empty agents', async ({ page }) => {
    /**
     * REPRODUCES THE EXACT BUG:
     * - FleetBar receives empty agents array (common during startup)
     * - AgentAvatar receives hardcoded "YOU" agent
     * - Console error: "Cannot read properties of undefined (reading 'status')"
     */

    await page.goto(BASE_URL);

    // Collect ALL console messages
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Wait for multiple render cycles (component polls every 5s)
    // Give it time to hit the edge case
    await page.waitForTimeout(10000);

    // Find the specific error we're fixing
    const statusErrors = consoleMessages.filter(msg =>
      msg.type === 'error' &&
      msg.text.includes('Cannot read properties of undefined') &&
      msg.text.includes("reading 'status'")
    );

    // Log all errors for debugging
    const allErrors = consoleMessages.filter(msg => msg.type === 'error');
    if (allErrors.length > 0) {
      console.log('🔴 All console errors:');
      allErrors.forEach((err, i) => {
        console.log(`  [${i}] ${err.text}`);
      });
    }

    // The bug should NOT appear
    expect(statusErrors.length).toBe(0);

    // FleetBar should still be visible and functional
    await expect(page.getByText('YOU', { exact: true })).toBeVisible();
    await expect(page.getByText('ME', { exact: true })).toBeVisible();
  });

  test('TaskWidget should render without crashing (no agent selected)', async ({ page }) => {
    /**
     * Edge case: User loads page, no agent selected yet
     * Should show "Select an agent to view details" without errors
     */

    await page.goto(BASE_URL);

    // Collect console errors
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text()
        });
      }
    });

    // Wait for initial render
    await page.waitForTimeout(2000);

    // Should see Fleet Bar
    await expect(page.getByText('YOU', { exact: true })).toBeVisible();

    // Should NOT crash with undefined access errors
    const hasUndefinedError = consoleMessages.some(err =>
      err.text.includes('Cannot read properties of undefined') ||
      err.text.includes("reading 'status'")
    );

    if (consoleMessages.length > 0) {
      console.log('🔴 Console errors found:', consoleMessages);
    }

    expect(hasUndefinedError).toBe(false);
  });

  test('Agent selection should work without console errors', async ({ page }) => {
    /**
     * Edge case: Clicking on agent avatars should work even if
     * underlying agent data is incomplete or timing issues occur
     */

    await page.goto(BASE_URL);

    // Collect console messages
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text()
        });
      }
    });

    // Click the YOU agent (should be visible)
    const youAgent = page.getByText('YOU', { exact: true });
    await expect(youAgent).toBeVisible();
    await youAgent.click();

    // Wait for UI to update (might show deck view or grid view)
    await page.waitForTimeout(2000);

    // Should NOT crash
    const hasUndefinedError = consoleMessages.some(err =>
      err.text.includes('Cannot read properties of undefined') ||
      err.text.includes("reading 'status'")
    );

    expect(hasUndefinedError).toBe(false);
  });

  test('Continuous polling should not accumulate errors', async ({ page }) => {
    /**
     * Edge case: Dashboard polls every 5 seconds
     * If there's a bug, errors should accumulate in console
     * With the fix, no errors should appear over time
     */

    await page.goto(BASE_URL);

    // Collect console errors
    const errorCount = { status: 0, total: 0 };
    page.on('console', msg => {
      if (msg.type === 'error') {
        errorCount.total++;
        if (msg.text().includes('Cannot read properties of undefined') &&
            msg.text().includes("reading 'status'")) {
          errorCount.status++;
        }
      }
    });

    // Wait for multiple poll cycles (3 cycles = 15 seconds)
    await page.waitForTimeout(15000);

    // Should have zero status errors
    console.log(`📊 After 15s: ${errorCount.total} total errors, ${errorCount.status} status errors`);

    expect(errorCount.status).toBe(0);
  });

  test('Quick Add should work without crashing', async ({ page }) => {
    /**
     * Edge case: Creating a task while agents array might be empty
     * TaskWidget should not crash during task creation
     */

    await page.goto(BASE_URL);

    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Type in the quick add input
    const input = page.getByPlaceholder('New objective...');
    await expect(input).toBeVisible();
    await input.fill(`Edge case test task ${Date.now()}`);

    // Press Enter to create
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/tracker/tasks')
    );
    await input.press('Enter');
    await responsePromise;

    // Wait for UI update
    await page.waitForTimeout(1000);

    // Should NOT have crashed
    const hasUndefinedError = consoleErrors.some(err =>
      err.includes('Cannot read properties of undefined') ||
      err.includes("reading 'status'")
    );

    expect(hasUndefinedError).toBe(false);
  });

});

test.describe('Dashboard - Smoke Tests', () => {

  test('Dashboard loads without JavaScript errors', async ({ page }) => {
    /**
     * Basic smoke test: Page should load with zero JavaScript errors
     */

    const jsErrors: string[] = [];

    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(`Console: ${msg.text()}`);
      }
    });

    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    if (jsErrors.length > 0) {
      console.log('🔴 JavaScript errors found:');
      jsErrors.forEach((err, i) => {
        console.log(`  [${i}] ${err}`);
      });
    }

    expect(jsErrors.length).toBe(0);
  });

  test('Main UI elements are accessible', async ({ page }) => {
    /**
     * Smoke test: Verify key UI elements are present and clickable
     */

    await page.goto(BASE_URL);

    // Fleet Bar should be visible
    await expect(page.getByText('YOU', { exact: true })).toBeVisible();

    // Quick Add input should be visible
    await expect(page.getByPlaceholder('New objective...')).toBeVisible();

    // View toggle buttons should be present
    const layoutGridIcon = page.locator('svg').nth(0); // First icon (LayoutGrid)
    await expect(layoutGridIcon).toBeVisible();

    // Status: No console errors during these checks
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    expect(consoleErrors.filter(err =>
      err.includes('Cannot read properties of undefined')
    ).length).toBe(0);
  });

});
