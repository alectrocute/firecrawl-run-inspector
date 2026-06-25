import { test, expect, type Page } from '@playwright/test';

// ── Mock helpers ─────────────────────────────────────────────────────

const MOCK_SCREENSHOT = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#f0f0f0"/><text x="400" y="300" text-anchor="middle" fill="#999" font-size="20">Mock Screenshot</text></svg>'
);

function makeSuccessResponse() {
  return {
    success: true,
    url: 'https://httpbin.org/forms/post',
    steps: [
      { index: 0, action: { type: 'wait', milliseconds: 500 }, status: 'succeeded', durationMs: 520, preStateScreenshotUrl: MOCK_SCREENSHOT, screenshotUrl: MOCK_SCREENSHOT },
      { index: 1, action: { type: 'write', selector: 'input[name="custname"]', text: 'Test User' }, status: 'succeeded', durationMs: 340, screenshotUrl: MOCK_SCREENSHOT },
      { index: 2, action: { type: 'click', selector: 'button[type="submit"]' }, status: 'succeeded', durationMs: 890, screenshotUrl: MOCK_SCREENSHOT },
    ],
    initialScreenshotUrl: MOCK_SCREENSHOT,
    totalDurationMs: 1750,

  };
}

function makeFailureResponse() {
  return {
    success: false,
    url: 'https://httpbin.org/forms/post',
    steps: [
      { index: 0, action: { type: 'wait', milliseconds: 500 }, status: 'succeeded', durationMs: 510, screenshotUrl: MOCK_SCREENSHOT },
      { index: 1, action: { type: 'write', selector: 'input[name="custname"]', text: 'Test User' }, status: 'succeeded', durationMs: 320, screenshotUrl: MOCK_SCREENSHOT },
      { index: 2, action: { type: 'click', selector: '#nonexistent-button-xyz' }, status: 'failed', error: { message: 'Error in action 5: Element not found for selector "#nonexistent-button-xyz"', classification: 'selector_not_found', rawActionIndex: 5 } },
      { index: 3, action: { type: 'wait', milliseconds: 1000 }, status: 'pending' },
      { index: 4, action: { type: 'screenshot' }, status: 'pending' },
    ],
    totalDurationMs: 1200,

    failure: { failedAtStep: 2, totalSteps: 5, message: 'Error in action 5: Element not found for selector "#nonexistent-button-xyz"', classification: 'selector_not_found' as const, category: 'api' as const },
  };
}

function makeEmptyResponse() {
  return {
    success: true,
    url: 'https://httpbin.org/forms/post',
    steps: [
      { index: 0, action: { type: 'wait', milliseconds: 500 }, status: 'completed_empty', durationMs: 510 },
      { index: 1, action: { type: 'click', selector: '.button' }, status: 'completed_empty', durationMs: 0 },
    ],
    totalDurationMs: 510,

    warnings: [{ type: 'empty_sequence', message: 'The action sequence completed but returned no screenshots or extracted content.' }],
  };
}

function makeTimeoutResponse() {
  return {
    success: false,
    url: 'https://httpbin.org/forms/post',
    steps: [
      { index: 0, action: { type: 'wait', milliseconds: 500 }, status: 'succeeded' },
      { index: 1, action: { type: 'click', selector: '.button' }, status: 'failed', error: { message: 'Scrape timed out after 60000ms', classification: 'api_timeout' } },
    ],
    totalDurationMs: 60000,
    failure: { failedAtStep: 1, totalSteps: 2, message: 'Scrape timed out after 60000ms', classification: 'api_timeout' as const, category: 'network' as const },
  };
}

function makeRateLimitedResponse() {
  return {
    success: false,
    url: 'https://httpbin.org/forms/post',
    steps: [
      { index: 0, action: { type: 'wait', milliseconds: 500 }, status: 'succeeded' },
      { index: 1, action: { type: 'click', selector: '.button' }, status: 'failed', error: { message: 'Rate limit exceeded (429)', classification: 'rate_limited' } },
    ],
    totalDurationMs: 5000,
    retries: [
      { attempt: 1, delayMs: 1000, reason: 'Rate limit exceeded (429)' },
      { attempt: 2, delayMs: 2000, reason: 'Rate limit exceeded (429)' },
    ],
    failure: { failedAtStep: 1, totalSteps: 2, message: 'Rate limit exceeded (429)', classification: 'rate_limited' as const, category: 'api' as const },
  };
}

