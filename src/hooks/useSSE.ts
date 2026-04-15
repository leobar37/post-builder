import { useState, useEffect, useCallback, useRef } from 'react';
import type { SSEEvent } from '../../api/types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '';

export type SSEStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useSSE(videoId?: string) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [status, setStatus] = useState<SSEStatus>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = videoId
      ? `${API_BASE}/events?video_id=${videoId}`
      : `${API_BASE}/events`;

    setStatus('connecting');
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;
        setEvents(prev => [...prev.slice(-99), data]);
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      setStatus('error');
      eventSource.close();
    };

    // Named event listeners for specific event types
    eventSource.addEventListener('state_transition', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as SSEEvent;
        setEvents(prev => [...prev.slice(-99), data]);
      } catch {
        // ignore
      }
    });

    eventSource.addEventListener('scene_created', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as SSEEvent;
        setEvents(prev => [...prev.slice(-99), data]);
      } catch {
        // ignore
      }
    });
  }, [videoId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return { events, status, connect, disconnect, clearEvents };
}
