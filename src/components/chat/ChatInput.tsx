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
    <form onSubmit={handleSubmit} className="border-t border-ui-border bg-ui-bg-card p-4">
      <div className="relative">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Describe what you want to create...'}
          disabled={isLoading}
          className="w-full pr-12 py-3 px-4 border border-ui-border bg-ui-bg-input rounded-xl resize-none focus:ring-2 focus:ring-gs-orange focus:border-gs-orange disabled:bg-ui-bg-input text-ui-text-primary placeholder-ui-text-muted"
          rows={2}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-3 bottom-3 p-2 bg-gs-orange hover:bg-gs-orange-dark disabled:bg-ui-bg-input text-white rounded-lg transition-colors"
        >
          {isLoading ? (
            <LoadingSpinner className="w-4 h-4" />
          ) : (
            <SendIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      <p className="text-xs text-ui-text-muted mt-2 text-center">
        Shift + Enter for new line • Enter to send
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
