import type { Options } from '@wdio/types';
import path from 'path';

const isHeadless = process.env.HEADLESS !== 'false';

export const config: Options.Testrunner = {
  runner: 'local',
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      project: path.resolve(__dirname, '../../tsconfig.json'),
      transpileOnly: true,
    },
  },
  specs: [
    path.resolve(__dirname, '../../tests/e2e/**/*.e2e.ts'),
  ],
  exclude: [],
  maxInstances: 1,
  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: [
        ...(isHeadless ? ['--headless=new'] : []),
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--window-size=1920,1080',
      ],
    },
  }],
  logLevel: 'info',
  bail: 0,
  baseUrl: 'https://www.saucedemo.com',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
};
