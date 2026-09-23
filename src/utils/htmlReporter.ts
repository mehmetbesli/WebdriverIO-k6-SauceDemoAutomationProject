export interface TestResultItem {
  title: string;
  parent: string;
  passed: boolean;
  duration: number;
  error?: string | null;
  screenshot?: string | null;
  timestamp: string;
  retries?: number;
  isFlaky?: boolean;
}

/**
 * Generates an offline HTML report string for WebdriverIO test runs
 */
export function generateE2EHtmlReport(
  suiteName: string,
  timestamp: string,
  results: TestResultItem[],
  environment: string = 'QA'
): string {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const retried = results.filter((r) => (r.retries && r.retries > 0) || r.isFlaky).length;
  const totalDuration = (results.reduce((acc, r) => acc + r.duration, 0) / 1000).toFixed(2);
  const statusClass = failed === 0 ? 'status-pass' : 'status-fail';
  const statusText = failed === 0 ? 'PASSED' : 'FAILED';

  const rows = results
    .map((r, i) => {
      let badgeHtml = `<span class="badge ${r.passed ? 'badge-pass' : 'badge-fail'}">${r.passed ? 'PASSED' : 'FAILED'}</span>`;
      if (r.passed && r.isFlaky) {
        badgeHtml = `<span class="badge" style="background:#fef3c7; color:#b45309; font-weight:700;">PASSED (FLAKY)</span>`;
      } else if (!r.passed && r.retries && r.retries > 0) {
        badgeHtml = `<span class="badge badge-fail" style="background:#fee2e2; color:#b91c1c; font-weight:700;">FAILED (${r.retries}x RETRIED)</span>`;
      }

      let retryNotice = '';
      if (r.retries && r.retries > 0) {
        if (r.passed) {
          retryNotice = `<br><small style="color:#d97706; font-weight:600;">⚠️ Passed after retry #${r.retries}</small>`;
        } else {
          retryNotice = `<br><small style="color:#dc2626; font-weight:600;">⚠️ Retried ${r.retries} time(s) - All Failed</small>`;
        }
      }

      const cleanError = (r.error || 'Unknown error')
        .replace(/\u001b\[[0-9;]*m/g, '')
        .replace(/\[\d+m/g, '')
        .replace(/\[\d+;\d+m/g, '');

      return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${r.title}</strong><br><small style="color:#64748b">${r.parent}</small>${retryNotice}</td>
        <td>${badgeHtml}</td>
        <td>${(r.duration / 1000).toFixed(2)}s</td>
        <td>${r.timestamp}</td>
        <td>
          ${
            r.passed
              ? `<span style="color:#16a34a">✓ No Errors${r.isFlaky ? ` (Resolved after retry #${r.retries})` : ''}</span>`
              : `<div class="error-msg">${cleanError}</div>
                 ${r.retries && r.retries > 0 ? `<div style="color:#dc2626; font-size:12px; font-weight:600; margin-bottom:4px;">❌ Failed after ${r.retries + 1} total attempts (${r.retries} retries)</div>` : ''}
                 ${
                   r.screenshot
                     ? `<a class="screenshot-link" href="${r.screenshot}" target="_blank">📸 View Screenshot</a>`
                     : ''
                 }`
          }
        </td>
      </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SauceDemo E2E Test Report - ${timestamp}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; background: #f8fafc; color: #1e293b; }
    .container { max-width: 1000px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 22px; color: #0f172a; }
    .status-badge { font-weight: 700; font-size: 14px; padding: 6px 16px; border-radius: 9999px; }
    .status-pass { background: #dcfce7; color: #15803d; }
    .status-fail { background: #fee2e2; color: #b91c1c; }
    .metrics-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 28px; }
    .metric-card { background: #f1f5f9; padding: 18px; border-radius: 8px; text-align: center; border-left: 4px solid #3b82f6; }
    .metric-card.pass { border-left-color: #22c55e; }
    .metric-card.fail { border-left-color: #ef4444; }
    .metric-card.flaky { border-left-color: #f59e0b; }
    .metric-label { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .metric-val { font-size: 28px; font-weight: 800; color: #0f172a; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #f8fafc; text-align: left; padding: 12px; font-size: 13px; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 14px 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
    .badge-pass { background: #dcfce7; color: #15803d; }
    .badge-fail { background: #fee2e2; color: #b91c1c; }
    .error-msg { color: #b91c1c; background: #fef2f2; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-family: monospace; white-space: pre-wrap; margin-bottom: 6px; }
    .screenshot-link { display: inline-block; color: #2563eb; text-decoration: none; font-size: 13px; font-weight: 600; }
    .screenshot-link:hover { text-decoration: underline; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>🚀 WebdriverIO E2E Test Report</h1>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Suite: <strong>${suiteName}</strong> | Environment: <strong style="color: #2563eb; text-transform: uppercase;">${environment}</strong> | Run Time: <strong>${timestamp}</strong></p>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <span style="background: #e0e7ff; color: #3730a3; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 9999px;">ENV: ${environment.toUpperCase()}</span>
        ${retried > 0 ? `<span style="background: #fef3c7; color: #b45309; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 9999px;">RETRIED: ${retried}</span>` : ''}
        <div class="status-badge ${statusClass}">${statusText}</div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card"><div class="metric-label">Total Tests</div><div class="metric-val">${total}</div></div>
      <div class="metric-card pass"><div class="metric-label">Passed</div><div class="metric-val">${passed}</div></div>
      <div class="metric-card ${failed > 0 ? 'fail' : ''}"><div class="metric-label">Failed</div><div class="metric-val">${failed}</div></div>
      <div class="metric-card ${retried > 0 ? 'flaky' : ''}"><div class="metric-label">Flaky / Retried</div><div class="metric-val" style="${retried > 0 ? 'color: #d97706;' : ''}">${retried}</div></div>
      <div class="metric-card"><div class="metric-label">Total Duration</div><div class="metric-val">${totalDuration}s</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px">#</th>
          <th>Test Name</th>
          <th style="width: 90px">Status</th>
          <th style="width: 90px">Duration</th>
          <th style="width: 160px">Timestamp</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="footer">Generated automatically by WebdriverIO Automation Suite</div>
  </div>
</body>
</html>`;
}
