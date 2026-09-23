import path from 'path';
import fs from 'fs';
import { browser } from '@wdio/globals';
import { getFormattedTimestamp } from '../utils/dateTimeHelper';
import { generateE2EHtmlReport, TestResultItem } from '../utils/htmlReporter';
import { getCurrentEnvironment, getEnvironmentName } from './environment';
import { Logger } from '../utils/logger';

const activeEnv = getCurrentEnvironment();
const envName = getEnvironmentName();
const isHeadless = process.env.HEADLESS !== 'false';
const defaultRetries = process.env.RETRIES !== undefined ? parseInt(process.env.RETRIES, 10) : 2;
const specRetries = process.env.SPEC_RETRIES !== undefined ? parseInt(process.env.SPEC_RETRIES, 10) : 2;
const suiteResults: TestResultItem[] = [];

export const config: WebdriverIO.Config = {
  runner: 'local',
  specFileRetries: specRetries,
  specFileRetriesDelay: 1,
  specFileRetriesDeferred: false,
  specs: [
    path.resolve(__dirname, '../../tests/e2e/**/*.e2e.ts'),
  ],
  exclude: [],
  maxInstances: 1,
  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: [
        ...(isHeadless ? ['--headless=new'] : []),
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--window-size=1920,1080',
      ],
    },
  }],
  logLevel: 'error',
  bail: 0,
  baseUrl: activeEnv.baseUrl,
  waitforTimeout: activeEnv.timeout,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
    retries: defaultRetries,
  },

  onPrepare: function () {
    const sessionTimestamp = Logger.getSessionTimestamp();
    console.log(`\n\x1b[36m[E2E Runner] Target Environment: ${envName.toUpperCase()} | Base URL: ${activeEnv.baseUrl} | Retries: ${defaultRetries}\x1b[0m\n`);
    Logger.info(`[E2E Runner Initialized] Environment: ${envName.toUpperCase()} | Base URL: ${activeEnv.baseUrl} | Max Retries: ${defaultRetries}`);
    Logger.info(`[Execution Log Session] ${Logger.getLogFilePath()}`);
  },

  beforeSuite: function (suite) {
    Logger.info(`[Suite Started] "${suite.title || 'E2E Suite'}" [Env: ${envName.toUpperCase()}]`);
  },

  beforeTest: function (test) {
    Logger.debug(`[Test Started] "${test.title}"`);
  },

  /**
   * Hook executed after each test
   * Supports retry mechanism: captures screenshot on final failure, tracks flaky tests
   */
  afterTest: async function (test, _context, { error, duration, passed, retries }) {
    const timestamp = Logger.getSessionTimestamp();
    const mochaTest = test as any;
    const attempts = typeof mochaTest.currentRetry === 'function'
      ? mochaTest.currentRetry()
      : (mochaTest._currentRetry ?? retries?.attempts ?? 0);
    const limit = typeof mochaTest.retries === 'function'
      ? mochaTest.retries()
      : (mochaTest._retries ?? retries?.limit ?? defaultRetries);
    const willRetry = !passed && attempts < limit;
    const isFlaky = passed && attempts > 0;

    let relativeScreenshotPath: string | null = null;

    if (!passed) {
      if (willRetry) {
        Logger.warn(`[Retry Engine] "${test.title}" failed on attempt ${attempts + 1}/${limit + 1}. Retrying... (Reason: ${(error as Error)?.message})`);
      } else {
        const screenshotsDir = path.resolve(process.cwd(), 'reports/e2e/screenshots');
        if (!fs.existsSync(screenshotsDir)) {
          fs.mkdirSync(screenshotsDir, { recursive: true });
        }
        const screenshotFileName = `${timestamp}.png`;
        const fullScreenshotPath = path.resolve(screenshotsDir, screenshotFileName);
        await browser.saveScreenshot(fullScreenshotPath);
        relativeScreenshotPath = `../screenshots/${screenshotFileName}`;
        Logger.error(`[Test Failed] "${test.title}" failed after all ${limit + 1} attempts. Error: ${(error as Error)?.message}`, error);
        Logger.warn(`[Final Failure Screenshot Captured] Saved at: ${fullScreenshotPath}`);
      }
    } else {
      Logger.success(`[Test Passed] "${test.title}" finished in ${((duration || 0) / 1000).toFixed(2)}s${isFlaky ? ` (Resolved after retry #${attempts})` : ''}`);
    }

    const existingIndex = suiteResults.findIndex(
      (r) => r.title === test.title && r.parent === (test.parent || 'E2E Suite')
    );

    const resultItem: TestResultItem = {
      title: test.title,
      parent: test.parent || 'E2E Suite',
      passed,
      duration: duration || 0,
      error: error ? (error as Error).message : null,
      screenshot: relativeScreenshotPath,
      timestamp,
      retries: attempts,
      isFlaky,
    };

    if (existingIndex >= 0) {
      suiteResults[existingIndex] = resultItem;
    } else {
      suiteResults.push(resultItem);
    }
  },

  /**
   * Hook executed after all tests in a suite complete
   * Writes HTML report into reports/e2e/html/YYYY-MM-DD_HH-mm-ss.html
   */
  afterSuite: async function (suite) {
    if (suiteResults.length === 0) return;

    const htmlDir = path.resolve(process.cwd(), 'reports/e2e/html');
    if (!fs.existsSync(htmlDir)) {
      fs.mkdirSync(htmlDir, { recursive: true });
    }

    const timestamp = Logger.getSessionTimestamp();
    const reportFile = path.resolve(htmlDir, `${timestamp}.html`);
    const htmlContent = generateE2EHtmlReport(suite.title || 'E2E Test Suite', timestamp, suiteResults, envName);
    fs.writeFileSync(reportFile, htmlContent, 'utf-8');
    Logger.info(`[E2E Suite Completed] "${suite.title || 'E2E Suite'}" | Total Results: ${suiteResults.length}`);
    Logger.info(`[HTML Report Generated] ${reportFile}`);
    Logger.info(`[Execution Log File] ${Logger.getLogFilePath()}`);
    console.log(`\n\x1b[32m[E2E Reporter] HTML Report generated: ${reportFile}\x1b[0m\n`);
  },
};
