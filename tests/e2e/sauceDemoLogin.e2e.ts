import { browser, expect } from '@wdio/globals';
import { LoginPage, InventoryPage } from '../../src/pages';
import { TEST_DATA } from '../../src/data/testData';
import { MESSAGES } from '../../src/constants/messages';
import { Logger } from '../../src/utils/logger';

describe('SauceDemo Login Suite - User Authentication & Validation Checks', () => {
  const loginPage = new LoginPage();
  const inventoryPage = new InventoryPage();

  beforeEach(async () => {
    await loginPage.open();
    await browser.execute(() => {
      try {
        window.sessionStorage.clear();
        window.localStorage.clear();
      } catch (_) {}
    });
    await browser.deleteAllCookies();
    await loginPage.open();
  });

  it('TC02 - Should display error message for locked out user', async () => {
    Logger.step(1, 'Attempting login with locked out user credentials...');
    await loginPage.login(
      TEST_DATA.USERS.LOCKED_OUT.username,
      TEST_DATA.USERS.LOCKED_OUT.password
    );

    Logger.step(2, 'Verifying locked out error message is displayed...');
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain(MESSAGES.ERRORS.LOCKED_OUT);
    Logger.success(`Locked out validation passed: "${errorText}"`);
  });

  it('TC03 - Should display error message for invalid password', async () => {
    Logger.step(1, 'Attempting login with invalid password...');
    await loginPage.login(
      TEST_DATA.USERS.STANDARD.username,
      'invalid_secret_sauce'
    );

    Logger.step(2, 'Verifying invalid credentials error message...');
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain(MESSAGES.ERRORS.INVALID_CREDENTIALS);
    Logger.success(`Invalid credentials validation passed: "${errorText}"`);
  });

  it('TC04 - Should successfully login with valid standard user', async () => {
    Logger.step(1, 'Attempting login with valid standard user...');
    await loginPage.login(
      TEST_DATA.USERS.STANDARD.username,
      TEST_DATA.USERS.STANDARD.password
    );

    Logger.step(2, 'Verifying redirection to Inventory products page...');
    const isInventoryDisplayed = await inventoryPage.isInventoryDisplayed();
    expect(isInventoryDisplayed).toBe(true);
    Logger.success('Standard user login verified successfully.');
  });
});
