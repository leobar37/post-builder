interface Props {
  activeTab: 'projects' | 'videos' | 'pipeline';
  onTabChange: (tab: 'projects' | 'videos' | 'pipeline') => void;
}

export function Tabs({ activeTab, onTabChange }: Props) {
  const tabs = [
    { key: 'projects' as const, label: 'Proyectos' },
    { key: 'videos' as const, label: 'Todos los Videos' },
    { key: 'pipeline' as const, label: 'Pipeline' },
  ];

  return (
    <div className="bg-ui-bg-card border-b border-ui-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-gs-orange text-gs-orange'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
