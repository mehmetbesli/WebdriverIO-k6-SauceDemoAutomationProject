import { $ } from '@wdio/globals';
import { BasePage } from '../base/BasePage';
import { HeaderComponent } from '../components/HeaderComponent';
import { ROUTES } from '../../constants/routes';

/**
 * Page Object representing SauceDemo Checkout Complete Confirmation Page
 */
export class CheckoutCompletePage extends BasePage {
  readonly header = new HeaderComponent();

  get completeHeader() {
    return $('[data-test="complete-header"]');
  }

  get completeText() {
    return $('[data-test="complete-text"]');
  }

  get backToProductsButton() {
    return $('[data-test="back-to-products"]');
  }

  get ponyExpressImage() {
    return $('[data-test="pony-express"]');
  }

  async open(): Promise<void> {
    await super.open(ROUTES.CHECKOUT_COMPLETE);
  }

  async getSuccessHeader(): Promise<string> {
    return this.getText(this.completeHeader);
  }

  async getSuccessDescription(): Promise<string> {
    return this.getText(this.completeText);
  }

  async backToProducts(): Promise<void> {
    await this.click(this.backToProductsButton);
  }

  async isSuccessPageDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.completeHeader);
  }
}
