/**
 * Centralized Test Data Models and Parametric Data for Tests
 */
export const TEST_DATA = {
  USERS: {
    STANDARD: {
      username: 'standard_user',
      password: 'secret_sauce',
    },
    LOCKED_OUT: {
      username: 'locked_out_user',
      password: 'secret_sauce',
    },
    PROBLEM: {
      username: 'problem_user',
      password: 'secret_sauce',
    },
    PERFORMANCE_GLITCH: {
      username: 'performance_glitch_user',
      password: 'secret_sauce',
    },
  },
  CHECKOUT_CUSTOMER: {
    firstName: 'John',
    lastName: 'Doe',
    postalCode: '34710',
  },
  SELECTED_PRODUCTS: [
    {
      name: 'Sauce Labs Backpack',
      price: '$29.99',
      idSlug: 'sauce-labs-backpack',
    },
    {
      name: 'Sauce Labs Bike Light',
      price: '$9.99',
      idSlug: 'sauce-labs-bike-light',
    },
  ],
} as const;
