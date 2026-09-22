import { $, $$ } from '@wdio/globals';
import { BasePage } from './base/BasePage';
import { HeaderComponent } from './components/HeaderComponent';
import { ROUTES } from '../constants/routes';

/**
 * Page Object representing SauceDemo Checkout Step Two: Overview
 */
export class CheckoutStepTwoPage extends BasePage {
  readonly header = new HeaderComponent();

  get cartItems() {
    return $$('[data-test="inventory-item"]');
  }

  get cartItemNames() {
    return $$('[data-test="inventory-item-name"]');
  }

  get subtotalLabel() {
    return $('[data-test="subtotal-label"]');
  }

  get taxLabel() {
    return $('[data-test="tax-label"]');
  }

  get totalLabel() {
    return $('[data-test="total-label"]');
  }

  get finishButton() {
    return $('[data-test="finish"]');
  }

  get cancelButton() {
    return $('[data-test="cancel"]');
  }

  async open(): Promise<void> {
    await super.open(ROUTES.CHECKOUT_STEP_TWO);
  }

  async getItemNames(): Promise<string[]> {
    const items = await this.cartItemNames;
    const names: string[] = [];
    for (const item of items) {
      names.push(await item.getText());
    }
    return names;
  }

  async getSubtotalText(): Promise<string> {
    return this.getText(this.subtotalLabel);
  }

  async getTaxText(): Promise<string> {
    return this.getText(this.taxLabel);
  }

  async getTotalText(): Promise<string> {
    return this.getText(this.totalLabel);
  }

  async finishCheckout(): Promise<void> {
    await this.click(this.finishButton);
  }

  async cancel(): Promise<void> {
    await this.click(this.cancelButton);
  }

  async isStepTwoDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.finishButton);
  }
}
