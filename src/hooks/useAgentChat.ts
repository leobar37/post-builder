import { useChat, type Message } from "@ai-sdk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

interface UseAgentChatOptions {
  sessionId: string | null;
  onError?: (error: Error) => void;
}

interface UseAgentChatReturn {
  messages: Message[];
  input: string;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
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
  sceneType?: "hook" | "stats" | "cta" | "transition";
}

export function useAgentChat({
  sessionId,
  onError,
}: UseAgentChatOptions): UseAgentChatReturn {
  const queryClient = useQueryClient();

  // Query: Fetch session messages to initialize the chat
  const { data: sessionData } = useQuery({
    queryKey: ["agent-session", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const res = await fetch(`/api/agent/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to load session");
      return res.json();
    },
    enabled: !!sessionId,
  });

  // AI SDK useChat: Handles streaming, message state, and error handling
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
    api: "/api/agent/chat",
    id: sessionId || undefined,
    initialMessages: sessionData?.session?.messages || [],
    body: {
      sessionId,
    },
    onError: (err) => {
      onError?.(err as Error);
    },
    onFinish: () => {
      // Invalidate cache after completing the message
      if (sessionId) {
        queryClient.invalidateQueries({
          queryKey: ["agent-session", sessionId],
        });
      }
    },
  });

  // Mutation: Create new session
  const createSession = useCallback(
    async (data: CreateSessionData): Promise<string> => {
      const res = await fetch("/api/agent/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create session");
      const result = await res.json();

      // Invalidate sessions list
      queryClient.invalidateQueries({
        queryKey: ["agent-sessions", data.sceneId],
      });

      return result.sessionId as string;
    },
    [queryClient],
  );

  // Wrapper for handleSubmit that ensures sessionId
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!sessionId) {
        onError?.(new Error("No active session. Create a session first."));
        return;
      }
      aiHandleSubmit(e);
    },
    [sessionId, aiHandleSubmit, onError],
  );

  // Determine if streaming (loading but not sending)
  const isStreaming =
    isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "assistant";

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
    queryKey: ["agent-sessions", sceneId],
    queryFn: async () => {
      const res = await fetch(`/api/agent/sessions?sceneId=${sceneId}`);
      if (!res.ok) throw new Error("Failed to load sessions");
      return res.json();
    },
    enabled: !!sceneId,
  });
}
