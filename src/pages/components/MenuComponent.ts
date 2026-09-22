import { $ } from '@wdio/globals';

/**
 * Sidebar Navigation Menu Component
 */
export class MenuComponent {
  get menuWrap() {
    return $('.bm-menu-wrap');
  }

  get allItemsLink() {
    return $('#inventory_sidebar_link');
  }

  get aboutLink() {
    return $('#about_sidebar_link');
  }

  get logoutLink() {
    return $('#logout_sidebar_link');
  }

  get resetAppStateLink() {
    return $('#reset_sidebar_link');
  }

  get closeButton() {
    return $('#react-burger-cross-btn');
  }

  async logout(): Promise<void> {
    await this.logoutLink.waitForDisplayed({ timeout: 10000 });
    await this.logoutLink.waitForClickable({ timeout: 10000 });
    await this.logoutLink.click();
  }

  async resetAppState(): Promise<void> {
    await this.resetAppStateLink.waitForDisplayed({ timeout: 10000 });
    await this.resetAppStateLink.click();
  }

  async closeMenu(): Promise<void> {
    await this.closeButton.waitForDisplayed({ timeout: 10000 });
    await this.closeButton.click();
  }
}