function makeMismatchResponse() {
  return {
    success: true,
    url: 'https://httpbin.org/forms/post',
    steps: [
      { index: 0, action: { type: 'wait', milliseconds: 500 }, status: 'succeeded', durationMs: 520, preStateScreenshotUrl: MOCK_SCREENSHOT },
      { index: 1, action: { type: 'write', selector: 'input[name="custname"]', text: 'Test User' }, status: 'succeeded', durationMs: 340, screenshotUrl: MOCK_SCREENSHOT },
      { index: 2, action: { type: 'click', selector: 'button[type="submit"]' }, status: 'succeeded', durationMs: 890 },
    ],
    initialScreenshotUrl: MOCK_SCREENSHOT,
    totalDurationMs: 1750,

    warnings: [{ type: 'screenshot_count_mismatch', message: 'Expected 4 screenshots but received 3. Some screenshots may be missing or duplicated.' }],
  };
}

async function mockApi(page: Page, response: unknown) {
  await page.route('**/api/run', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) });
  });
}

async function fillAndRun(page: Page) {
  await page.locator('#url-input').fill('https://httpbin.org/forms/post');
  await page.locator('#actions-input').fill(JSON.stringify([
    { type: 'wait', milliseconds: 500 },
    { type: 'click', selector: 'button[type="submit"]' },
  ]));
  await page.getByRole('button', { name: /Run/ }).click();
}

async function gotoApp(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#url-input', { state: 'visible' });
  await page.waitForTimeout(500);
}

// ── Tests: Page structure ────────────────────────────────────────────

test.describe('Page structure', () => {
  test('renders header with section labels, URL input, actions editor, presets, and Run button', async ({ page }) => {
    await gotoApp(page);
    await expect(page.getByText('Run Inspector').first()).toBeVisible();
    await expect(page.locator('text=01 / Input')).toBeVisible();
    await expect(page.locator('#url-input')).toBeVisible();
    await expect(page.locator('#actions-input')).toBeVisible();
    await expect(page.locator('text=Try a preset')).toBeVisible();
    await expect(page.locator('text=The happy path: fill a form')).toBeVisible();
    await expect(page.locator('text=A broken selector')).toBeVisible();
    await expect(page.locator('text=A multi-step journey')).toBeVisible();
    await expect(page.getByRole('button', { name: /Run sequence/ })).toBeVisible();
  });

  test('shows empty state before any run is performed', async ({ page }) => {
    await gotoApp(page);
    await expect(page.locator('text=Hit a snag at step')).toHaveCount(0);
    await expect(page.getByText('What went wrong', { exact: true })).toHaveCount(0);
  });
});

// ── Tests: Presets ───────────────────────────────────────────────────

test.describe('Presets', () => {
  test('selecting the happy path preset fills URL and actions fields', async ({ page }) => {
    await gotoApp(page);
    await page.locator('text=The happy path: fill a form').click();
    await expect(page.locator('#url-input')).toHaveValue('https://httpbin.org/forms/post');
    const actionsValue = await page.locator('#actions-input').inputValue();
    const parsed = JSON.parse(actionsValue);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThanOrEqual(3);
  });

  test('selecting broken selector preset fills with wrong selector', async ({ page }) => {
    await gotoApp(page);
    await page.locator('text=A broken selector').click();
    const actionsValue = await page.locator('#actions-input').inputValue();
    const parsed = JSON.parse(actionsValue);
    const clickAction = parsed.find((a: { type: string }) => a.type === 'click');
    expect(clickAction).toBeDefined();
    expect(clickAction.selector).toContain('nonexistent');
  });

  test('presets show step count and URL info', async ({ page }) => {
    await gotoApp(page);
    await expect(page.locator('text=4 steps')).toHaveCount(2);
    await expect(page.locator('text=2 steps')).toHaveCount(1);
    await expect(page.locator('text=httpbin.org/forms/post')).toHaveCount(2);
  });
});

// ── Tests: Validation ────────────────────────────────────────────────

