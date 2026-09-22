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
