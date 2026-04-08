// GymSpace Instagram Post Builder - Publish Service
// Handles publishing posts directly to Instagram

import type { PublishResult } from '../types/post.types';

interface PublishOptions {
  postId: number;
  html: string;
  caption: string;
  username: string;
  password: string;
}

export class PublishService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = '/api';
  }

  /**
   * Publish a post directly to Instagram
   */
  async publishToInstagram(options: PublishOptions): Promise<PublishResult> {
    console.log('[PublishService] Starting publish to Instagram...');
    console.log('[PublishService] Post ID:', options.postId);
    console.log('[PublishService] Username:', options.username);
    console.log('[PublishService] Caption length:', options.caption.length);

    try {
      const response = await fetch(`${this.apiUrl}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[PublishService] Publish failed:', result.error);
        return {
          success: false,
          error: result.error || `Publish failed: ${response.status}`,
        };
      }

      console.log('[PublishService] Publish successful:', result.postUrl);
      return {
        success: true,
        postUrl: result.postUrl,
      };
    } catch (error) {
      console.error('[PublishService] Network error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error during publishing',
      };
    }
  }
}

// Singleton instance
export const publishService = new PublishService();
