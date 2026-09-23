import { getCurrentEnvironment } from '../config/environment';

/**
 * Centralized Test Data Models and Parametric Data for Tests
 * Dynamically resolves user credentials from active environment
 */
export const TEST_DATA = {
  get USERS() {
    const env = getCurrentEnvironment();
    return {
      STANDARD: env.users.standard,
      LOCKED_OUT: env.users.lockedOut,
      PROBLEM: env.users.problem,
      PERFORMANCE_GLITCH: env.users.performanceGlitch,
      ERROR: env.users.error,
      VISUAL: env.users.visual,
    };
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
};
