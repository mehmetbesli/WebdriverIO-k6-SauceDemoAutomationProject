const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { remote } = require('webdriverio');
const { generatePerfExcelReport } = require('./utils/perfExcelReporter');

function getFormattedTimestamp(date = new Date()) {
  const pad = (n) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

function getLocalTimeString(date = new Date()) {
  const pad = (n) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function resolveK6Executable() {
  const defaultPath = 'C:\\Program Files\\k6\\k6.exe';
  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }
  return 'k6';
}

async function captureFailureScreenshot(reportTimestamp, htmlDir, screenshotsDir) {
  let browser;
  try {
    const htmlReportPath = path.resolve(htmlDir, `${reportTimestamp}.html`);
    const screenshotFile = path.resolve(screenshotsDir, `${reportTimestamp}.png`);

    browser = await remote({
      logLevel: 'error',
      capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: ['--headless', '--disable-gpu', '--window-size=1200,900'],
        },
      },
    });

    if (fs.existsSync(htmlReportPath)) {
      // Capture the generated performance dashboard report showing the exact failing SLA metrics
      const htmlContent = fs.readFileSync(htmlReportPath, 'utf-8');
      await browser.url('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
    } else {
      // Fallback: capture target site
      await browser.url('https://www.saucedemo.com');
    }

    await browser.pause(500);
    await browser.saveScreenshot(screenshotFile);

    if (fs.existsSync(screenshotFile)) {
      console.log(`\x1b[31m[k6 Runner] Failure visual screenshot saved at: ${screenshotFile}\x1b[0m\n`);
    }
  } catch (err) {
    console.error('[k6 Runner] Could not capture screenshot via WebdriverIO:', err.message);
  } finally {
    if (browser) {
      await browser.deleteSession().catch(() => {});
    }
  }
}

const k6Bin = resolveK6Executable();
const timestamp = getFormattedTimestamp();

// Output directories
const htmlDir = path.resolve(__dirname, '../reports/performance/html');
const screenshotsDir = path.resolve(__dirname, '../reports/performance/screenshots');
const logsDir = path.resolve(__dirname, '../reports/performance/logs');
if (!fs.existsSync(htmlDir)) fs.mkdirSync(htmlDir, { recursive: true });
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logFile = path.resolve(logsDir, `${timestamp}.log`);
const cumulativeLogFile = path.resolve(logsDir, 'perf-execution.log');

function appendLog(line) {
  const cleanLine = line.replace(/\u001b\[[0-9;]*m/g, '').replace(/\[\d+m/g, '').replace(/\[\d+;\d+m/g, '');
  try {
    fs.appendFileSync(logFile, cleanLine + '\n', 'utf-8');
    fs.appendFileSync(cumulativeLogFile, cleanLine + '\n', 'utf-8');
  } catch (_) {}
}

const rawArgs = process.argv.slice(2);
let testEnv = (process.env.TEST_ENV || 'qa').toLowerCase();

const filteredArgs = [];
for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg.startsWith('--env=')) {
    testEnv = arg.split('=')[1].trim().toLowerCase();
  } else if (arg === '--env' && i + 1 < rawArgs.length) {
    testEnv = rawArgs[++i].trim().toLowerCase();
  } else {
    filteredArgs.push(arg);
  }
}

const defaultArgs = ['run', 'tests/performance/sauceDemoLoad.test.js'];
const finalArgs = filteredArgs.length > 0 ? filteredArgs : defaultArgs;

// Pass TEST_ENV to k6 runtime so __ENV.TEST_ENV is populated
finalArgs.push('-e', `TEST_ENV=${testEnv}`);

console.log(`\n\x1b[36m[k6 Runner] Starting performance test on [${testEnv.toUpperCase()}]...\x1b[0m`);
console.log(`\x1b[90m[k6 Runner] Environment: ${testEnv.toUpperCase()} | Report ID: ${timestamp}\x1b[0m\n`);

appendLog(`[${getLocalTimeString()}] [k6 Runner] Starting performance test on [${testEnv.toUpperCase()}] | Report ID: ${timestamp}`);
appendLog(`[${getLocalTimeString()}] [k6 Runner] Arguments: ${finalArgs.join(' ')}`);

const proc = spawn(k6Bin, finalArgs, {
  shell: false,
  env: {
    ...process.env,
    TEST_ENV: testEnv,
    K6_REPORT_TIMESTAMP: timestamp,
  },
});

let inReport = false;
let hasReportStarted = false;
let hasProgressOnScreen = false;
let lastProgressTime = '';

function clearProgressLine() {
  if (hasProgressOnScreen) {
    if (process.stdout.isTTY) {
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout, 0);
    } else {
      process.stdout.write('\n');
    }
    hasProgressOnScreen = false;
  }
}

