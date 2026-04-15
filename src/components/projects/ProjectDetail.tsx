import type { ProjectWithCounts, VideoResponse } from '../../../api/types/index.js';
import { ContextFiles } from './ContextFiles';
import { VideoRow } from '../videos/VideoRow';

interface Props {
  project: ProjectWithCounts;
  videos: VideoResponse[];
  onBack: () => void;
  onCreateVideo: () => void;
  onSelectVideo: (video: VideoResponse) => void;
}

export function ProjectDetail({ project, videos, onBack, onCreateVideo, onSelectVideo }: Props) {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ui-text-secondary mb-6">
        <button onClick={onBack} className="hover:text-ui-text-primary">Proyectos</button>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
        </svg>
        <span className="text-ui-text-primary font-medium">{project.name}</span>
      </div>

      {/* Project Header */}
      <div className="bg-ui-bg-card rounded-xl border border-ui-border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-ui-text-primary mb-1">{project.name}</h1>
            <p className="text-sm text-ui-text-secondary">{project.description || 'Sin descripción'}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs bg-gs-orange/20 text-gs-orange px-2 py-1 rounded-full font-medium">
                {project.status === 'active' ? 'Activo' : project.status}
              </span>
              <span className="text-xs text-ui-text-muted font-mono">projects/{project.context_id}/</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-sm text-ui-text-secondary hover:text-ui-text-primary px-3 py-1.5 rounded-lg hover:bg-ui-bg-hover transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Config
            </button>
            <button
              onClick={onCreateVideo}
              className="bg-gs-orange hover:bg-gs-orange-dark text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              Nuevo Video
            </button>
          </div>
        </div>

        {/* Context Files */}
        <div className="mt-5 pt-5 border-t border-ui-border-subtle">
          <h3 className="text-sm font-medium text-ui-text-secondary mb-3">Archivos de Contexto</h3>
          <ContextFiles contextId={project.context_id} />
        </div>
      </div>

      {/* Videos Section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ui-text-primary">Videos</h2>
        <span className="text-sm text-ui-text-secondary">{videos.length} videos</span>
      </div>

      <div className="space-y-3">
        {videos.length === 0 ? (
          <div className="bg-ui-bg-card rounded-xl border border-ui-border p-8 text-center">
            <p className="text-ui-text-secondary">No hay videos en este proyecto</p>
            <button
              onClick={onCreateVideo}
              className="mt-3 text-gs-orange hover:text-gs-orange-light text-sm font-medium"
            >
              Crear el primer video
            </button>
          </div>
        ) : (
          videos.map(video => (
            <VideoRow
              key={video.id}
              video={video}
              onClick={() => onSelectVideo(video)}
            />
          ))
        )}
      </div>
    </div>
  );
}
