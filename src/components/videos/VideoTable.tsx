import { useState } from 'react';
import type { VideoResponse } from '../../../api/types/index.js';
import { VideoRow } from './VideoRow';

interface Props {
  videos: VideoResponse[];
  onSelectVideo: (video: VideoResponse) => void;
}

const filters = [
  { key: 'all', label: 'Todos' },
  { key: 'completed', label: 'Completados' },
  { key: 'in_progress', label: 'En progreso' },
  { key: 'failed', label: 'Fallidos' },
];

export function VideoTable({ videos, onSelectVideo }: Props) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVideos = videos.filter(video => {
    if (activeFilter === 'completed' && video.status !== 'completed') return false;
    if (activeFilter === 'in_progress' && !['generating_idea', 'generating_clips', 'composing'].includes(video.status)) return false;
    if (activeFilter === 'failed' && video.status !== 'failed') return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        video.title?.toLowerCase().includes(query) ||
        video.prompt?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Search & Filters */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ui-text-primary">Todos los Videos</h1>
          <p className="text-sm text-ui-text-secondary mt-1">{videos.length} videos en {new Set(videos.map(v => v.project_id)).size} proyectos</p>
        </div>
        <div className="flex items-center gap-2 bg-ui-bg-card border border-ui-border rounded-lg px-3 py-1.5">
          <svg className="w-4 h-4 text-ui-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar videos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="text-sm border-0 outline-none bg-transparent w-48 text-ui-text-primary"
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        {filters.map(filter => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              activeFilter === filter.key
                ? 'bg-gs-orange/20 text-gs-orange'
                : 'text-ui-text-muted hover:bg-ui-bg-hover'
            }`}
          >
            {filter.label} ({getCount(videos, filter.key)})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-ui-bg-card rounded-xl border border-ui-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ui-bg-input border-b border-ui-border">
            <tr>
              <th className="text-left px-4 py-3 text-ui-text-secondary font-medium">Video</th>
              <th className="text-left px-4 py-3 text-ui-text-secondary font-medium">Proyecto</th>
              <th className="text-left px-4 py-3 text-ui-text-secondary font-medium">Estado</th>
              <th className="text-left px-4 py-3 text-ui-text-secondary font-medium">Progreso</th>
              <th className="text-left px-4 py-3 text-ui-text-secondary font-medium">Creado</th>
              <th className="text-right px-4 py-3 text-ui-text-secondary font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border-subtle">
            {filteredVideos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ui-text-muted">
                  No hay videos que coincidan con los filtros
                </td>
              </tr>
            ) : (
              filteredVideos.map(video => (
                <tr key={video.id} className="hover:bg-ui-bg-hover cursor-pointer" onClick={() => onSelectVideo(video)}>
                  <td className="px-4 py-3 font-medium text-ui-text-primary">{video.title || 'Sin título'}</td>
                  <td className="px-4 py-3 text-ui-text-secondary">{video.project_id || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={video.status} />
                  </td>
                  <td className="px-4 py-3">
                    {video.status === 'completed' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-ui-bg-input rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full w-full" />
                        </div>
                        <span className="text-xs text-ui-text-muted">100%</span>
                      </div>
                    ) : video.status === 'failed' ? (
                      <span className="text-xs text-ui-text-muted">—</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-ui-bg-input rounded-full h-1.5">
                          <div className="bg-gs-orange h-1.5 rounded-full" style={{ width: `${video.progress}%` }} />
                        </div>
                        <span className="text-xs text-ui-text-muted">{video.progress}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ui-text-muted">{formatDate(video.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {video.status === 'completed' ? (
                      <button className="text-ui-text-muted hover:text-ui-text-secondary p-2 rounded-lg hover:bg-ui-bg-hover">↓</button>
                    ) : video.status === 'failed' ? (
                      <button className="text-gs-orange hover:text-gs-orange-light text-xs">Reintentar</button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string }> = {
    draft: { label: 'Borrador', class: 'bg-ui-bg-input text-ui-text-muted' },
    generating_idea: { label: 'Generando idea', class: 'bg-gs-orange/20 text-gs-orange' },
    idea_ready: { label: 'Idea lista', class: 'bg-blue-900/30 text-blue-400' },
    generating_clips: { label: 'Generando clips', class: 'bg-gs-orange/20 text-gs-orange' },
    clips_ready: { label: 'Clips listos', class: 'bg-indigo-900/30 text-indigo-400' },
    composing: { label: 'Componiendo', class: 'bg-gs-orange/20 text-gs-orange' },
    completed: { label: 'Completado', class: 'bg-green-900/30 text-green-400' },
    failed: { label: 'Fallido', class: 'bg-red-900/30 text-red-400' },
  };
  const { label, class: className } = config[status] || config.draft;
  return <span className={`px-2 py-0.5 rounded-full text-xs ${className}`}>{label}</span>;
}

function getCount(videos: VideoResponse[], filter: string): number {
  if (filter === 'all') return videos.length;
  if (filter === 'completed') return videos.filter(v => v.status === 'completed').length;
  if (filter === 'in_progress') return videos.filter(v => ['generating_idea', 'generating_clips', 'composing'].includes(v.status)).length;
  if (filter === 'failed') return videos.filter(v => v.status === 'failed').length;
  return 0;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
  } catch {
    return '';
  }
}
