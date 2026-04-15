const states = [
  { id: 'draft', label: 'Creado', icon: '1' },
  { id: 'generating_idea', label: 'OpenCode', icon: null },
  { id: 'idea_ready', label: 'Esperando revisión', icon: null },
  { id: 'generating_clips', label: 'MiniMax', icon: null },
  { id: 'clips_ready', label: 'Clips OK', icon: null },
  { id: 'composing', label: 'Remotion', icon: null },
  { id: 'completed', label: 'MP4 listo', icon: null },
];

const spinningStates = ['generating_idea', 'generating_clips', 'composing'];

export function StateMachine() {
  return (
    <div className="bg-ui-bg-card rounded-xl border border-ui-border p-8">
      <div className="flex items-center justify-between overflow-x-auto pb-4">
        {states.map((state, index) => {
          const isSpinning = spinningStates.includes(state.id);
          const isCompleted = index < states.length - 1 && state.id !== 'generating_idea' && state.id !== 'generating_clips' && state.id !== 'composing';

          return (
            <div key={state.id} className="flex items-center">
              <div className="flex flex-col items-center min-w-28">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-2 border-2 ${
                  isSpinning
                    ? 'bg-gs-orange/20 border-gs-orange/50'
                    : isCompleted
                    ? 'bg-green-900/20 border-green-900/50'
                    : 'bg-ui-bg-input border-ui-border'
                }`}>
                  {isSpinning ? (
                    <svg className="w-6 h-6 text-gs-orange animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  ) : state.id === 'idea_ready' ? (
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                  ) : state.id === 'clips_ready' ? (
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  ) : state.id === 'completed' ? (
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  ) : (
                    <span className="text-lg font-bold text-ui-text-muted">{state.icon}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-ui-text-primary text-center">{state.label}</span>
              </div>
              {index < states.length - 1 && (
                <svg className="w-8 h-4 text-ui-border flex-shrink-0 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* Failed path */}
      <div className="mt-6 pt-6 border-t border-ui-border-subtle flex items-center gap-4">
        <span className="text-sm text-ui-text-secondary">Path alternativo:</span>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-ui-bg-input text-ui-text-secondary px-2 py-1 rounded">desde cualquier estado</span>
          <svg className="w-4 h-4 text-ui-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
          </svg>
          <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded font-medium">failed</span>
        </div>
        <span className="text-xs text-ui-text-muted">→ retry posible</span>
      </div>
    </div>
  );
}
