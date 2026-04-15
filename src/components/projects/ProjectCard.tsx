import type { ProjectWithCounts } from '../../../api/types/index.js';

interface Props {
  project: ProjectWithCounts;
  onClick: () => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-900/30 text-green-400',
  archived: 'bg-ui-bg-input text-ui-text-muted',
  deleted: 'bg-red-900/30 text-red-400',
};

export function ProjectCard({ project, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bg-ui-bg-card rounded-xl border border-ui-border p-5 hover:shadow-md hover:border-gs-orange transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-gs-orange/20 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-gs-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2m0 2v2m0-2H4m3 0h3m0 2v2m0-2h2m-2 0v6m0-6H4m3 0h3m0 2v2m0-2h2m-2 0v6m0-6h2m-2 0h2"/>
          </svg>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[project.status] || statusColors.active}`}>
          {project.status === 'active' ? 'Activo' : project.status}
        </span>
      </div>
      <h3 className="font-semibold text-ui-text-primary mb-1">{project.name}</h3>
      <p className="text-sm text-ui-text-secondary mb-4 line-clamp-2">{project.description || 'Sin descripción'}</p>
      <div className="flex items-center gap-4 text-xs text-ui-text-muted">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          {project.video_count} videos
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {project.completed_videos} completados
        </span>
      </div>
      <div className="mt-3 pt-3 border-t border-ui-border-subtle">
        <span className="text-xs text-ui-text-muted font-mono">context_id: {project.context_id}</span>
      </div>
    </div>
  );
}
