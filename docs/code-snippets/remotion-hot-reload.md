# Remotion Hot Reload Patterns

## Overview

Patrones y utilidades para recargar el Remotion Player cuando el código generado por el agente cambia.

## useRemotionReload Hook

```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseRemotionReloadOptions {
  videoId: string;
  apiUrl?: string;
  onCodeUpdate?: () => void;
  onError?: (error: Error) => void;
}

interface UseRemotionReloadReturn {
  reloadKey: number;           // Key para forzar re-mount
  lastUpdate: Date | null;     // Última actualización
  isConnected: boolean;        // Estado de conexión SSE
  forceReload: () => void;     // Recarga manual
}

export function useRemotionReload({ 
  videoId, 
  apiUrl = 'http://localhost:3000',
  onCodeUpdate,
  onError,
}: UseRemotionReloadOptions): UseRemotionReloadReturn {
  const [reloadKey, setReloadKey] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const es = new EventSource(`${apiUrl}/api/videos/${videoId}/events`);
    
    es.onopen = () => {
      console.log('[SSE] Connected');
      setIsConnected(true);
    };
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'code_updated':
            console.log('[SSE] Code updated, reloading...');
            setReloadKey(k => k + 1);
            setLastUpdate(new Date());
            onCodeUpdate?.();
            break;
            
          case 'scene_code_updated':
            console.log(`[SSE] Scene ${data.sceneId} updated`);
            // Para actualizaciones parciales, podríamos no recargar todo
            if (data.fullReload !== false) {
              setReloadKey(k => k + 1);
              setLastUpdate(new Date());
              onCodeUpdate?.();
            }
            break;
            
          case 'connected':
            console.log('[SSE] Connection established');
            break;
            
          case 'error':
            console.error('[SSE] Server error:', data.data);
            onError?.(new Error(data.data.message));
            break;
        }
      } catch (error) {
        console.error('[SSE] Failed to parse event:', error);
      }
    };
    
    es.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      setIsConnected(false);
      onError?.(new Error('SSE connection failed'));
    };
    
    return () => {
      console.log('[SSE] Closing connection');
      es.close();
    };
  }, [videoId, apiUrl, onCodeUpdate, onError]);
  
  const forceReload = useCallback(() => {
    console.log('[HotReload] Manual reload triggered');
    setReloadKey(k => k + 1);
    setLastUpdate(new Date());
  }, []);
  
  return { reloadKey, lastUpdate, isConnected, forceReload };
}
```

## Uso Básico

```tsx
import { Player } from '@remotion/player';
import { VideoComposition } from '../remotion/compositions/VideoComposition';
import { useRemotionReload } from '../hooks/useRemotionReload';

function VideoPreview({ videoId }: { videoId: string }) {
  const { reloadKey, lastUpdate, isConnected } = useRemotionReload({ 
    videoId,
    onCodeUpdate: () => {
      console.log('Code updated!');
    },
  });
  
  return (
    <div className="video-preview">
      <div className="status-bar">
        <span className={`connection ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Conectado' : '○ Desconectado'}
        </span>
        {lastUpdate && (
          <span className="last-update">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      <Player
        key={reloadKey}  // Re-mount cuando cambia
        component={VideoComposition}
        durationInFrames={900}
        fps={30}
        compositionWidth={1080}
        compositionHeight={1920}
        inputProps={{ videoId }}
        controls
        autoPlay
        loop
      />
    </div>
  );
}
```

## Recarga Selectiva por Escena

Para videos largos, recargar todo el player puede ser lento. Implementar recarga selectiva:

```typescript
// hooks/useSceneReload.ts
import { useState, useEffect } from 'react';

interface SceneCode {
  id: string;
  code: string;
  lastModified: Date;
}

export function useSceneReload(videoId: string) {
  const [scenes, setScenes] = useState<Record<string, SceneCode>>({});
  const [reloadTrigger, setReloadTrigger] = useState(0);
  
  useEffect(() => {
    const es = new EventSource(`/api/videos/${videoId}/events`);
    
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'scene_code_updated') {
        setScenes(prev => ({
          ...prev,
          [data.sceneId]: {
            id: data.sceneId,
            code: data.code,
            lastModified: new Date(),
          },
        }));
        
        // Solo recargar si la escena actual cambió
        setReloadTrigger(t => t + 1);
      }
    };
    
    return () => es.close();
  }, [videoId]);
  
  return { scenes, reloadTrigger };
}
```

## Debounce de Recargas

Si múltiples escenas se actualizan simultáneamente, debouncear las recargas:

```typescript
// hooks/useDebouncedReload.ts
import { useState, useEffect, useRef } from 'react';

