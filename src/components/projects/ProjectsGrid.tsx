import type { ProjectWithCounts } from '../../../api/types/index.js';
import { ProjectCard } from './ProjectCard';

interface Props {
  projects: ProjectWithCounts[];
  onSelectProject: (project: ProjectWithCounts) => void;
  onCreateProject: () => void;
}

export function ProjectsGrid({ projects, onSelectProject, onCreateProject }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={() => onSelectProject(project)}
        />
      ))}
      <div
        onClick={onCreateProject}
        className="bg-ui-bg-secondary rounded-xl border-2 border-dashed border-ui-border p-5 hover:border-gs-orange hover:bg-gs-orange/10 transition-all cursor-pointer flex flex-col items-center justify-center min-h-48"
      >
        <div className="w-10 h-10 bg-ui-bg-input rounded-full flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-ui-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
          </svg>
        </div>
        <span className="text-sm text-ui-text-secondary">Crear nuevo proyecto</span>
      </div>
    </div>
  );
}