test.describe('Validation', () => {
  test('shows error when URL is empty', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#actions-input').fill('[{"type": "wait", "milliseconds": 500}]');
    await page.getByRole('button', { name: /Run/ }).click();
    await expect(page.locator('text=Add a URL to get started')).toBeVisible();
  });

  test('shows error when URL is not valid', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#url-input').fill('not-a-url');
    await page.locator('#actions-input').fill('[{"type": "wait", "milliseconds": 500}]');
    await page.getByRole('button', { name: /Run/ }).click();
    await expect(page.locator("text=That doesn't look like a valid URL")).toBeVisible();
  });

  test('shows error when actions textarea is empty', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#url-input').fill('https://example.com');
    await page.getByRole('button', { name: /Run/ }).click();
    await expect(page.locator("text=isn't quite right")).toBeVisible();
  });

  test('shows error when actions is an empty array', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#url-input').fill('https://example.com');
    await page.locator('#actions-input').fill('[]');
    await page.getByRole('button', { name: /Run/ }).click();
    await expect(page.locator('text=Add at least one action')).toBeVisible();
  });

  test('shows error for invalid JSON', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#url-input').fill('https://example.com');
    await page.locator('#actions-input').fill('not valid json {{{');
    await page.getByRole('button', { name: /Run/ }).click();
    await expect(page.locator("text=isn't quite right")).toBeVisible();
  });

  test('shows error when actions is not an array', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#url-input').fill('https://example.com');
    await page.locator('#actions-input').fill('{"type": "wait"}');
    await page.getByRole('button', { name: /Run/ }).click();
    await expect(page.locator('text=Actions need to be a JSON array')).toBeVisible();
  });

  test('shows error when an action is missing a type field', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#url-input').fill('https://example.com');
    await page.locator('#actions-input').fill('[{"milliseconds": 500}]');
    await page.getByRole('button', { name: /Run/ }).click();
    await expect(page.locator('text=is missing its "type"')).toBeVisible();
  });

  test('shows error for invalid action type', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#url-input').fill('https://example.com');
    await page.locator('#actions-input').fill('[{"type": "invalid_type"}]');
    await page.getByRole('button', { name: /Run/ }).click();
    await expect(page.locator('text=unknown type')).toBeVisible();
  });

  test('Run button shows fix-errors message when validation fails', async ({ page }) => {
    await gotoApp(page);
    await page.locator('#url-input').fill('');
    await page.locator('#actions-input').fill('');
    // Click to trigger validation
    await page.getByRole('button', { name: /Run/ }).click();
    await expect(page.locator('text=Fix the issues above to run')).toBeVisible();
  });
});

// ── Tests: Successful run ────────────────────────────────────────────

