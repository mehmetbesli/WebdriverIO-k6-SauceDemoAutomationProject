import { $ } from '@wdio/globals';

/**
 * Reusable Header Component present across application pages
 */
export class HeaderComponent {
  get appLogo() {
    return $('.app_logo');
  }

  get pageTitle() {
    return $('[data-test="title"]');
  }

  get cartLink() {
    return $('[data-test="shopping-cart-link"]');
  }

  get cartBadge() {
    return $('[data-test="shopping-cart-badge"]');
  }

  get burgerMenuButton() {
    return $('#react-burger-menu-btn');
  }

  async getPageTitleText(): Promise<string> {
    await this.pageTitle.waitForDisplayed({ timeout: 10000 });
    return (await this.pageTitle.getText()).trim();
  }

  async clickCart(): Promise<void> {
    await this.cartLink.waitForDisplayed({ timeout: 10000 });
    await this.cartLink.click();
  }

  async openCart(): Promise<void> {
    await this.clickCart();
  }

  async hasCartBadge(): Promise<boolean> {
    return this.cartBadge.isDisplayed().catch(() => false);
  }

  async getCartBadgeCount(): Promise<number> {
    const isBadgePresent = await this.hasCartBadge();
    if (!isBadgePresent) {
      return 0;
    }
    const countText = await this.cartBadge.getText();
    return parseInt(countText.trim(), 10) || 0;
  }

  async openBurgerMenu(): Promise<void> {
    await this.burgerMenuButton.waitForDisplayed({ timeout: 10000 });
    await this.burgerMenuButton.click();
  }
}
