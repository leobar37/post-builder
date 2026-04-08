// Export Routes for Instagram Post Builder API

import { Router, type Request, type Response } from 'express';
import { getBrowserlessService } from '../services/browserless.service';
import type { ExportRequest } from '../types/export.types';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = Router();

// Read CSS files once at startup
const baseCss = readFileSync(join(process.cwd(), 'src', 'base.css'), 'utf-8');
const componentsCss = readFileSync(join(process.cwd(), 'src', 'components.css'), 'utf-8');

function inlineCss(html: string): string {
  // Replace link tags with inline styles
  const css = `${baseCss}\n${componentsCss}`;
  return html
    .replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']\/src\/[^"']*\.css["'][^>]*>/g, '')
    .replace('</head>', `<style>${css}</style></head>`);
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { postId, html, format = 'png', width = 1080, height = 1080 } = req.body as ExportRequest;

    if (!postId || !html) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: postId, html',
      });
      return;
    }

    // Inline CSS before sending to Browserless
    const processedHtml = inlineCss(html);

    const browserlessService = getBrowserlessService();
    let buffer: Buffer;

    if (format === 'pdf') {
      buffer = await browserlessService.htmlToPdf(processedHtml, {
        width: `${width}px`,
        height: `${height}px`,
        printBackground: true,
      });
    } else {
      buffer = await browserlessService.htmlToImage(processedHtml, {
        type: 'png',
        width,
        height,
        fullPage: false,
        encoding: 'binary',
      });
    }

    const filename = `gymspace_post_${String(postId).padStart(2, '0')}.${format}`;

    res.set({
      'Content-Type': format === 'png' ? 'image/png' : 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    });
  }
});

export default router;
