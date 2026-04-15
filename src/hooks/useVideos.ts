import { useState, useEffect, useCallback } from 'react';
import type { VideoResponse, CreateVideoRequest, VideoStatus } from '../../api/types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function useVideos(projectId?: string) {
  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = projectId
        ? `${API_BASE}/api/videos?project_id=${projectId}`
        : `${API_BASE}/api/videos`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createVideo = useCallback(async (projectId: string, prompt: string): Promise<VideoResponse | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, prompt }),
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const result = await res.json();
      if (result.success) {
        await fetchVideos();
        return result.video;
      }
      throw new Error(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create video');
      return null;
    }
  }, [fetchVideos]);

  const getVideo = useCallback(async (id: string): Promise<VideoResponse | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/videos/${id}`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const updateVideoStatus = useCallback(async (id: string, status: VideoStatus): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/videos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const result = await res.json();
      if (result.success) {
        await fetchVideos();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [fetchVideos]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  return { videos, loading, error, fetchVideos, createVideo, getVideo, updateVideoStatus };
}