function handleStreamLine(line) {
  if (!line || !line.trim()) return;

  // 1. Report Banner detection
  if (line.includes('SAUCEDEMO K6 PERFORMANCE TEST REPORT') || inReport) {
    clearProgressLine();
    if (!hasReportStarted) {
      hasReportStarted = true;
      inReport = true;
      process.stdout.write('\n' + '='.repeat(80) + '\n');
    }

    // Ignore trailing k6 default status text after the report banner
    if (
      line.includes('running (') ||
      line.includes('default ✓') ||
      line.includes('default [') ||
      line.includes('iterations')
    ) {
      return;
    }

    process.stdout.write(line + '\n');
    return;
  }

  // 2. Parse k6 console log outputs (from PerfLogger or custom console.log)
  const consoleMatch = line.match(/level=(\w+)\s+msg="(.*?)"\s+source=console/);
  if (consoleMatch) {
    clearProgressLine();
    const rawMsg = consoleMatch[2].replace(/\\"/g, '"');
    const now = getLocalTimeString();

    let consoleLine = '';
    let fileLine = '';

    const stepMatch = rawMsg.match(/^\[STEP\s*(\d+)\]\s*(.*)$/);
    const successMatch = rawMsg.match(/^\[SUCCESS\]\s*(.*)$/);
    const errorMatch = rawMsg.match(/^\[ERROR\]\s*(.*)$/);
    const infoMatch = rawMsg.match(/^\[INFO\]\s*(.*)$/);

    if (stepMatch) {
      const stepNum = stepMatch[1];
      const detail = stepMatch[2];
      consoleLine = `\x1b[36m[${now}] 🔹 STEP ${stepNum}:\x1b[0m ${detail}`;
      fileLine = `[${now}] [STEP ${stepNum}] ${detail}`;
    } else if (successMatch) {
      const detail = successMatch[1];
      consoleLine = `\x1b[32m[${now}] ✅ SUCCESS:\x1b[0m ${detail}`;
      fileLine = `[${now}] [SUCCESS] ${detail}`;
    } else if (errorMatch) {
      const detail = errorMatch[1];
      consoleLine = `\x1b[31m[${now}] ❌ ERROR:\x1b[0m ${detail}`;
      fileLine = `[${now}] [ERROR] ${detail}`;
    } else if (infoMatch) {
      const detail = infoMatch[1];
      consoleLine = `\x1b[34m[${now}] ℹ️  INFO:\x1b[0m ${detail}`;
      fileLine = `[${now}] [INFO] ${detail}`;
    } else {
      consoleLine = `\x1b[90m[${now}]\x1b[0m ${rawMsg}`;
      fileLine = `[${now}] ${rawMsg}`;
    }

    console.log(consoleLine);
    appendLog(fileLine);
    return;
  }

  // 3. Parse progress updates from k6 live stream
  const progressMatch = line.match(/running \((.*?)\), (\d+\/\d+) VUs, (\d+) complete/);
  if (progressMatch) {
    const [, time, vus, completed] = progressMatch;
    const percentMatch = line.match(/\[\s*(\d+%)\s*\]/);
    const percent = percentMatch ? percentMatch[1] : '';
    const percentText = percent ? ` | İlerleme: \x1b[36m${percent.padEnd(5)}\x1b[0m` : '';

    const progressText = `\x1b[33m⏳ [k6 Test Koşuyor]\x1b[0m Süre: \x1b[32m${time.padEnd(6)}\x1b[0m${percentText} | Aktif Sanal Kullanıcı: \x1b[35m${vus.padEnd(5)}\x1b[0m | Tamamlanan Döngü: \x1b[37m${completed}\x1b[0m`;

    if (process.stdout.isTTY) {
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout, 0);
      process.stdout.write(progressText);
      hasProgressOnScreen = true;
    } else {
      if (lastProgressTime !== time) {
        lastProgressTime = time;
        process.stdout.write(`\r${progressText}   `);
        hasProgressOnScreen = true;
      }
    }
    return;
  }

  // 4. Fallback for other standard errors / info
  if (!line.includes('default [') && !line.includes('execution: local') && !line.includes('scenarios:')) {
    // Only pass unhandled non-verbose lines
    if (line.includes('level=error') || line.includes('ERRO')) {
      clearProgressLine();
      console.error(`\x1b[31m[k6 Engine Error]\x1b[0m ${line}`);
      appendLog(`[ERROR] ${line}`);
    }
  }
}

