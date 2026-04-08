import axios, { AxiosInstance } from 'axios';

export interface Video {
  id: string;
  post_id: number;
  title: string;
  status: string;
  total_scenes: number;
  created_at: string;
  completed_at: string | null;
  scenes?: Scene[];
}

export interface Scene {
  id: string;
  video_id: string;
  sequence: number;
  name: string;
  status: string;
  duration: number | null;
}

export interface VideoStatus {
  videoId: string;
  status: string;
  progress: number;
  totalScenes: number;
  completedScenes: number;
  scenes: Scene[];
}

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:3451') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
    });
  }

  async createVideo(postId: number): Promise<Video> {
    const response = await this.client.post('/api/videos', { postId });
    return response.data;
  }

  async getVideos(status?: string): Promise<Video[]> {
    const params = status ? { status } : {};
    const response = await this.client.get('/api/videos', { params });
    return response.data;
  }

  async getVideo(videoId: string): Promise<Video> {
    const response = await this.client.get(`/api/videos/${videoId}`);
    return response.data;
  }

  async getVideoStatus(videoId: string): Promise<VideoStatus> {
    const response = await this.client.get(`/api/videos/${videoId}/status`);
    return response.data;
  }

  async startRender(videoId: string): Promise<{ videoId: string; status: string }> {
    const response = await this.client.post(`/api/videos/${videoId}/render`);
    return response.data;
  }

  async buildVideo(videoId: string): Promise<{ outputPath: string; duration: number }> {
    const response = await this.client.post(`/api/videos/${videoId}/build`);
    return response.data;
  }

  async downloadVideo(videoId: string, outputPath: string): Promise<void> {
    const response = await this.client.get(`/api/videos/${videoId}/download`, {
      responseType: 'stream',
    });

    const fs = await import('fs');
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
}
