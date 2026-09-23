import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { K6_CONFIG } from './config/k6.config.js';
import { PerfLogger } from './utils/perfLogger.js';

// Custom Performance Metrics
const pageResponseTime = new Trend('saucedemo_page_response_time', true);
const successfulRequests = new Counter('saucedemo_successful_requests');
const errorRate = new Rate('saucedemo_error_rate');

const targetP95 = __ENV.P95_THRESHOLD ? parseInt(__ENV.P95_THRESHOLD, 10) : 1000;

export const options = {
  stages: K6_CONFIG.stages,
  thresholds: {
    ...K6_CONFIG.thresholds,
    'http_req_duration': [`p(95)<${targetP95}`],
    'saucedemo_page_response_time': [`p(95)<${targetP95}`],
    'saucedemo_error_rate': ['rate<0.05'],
  },
};

export default function () {
  const baseParams = {
    headers: K6_CONFIG.headers,
    tags: { test_type: 'e2e_performance_journey' },
  };

  // Step 1: Browse Landing / Login Page HTML
  group('01_LandingPage_HTML', function () {
    const res = http.get(K6_CONFIG.baseUrl, baseParams);
    pageResponseTime.add(res.timings.duration);

    const isOk = check(res, {
      'landing page status is 200': (r) => r.status === 200,
      'landing page contains Swag Labs title': (r) => r.body.includes('Swag Labs'),
      'landing page response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (isOk) {
      successfulRequests.add(1);
      errorRate.add(0);
      PerfLogger.step(1, 'Ana Sayfa (HTML) indiriliyor...', res);
    } else {
      errorRate.add(1);
      PerfLogger.error(`Step 1 (Ana Sayfa) doğrulanamadı: Status ${res.status}`);
    }
  });

  sleep(0.5);

  // Step 2: Download Main Stylesheet Bundle
  group('02_Stylesheet_Bundle', function () {
    const res = http.get(`${K6_CONFIG.baseUrl}/assets/index-aSZoiKGF.css`, baseParams);
    pageResponseTime.add(res.timings.duration);

    const isOk = check(res, {
      'css bundle status is 200': (r) => r.status === 200,
      'css response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (isOk) {
      successfulRequests.add(1);
      errorRate.add(0);
      PerfLogger.step(2, 'CSS Stylesheet paketi indiriliyor...', res);
    } else {
      errorRate.add(1);
      PerfLogger.error(`Step 2 (CSS Paketi) doğrulanamadı: Status ${res.status}`);
    }
  });

  sleep(0.5);

  // Step 3: Download Main JavaScript React Bundle
  group('03_JavaScript_Bundle', function () {
    const res = http.get(`${K6_CONFIG.baseUrl}/assets/index-D3OxT1jE.js`, baseParams);
    pageResponseTime.add(res.timings.duration);

    const isOk = check(res, {
      'js bundle status is 200': (r) => r.status === 200,
      'js response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (isOk) {
      successfulRequests.add(1);
      errorRate.add(0);
      PerfLogger.step(3, 'React JavaScript uygulama bundle indiriliyor...', res);
    } else {
      errorRate.add(1);
      PerfLogger.error(`Step 3 (JS Bundle) doğrulanamadı: Status ${res.status}`);
    }
  });

  sleep(0.5);

  // Step 4: Download Web App Manifest
  group('04_Web_Manifest', function () {
    const res = http.get(`${K6_CONFIG.baseUrl}/manifest.json`, baseParams);
    pageResponseTime.add(res.timings.duration);

    const isOk = check(res, {
      'manifest status is 200': (r) => r.status === 200,
      'manifest contains Swag Labs text': (r) => r.body.includes('Swag Labs'),
      'manifest response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (isOk) {
      successfulRequests.add(1);
      errorRate.add(0);
      PerfLogger.step(4, 'Web App Manifest dosyası kontrol ediliyor...', res);
    } else {
      errorRate.add(1);
      PerfLogger.error(`Step 4 (Manifest) doğrulanamadı: Status ${res.status}`);
    }
  });

  sleep(0.5);

  // Step 5: Download Favicon
  group('05_Favicon_Asset', function () {
    const res = http.get(`${K6_CONFIG.baseUrl}/favicon.ico`, baseParams);
    pageResponseTime.add(res.timings.duration);

    const isOk = check(res, {
      'favicon status is 200': (r) => r.status === 200,
      'favicon response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (isOk) {
      successfulRequests.add(1);
      errorRate.add(0);
      PerfLogger.step(5, 'Favicon varlığı kontrol ediliyor...', res);
    } else {
      errorRate.add(1);
      PerfLogger.error(`Step 5 (Favicon) doğrulanamadı: Status ${res.status}`);
    }
  });

  PerfLogger.success('Kullanıcı döngüsü başarıyla tamamlandı (Tüm SLA eşikleri sağlandı).');
  sleep(1);
}

/**
 * Custom summary generator for formatted terminal output, JSON metrics, and HTML report
 */
export function handleSummary(data) {
  const p95 = data.metrics['http_req_duration']?.values['p(95)']?.toFixed(2) || '0.00';
  const avg = data.metrics['http_req_duration']?.values['avg']?.toFixed(2) || '0.00';
  const min = data.metrics['http_req_duration']?.values['min']?.toFixed(2) || '0.00';
  const max = data.metrics['http_req_duration']?.values['max']?.toFixed(2) || '0.00';
  const reqTotal = data.metrics['http_reqs']?.values['count'] || 0;
  const failRate = ((data.metrics['http_req_failed']?.values['rate'] || 0) * 100).toFixed(2);
  const date = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const timestamp =
    __ENV.K6_REPORT_TIMESTAMP ||
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  const now = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

  let allThresholdsPassed = true;
  if (data.metrics) {
    for (const metric of Object.values(data.metrics)) {
      if (metric.thresholds) {
        for (const th of Object.values(metric.thresholds)) {
          if (!th.ok) {
            allThresholdsPassed = false;
            break;
          }
        }
      }
    }
  }
  const isPassed = allThresholdsPassed && parseFloat(failRate) === 0;

  const envName = (K6_CONFIG.environment || 'qa').toUpperCase();
  const banner = `
================================================================================
🚀 SAUCEDEMO K6 PERFORMANCE TEST REPORT [${isPassed ? 'PASSED' : 'FAILED'}]
================================================================================
🌍 Environment              : ${envName}
🎯 Target Base URL          : ${K6_CONFIG.baseUrl}
📅 Timestamp               : ${now}
📊 Total HTTP Requests     : ${reqTotal}
⏱️ Avg Response Duration   : ${avg} ms
⏱️ Min Response Duration   : ${min} ms
⏱️ Max Response Duration   : ${max} ms
🎯 P95 Response Duration   : ${p95} ms
❌ Failure Rate            : ${failRate}%
🏁 SLA / Thresholds        : ${allThresholdsPassed ? 'PASSED (All SLA targets met)' : 'FAILED (Thresholds breached)'}
================================================================================
`;

  const targetP95 = __ENV.P95_THRESHOLD ? parseInt(__ENV.P95_THRESHOLD, 10) : 1000;
  const isP95Ok = parseFloat(p95) < targetP95;
  const isFailRateOk = parseFloat(failRate) < 5;

  const htmlReport = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SauceDemo - k6 Performance Test Report - ${timestamp}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; background: #f8fafc; color: #1e293b; }
    .container { max-width: 900px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); padding: 32px; }
    h1 { margin-top: 0; color: #0f172a; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; background: #dcfce7; color: #15803d; }
    .badge.fail { background: #fee2e2; color: #b91c1c; }
    .badge-env { background: #e0e7ff; color: #3730a3; margin-left: 8px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 24px 0; }
    .card { background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .card.success { border-left-color: #22c55e; }
    .card.warning { border-left-color: #eab308; }
    .card.fail { border-left-color: #ef4444; }
    .card-label { font-size: 13px; color: #64748b; margin-bottom: 6px; font-weight: 500; }
    .card-value { font-size: 26px; font-weight: 700; color: #0f172a; }
    .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; }
    .sla-box { margin-top: 24px; padding: 16px; border-radius: 8px; border: 1px solid; }
    .sla-box.pass { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
    .sla-box.fail { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 SauceDemo Performance Test Report <span class="badge ${isPassed ? '' : 'fail'}">${isPassed ? 'PASSED' : 'FAILED'}</span> <span class="badge badge-env">ENV: ${envName}</span></h1>
    <p>Execution Time: <strong>${now}</strong> | Environment: <strong style="color:#2563eb">${envName}</strong> | Target: <strong>${K6_CONFIG.baseUrl}</strong> | Report ID: <strong>${timestamp}</strong></p>
    <div class="grid">
      <div class="card"><div class="card-label">Total HTTP Requests</div><div class="card-value">${reqTotal}</div></div>
      <div class="card success"><div class="card-label">Average Response Time</div><div class="card-value">${avg} ms</div></div>
      <div class="card ${isP95Ok ? 'success' : 'fail'}"><div class="card-label">P95 Response Time</div><div class="card-value">${p95} ms</div></div>
      <div class="card ${parseFloat(failRate) === 0 ? 'success' : 'fail'}"><div class="card-label">Failure Rate</div><div class="card-value">${failRate}%</div></div>
      <div class="card"><div class="card-label">Min Response Time</div><div class="card-value">${min} ms</div></div>
      <div class="card"><div class="card-label">Max Response Time</div><div class="card-value">${max} ms</div></div>
    </div>
    <div class="sla-box ${isPassed ? 'pass' : 'fail'}">
      <h3 style="margin-top:0; font-size:15px;">📋 SLA / Eşik Değerleri Durumu (${isPassed ? 'PASSED' : 'FAILED'})</h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
        <li>P95 Yanıt Süresi &lt; ${targetP95}ms: <strong>${p95} ms</strong> (${isP95Ok ? '✅ Başarılı' : '❌ Eşik Aşıldı'})</li>
        <li>Hata Oranı (Failure Rate) &lt; 5%: <strong>${failRate}%</strong> (${isFailRateOk ? '✅ Başarılı' : '❌ Hata Oranı Yüksek'})</li>
      </ul>
    </div>
    <div class="footer">Generated automatically by Grafana k6 Test Suite</div>
  </div>
</body>
</html>`;

  const outputs = {
    stdout: banner,
    'reports/performance/k6-summary.json': JSON.stringify(data, null, 2),
  };
  outputs[`reports/performance/html/${timestamp}.html`] = htmlReport;

  return outputs;
}