function handleStreamData(text) {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    handleStreamLine(line);
  }
}

proc.stdout.on('data', (chunk) => {
  handleStreamData(chunk.toString());
});

proc.stderr.on('data', (chunk) => {
  handleStreamData(chunk.toString());
});

proc.on('close', async (code) => {
  if (code !== 0) {
    appendLog(`[${getLocalTimeString()}] [k6 Runner] Performance test failed or crossed threshold! (Exit code: ${code})`);
    console.log(`\n\x1b[31m[k6 Runner] Performance test failed or crossed threshold! (Exit code: ${code})\x1b[0m`);
    console.log(`\x1b[33m[k6 Runner] Capturing visual dashboard failure screenshot...\x1b[0m`);
    await captureFailureScreenshot(timestamp, htmlDir, screenshotsDir);
  } else {
    appendLog(`[${getLocalTimeString()}] [k6 Runner] Performance test completed successfully. Exit code: 0`);
    appendLog(`[${getLocalTimeString()}] [k6 Runner] Report generated: reports/performance/html/${timestamp}.html`);
    console.log(`\n\x1b[32m[k6 Runner] Performance HTML Report generated: reports/performance/html/${timestamp}.html\x1b[0m`);
  }

  // Generate Performance Excel Report (.xlsx)
  const summaryJsonPath = path.resolve(__dirname, '../reports/performance/k6-summary.json');
  const excelDir = path.resolve(__dirname, '../reports/performance/excel');
  const excelFile = path.resolve(excelDir, `${timestamp}_PERF_${testEnv.toUpperCase()}.xlsx`);

  if (fs.existsSync(summaryJsonPath)) {
    try {
      const summaryData = JSON.parse(fs.readFileSync(summaryJsonPath, 'utf-8'));
      await generatePerfExcelReport({
        summaryData,
        environment: testEnv,
        targetUrl: 'https://www.saucedemo.com',
        timestamp,
        outputPath: excelFile,
      });
      appendLog(`[${getLocalTimeString()}] [k6 Runner] Performance Excel Report generated: reports/performance/excel/${timestamp}_PERF_${testEnv.toUpperCase()}.xlsx`);
      console.log(`\x1b[32m[k6 Runner] Performance Excel Report generated: ${excelFile}\x1b[0m\n`);
    } catch (excelErr) {
      appendLog(`[${getLocalTimeString()}] [k6 Runner] Failed to generate Performance Excel report: ${excelErr.message}`);
    }
  }

  setTimeout(() => {
    process.exit(code ?? 0);
  }, 100);
});
