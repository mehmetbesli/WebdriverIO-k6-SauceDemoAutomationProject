import { $, $$ } from '@wdio/globals';
import { BasePage } from '../base/BasePage';
import { HeaderComponent } from '../components/HeaderComponent';
import { ROUTES } from '../../constants/routes';

/**
 * Page Object representing SauceDemo Shopping Cart Page
 */
export class CartPage extends BasePage {
  readonly header = new HeaderComponent();

  get cartList() {
    return $('[data-test="cart-list"]');
  }

  get cartItems() {
    return $$('[data-test="inventory-item"]');
  }

  get cartItemNames() {
    return $$('[data-test="inventory-item-name"]');
  }

  get continueShoppingButton() {
    return $('[data-test="continue-shopping"]');
  }

  get checkoutButton() {
    return $('[data-test="checkout"]');
  }

  async open(): Promise<void> {
    await super.open(ROUTES.CART);
  }

  async getCartItemNames(): Promise<string[]> {
    const items = await this.cartItemNames;
    const names: string[] = [];
    for (const item of items) {
      names.push(await item.getText());
    }
    return names;
  }

  async removeProduct(productSlug: string): Promise<void> {
    const removeBtn = $(`[data-test="remove-${productSlug}"]`);
    await this.click(removeBtn);
  }

  async continueShopping(): Promise<void> {
    await this.click(this.continueShoppingButton);
  }

  async proceedToCheckout(): Promise<void> {
    await this.click(this.checkoutButton);
  }

  async isCartPageDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.checkoutButton);
  }
}
