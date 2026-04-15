import { useAgentChat } from '../../hooks/useAgentChat.js';
import { MessageList } from './MessageList.js';
import { ChatInput } from './ChatInput.js';

interface AgentChatProps {
  sessionId: string | null;
  onCreateSession: (sceneId: string) => Promise<string>;
  sceneId: string;
}

export function AgentChat({ sessionId, onCreateSession, sceneId }: AgentChatProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    isStreaming,
    createSession,
    stop,
  } = useAgentChat({
    sessionId,
  });

  const handleSendWithSession = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!sessionId) {
      const newSessionId = await createSession({
        sceneId,
        videoId: '',
        projectId: '',
      });
      return;
    }

    handleSubmit(e);
  };

  return (
    <div className="flex flex-col h-full bg-ui-bg-card">
      {/* Header */}
      <div className="p-4 border-b border-ui-border flex items-center justify-between bg-ui-bg-input">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gs-orange/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-gs-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-sm text-ui-text-primary">OpenCode Assistant</h3>
            <p className="text-xs text-ui-text-secondary">
              {sessionId ? `Session: ${sessionId.slice(0, 8)}...` : 'New session'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <button
              onClick={stop}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/20"
            >
              Stop
            </button>
          )}
          {sessionId && (
            <button
              onClick={() => onCreateSession(sceneId)}
              className="text-xs text-ui-text-secondary hover:text-ui-text-primary px-2 py-1 rounded hover:bg-ui-bg-hover"
            >
              New session
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isStreaming={isStreaming} />

      {/* Input */}
      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSendWithSession}
        isLoading={isLoading}
        placeholder={
          sessionId
            ? 'Describe what changes you want to make...'
            : 'Describe what scene you want to create...'
        }
      />
    </div>
  );
}
