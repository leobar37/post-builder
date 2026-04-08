// GymSpace Instagram Post Builder - Export Service
// Handles post export via local API using Browserless

import type { ExportFormat, ExportResult, ExportProgress } from '../types/post.types';

interface ExportPostOptions {
  download?: boolean;
  filename?: string;
}

export class ExportService {
  private apiUrl: string;

  constructor() {
    // Use the Vite proxy to reach the API
    this.apiUrl = '/api';
  }

  /**
   * Export a single post as PNG/PDF
   */
  async exportPost(
    postId: number,
    html: string,
    format: ExportFormat = 'png',
    options: ExportPostOptions = {},
  ): Promise<ExportResult> {
    try {
      const response = await fetch(`${this.apiUrl}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          html,
          format,
          width: 1080,
          height: 1080,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const filename =
        options.filename || `gymspace_post_${String(postId).padStart(2, '0')}.${format}`;

      if (options.download !== false) {
        this.downloadBlob(blob, filename);
      }

      return { success: true, filename, blob };
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Export multiple posts with progress tracking
   */
  async exportMultiplePosts(
    postIds: number[],
    getHtmlForPost: (postId: number) => string | null,
    onProgress?: (progress: ExportProgress) => void,
    format: ExportFormat = 'png',
  ): Promise<{ success: number; failed: number; files: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      files: [] as string[],
    };

    for (let i = 0; i < postIds.length; i++) {
      const postId = postIds[i];

      try {
        const html = getHtmlForPost(postId);
        if (!html) {
          throw new Error(`Could not get HTML for post ${postId}`);
        }

        const result = await this.exportPost(postId, html, format);

        if (result.success) {
          results.success++;
          results.files.push(result.filename);
        } else {
          results.failed++;
          console.error(`Failed to export post ${postId}:`, result.error);
        }
      } catch (error) {
        results.failed++;
        console.error(`Failed to export post ${postId}:`, error);
      }

      // Report progress
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: postIds.length,
          postId,
        });
      }

      if (i < postIds.length - 1) {
        await this.delay(1500);
      }
    }

    return results;
  }

  /**
   * Export all posts
   */
  async exportAllPosts(
    totalPosts: number,
    getHtmlForPost: (postId: number) => string | null,
    onProgress?: (progress: ExportProgress) => void,
    format: ExportFormat = 'png',
  ): Promise<{ success: number; failed: number; files: string[] }> {
    const postIds = Array.from({ length: totalPosts }, (_, i) => i + 1);
    return this.exportMultiplePosts(postIds, getHtmlForPost, onProgress, format);
  }

  /**
   * Download a blob as a file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const exportService = new ExportService();
