/**
 * Formatted Console Logger with Timestamps and Icons
 */
export class Logger {
  private static getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  static step(stepNumber: number, message: string): void {
    console.log(`\x1b[36m[${this.getTimestamp()}] 🔹 STEP ${stepNumber}:\x1b[0m ${message}`);
  }

  static info(message: string): void {
    console.log(`\x1b[34m[${this.getTimestamp()}] ℹ️  INFO:\x1b[0m ${message}`);
  }

  static success(message: string): void {
    console.log(`\x1b[32m[${this.getTimestamp()}] ✅ SUCCESS:\x1b[0m ${message}`);
  }

  static warn(message: string): void {
    console.warn(`\x1b[33m[${this.getTimestamp()}] ⚠️  WARN:\x1b[0m ${message}`);
  }

  static error(message: string, error?: unknown): void {
    console.error(`\x1b[31m[${this.getTimestamp()}] ❌ ERROR:\x1b[0m ${message}`, error ?? '');
  }
}