export function useDebouncedReload(
  videoId: string,
  debounceMs: number = 500
) {
  const [reloadKey, setReloadKey] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingUpdates = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const es = new EventSource(`/api/videos/${videoId}/events`);
    
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'code_updated' || data.type === 'scene_code_updated') {
        pendingUpdates.current.add(data.sceneId || 'all');
        
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Set new timeout
        timeoutRef.current = setTimeout(() => {
          console.log(`[Debounce] Reloading after ${debounceMs}ms. Updates:`, 
            Array.from(pendingUpdates.current));
          
          setReloadKey(k => k + 1);
          pendingUpdates.current.clear();
        }, debounceMs);
      }
    };
    
    return () => {
      es.close();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [videoId, debounceMs]);
  
  return reloadKey;
}
```

## Indicador de Recarga

```tsx
// components/ReloadIndicator.tsx
import { useState, useEffect } from 'react';

interface ReloadIndicatorProps {
  lastUpdate: Date | null;
  isConnected: boolean;
}

export function ReloadIndicator({ lastUpdate, isConnected }: ReloadIndicatorProps) {
  const [showPulse, setShowPulse] = useState(false);
  
  useEffect(() => {
    if (lastUpdate) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);
  
  return (
    <div className={`reload-indicator ${showPulse ? 'pulse' : ''}`}>
      <div className={`dot ${isConnected ? 'connected' : 'disconnected'}`} />
      <span className="status">
        {isConnected ? 'Actualizado' : 'Sin conexión'}
      </span>
      {lastUpdate && (
        <span className="time">
          {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
```

```css
/* styles/reload-indicator.css */
.reload-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f5f5f5;
  font-size: 14px;
}

.reload-indicator.pulse {
  animation: pulse-bg 2s ease-out;
}

@keyframes pulse-bg {
  0% { background: #4caf50; }
  100% { background: #f5f5f5; }
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.dot.connected {
  background: #4caf50;
}

.dot.disconnected {
  background: #f44336;
}

.time {
  color: #666;
  font-size: 12px;
}
```

## Reconexión Automática

```typescript
// hooks/useAutoReconnect.ts
import { useState, useEffect, useRef } from 'react';

export function useAutoReconnect(
  videoId: string,
  maxRetries: number = 5
) {
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  
  const connect = () => {
    if (esRef.current) {
      esRef.current.close();
    }
    
    const es = new EventSource(`/api/videos/${videoId}/events`);
    esRef.current = es;
    
    es.onopen = () => {
      console.log('[AutoReconnect] Connected');
      setIsConnected(true);
      setRetryCount(0);
    };
    
    es.onerror = () => {
      console.log('[AutoReconnect] Error, will retry...');
      setIsConnected(false);
      es.close();
      
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.log(`[AutoReconnect] Retrying in ${delay}ms...`);
        
        setTimeout(() => {
          setRetryCount(c => c + 1);
          connect();
        }, delay);
      }
    };
    
    return es;
  };
  
  useEffect(() => {
    const es = connect();
    return () => es.close();
  }, [videoId]);
  
  return { isConnected, retryCount };
}
```

## Ejemplo Completo: Preview con Hot Reload

```tsx
// components/VideoPreview.tsx
import { Player } from '@remotion/player';
import { VideoComposition } from '../remotion/compositions/VideoComposition';
import { useRemotionReload } from '../hooks/useRemotionReload';
import { ReloadIndicator } from './ReloadIndicator';
import { useAutoReconnect } from '../hooks/useAutoReconnect';

interface VideoPreviewProps {
  videoId: string;
}

export function VideoPreview({ videoId }: VideoPreviewProps) {
  const { 
    reloadKey, 
    lastUpdate, 
    isConnected: reloadConnected,
    forceReload 
  } = useRemotionReload({ 
    videoId,
    onCodeUpdate: () => {
      console.log('✅ Código actualizado');
    },
  });
  
  const { isConnected: sseConnected, retryCount } = useAutoReconnect(videoId);
  
  return (
    <div className="video-preview-container">
      <div className="preview-header">
        <h3>Preview</h3>
        
        <ReloadIndicator 
          lastUpdate={lastUpdate} 
          isConnected={sseConnected && reloadConnected} 
        />
        
        <button onClick={forceReload} title="Recargar manualmente">
          ↻
        </button>
      </div>
      
      {!sseConnected && retryCount > 0 && (
        <div className="reconnect-banner">
          Reconectando... (intento {retryCount})
        </div>
      )}
      
      <div className="player-wrapper">
        <Player
          key={reloadKey}
          component={VideoComposition}
          durationInFrames={900}
          fps={30}
          compositionWidth={1080}
          compositionHeight={1920}
          inputProps={{ videoId }}
          controls
          autoPlay
          loop
        />
      </div>
      
      <div className="edit-controls">
        <button onClick={() => {
          // Abrir editor de código
          window.open(`/editor/${videoId}`, '_blank');
        }}>
          ✏️ Editar Código
        </button>
        
        <button onClick={async () => {
          // Generar clips con MiniMax
          await fetch(`/api/videos/${videoId}/generate-clips`, {
            method: 'POST',
          });
        }}>
          🎬 Generar Clips
        </button>
      </div>
    </div>
  );
}
```

## Ver También

- [Remotion Code Generation](../integrations/remotion-code-generation.md) - Generación de código
- [Video Pipeline Architecture](../architecture/overview.md) - Arquitectura general