test.describe('Successful run', () => {
  test('displays timeline with success banner on success', async ({ page }) => {
    await mockApi(page, makeSuccessResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=All 3 steps passed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.action-timeline')).toBeVisible();
  });

  test('shows step labels in timeline', async ({ page }) => {
    await mockApi(page, makeSuccessResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=All 3 steps passed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.action-timeline').getByText('Step 1', { exact: true })).toBeVisible();
    await expect(page.locator('.action-timeline').getByText('Step 2', { exact: true })).toBeVisible();
    await expect(page.locator('.action-timeline').getByText('Step 3', { exact: true })).toBeVisible();
  });

  test('does not show failure elements on success', async ({ page }) => {
    await mockApi(page, makeSuccessResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=All 3 steps passed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Hit a snag at step')).toHaveCount(0);
    await expect(page.getByText('What went wrong', { exact: true })).toHaveCount(0);
  });
});

// ── Tests: Failed run ────────────────────────────────────────────────

test.describe('Failed run', () => {
  test('shows failure banner with correct step index', async ({ page }) => {
    await mockApi(page, makeFailureResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=Hit a snag at step 3 of 5')).toBeVisible({ timeout: 10000 });
  });

  test('shows red step card for the failing step', async ({ page }) => {
    await mockApi(page, makeFailureResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=Hit a snag at step 3 of 5')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.action-timeline').getByText('FAILED', { exact: true })).toHaveCount(1);
    await expect(page.locator('.action-timeline').getByText('PENDING', { exact: true })).toHaveCount(2);
  });

  test('shows failure analysis section with error classification', async ({ page }) => {
    await mockApi(page, makeFailureResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.getByText('What went wrong', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Selector not found')).toBeVisible();
    await expect(page.locator('text=Error in action 5').first()).toBeVisible();
    await expect(page.locator("text=couldn't find that element")).toBeVisible();
  });

  test('shows error category badge', async ({ page }) => {
    await mockApi(page, makeFailureResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=API Error')).toBeVisible({ timeout: 10000 });
  });

  test('shows failing action JSON and copy button', async ({ page }) => {
    await mockApi(page, makeFailureResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.getByText('The action that failed', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Copy JSON')).toBeVisible();
  });

});

// ── Phase 6: Completed empty ─────────────────────────────────────────

test.describe('Completed empty', () => {
  test('shows empty result banner when sequence completes with no content', async ({ page }) => {
    await mockApi(page, makeEmptyResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=Finished, but nothing came back')).toBeVisible({ timeout: 10000 });
  });

  test('shows EMPTY badge on steps', async ({ page }) => {
    await mockApi(page, makeEmptyResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('.action-timeline').getByText('EMPTY', { exact: true })).toHaveCount(2);
  });
});

// ── Phase 6: Error classification ────────────────────────────────────

test.describe('Error classification', () => {
  test('shows API timeout classification distinctly from step timeout', async ({ page }) => {
    await mockApi(page, makeTimeoutResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=API Timeout (60s)')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=API-level timeout (60s)')).toBeVisible();
  });

  test('shows rate limited with retry info', async ({ page }) => {
    await mockApi(page, makeRateLimitedResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=Rate Limited (429)')).toBeVisible({ timeout: 10000 });
    // Retry info in failure detail
    await expect(page.getByText('Retries', { exact: true })).toBeVisible();
  });

  test('shows retry annotations in timeline for rate limited', async ({ page }) => {
    await mockApi(page, makeRateLimitedResponse());
    await gotoApp(page);
    await fillAndRun(page);
    // Both the timeline banner and failure detail show retry info
    await expect(page.locator('text=2 retries')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Attempt 1').first()).toBeVisible();
    await expect(page.locator('text=Attempt 2').first()).toBeVisible();
  });
});

// ── Phase 6: Warnings ────────────────────────────────────────────────

test.describe('Warnings', () => {
  test('shows warnings banner when warnings are present', async ({ page }) => {
    await mockApi(page, makeMismatchResponse());
    await gotoApp(page);
    await fillAndRun(page);
    // The warnings heading appears above the timeline (use first() to avoid Raw Response JSON match)
    await expect(page.locator('text=Heads up (1)').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Expected 4 screenshots but received 3').first()).toBeVisible();
  });
});

// ── Phase 6: Network vs API error ────────────────────────────────────

test.describe('Network vs API error', () => {
  test('shows network error message when connection fails', async ({ page }) => {
    await page.route('**/api/run', async (route) => { await route.abort('connectionrefused'); });
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator("text=We couldn't reach Firecrawl")).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=connection hiccup')).toBeVisible();
  });

  test('shows API error message when server returns 500', async ({ page }) => {
    await page.route('**/api/run', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ statusCode: 500, message: 'Internal error' }) });
    });
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=Firecrawl ran into an error')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Your request made it through')).toBeVisible();
  });
});

// ── Tests: Screenshot lightbox ───────────────────────────────────────

test.describe('Screenshot lightbox', () => {
  test('clicking screenshot thumbnail opens lightbox', async ({ page }) => {
    await mockApi(page, makeSuccessResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('.action-timeline img').first()).toBeVisible({ timeout: 10000 });
    await page.locator('.action-timeline img').first().click();
    const lightbox = page.locator('.fixed.inset-0.z-50');
    await expect(lightbox).toBeVisible({ timeout: 3000 });
    await expect(lightbox.locator('img')).toBeVisible();
  });

  test('clicking lightbox backdrop closes it', async ({ page }) => {
    await mockApi(page, makeSuccessResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('.action-timeline img').first()).toBeVisible({ timeout: 10000 });
    await page.locator('.action-timeline img').first().click();
    const lightbox = page.locator('.fixed.inset-0.z-50');
    await expect(lightbox).toBeVisible({ timeout: 3000 });
    await lightbox.click({ position: { x: 10, y: 10 } });
    await expect(lightbox).toHaveCount(0);
  });

  test('clicking close button in lightbox closes it', async ({ page }) => {
    await mockApi(page, makeSuccessResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('.action-timeline img').first()).toBeVisible({ timeout: 10000 });
    await page.locator('.action-timeline img').first().click();
    const lightbox = page.locator('.fixed.inset-0.z-50');
    await expect(lightbox).toBeVisible({ timeout: 3000 });
    await lightbox.locator('button').first().click();
    await expect(lightbox).toHaveCount(0);
  });
});

// ── Tests: Loading state ─────────────────────────────────────────────

test.describe('Loading state', () => {
  test('Run button shows running state after click', async ({ page }) => {
    await page.route('**/api/run', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeSuccessResponse()) });
    });
    await gotoApp(page);
    await page.locator('#url-input').fill('https://httpbin.org/forms/post');
    await page.locator('#actions-input').fill('[{"type": "wait", "milliseconds": 500}]');
    await page.getByRole('button', { name: /Run/ }).click();
    await expect(page.getByRole('button', { name: /Running/ })).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Running your sequence')).toBeVisible();
  });

  test('loading state clears after response arrives', async ({ page }) => {
    await mockApi(page, makeSuccessResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=All 3 steps passed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Running your sequence')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Run sequence/ })).toBeEnabled();
  });
});

