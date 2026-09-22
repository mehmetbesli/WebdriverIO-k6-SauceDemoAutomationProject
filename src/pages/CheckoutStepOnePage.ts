import { $ } from '@wdio/globals';
import { BasePage } from './base/BasePage';
import { HeaderComponent } from './components/HeaderComponent';
import { ROUTES } from '../constants/routes';

/**
 * Page Object representing SauceDemo Checkout Step One: Your Information
 */
export class CheckoutStepOnePage extends BasePage {
  readonly header = new HeaderComponent();

  get firstNameInput() {
    return $('[data-test="firstName"]');
  }

  get lastNameInput() {
    return $('[data-test="lastName"]');
  }

  get postalCodeInput() {
    return $('[data-test="postalCode"]');
  }

  get continueButton() {
    return $('[data-test="continue"]');
  }

  get cancelButton() {
    return $('[data-test="cancel"]');
  }

  get errorMessageContainer() {
    return $('[data-test="error"]');
  }

  async open(): Promise<void> {
    await super.open(ROUTES.CHECKOUT_STEP_ONE);
  }

  async fillCustomerInformation(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.setValue(this.firstNameInput, firstName);
    await this.setValue(this.lastNameInput, lastName);
    await this.setValue(this.postalCodeInput, postalCode);
  }

  async continueToStepTwo(): Promise<void> {
    await this.click(this.continueButton);
  }

  async cancel(): Promise<void> {
    await this.click(this.cancelButton);
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessageContainer);
  }

  async isStepOneDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.continueButton);
  }
}
