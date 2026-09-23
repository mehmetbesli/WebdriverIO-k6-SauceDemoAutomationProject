import { expect } from '@wdio/globals';
import {
  LoginPage,
  InventoryPage,
  CartPage,
  CheckoutStepOnePage,
  CheckoutStepTwoPage,
  CheckoutCompletePage,
} from '../../src/pages';
import { TEST_DATA } from '../../src/data/testData';
import { MESSAGES } from '../../src/constants/messages';
import { Logger } from '../../src/utils/logger';

describe('SauceDemo E2E Suite - Complete Order & Checkout Journey', () => {
  const loginPage = new LoginPage();
  const inventoryPage = new InventoryPage();
  const cartPage = new CartPage();
  const checkoutStepOnePage = new CheckoutStepOnePage();
  const checkoutStepTwoPage = new CheckoutStepTwoPage();
  const checkoutCompletePage = new CheckoutCompletePage();

  it('TC01 - Full End-to-End Purchase Flow (Login -> Add Products -> Cart -> Checkout -> Confirmation -> Logout)', async () => {
    Logger.step(1, 'Navigating to SauceDemo login page...');
    await loginPage.open();
    const isLoginReady = await loginPage.isLoginPageDisplayed();
    expect(isLoginReady).toBe(true);
    Logger.success('Login page loaded successfully.');

    Logger.step(2, `Logging in as "${TEST_DATA.USERS.STANDARD.username}"...`);
    await loginPage.login(
      TEST_DATA.USERS.STANDARD.username,
      TEST_DATA.USERS.STANDARD.password
    );

    Logger.step(3, 'Verifying successful login and redirection to Inventory page...');
    const isInventoryReady = await inventoryPage.isInventoryPageDisplayed();
    expect(isInventoryReady).toBe(true);
    const pageTitle = await inventoryPage.header.getPageTitleText();
    expect(pageTitle).toBe(MESSAGES.HEADERS.PRODUCTS);
    Logger.success(`Successfully navigated to Products inventory (${pageTitle}).`);

    Logger.step(4, 'Adding selected products to the cart...');
    for (const product of TEST_DATA.SELECTED_PRODUCTS) {
      await inventoryPage.addProductToCart(product.idSlug);
      Logger.info(`Added product "${product.name}" to cart.`);
    }

    Logger.step(5, 'Verifying shopping cart badge count...');
    const badgeCount = await inventoryPage.header.getCartBadgeCount();
    expect(badgeCount).toBe(TEST_DATA.SELECTED_PRODUCTS.length);
    Logger.success(`Cart badge correctly shows ${badgeCount} item(s).`);

    Logger.step(6, 'Navigating to Cart page and verifying cart item names...');
    await inventoryPage.header.clickCart();
    const isCartReady = await cartPage.isCartPageDisplayed();
    expect(isCartReady).toBe(true);

    const cartItemNames = await cartPage.getCartItemNames();
    for (const product of TEST_DATA.SELECTED_PRODUCTS) {
      expect(cartItemNames).toContain(product.name);
    }
    Logger.success('All selected products verified inside Cart.');

    Logger.step(7, 'Proceeding to Checkout Step One...');
    await cartPage.proceedToCheckout();
    const isStepOneReady = await checkoutStepOnePage.isStepOneDisplayed();
    expect(isStepOneReady).toBe(true);
    Logger.success('Navigated to Checkout Step One.');

    Logger.step(8, 'Filling customer delivery details and continuing...');
    await checkoutStepOnePage.fillCustomerInformation(
      TEST_DATA.CHECKOUT_CUSTOMER.firstName,
      TEST_DATA.CHECKOUT_CUSTOMER.lastName,
      TEST_DATA.CHECKOUT_CUSTOMER.postalCode
    );
    await checkoutStepOnePage.continueToStepTwo();

    Logger.step(9, 'Verifying Checkout Step Two overview and financial totals...');
    const isStepTwoReady = await checkoutStepTwoPage.isStepTwoDisplayed();
    expect(isStepTwoReady).toBe(true);

    const overviewItems = await checkoutStepTwoPage.getItemNames();
    expect(overviewItems.length).toBe(TEST_DATA.SELECTED_PRODUCTS.length);

    const subtotalText = await checkoutStepTwoPage.getSubtotalText();
    const taxText = await checkoutStepTwoPage.getTaxText();
    const totalText = await checkoutStepTwoPage.getTotalText();

    expect(subtotalText).toContain('Item total: $');
    expect(taxText).toContain('Tax: $');
    expect(totalText).toContain('Total: $');
    Logger.info(`Order Overview - ${subtotalText} | ${taxText} | ${totalText}`);

    Logger.step(10, 'Finishing order and verifying confirmation screen...');
    await checkoutStepTwoPage.finishCheckout();
    const isCompleteReady = await checkoutCompletePage.isSuccessPageDisplayed();
    expect(isCompleteReady).toBe(true);

    const completeHeader = await checkoutCompletePage.getSuccessHeader();
    const completeDescription = await checkoutCompletePage.getSuccessDescription();

    expect(completeHeader).toBe(MESSAGES.ORDER_SUCCESS.HEADER);
    expect(completeDescription).toBe(MESSAGES.ORDER_SUCCESS.DESCRIPTION);
    Logger.success(`Order completed successfully: "${completeHeader}"`);

    Logger.step(11, 'Returning back home and logging out via Hamburger Menu...');
    await checkoutCompletePage.backToProducts();
    await inventoryPage.header.openBurgerMenu();
    await inventoryPage.menu.logout();

    Logger.step(12, 'Verifying user safely redirected back to Login screen...');
    const isLoggedOut = await loginPage.isLoginPageDisplayed();
    expect(isLoggedOut).toBe(true);
    Logger.success('Logout verified. End-to-End order flow completed with 100% success.');
  });
});