// ── Tests: Raw response ──────────────────────────────────────────────

test.describe('Raw response', () => {
  test('raw response can be copied to the clipboard after a run', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockApi(page, makeSuccessResponse());
    await gotoApp(page);
    await fillAndRun(page);

    const copyButton = page.getByRole('button', { name: /Copy raw response/i });
    await expect(copyButton).toBeVisible({ timeout: 10000 });
    await copyButton.click();

    // Button confirms the copy succeeded…
    await expect(page.getByRole('button', { name: /Copied/i })).toBeVisible();

    // …and the clipboard holds the full raw response JSON.
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain('"success"');
    expect(clipboard).toContain('true');
  });
});

// ── Tests: Time display ──────────────────────────────────────────────

test.describe('Time display', () => {
  test('shows per-step timing for successful steps', async ({ page }) => {
    await mockApi(page, makeSuccessResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=All 3 steps passed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=520ms')).toBeVisible();
    await expect(page.locator('text=340ms')).toBeVisible();
    await expect(page.locator('text=890ms')).toBeVisible();
  });

  test('shows total time on success banner', async ({ page }) => {
    await mockApi(page, makeSuccessResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=Total time:')).toBeVisible({ timeout: 10000 });
  });
});

// ── Tests: Dark theme ────────────────────────────────────────────────

test.describe('Dark theme', () => {
  test('page renders with dark background', async ({ page }) => {
    await gotoApp(page);
    const body = page.locator('.min-h-screen').first();
    await expect(body).toBeVisible();
    const classAttr = await body.getAttribute('class');
    expect(classAttr).toContain('bg-ash-950');
  });

  test('section labels use monospace slashed notation', async ({ page }) => {
    await gotoApp(page);
    await expect(page.locator('text=01 / Input')).toBeVisible();
    await expect(page.locator('text=02 / Inspect')).toBeVisible();
  });
});

// ── Tests: API key ───────────────────────────────────────────────────

test.describe('API key', () => {
  const STORAGE_KEY = 'firecrawl_api_key';

  test('persists the key to localStorage after a successful run', async ({ page }) => {
    await mockApi(page, makeSuccessResponse());
    await gotoApp(page);
    await page.locator('#api-key-input').fill('fc-test-key-123');
    await fillAndRun(page);
    await expect(page.locator('text=All 3 steps passed')).toBeVisible({ timeout: 10000 });
    const stored = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
    expect(stored).toBe('fc-test-key-123');
    await expect(page.locator('text=Saved on this device')).toBeVisible();
  });

  test('does not persist when no key is entered', async ({ page }) => {
    await mockApi(page, makeSuccessResponse());
    await gotoApp(page);
    await fillAndRun(page);
    await expect(page.locator('text=All 3 steps passed')).toBeVisible({ timeout: 10000 });
    const stored = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
    expect(stored).toBeNull();
  });

  test('hydrates the key from localStorage on load', async ({ page }) => {
    await page.addInitScript(
      ([k, v]) => localStorage.setItem(k, v),
      [STORAGE_KEY, 'fc-restored-key'] as const,
    );
    await gotoApp(page);
    await expect(page.locator('#api-key-input')).toHaveValue('fc-restored-key');
    await expect(page.locator('text=Saved on this device')).toBeVisible();
  });

  test('sends the key as a request header on run', async ({ page }) => {
    let sentKey: string | null = null;
    await page.route('**/api/run', async (route) => {
      sentKey = route.request().headers()['x-firecrawl-api-key'] ?? null;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeSuccessResponse()) });
    });
    await gotoApp(page);
    await page.locator('#api-key-input').fill('fc-header-key');
    await fillAndRun(page);
    await expect(page.locator('text=All 3 steps passed')).toBeVisible({ timeout: 10000 });
    expect(sentKey).toBe('fc-header-key');
  });

  test('Forget clears the persisted key', async ({ page }) => {
    await page.addInitScript(
      ([k, v]) => localStorage.setItem(k, v),
      [STORAGE_KEY, 'fc-restored-key'] as const,
    );
    await gotoApp(page);
    await expect(page.locator('#api-key-input')).toHaveValue('fc-restored-key');
    await page.getByRole('button', { name: 'Forget' }).click();
    await expect(page.locator('#api-key-input')).toHaveValue('');
    const stored = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
    expect(stored).toBeNull();
  });
});
