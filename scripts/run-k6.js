const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function resolveK6Executable() {
  const defaultPath = 'C:\\Program Files\\k6\\k6.exe';
  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }
  return 'k6';
}

const k6Bin = resolveK6Executable();
const args = process.argv.slice(2);
const defaultArgs = ['run', 'tests/performance/sauceDemoLoad.test.js'];
const finalArgs = args.length > 0 ? args : defaultArgs;

const reportsDir = path.resolve(__dirname, '../reports/performance');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

console.log(`[k6 Runner] Executing: "${k6Bin}" ${finalArgs.join(' ')}`);

const result = spawnSync(k6Bin, finalArgs, {
  stdio: 'inherit',
  shell: false,
});

process.exit(result.status ?? 0);
