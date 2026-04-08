// GymSpace Instagram Post Builder - API Client
// Simple HTTP client for API communication

import type { ExportPostRequest, ExportPostResponse } from '../types/post.types';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    // For blob responses (file downloads)
    if (response.headers.get('content-type')?.includes('image/') ||
        response.headers.get('content-type')?.includes('application/pdf')) {
      return response as unknown as T;
    }

    return response.json() as Promise<T>;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<T>;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
