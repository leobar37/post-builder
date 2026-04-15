import { useState, useCallback, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Tabs } from './components/layout/Tabs';
import { ProjectsGrid } from './components/projects/ProjectsGrid';
import { ProjectDetail } from './components/projects/ProjectDetail';
import { VideoTable } from './components/videos/VideoTable';
import { PipelineView } from './components/pipeline/PipelineView';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { CreateVideoModal } from './components/modals/CreateVideoModal';
import { useProjects } from './hooks/useProjects';
import { useVideos } from './hooks/useVideos';
import type { ProjectWithCounts } from '../api/types/index.js';

type Tab = 'projects' | 'videos' | 'pipeline';
type View = { type: 'projects' } | { type: 'project-detail'; project: ProjectWithCounts } | { type: 'videos' } | { type: 'pipeline' };

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [view, setView] = useState<View>({ type: 'projects' });
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateVideo, setShowCreateVideo] = useState(false);
  const [showError, setShowError] = useState(false);

  const { projects, loading, error, createProject } = useProjects();
  const { videos, createVideo } = useVideos();

  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'projects') setView({ type: 'projects' });
    else if (tab === 'videos') setView({ type: 'videos' });
    else if (tab === 'pipeline') setView({ type: 'pipeline' });
  }, []);

  const handleSelectProject = useCallback((project: ProjectWithCounts) => {
    setView({ type: 'project-detail', project });
  }, []);

  const handleBackToProjects = useCallback(() => {
    setView({ type: 'projects' });
  }, []);

  const handleCreateProject = useCallback(async (data: { name: string; description?: string; context_id: string }) => {
    await createProject(data);
    setShowCreateProject(false);
  }, [createProject]);

  const handleCreateVideo = useCallback(async (prompt: string) => {
    if (view.type === 'project-detail') {
      await createVideo(view.project.id, prompt);
      setShowCreateVideo(false);
    }
  }, [view, createVideo]);

  const projectVideos = view.type === 'project-detail'
    ? videos.filter(v => v.project_id === view.project.id)
    : [];

  return (
    <div className="min-h-screen bg-ui-bg-primary">
      <Navbar />
      <Tabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Error Toast */}
      {showError && error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-900/30 border border-red-900/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="text-red-400 text-sm">{error}</span>
            </div>
            <button
              onClick={() => setShowError(false)}
              className="text-red-400 hover:text-red-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Projects Tab */}
        {view.type === 'projects' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-ui-text-primary">Proyectos</h1>
                <p className="text-sm text-ui-text-secondary mt-1">Organiza tus videos por campaña o tipo de contenido</p>
              </div>
              <button
                onClick={() => setShowCreateProject(true)}
                className="bg-gs-orange hover:bg-gs-orange-dark text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                </svg>
                Nuevo Proyecto
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-gs-orange border-t-transparent rounded-full animate-spin" />
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-ui-bg-card rounded-xl border border-ui-border p-12 text-center">
                <p className="text-ui-text-secondary mb-4">No hay proyectos todavía</p>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="text-gs-orange hover:text-gs-orange-light font-medium"
                >
                  Crear el primer proyecto
                </button>
              </div>
            ) : (
              <ProjectsGrid
                projects={projects}
                onSelectProject={handleSelectProject}
                onCreateProject={() => setShowCreateProject(true)}
              />
            )}
          </div>
        )}

        {/* Project Detail Tab */}
        {view.type === 'project-detail' && (
          <ProjectDetail
            project={view.project}
            videos={projectVideos}
            onBack={handleBackToProjects}
            onCreateVideo={() => setShowCreateVideo(true)}
            onSelectVideo={(video) => {
              alert(`Video: ${video.title || video.id}\nEstado: ${video.status}\n\nNavegación a detalle de video pendiente de implementar.`);
            }}
          />
        )}

        {/* All Videos Tab */}
        {view.type === 'videos' && (
          <VideoTable
            videos={videos}
            onSelectVideo={(video) => {
              alert(`Video: ${video.title || video.id}\nEstado: ${video.status}\n\nNavegación a detalle de video pendiente de implementar.`);
            }}
          />
        )}

        {/* Pipeline Tab */}
        {view.type === 'pipeline' && (
          <PipelineView />
        )}
      </div>

      {/* Modals */}
      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onSubmit={handleCreateProject}
        />
      )}

      {showCreateVideo && view.type === 'project-detail' && (
        <CreateVideoModal
          projectName={view.project.name}
          projectContextId={view.project.context_id}
          onClose={() => setShowCreateVideo(false)}
          onSubmit={handleCreateVideo}
        />
      )}
    </div>
  );
}
