// API Types for Instagram Post Builder Export

export interface ExportRequest {
  postId: number;
  html: string;
  format?: 'png' | 'pdf';
  width?: number;
  height?: number;
}

export interface ExportResponse {
  success: boolean;
  filename?: string;
  error?: string;
}

export interface BrowserlessScreenshotOptions {
  type?: 'png' | 'jpeg';
  fullPage?: boolean;
  clip?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  encoding?: 'binary' | 'base64';
  width?: number;
  height?: number;
  waitFor?: number | string;
}

export interface BrowserlessPdfOptions {
  format?: string;
  width?: string;
  height?: string;
  printBackground?: boolean;
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}
