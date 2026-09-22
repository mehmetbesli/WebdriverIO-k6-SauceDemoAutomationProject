import { $, $$ } from '@wdio/globals';
import { BasePage } from './base/BasePage';
import { HeaderComponent } from './components/HeaderComponent';
import { MenuComponent } from './components/MenuComponent';
import { ROUTES } from '../constants/routes';

/**
 * Page Object representing SauceDemo Products / Inventory Page
 */
export class InventoryPage extends BasePage {
  readonly header = new HeaderComponent();
  readonly menu = new MenuComponent();

  get sortDropdown() {
    return $('[data-test="product-sort-container"]');
  }

  get inventoryList() {
    return $('[data-test="inventory-list"]');
  }

  get inventoryItems() {
    return $$('[data-test="inventory-item"]');
  }

  get inventoryItemNames() {
    return $$('[data-test="inventory-item-name"]');
  }

  get inventoryItemPrices() {
    return $$('[data-test="inventory-item-price"]');
  }

  async open(): Promise<void> {
    await super.open(ROUTES.INVENTORY);
  }

  getAddToCartButton(productSlug: string) {
    return $(`[data-test="add-to-cart-${productSlug}"]`);
  }

  getRemoveButton(productSlug: string) {
    return $(`[data-test="remove-${productSlug}"]`);
  }

  async addProductToCart(productSlug: string): Promise<void> {
    const addButton = this.getAddToCartButton(productSlug);
    await this.click(addButton);
  }

  async removeProductFromCart(productSlug: string): Promise<void> {
    const removeButton = this.getRemoveButton(productSlug);
    await this.click(removeButton);
  }

  async selectSortOption(value: string): Promise<void> {
    await this.sortDropdown.waitForDisplayed({ timeout: 10000 });
    await this.sortDropdown.selectByAttribute('value', value);
  }

  async getAllProductNames(): Promise<string[]> {
    const items = await this.inventoryItemNames;
    const names: string[] = [];
    for (const item of items) {
      names.push(await item.getText());
    }
    return names;
  }

  async getAllProductPrices(): Promise<number[]> {
    const items = await this.inventoryItemPrices;
    const prices: number[] = [];
    for (const item of items) {
      const priceText = await item.getText();
      prices.push(parseFloat(priceText.replace('$', '').trim()));
    }
    return prices;
  }

  async isInventoryPageDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.inventoryList);
  }
}
