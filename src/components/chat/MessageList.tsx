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
          isUser ? 'bg-blue-900/30' : 'bg-gs-orange/20'
        }`}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4 text-blue-400" />
        ) : (
          <AssistantIcon className="w-4 h-4 text-gs-orange" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-ui-bg-input text-ui-text-secondary rounded-tl-sm'
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
      <div className="w-8 h-8 bg-gs-orange/20 rounded-full flex items-center justify-center">
        <AssistantIcon className="w-4 h-4 text-gs-orange" />
      </div>
      <div className="bg-ui-bg-input rounded-2xl rounded-tl-sm px-4 py-3">
        <span className="inline-flex gap-1">
          <span className="w-2 h-2 bg-ui-text-muted rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-ui-text-muted rounded-full animate-bounce [animation-delay:0.1s]" />
          <span className="w-2 h-2 bg-ui-text-muted rounded-full animate-bounce [animation-delay:0.2s]" />
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
