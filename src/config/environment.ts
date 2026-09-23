/**
 * Multi-Environment Configuration
 * Central management for DEV, QA, STAGING, and PROD environments
 */

export type EnvironmentName = 'dev' | 'qa' | 'staging' | 'prod';

export interface UserCredentials {
  username: string;
  password: string;
}

export interface EnvironmentConfig {
  name: EnvironmentName;
  baseUrl: string;
  timeout: number;
  users: {
    standard: UserCredentials;
    lockedOut: UserCredentials;
    problem: UserCredentials;
    performanceGlitch: UserCredentials;
    error: UserCredentials;
    visual: UserCredentials;
  };
}

const DEFAULT_USERS = {
  standard: {
    username: process.env.SAUCE_USER || 'standard_user',
    password: process.env.SAUCE_PASSWORD || 'secret_sauce',
  },
  lockedOut: {
    username: 'locked_out_user',
    password: process.env.SAUCE_PASSWORD || 'secret_sauce',
  },
  problem: {
    username: 'problem_user',
    password: process.env.SAUCE_PASSWORD || 'secret_sauce',
  },
  performanceGlitch: {
    username: 'performance_glitch_user',
    password: process.env.SAUCE_PASSWORD || 'secret_sauce',
  },
  error: {
    username: 'error_user',
    password: process.env.SAUCE_PASSWORD || 'secret_sauce',
  },
  visual: {
    username: 'visual_user',
    password: process.env.SAUCE_PASSWORD || 'secret_sauce',
  },
};

export const ENVIRONMENTS: Record<EnvironmentName, EnvironmentConfig> = {
  dev: {
    name: 'dev',
    baseUrl: process.env.BASE_URL || 'https://www.saucedemo.com',
    timeout: 15000,
    users: DEFAULT_USERS,
  },
  qa: {
    name: 'qa',
    baseUrl: process.env.BASE_URL || 'https://www.saucedemo.com',
    timeout: 10000,
    users: DEFAULT_USERS,
  },
  staging: {
    name: 'staging',
    baseUrl: process.env.BASE_URL || 'https://www.saucedemo.com',
    timeout: 10000,
    users: DEFAULT_USERS,
  },
  prod: {
    name: 'prod',
    baseUrl: process.env.BASE_URL || 'https://www.saucedemo.com',
    timeout: 8000,
    users: DEFAULT_USERS,
  },
};

/**
 * Resolves current environment name based on process.env.TEST_ENV
 * Defaults to 'qa'
 */
export function getEnvironmentName(): EnvironmentName {
  const env = (process.env.TEST_ENV || 'qa').toLowerCase().trim() as EnvironmentName;
  if (ENVIRONMENTS[env]) {
    return env;
  }
  return 'qa';
}

/**
 * Returns complete configuration for the active environment
 */
export function getCurrentEnvironment(): EnvironmentConfig {
  const envName = getEnvironmentName();
  return ENVIRONMENTS[envName];
}
