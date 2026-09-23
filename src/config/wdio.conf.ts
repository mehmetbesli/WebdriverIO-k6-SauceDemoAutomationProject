import path from 'path';
import fs from 'fs';
import { browser } from '@wdio/globals';
import { getFormattedTimestamp } from '../utils/dateTimeHelper';
import { generateE2EHtmlReport, TestResultItem } from '../utils/htmlReporter';
import { getCurrentEnvironment, getEnvironmentName } from './environment';

const activeEnv = getCurrentEnvironment();
const envName = getEnvironmentName();
const isHeadless = process.env.HEADLESS !== 'false';
const suiteResults: TestResultItem[] = [];

export const config: WebdriverIO.Config = {
  runner: 'local',
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
  },

  onPrepare: function () {
    console.log(`\n\x1b[36m[E2E Runner] Target Environment: ${envName.toUpperCase()} | Base URL: ${activeEnv.baseUrl}\x1b[0m\n`);
  },

  /**
   * Hook executed after each test
   * Captures screenshot if test fails into reports/e2e/screenshots/YYYY-MM-DD_HH-mm-ss.png
   */
  afterTest: async function (test, _context, { error, duration, passed }) {
    const timestamp = getFormattedTimestamp();
    let relativeScreenshotPath: string | null = null;

    if (!passed) {
      const screenshotsDir = path.resolve(process.cwd(), 'reports/e2e/screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }
      const screenshotFileName = `${timestamp}.png`;
      const fullScreenshotPath = path.resolve(screenshotsDir, screenshotFileName);
      await browser.saveScreenshot(fullScreenshotPath);
      relativeScreenshotPath = `../screenshots/${screenshotFileName}`;
      console.log(`\x1b[31m[E2E Reporter] Failure screenshot captured: ${fullScreenshotPath}\x1b[0m`);
    }

    suiteResults.push({
      title: test.title,
      parent: test.parent || 'E2E Suite',
      passed,
      duration: duration || 0,
      error: error ? (error as Error).message : null,
      screenshot: relativeScreenshotPath,
      timestamp,
    });
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

    const timestamp = getFormattedTimestamp();
    const reportFile = path.resolve(htmlDir, `${timestamp}.html`);
    const htmlContent = generateE2EHtmlReport(suite.title || 'E2E Test Suite', timestamp, suiteResults, envName);
    fs.writeFileSync(reportFile, htmlContent, 'utf-8');
    console.log(`\n\x1b[32m[E2E Reporter] HTML Report generated: ${reportFile}\x1b[0m\n`);
  },
};
