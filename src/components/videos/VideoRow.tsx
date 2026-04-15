import type { VideoResponse } from '../../../api/types/index.js';

interface Props {
  video: VideoResponse;
  onClick?: () => void;
  compact?: boolean;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  draft: { label: 'Borrador', class: 'bg-ui-bg-input text-ui-text-muted' },
  generating_idea: { label: 'Generando idea', class: 'bg-gs-orange/20 text-gs-orange' },
  idea_ready: { label: 'Idea lista', class: 'bg-blue-900/30 text-blue-400' },
  generating_clips: { label: 'Generando clips', class: 'bg-gs-orange/20 text-gs-orange' },
  clips_ready: { label: 'Clips listos', class: 'bg-indigo-900/30 text-indigo-400' },
  composing: { label: 'Componiendo', class: 'bg-gs-orange/20 text-gs-orange' },
  completed: { label: 'Completado', class: 'bg-green-900/30 text-green-400' },
  failed: { label: 'Fallido', class: 'bg-red-900/30 text-red-400' },
};

export function VideoRow({ video, onClick, compact = false }: Props) {
  const status = statusConfig[video.status] || statusConfig.draft;
  const progress = video.progress || 0;

  return (
    <div
      onClick={onClick}
      className={`bg-ui-bg-card rounded-xl border border-ui-border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer ${compact ? 'p-3' : ''}`}
    >
      {/* Thumbnail */}
      <div className={`bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 ${compact ? 'w-12 h-12' : 'w-16 h-16'}`}>
        <svg className={`text-white ${compact ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-ui-text-primary truncate">{video.title || 'Sin título'}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${status.class}`}>
            {status.label}
          </span>
        </div>
        {video.prompt && (
          <p className="text-sm text-ui-text-secondary truncate">{video.prompt}</p>
        )}
        {!compact && (
          <div className="flex items-center gap-4 mt-2 text-xs text-ui-text-muted">
            <span>{video.total_scenes} escenas</span>
            <span>{progress}%</span>
            <span>{formatTime(video.created_at)}</span>
          </div>
        )}
        {!compact && video.status === 'generating_clips' && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-ui-text-muted mb-1">
              <span>{video.completed_scenes}/{video.total_scenes} escenas</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-ui-bg-input rounded-full h-1.5">
              <div className="bg-gs-orange h-1.5 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {video.status === 'completed' && (
          <button className="text-ui-text-muted hover:text-ui-text-secondary p-2 rounded-lg hover:bg-ui-bg-hover">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
          </button>
        )}
        {video.status === 'generating_clips' && (
          <button className="text-ui-text-muted hover:text-ui-text-secondary p-2 rounded-lg hover:bg-ui-bg-hover">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}
