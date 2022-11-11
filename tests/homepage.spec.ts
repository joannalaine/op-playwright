import { test } from '@playwright/test';
import { ClassicRunner, BatchInfo, Configuration, Eyes, Target } from '@applitools/eyes-playwright';

// Applitools objects to share for all tests
export let Runner: ClassicRunner;
export let Batch: BatchInfo;
export let Config: Configuration;

// This method sets up the configuration for running visual tests locally using the classic runner.
// The configuration is shared by all tests in a test suite, so it belongs in a `beforeAll` method.
// If you have more than one test class, then you should abstract this configuration to avoid duplication.
test.beforeAll(async () => {

  // Create the classic runner.
  Runner = new ClassicRunner();

  // Create a new batch for tests.
  // A batch is the collection of visual checkpoints for a test suite.
  // Batches are displayed in the dashboard, so use meaningful names.
  Batch = new BatchInfo({ name: 'Example: Playwright TypeScript with the Classic Runner' });

  // Create a configuration for Applitools Eyes.
  Config = new Configuration();

  // Set the batch for the config.
  Config.setBatch(Batch);
});

// This "describe" method contains related test cases with per-test setup and cleanup.
test.describe('Homepage', () => {

  // Test-specific objects
  let eyes: Eyes;

  // This method sets up each test with its own Applitools Eyes object.
  test.beforeEach(async ({ page }) => {

    // Create the Applitools Eyes object connected to the Classic Runner and set its configuration.
    eyes = new Eyes(Runner, Config);

    // Open Eyes to start visual testing.
    // Each test should open its own Eyes for its own snapshots.
    // It is a recommended practice to set all four inputs below:
    await eyes.open(
      page,                             // The Playwright page object to "watch"
      'Our Place',                      // The name of the app under test
      test.info().title,                // The name of the test case
      { width: 1024, height: 768 });    // The viewport size for the local browser
  });

  test('Email popup should look ok', async ({ page }) => {
    await page.goto('https://fromourplace.com');
    await page.waitForSelector('iframe#attentive_creative');
    await eyes.check('Modal', Target.frame('iframe#attentive_creative').region('#page1').layout());
  });

  test('Homepage should look ok', async ({ page }) => {
    await page.goto('https://fromourplace.com');

    // Close modal
    await page.waitForSelector('iframe#attentive_creative');
    await page.frameLocator('iframe#attentive_creative').locator('button#closeIconContainer').click();

    await eyes.check('Homepage', Target.window().fully().ignoreRegion({ selector: '[data-tbsp-component="marquee"]' }).layout());
  });

  // This method performs cleanup after each test.
  test.afterEach(async () => {

    // Close Eyes to tell the server it should display the results.
    await eyes.closeAsync();

    // Warning: `eyes.closeAsync()` will NOT wait for visual checkpoints to complete.
    // You will need to check the Applitools dashboard for visual results per checkpoint.
    // Note that "unresolved" and "failed" visual checkpoints will not cause the Playwright test to fail.

    // If you want the Playwright test to wait synchronously for all checkpoints to complete, then use `eyes.close()`.
    // If any checkpoints are unresolved or failed, then `eyes.close()` will make the Playwright test fail.
  });
});

test.afterAll(async () => {

  // Close the batch and report visual differences to the console.
  // Note that it forces Playwright to wait synchronously for all visual checkpoints to complete.
  const results = await Runner.getAllTestResults();
  console.log('Visual test results', results);
});
