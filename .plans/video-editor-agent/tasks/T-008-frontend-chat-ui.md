# T-008: Frontend Chat UI

## Objective
Implementar componentes React para el chat con UI en tiempo real usando `@ai-sdk/react`.

## Requirements
- FR-006: Frontend con TanStack Query
- UI de chat con streaming, historial, y tool invocations

## Implementation

### 1. Message Components

**File: `src/components/chat/MessageList.tsx`**
```tsx
import type { Message } from '@ai-sdk/react';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id || index}
          message={message}
          isLast={index === messages.length - 1}
          isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
        />
      ))}
      {isStreaming && messages.length === 0 && <TypingIndicator />}
    </div>
  );
}

function MessageBubble({
  message,
  isLast,
  isStreaming,
}: {
  message: Message;
  isLast: boolean;
  isStreaming: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-blue-100' : 'bg-orange-100'
        }`}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4 text-blue-600" />
        ) : (
          <AssistantIcon className="w-4 h-4 text-orange-600" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-500 text-white rounded-tr-sm'
            : 'bg-slate-100 text-slate-700 rounded-tl-sm'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {isStreaming && isLast && <StreamingIndicator />}
      </div>
    </div>
  );
}

function StreamingIndicator() {
  return (
    <span className="inline-flex gap-1 mt-1">
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.1s]" />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
        <AssistantIcon className="w-4 h-4 text-orange-600" />
      </div>
      <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <span className="inline-flex gap-1">
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
        </span>
      </div>
    </div>
  );
}

// Icons
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function AssistantIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
```

### 2. Input Component

**File: `src/components/chat/ChatInput.tsx`**
```tsx
interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  placeholder,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4">
      <div className="relative">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Describe qué quieres crear...'}
          disabled={isLoading}
          className="w-full pr-12 py-3 px-4 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-slate-50"
          rows={2}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-3 bottom-3 p-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white rounded-lg transition-colors"
        >
          {isLoading ? (
            <LoadingSpinner className="w-4 h-4" />
          ) : (
            <SendIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-2 text-center">
        Shift + Enter para nueva línea • Enter para enviar
      </p>
    </form>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
```

### 3. Main Chat Component

**File: `src/components/chat/AgentChat.tsx`**
```tsx
import { useAgentChat } from '../../hooks/useAgentChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

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
    reload,
    stop,
  } = useAgentChat({
    sessionId,
  });

  const handleSendWithSession = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Create session if needed
    if (!sessionId) {
      const newSessionId = await createSession({
        sceneId,
        videoId: '', // Obtener del contexto
        projectId: '', // Obtener del contexto
      });
      // El hook useAgentChat se re-inicializará con el nuevo sessionId
      // cuando el componente padre actualice la prop
      return;
    }

    handleSubmit(e);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-sm">OpenCode Assistant</h3>
            <p className="text-xs text-slate-500">
              {sessionId ? `Session: ${sessionId.slice(0, 8)}...` : 'Nueva sesión'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <button
              onClick={stop}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
            >
              Detener
            </button>
          )}
          {sessionId && (
            <button
              onClick={() => onCreateSession(sceneId)}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-200"
            >
              Nueva sesión
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
            ? 'Describe qué cambios quieres hacer...'
            : 'Describe qué escena quieres crear...'
        }
      />
    </div>
  );
}
```

### 4. Tool Invocation Display (Opcional)

**File: `src/components/chat/ToolInvocation.tsx`**
```tsx
import type { ToolInvocation as ToolInvocationType } from '@ai-sdk/react';

interface ToolInvocationProps {
  toolInvocation: ToolInvocationType;
}

export function ToolInvocation({ toolInvocation }: ToolInvocationProps) {
  const { toolName, toolCallId, state } = toolInvocation;

  return (
    <div className="my-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <ToolIcon className="w-4 h-4" />
        <span className="font-medium">{toolName}</span>
        <span className="text-xs text-slate-400">({state})</span>
      </div>
      {state === 'result' && toolInvocation.result && (
        <div className="mt-2 text-xs text-slate-500">
          <pre className="bg-slate-100 p-2 rounded overflow-x-auto">
            {JSON.stringify(toolInvocation.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function ToolIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
```

## Verification

- [ ] MessageList muestra mensajes con estilos diferenciados (user/assistant)
- [ ] Indicador de typing aparece durante streaming
- [ ] ChatInput maneja Shift+Enter y Enter correctamente
- [ ] Botón enviar se deshabilita cuando no hay mensaje
- [ ] AgentChat integra todo y maneja creación de sesiones
- [ ] Scroll automático al último mensaje
- [ ] Botón "Detener" aparece durante streaming
- [ ] Mensajes tienen `id` estable del AI SDK

## Dependencies
- T-007: TanStack Query + AI SDK Hook
- `@ai-sdk/react` package
- Tailwind CSS (o sistema de estilos existente)

## Estimated Effort
4-5 hours
