// Browserless Service for Instagram Post Builder API
// Handles screenshot and PDF generation via Browserless

import type { BrowserlessPdfOptions, BrowserlessScreenshotOptions } from '../types/export.types';

export class BrowserlessService {
  private readonly browserlessUrl: string;
  private readonly browserlessApiKey: string;
  private readonly timeout: number = 60000;
  private readonly maxRetries: number = 1;

  constructor() {
    this.browserlessUrl = process.env.BROWSERLESS_URL || '';
    this.browserlessApiKey = process.env.BROWSERLESS_API_KEY || '';

    if (!this.browserlessUrl || !this.browserlessApiKey) {
      console.warn('BrowserlessService: Missing BROWSERLESS_URL or BROWSERLESS_API_KEY');
    }
  }

  async htmlToImage(html: string, options?: BrowserlessScreenshotOptions): Promise<Buffer> {
    const screenshotOptions = this.buildScreenshotOptions(options);
    const viewport = this.buildViewport(options);
    const url = `${this.browserlessUrl}/chrome/screenshot?token=${this.browserlessApiKey}`;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        await this.delay(2000);
      }

      try {
        console.log(`Converting HTML to image (attempt ${attempt + 1}/${this.maxRetries + 1})`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
            body: JSON.stringify({
              html,
              viewport,
              options: screenshotOptions,
              waitForTimeout: 2000,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Browserless API error: ${response.status} - ${errorBody}`);
          }

          const buffer = await response.arrayBuffer();
          console.log(`Image generated successfully (${buffer.byteLength} bytes)`);

          return Buffer.from(buffer);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${attempt + 1} failed: ${lastError.message}`);

        if (attempt === this.maxRetries) {
          break;
        }

        if (lastError.message.includes('abort')) {
          console.warn(`Image generation timeout (${this.timeout}ms)`);
        }
      }
    }

    console.error(
      `Failed to generate image after ${this.maxRetries + 1} attempts: ${lastError?.message}`,
    );

    throw new Error(`Failed to generate image: ${lastError?.message || 'Unknown error'}`);
  }

  async htmlToPdf(html: string, options?: BrowserlessPdfOptions): Promise<Buffer> {
    const pdfOptions = this.buildPdfOptions(options);
    const url = `${this.browserlessUrl}/chrome/pdf?token=${this.browserlessApiKey}`;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Converting HTML to PDF (attempt ${attempt + 1}/${this.maxRetries + 1})`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
            body: JSON.stringify({
              html,
              options: pdfOptions,
              bestAttempt: true,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Browserless API error: ${response.status} - ${errorBody}`);
          }

          const buffer = await response.arrayBuffer();
          console.log(`PDF generated successfully (${buffer.byteLength} bytes)`);

          return Buffer.from(buffer);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${attempt + 1} failed: ${lastError.message}`);

        if (attempt === this.maxRetries) {
          break;
        }

        if (lastError.message.includes('abort')) {
          console.warn(`PDF generation timeout (${this.timeout}ms)`);
        }
      }
    }

    console.error(
      `Failed to generate PDF after ${this.maxRetries + 1} attempts: ${lastError?.message}`,
    );

    throw new Error(`Failed to generate PDF: ${lastError?.message || 'Unknown error'}`);
  }

  private buildViewport(options?: BrowserlessScreenshotOptions): Record<string, unknown> {
    const width = options?.width || 1080;
    const height = options?.height || 1080;

    return {
      width,
      height,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: false,
    };
  }

  private buildScreenshotOptions(options?: BrowserlessScreenshotOptions): Record<string, unknown> {
    const width = options?.width || 1080;
    const height = options?.height || 1080;

    return {
      type: options?.type || 'png',
      encoding: options?.encoding || 'binary',
      fullPage: options?.fullPage ?? false,
      clip: {
        x: 0,
        y: 0,
        width,
        height,
      },
      omitBackground: false,
    };
  }

  private buildPdfOptions(options?: BrowserlessPdfOptions): BrowserlessPdfOptions {
    return {
      format: options?.format || 'A4',
      printBackground: options?.printBackground !== undefined ? options.printBackground : true,
      width: options?.width || '1080px',
      height: options?.height || '1080px',
      margin: {
        top: options?.margin?.top || '0px',
        bottom: options?.margin?.bottom || '0px',
        left: options?.margin?.left || '0px',
        right: options?.margin?.right || '0px',
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

let browserlessServiceInstance: BrowserlessService | null = null;

export function getBrowserlessService(): BrowserlessService {
  if (!browserlessServiceInstance) {
    browserlessServiceInstance = new BrowserlessService();
  }
  return browserlessServiceInstance;
}
