export function Navbar() {
  return (
    <nav className="bg-ui-bg-card border-b border-ui-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gs-orange rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">GS</span>
          </div>
          <span className="font-semibold text-ui-text-primary">GymSpace</span>
          <span className="text-xs bg-gs-orange/20 text-gs-orange px-2 py-0.5 rounded-full">Video Pipeline</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm text-ui-text-secondary hover:text-ui-text-primary flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Feedback
          </button>
          <div className="w-8 h-8 bg-ui-bg-input rounded-full flex items-center justify-center text-sm font-medium text-ui-text-muted">
            L
          </div>
        </div>
      </div>
    </nav>
  );
}
