// Export Routes for Instagram Post Builder API

import { Router, type Request, type Response } from 'express';
import { getBrowserlessService } from '../services/browserless.service';
import type { ExportRequest } from '../types/export.types';

const router = Router();

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

    const browserlessService = getBrowserlessService();
    let buffer: Buffer;

    if (format === 'pdf') {
      buffer = await browserlessService.htmlToPdf(html, {
        width: `${width}px`,
        height: `${height}px`,
        printBackground: true,
      });
    } else {
      buffer = await browserlessService.htmlToImage(html, {
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
