/**
 * Centralized UI Text, Headings, and Validation Messages for SauceDemo
 */
export const MESSAGES = {
  APP_TITLE: 'Swag Labs',
  HEADERS: {
    PRODUCTS: 'Products',
    CART: 'Your Cart',
    CHECKOUT_INFO: 'Checkout: Your Information',
    CHECKOUT_OVERVIEW: 'Checkout: Overview',
    CHECKOUT_COMPLETE: 'Checkout: Complete!',
  },
  ERRORS: {
    LOCKED_OUT: 'Epic sadface: Sorry, this user has been locked out.',
    INVALID_CREDENTIALS: 'Epic sadface: Username and password do not match any user in this service',
    USERNAME_REQUIRED: 'Epic sadface: Username is required',
    PASSWORD_REQUIRED: 'Epic sadface: Password is required',
  },
  ORDER_SUCCESS: {
    HEADER: 'Thank you for your order!',
    DESCRIPTION: 'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
  },
  BUTTON_LABELS: {
    ADD_TO_CART: 'Add to cart',
    REMOVE: 'Remove',
    CHECKOUT: 'Checkout',
    CONTINUE: 'Continue',
    FINISH: 'Finish',
    BACK_HOME: 'Back Home',
  },
  PAYMENT_INFO_LABEL: 'Payment Information:',
  SHIPPING_INFO_LABEL: 'Shipping Information:',
  PRICE_TOTAL_LABEL: 'Price Total',
} as const;
