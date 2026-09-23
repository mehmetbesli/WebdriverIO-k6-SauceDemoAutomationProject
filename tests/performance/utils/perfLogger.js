/**
 * k6 Performance Test Logger
 * Provides structured, real-time step-by-step progress logging similar to E2E tests.
 * 
 * - VU Protection: Logs representative Virtual User (VU 1) during load tests to prevent terminal flooding.
 * - Error Visibility: Logs errors immediately across all Virtual Users.
 */
export class PerfLogger {
  /**
   * Log an execution step with HTTP response status and duration
   * @param {number} stepNum - Step sequence number
   * @param {string} action - Description of the action performed
   * @param {object} res - k6 HTTP response object
   */
  static step(stepNum, action, res) {
    if (__VU <= 1) {
      const status = res && res.status ? res.status : 'N/A';
      const duration = res && res.timings && typeof res.timings.duration === 'number'
        ? Math.round(res.timings.duration)
        : 0;
      const statusText = status === 200 ? 'HTTP 200' : `HTTP ${status}`;
      console.log(`[STEP ${stepNum}] ${action} -> ${statusText} (${duration}ms)`);
    }
  }

  /**
   * Log successful iteration completion
   * @param {string} message - Success message
   */
  static success(message) {
    if (__VU <= 1) {
      console.log(`[SUCCESS] ${message}`);
    }
  }

  /**
   * Log informational message
   * @param {string} message - Info message
   */
  static info(message) {
    if (__VU <= 1) {
      console.log(`[INFO] ${message}`);
    }
  }

  /**
   * Log an error immediately regardless of which VU encountered it
   * @param {string} message - Error details
   */
  static error(message) {
    console.error(`[ERROR] [VU:${__VU}] ${message}`);
  }
}
