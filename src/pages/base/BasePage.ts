import { browser } from '@wdio/globals';

/**
 * Base Page Object providing centralized and reusable web interaction methods.
 * All specific page objects inherit from this base class.
 */
export abstract class BasePage {
  /**
   * Navigates to a specific path relative to the baseUrl or absolute URL
   * @param path URL path (e.g. '/inventory.html')
   */
  async open(path: string = ''): Promise<void> {
    await browser.url(path);
  }

  /**
   * Safely clicks on an element after ensuring it is clickable
   * @param element ChainablePromiseElement to click
   */
  async click(element: ReturnType<typeof $>): Promise<void> {
    await element.waitForDisplayed({ timeout: 10000 });
    await element.waitForClickable({ timeout: 10000 });
    await element.click();
  }

  /**
   * Clears existing text and sets new value into an input field
   * @param element Input element
   * @param value Text to type
   */
  async setValue(element: ReturnType<typeof $>, value: string): Promise<void> {
    await element.waitForDisplayed({ timeout: 10000 });
    await element.clearValue();
    await element.setValue(value);
  }

  /**
   * Retrieves text content from an element after waiting for display
   * @param element Target element
   */
  async getText(element: ReturnType<typeof $>): Promise<string> {
    await element.waitForDisplayed({ timeout: 10000 });
    return (await element.getText()).trim();
  }

  /**
   * Checks whether an element is displayed, waiting up to timeout ms
   * @param element Target element
   * @param timeout Wait timeout in ms (default 10000)
   */
  async isDisplayed(element: ReturnType<typeof $>, timeout: number = 10000): Promise<boolean> {
    try {
      await element.waitForDisplayed({ timeout });
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Waits for an element to be displayed on the DOM
   * @param element Target element
   * @param timeout Optional timeout in ms
   */
  async waitForDisplayed(element: ReturnType<typeof $>, timeout: number = 10000): Promise<void> {
    await element.waitForDisplayed({ timeout });
  }

  /**
   * Returns current browser URL
   */
  async getCurrentUrl(): Promise<string> {
    return browser.getUrl();
  }

  /**
   * Returns page title
   */
  async getPageTitle(): Promise<string> {
    return browser.getTitle();
  }
}
