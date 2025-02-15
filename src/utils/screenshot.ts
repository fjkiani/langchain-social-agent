import {
  BrowserContextOptions,
  chromium,
  PageScreenshotOptions,
  Page,
} from "playwright";

const GOTO_PAGE_TIMEOUT_ERROR = `Timeout 30000ms exceeded`;

/**
 * Attempts to navigate to a URL with retry logic for timeout errors
 * @param page - Playwright Page instance to navigate with
 * @param url - The URL to navigate to
 * @param iters - Current retry iteration count (internal use)
 * @throws {Error} If navigation fails after 3 attempts or encounters non-timeout errors
 */
async function goToPage(page: Page, url: string, iters = 0): Promise<void> {
  if (iters > 3) {
    throw new Error(`Failed to navigate to ${url} after 3 attempts`);
  }
  try {
    // Navigate and wait for the page to be fully loaded
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
  } catch (error: any) {
    if (
      typeof error === "object" &&
      error?.message &&
      typeof error?.message === "string" &&
      error?.message.includes(GOTO_PAGE_TIMEOUT_ERROR)
    ) {
      console.warn(
        `Navigation to ${url} timed out. Attempting retry ${iters + 1}/3`,
      );
      await goToPage(page, url, iters + 1);
    } else {
      throw error;
    }
  }
}

/**
 * Takes a screenshot of a webpage using Playwright
 * @param url - The URL of the webpage to screenshot
 * @param options - Configuration options for the screenshot
 * @param options.browserContextOptions - Additional options for the browser context
 * @param options.screenshotOptions - Options for the screenshot capture
 * @returns Promise resolving to a Buffer containing the JPEG screenshot data
 * @throws {Error} If screenshot capture fails for any reason
 */
export async function takeScreenshot(
  url: string,
  options?: {
    browserContextOptions?: BrowserContextOptions;
    screenshotOptions?: PageScreenshotOptions;
  },
): Promise<Buffer> {
  const browser = await chromium.launch({
    headless: true,
  });

  // Configure browser with desktop viewport and common headers to appear more like a regular user
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    },
    ...options?.browserContextOptions,
  });

  const page = await context.newPage();

  try {
    // Navigate to page and wait for it to load. This function will retry up to 3 times if it times out
    await goToPage(page, url, 0);

    // Check for various indicators that the page is fully loaded and ready for screenshot
    await page
      .waitForFunction(
        () => {
          // Basic document ready check
          if (document.readyState !== "complete") return false;

          // Look for common loading indicator patterns in class/id names
          const loadingElements = document.querySelectorAll(
            '[class*="loading"], [id*="loading"]',
          );
          if (loadingElements.length > 0) return false;

          // Ensure all images are fully loaded with valid dimensions
          const images = document.getElementsByTagName("img");
          if (images.length > 0) {
            return Array.from(images).every(
              (img) =>
                img.complete &&
                (img.naturalHeight !== 0 || img.naturalWidth !== 0),
            );
          }

          return true;
        },
        { timeout: 5000 },
      )
      .catch(() => {
        // Continue even if waiting times out
        console.warn(
          "Page might not be fully loaded, proceeding with screenshot",
        );
      });

    const screenshot = await page.screenshot({
      type: "jpeg",
      ...options?.screenshotOptions,
    });

    await context.close();
    await browser.close();
    return Buffer.from(screenshot);
  } catch (error: any) {
    await context.close();
    await browser.close();
    console.error(`Failed to take screenshot of ${url}:`, error);
    throw error;
  }
}
