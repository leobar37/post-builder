# T-007: TanStack Query + AI SDK Frontend Hook

## Objective
Implementar el hook de React usando `@ai-sdk/react` para manejo de streaming y TanStack Query para estado server.

## Requirements
- FR-006: Frontend con TanStack Query
- Integrar AI SDK `useChat` de `@ai-sdk/react` con TanStack Query para cacheo de sesiones

## Implementation

### 1. Query Client Setup

**File: `src/lib/queryClient.ts`**
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

### 2. Hook useAgentChat (usando AI SDK useChat)

**File: `src/hooks/useAgentChat.ts`**
```typescript
import { useChat, type UseChatOptions } from '@ai-sdk/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

interface UseAgentChatOptions {
  sessionId: string | null;
  onError?: (error: Error) => void;
}

interface UseAgentChatReturn {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system' | 'data';
    content: string;
    createdAt?: Date;
  }>;
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  isStreaming: boolean;
  error: Error | undefined;
  createSession: (data: CreateSessionData) => Promise<string>;
  reload: () => void;
  stop: () => void;
}

interface CreateSessionData {
  sceneId: string;
  videoId: string;
  projectId: string;
  sceneType?: 'hook' | 'stats' | 'cta' | 'transition';
}

export function useAgentChat({ sessionId, onError }: UseAgentChatOptions): UseAgentChatReturn {
  const queryClient = useQueryClient();

  // Query: Fetch session messages para inicializar el chat
  const { data: sessionData } = useQuery({
    queryKey: ['agent-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const res = await fetch(`/api/agent/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Failed to load session');
      return res.json();
    },
    enabled: !!sessionId,
  });

  // AI SDK useChat: Maneja streaming, estado de mensajes, y error handling
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: aiHandleSubmit,
    isLoading,
    error,
    reload,
    stop,
  } = useChat({
    api: '/api/agent/chat',
    id: sessionId || undefined, // ID de conversación para persistencia
    initialMessages: sessionData?.session?.messages || [],
    body: {
      sessionId, // Se envía al backend para identificar la sesión
    },
    onError: (err) => {
      onError?.(err);
    },
    onFinish: () => {
      // Invalidar cache después de completar el mensaje
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ['agent-session', sessionId] });
      }
    },
  });

  // Mutation: Create new session
  const createSession = useCallback(async (data: CreateSessionData): Promise<string> => {
    const res = await fetch('/api/agent/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create session');
    const result = await res.json();
    
    // Invalidar lista de sesiones
    queryClient.invalidateQueries({ queryKey: ['agent-sessions', data.sceneId] });
    
    return result.sessionId as string;
  }, [queryClient]);

  // Wrapper para handleSubmit que asegura sessionId
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!sessionId) {
      onError?.(new Error('No active session. Create a session first.'));
      return;
    }
    aiHandleSubmit(e);
  }, [sessionId, aiHandleSubmit, onError]);

  // Determinar si está streaming (loading pero no enviando)
  const isStreaming = isLoading && messages.length > 0 && 
    messages[messages.length - 1]?.role === 'assistant';

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    isStreaming,
    error,
    createSession,
    reload,
    stop,
  };
}

// Hook for listing sessions by scene
export function useSceneSessions(sceneId: string) {
  return useQuery({
    queryKey: ['agent-sessions', sceneId],
    queryFn: async () => {
      const res = await fetch(`/api/agent/sessions?sceneId=${sceneId}`);
      if (!res.ok) throw new Error('Failed to load sessions');
      return res.json();
    },
    enabled: !!sceneId,
  });
}
```

### 3. Provider Setup

**Update: `src/main.tsx` (o entry point)**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

## Verification

- [ ] `useAgentChat` usa `useChat` de `@ai-sdk/react` (no implementación manual)
- [ ] `messages` viene del AI SDK, inicializado desde la sesión del servidor
- [ ] `isStreaming` refleja correctamente el estado de streaming
- [ ] `handleSubmit` envía mensajes al endpoint `/api/agent/chat`
- [ ] `createSession` crea nueva sesión en backend y retorna el ID
- [ ] `onFinish` invalida el cache de TanStack Query
- [ ] `useSceneSessions` lista sesiones por escena
- [ ] Error handling funciona a través de callbacks del AI SDK

## Dependencies
- T-006: Agent API Routes (para endpoints)
- `@ai-sdk/react` package
- `@tanstack/react-query` package

## Estimated Effort
3-4 hours (reducido por usar AI SDK)
