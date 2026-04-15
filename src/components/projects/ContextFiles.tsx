interface Props {
  contextId: string;
}

export function ContextFiles({ contextId }: Props) {
  const files = [
    { name: 'system.md', label: 'system.md' },
    { name: 'brand.md', label: 'brand.md' },
    { name: 'audience.md', label: 'audience.md' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {files.map((file, i) => (
        <div key={file.name} className="flex items-center gap-2 bg-ui-bg-input rounded-lg px-3 py-2 text-sm">
          <svg className="w-4 h-4 text-ui-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span className="text-ui-text-secondary">{file.label}</span>
          <span className="ml-auto text-xs text-green-400">
            {i < 2 ? '✓' : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
