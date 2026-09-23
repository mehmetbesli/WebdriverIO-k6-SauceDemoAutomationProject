import { browser, expect } from '@wdio/globals';
import { LoginPage, InventoryPage, CartPage } from '../../src/pages';
import { TEST_DATA } from '../../src/data/testData';
import { Logger } from '../../src/utils/logger';

describe('SauceDemo Cart Suite - Product Selection & Cart Badge Dynamic Updates', () => {
  const loginPage = new LoginPage();
  const inventoryPage = new InventoryPage();
  const cartPage = new CartPage();

  const product1 = TEST_DATA.SELECTED_PRODUCTS[0]; // Sauce Labs Backpack
  const product2 = TEST_DATA.SELECTED_PRODUCTS[1]; // Sauce Labs Bike Light

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
    await loginPage.login(
      TEST_DATA.USERS.STANDARD.username,
      TEST_DATA.USERS.STANDARD.password
    );
    await inventoryPage.isInventoryPageDisplayed();
  });

  afterEach(async () => {
    try {
      await browser.execute(() => {
        window.sessionStorage.clear();
        window.localStorage.clear();
      });
      await browser.deleteAllCookies();
    } catch (_) {}
  });

  it('TC05 - Should dynamically update cart badge on adding and removing items', async () => {
    Logger.step(1, `Adding first product "${product1.name}" to cart...`);
    await inventoryPage.addProductToCart(product1.idSlug);
    expect(await inventoryPage.header.getCartBadgeCount()).toBe(1);
    Logger.success('Cart badge updated to 1.');

    Logger.step(2, `Adding second product "${product2.name}" to cart...`);
    await inventoryPage.addProductToCart(product2.idSlug);
    expect(await inventoryPage.header.getCartBadgeCount()).toBe(2);
    Logger.success('Cart badge updated to 2.');

    Logger.step(3, `Removing first product "${product1.name}" from inventory page...`);
    await inventoryPage.removeProductFromCart(product1.idSlug);
    expect(await inventoryPage.header.getCartBadgeCount()).toBe(1);
    Logger.success('Cart badge decremented to 1.');

    Logger.step(4, 'Navigating to Cart page and verifying remaining item...');
    await inventoryPage.header.openCart();
    const cartItems = await cartPage.getCartItemNames();
    expect(cartItems).toHaveLength(1);
    expect(cartItems[0]).toBe(product2.name);
    Logger.success(`Cart correctly contains only "${product2.name}".`);

    Logger.step(5, `Removing remaining item "${product2.name}" from cart...`);
    await cartPage.removeProduct(product2.idSlug);
    const hasBadge = await cartPage.header.hasCartBadge();
    expect(hasBadge).toBe(false);
    Logger.success('Cart badge correctly removed when cart is empty.');
  });
});
