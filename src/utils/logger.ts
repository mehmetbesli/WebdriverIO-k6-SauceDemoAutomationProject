import fs from 'fs';
import path from 'path';
import { getFormattedTimestamp } from './dateTimeHelper';

/**
 * Log severity levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  STEP = 2,
  SUCCESS = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5,
}

/**
 * Enterprise Multi-Stream Logger
 * Outputs formatted ANSI colored logs to Console and clean persistent logs to File
 */
export class Logger {
  private static logsDir: string = path.resolve(process.cwd(), 'reports/e2e/logs');
  private static isInitialized = false;

  private static parseLogLevel(): LogLevel {
    const envLevel = (process.env.LOG_LEVEL || 'debug').toUpperCase();
    switch (envLevel) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'STEP':
        return LogLevel.STEP;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      case 'SILENT':
        return LogLevel.SILENT;
      default:
        return LogLevel.DEBUG;
    }
  }

  private static currentLevel: LogLevel = Logger.parseLogLevel();

  public static setLevel(level: LogLevel): void {
    Logger.currentLevel = level;
  }

  public static setSessionTimestamp(timestamp: string): void {
    process.env.E2E_SESSION_TIMESTAMP = timestamp;
  }

  public static getSessionTimestamp(): string {
    if (!process.env.E2E_SESSION_TIMESTAMP) {
      process.env.E2E_SESSION_TIMESTAMP = getFormattedTimestamp();
    }
    return process.env.E2E_SESSION_TIMESTAMP;
  }

  public static getLogFilePath(): string {
    const timestamp = Logger.getSessionTimestamp();
    return path.resolve(Logger.logsDir, `${timestamp}.log`);
  }

  public static getCumulativeLogFilePath(): string {
    return path.resolve(Logger.logsDir, 'e2e-execution.log');
  }

  private static ensureLogDir(): void {
    if (!Logger.isInitialized) {
      if (!fs.existsSync(Logger.logsDir)) {
        fs.mkdirSync(Logger.logsDir, { recursive: true });
      }
      Logger.isInitialized = true;
    }
  }

  private static getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  private static stripAnsi(text: string): string {
    return text.replace(/\u001b\[[0-9;]*m/g, '').replace(/\[\d+m/g, '').replace(/\[\d+;\d+m/g, '');
  }

  private static writeToFile(line: string): void {
    try {
      Logger.ensureLogDir();
      const cleanLine = Logger.stripAnsi(line);
      fs.appendFileSync(Logger.getLogFilePath(), cleanLine + '\n', 'utf-8');
      fs.appendFileSync(Logger.getCumulativeLogFilePath(), cleanLine + '\n', 'utf-8');
    } catch (err) {
      console.error('[Logger] Failed to write to log file:', err);
    }
  }

  private static getWorkerTag(): { consoleTag: string; fileTag: string } {
    const workerId = process.env.WDIO_WORKER_ID;
    if (workerId) {
      return {
        consoleTag: `\x1b[35m[${workerId}]\x1b[0m `,
        fileTag: `[${workerId}] `,
      };
    }
    return { consoleTag: '', fileTag: '' };
  }

  static debug(message: string, context?: unknown): void {
    if (Logger.currentLevel > LogLevel.DEBUG) return;
    const ts = Logger.getTimestamp();
    const tag = Logger.getWorkerTag();
    const contextStr = context ? ` ${typeof context === 'object' ? JSON.stringify(context) : context}` : '';
    console.log(`${tag.consoleTag}\x1b[90m[${ts}] 🔍 DEBUG:\x1b[0m ${message}${contextStr}`);
    Logger.writeToFile(`[${ts}] ${tag.fileTag}[DEBUG]   ${message}${contextStr}`);
  }

  static info(message: string): void {
    if (Logger.currentLevel > LogLevel.INFO) return;
    const ts = Logger.getTimestamp();
    const tag = Logger.getWorkerTag();
    console.log(`${tag.consoleTag}\x1b[34m[${ts}] ℹ️  INFO:\x1b[0m ${message}`);
    Logger.writeToFile(`[${ts}] ${tag.fileTag}[INFO]    ${message}`);
  }

  static step(stepNumber: number, message: string): void {
    if (Logger.currentLevel > LogLevel.STEP) return;
    const ts = Logger.getTimestamp();
    const tag = Logger.getWorkerTag();
    console.log(`${tag.consoleTag}\x1b[36m[${ts}] 🔹 STEP ${stepNumber}:\x1b[0m ${message}`);
    Logger.writeToFile(`[${ts}] ${tag.fileTag}[STEP ${stepNumber}] ${message}`);
    try {
      const allure = require('@wdio/allure-reporter');
      if (allure && typeof allure.addStep === 'function') {
        allure.addStep(`STEP ${stepNumber}: ${message}`);
      }
    } catch (_) {}
  }

  static success(message: string): void {
    if (Logger.currentLevel > LogLevel.SUCCESS) return;
    const ts = Logger.getTimestamp();
    const tag = Logger.getWorkerTag();
    console.log(`${tag.consoleTag}\x1b[32m[${ts}] ✅ SUCCESS:\x1b[0m ${message}`);
    Logger.writeToFile(`[${ts}] ${tag.fileTag}[SUCCESS] ${message}`);
    try {
      const allure = require('@wdio/allure-reporter');
      if (allure && typeof allure.addStep === 'function') {
        allure.addStep(`SUCCESS: ${message}`);
      }
    } catch (_) {}
  }

  static warn(message: string): void {
    if (Logger.currentLevel > LogLevel.WARN) return;
    const ts = Logger.getTimestamp();
    const tag = Logger.getWorkerTag();
    console.warn(`${tag.consoleTag}\x1b[33m[${ts}] ⚠️  WARN:\x1b[0m ${message}`);
    Logger.writeToFile(`[${ts}] ${tag.fileTag}[WARN]    ${message}`);
  }

  static error(message: string, error?: unknown): void {
    if (Logger.currentLevel > LogLevel.ERROR) return;
    const ts = Logger.getTimestamp();
    const tag = Logger.getWorkerTag();
    let errorDetails = '';
    if (error instanceof Error) {
      errorDetails = `\nStack: ${error.stack}`;
    } else if (error) {
      errorDetails = ` ${typeof error === 'object' ? JSON.stringify(error) : error}`;
    }
    console.error(`${tag.consoleTag}\x1b[31m[${ts}] ❌ ERROR:\x1b[0m ${message}`, error ?? '');
    Logger.writeToFile(`[${ts}] ${tag.fileTag}[ERROR]   ${message}${errorDetails}`);
  }
}
