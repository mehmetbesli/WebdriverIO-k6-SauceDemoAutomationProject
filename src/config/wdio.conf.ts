import path from 'path';
import fs from 'fs';
import { browser } from '@wdio/globals';
import { getFormattedTimestamp } from '../utils/dateTimeHelper';
import { generateE2EHtmlReport, TestResultItem } from '../utils/htmlReporter';
import { generateE2EExcelReport } from '../utils/excelReporter';
import { getCurrentEnvironment, getEnvironmentName } from './environment';
import { Logger } from '../utils/logger';

const activeEnv = getCurrentEnvironment();
const envName = getEnvironmentName();
const isHeadless = process.env.HEADLESS !== 'false';
const defaultRetries = process.env.RETRIES !== undefined ? parseInt(process.env.RETRIES, 10) : 2;
const specRetries = process.env.SPEC_RETRIES !== undefined ? parseInt(process.env.SPEC_RETRIES, 10) : 2;
const maxInstances = process.env.MAX_INSTANCES !== undefined ? parseInt(process.env.MAX_INSTANCES, 10) : 3;
const targetBrowser = (process.env.BROWSER || 'chrome').toLowerCase();
const suiteResults: TestResultItem[] = [];

function resolveCapabilities(browserType: string, maxInst: number, headless: boolean): WebdriverIO.Capabilities[] {
  const chromeCap = {
    browserName: 'chrome',
    maxInstances: maxInst,
    'goog:chromeOptions': {
      args: [
        ...(headless ? ['--headless=new'] : []),
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--window-size=1920,1080',
      ],
    },
  };

  const edgeCap = {
    browserName: 'MicrosoftEdge',
    maxInstances: maxInst,
    'ms:edgeOptions': {
      args: [
        ...(headless ? ['--headless=new'] : []),
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--window-size=1920,1080',
      ],
    },
  };

  const firefoxCap = {
    browserName: 'firefox',
    maxInstances: maxInst,
    'moz:firefoxOptions': {
      args: [
        ...(headless ? ['-headless'] : []),
        '--width=1920',
        '--height=1080',
      ],
    },
  };

  if (browserType === 'all' || browserType === 'multi') {
    return [chromeCap, edgeCap];
  }
  if (browserType === 'all-with-firefox') {
    return [chromeCap, edgeCap, firefoxCap];
  }
  if (browserType === 'edge' || browserType === 'msedge' || browserType === 'microsoftedge') {
    return [edgeCap];
  }
  if (browserType === 'firefox' || browserType === 'gecko') {
    return [firefoxCap];
  }
  return [chromeCap];
}

