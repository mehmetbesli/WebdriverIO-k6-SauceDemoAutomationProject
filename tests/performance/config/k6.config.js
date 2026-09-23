/**
 * Shared k6 Configuration & Multi-Environment Support
 */
const ENVIRONMENTS = {
  dev: 'https://www.saucedemo.com',
  qa: 'https://www.saucedemo.com',
  staging: 'https://www.saucedemo.com',
  prod: 'https://www.saucedemo.com',
};

const activeEnv = (__ENV.TEST_ENV || 'qa').toLowerCase().trim();
const resolvedBaseUrl = __ENV.BASE_URL || ENVIRONMENTS[activeEnv] || ENVIRONMENTS.qa;

export const K6_CONFIG = {
  environment: activeEnv,
  baseUrl: resolvedBaseUrl,
  stages: [
    { duration: '5s', target: 5 },   // Ramp-up to 5 Virtual Users
    { duration: '10s', target: 5 },  // Steady state load
    { duration: '5s', target: 0 },   // Ramp-down to 0
  ],
  thresholds: {
    // 95% of requests must complete below 1000ms
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    // Less than 5% HTTP errors
    http_req_failed: ['rate<0.05'],
    // Over 95% check assertions passing
    checks: ['rate>0.95'],
  },
  headers: {
    'User-Agent': 'k6-SauceDemoPerformanceTest/1.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  },
};
