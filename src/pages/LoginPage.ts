import { $ } from '@wdio/globals';
import { BasePage } from './base/BasePage';
import { ROUTES } from '../constants/routes';

/**
 * Page Object representing SauceDemo Login Page
 */
export class LoginPage extends BasePage {
  get usernameInput() {
    return $('[data-test="username"]');
  }

  get passwordInput() {
    return $('[data-test="password"]');
  }

  get loginButton() {
    return $('[data-test="login-button"]');
  }

  get errorMessageContainer() {
    return $('[data-test="error"]');
  }

  async open(): Promise<void> {
    await super.open(ROUTES.LOGIN);
  }

  async login(username: string, password: string): Promise<void> {
    await this.setValue(this.usernameInput, username);
    await this.setValue(this.passwordInput, password);
    await this.click(this.loginButton);
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessageContainer);
  }

  async isLoginPageDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.loginButton);
  }
}