export const config: WebdriverIO.Config = {
  runner: 'local',
  specFileRetries: specRetries,
  specFileRetriesDelay: 1,
  specFileRetriesDeferred: false,
  specs: [
    path.resolve(__dirname, '../../tests/e2e/**/*.e2e.ts'),
  ],
  exclude: [],
  maxInstances: maxInstances,
  capabilities: resolveCapabilities(targetBrowser, maxInstances, isHeadless),
  logLevel: 'error',
  bail: 0,
  baseUrl: activeEnv.baseUrl,
  waitforTimeout: activeEnv.timeout,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: 'reports/allure-results',
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false,
        useCucumberStepReporter: false,
        reportedEnvironmentVars: {
          Environment: envName.toUpperCase(),
          Browser: targetBrowser.toUpperCase(),
          Base_URL: activeEnv.baseUrl,
          Platform: 'Windows 11',
        },
      },
    ],
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
    retries: defaultRetries,
  },

  onPrepare: function () {
    const sessionTimestamp = Logger.getSessionTimestamp();
    console.log(`\n\x1b[36m[E2E Runner] Target Environment: ${envName.toUpperCase()} | Browser: ${targetBrowser.toUpperCase()} | Base URL: ${activeEnv.baseUrl} | Parallel Instances: ${maxInstances} | Retries: ${defaultRetries}\x1b[0m\n`);
    Logger.info(`[E2E Runner Initialized] Environment: ${envName.toUpperCase()} | Browser: ${targetBrowser.toUpperCase()} | Base URL: ${activeEnv.baseUrl} | Max Instances: ${maxInstances} | Max Retries: ${defaultRetries}`);
    Logger.info(`[Execution Log Session] ${Logger.getLogFilePath()}`);

    // Clean up temporary results store from previous runs
    const tempDir = path.resolve(process.cwd(), 'reports/e2e/.results');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // Clean up Allure raw results from previous runs for a fresh execution session
    const allureResultsDir = path.resolve(process.cwd(), 'reports/allure-results');
    if (fs.existsSync(allureResultsDir)) {
      fs.rmSync(allureResultsDir, { recursive: true, force: true });
    }
    fs.mkdirSync(allureResultsDir, { recursive: true });
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
    const currentBrowser = (browser.capabilities as any)?.browserName || 'chrome';
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
        Logger.warn(`[Retry Engine] "${test.title}" [${currentBrowser}] failed on attempt ${attempts + 1}/${limit + 1}. Retrying... (Reason: ${(error as Error)?.message})`);
      } else {
        const screenshotsDir = path.resolve(process.cwd(), 'reports/e2e/screenshots');
        if (!fs.existsSync(screenshotsDir)) {
          fs.mkdirSync(screenshotsDir, { recursive: true });
        }
        const screenshotFileName = `${timestamp}.png`;
        const fullScreenshotPath = path.resolve(screenshotsDir, screenshotFileName);
        await browser.saveScreenshot(fullScreenshotPath);
        relativeScreenshotPath = `../screenshots/${screenshotFileName}`;
        Logger.error(`[Test Failed] "${test.title}" [${currentBrowser}] failed after all ${limit + 1} attempts. Error: ${(error as Error)?.message}`, error);
        Logger.warn(`[Final Failure Screenshot Captured] Saved at: ${fullScreenshotPath}`);

        try {
          const allure = require('@wdio/allure-reporter');
          allure.addAttachment('Failure Screenshot', fs.readFileSync(fullScreenshotPath), 'image/png');
        } catch (_) {}
      }
    } else {
      Logger.success(`[Test Passed] "${test.title}" [${currentBrowser}] finished in ${((duration || 0) / 1000).toFixed(2)}s${isFlaky ? ` (Resolved after retry #${attempts})` : ''}`);
    }

    const existingIndex = suiteResults.findIndex(
      (r) => r.title === test.title && r.parent === (test.parent || 'E2E Suite') && r.browserName === currentBrowser
    );

    const resultItem: TestResultItem = {
      title: test.title,
      parent: test.parent || 'E2E Suite',
      passed,
      duration: duration || 0,
      browserName: currentBrowser,
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

    // Persist result item to temp directory for parallel execution aggregation
    try {
      const tempDir = path.resolve(process.cwd(), 'reports/e2e/.results');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const safeTitle = `${currentBrowser}_${test.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}`;
      const tempFile = path.resolve(tempDir, `${safeTitle}_${Date.now()}.json`);
      fs.writeFileSync(tempFile, JSON.stringify(resultItem), 'utf-8');
    } catch (_) {}
  },

  /**
   * Hook executed after all tests in a suite complete
   */
  afterSuite: async function (suite) {
    Logger.info(`[Suite Finished] "${suite.title || 'E2E Suite'}" | Worker Suite Results: ${suiteResults.length}`);
  },

  /**
   * Hook executed once all workers have finished running all specs
   * Aggregates results from all parallel workers into a single unified HTML dashboard
   */
  onComplete: async function () {
    const tempDir = path.resolve(process.cwd(), 'reports/e2e/.results');
    const allResults: TestResultItem[] = [];

    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.resolve(tempDir, file), 'utf-8');
          const parsed: TestResultItem = JSON.parse(content);
          const existingIdx = allResults.findIndex(
            (r) => r.title === parsed.title && r.parent === parsed.parent && r.browserName === parsed.browserName
          );
          if (existingIdx >= 0) {
            allResults[existingIdx] = parsed;
          } else {
            allResults.push(parsed);
          }
        } catch (_) {}
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    if (allResults.length > 0) {
      const htmlDir = path.resolve(process.cwd(), 'reports/e2e/html');
      const excelDir = path.resolve(process.cwd(), 'reports/e2e/excel');
      if (!fs.existsSync(htmlDir)) {
        fs.mkdirSync(htmlDir, { recursive: true });
      }
      if (!fs.existsSync(excelDir)) {
        fs.mkdirSync(excelDir, { recursive: true });
      }

      const timestamp = Logger.getSessionTimestamp();
      const reportFile = path.resolve(htmlDir, `${timestamp}.html`);
      const excelFile = path.resolve(excelDir, `${timestamp}_E2E_${envName.toUpperCase()}.xlsx`);
      const reportTitle = targetBrowser === 'all' ? 'SauceDemo Multi-Browser E2E Report' : 'SauceDemo E2E Test Suite';

      // 1. Generate Unified HTML Report
      const htmlContent = generateE2EHtmlReport(reportTitle, timestamp, allResults, envName);
      fs.writeFileSync(reportFile, htmlContent, 'utf-8');

      // 2. Generate Executive Excel Report
      try {
        await generateE2EExcelReport({
          results: allResults,
          environment: envName,
          targetUrl: activeEnv.baseUrl,
          timestamp,
          outputPath: excelFile,
          browser: targetBrowser,
          headless: isHeadless,
        });
      } catch (excelErr) {
        Logger.error('Failed to generate Excel report:', excelErr);
      }

      // 3. Automatically Generate Allure Standalone HTML Report (Timestamped)
      try {
        const { execSync, exec } = require('child_process');
        const allureOutputDir = path.resolve(process.cwd(), 'reports/allure-report');
        const tempAllureDir = path.resolve(process.cwd(), 'reports/.allure-tmp');

        if (!fs.existsSync(allureOutputDir)) {
          fs.mkdirSync(allureOutputDir, { recursive: true });
        }

        execSync(`npx allure generate reports/allure-results --clean --single-file -o "${tempAllureDir}"`, {
          stdio: 'ignore',
        });

        const tempIndexHtml = path.resolve(tempAllureDir, 'index.html');
        if (fs.existsSync(tempIndexHtml)) {
          const allureHtmlPath = path.resolve(allureOutputDir, `${timestamp}.html`);
          fs.copyFileSync(tempIndexHtml, allureHtmlPath);
          fs.rmSync(tempAllureDir, { recursive: true, force: true });

          Logger.info(`[Allure HTML Report Generated] ${allureHtmlPath}`);
          console.log(`\x1b[35m[Allure Reporter] Allure Standalone HTML Report generated: ${allureHtmlPath}\x1b[0m\n`);

          // Automatically open the report in the default browser (unless disabled or in CI)
          if (!process.env.CI && process.env.AUTO_OPEN !== 'false') {
            exec(`start "" "${allureHtmlPath}"`);
          }
        }
      } catch (allureErr) {
        Logger.error('Failed to automatically generate Allure report:', allureErr);
      }

      Logger.info(`[All Parallel Workers Finished] Total Tests: ${allResults.length}`);
      Logger.info(`[Unified HTML Report Generated] ${reportFile}`);
      Logger.info(`[Executive Excel Report Generated] ${excelFile}`);
      Logger.info(`[Execution Log File] ${Logger.getLogFilePath()}`);
      console.log(`\x1b[32m[E2E Reporter] Unified HTML Report generated: ${reportFile}\x1b[0m`);
      console.log(`\x1b[32m[E2E Reporter] Executive Excel Report generated: ${excelFile}\x1b[0m\n`);
    }
  },
};
