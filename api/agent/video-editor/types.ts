import type { AgentSession } from '../core/types.js';

export interface VideoEditorSession extends AgentSession {
  metadata: {
    sceneId: string;
    videoId: string;
    projectId: string;
    sceneType: 'hook' | 'stats' | 'cta' | 'transition';
    currentCode?: string;
  };
}

export interface SceneContext {
  projectName: string;
  brandColors: string[];
  targetAudience: string;
  videoObjective: 'awareness' | 'conversion' | 'engagement';
}

/**
 * Type guard to check if a session is a valid VideoEditorSession
 */
export function isVideoEditorSession(session: AgentSession): session is VideoEditorSession {
  const meta = session.metadata;
  return (
    typeof meta.sceneId === 'string' &&
    typeof meta.videoId === 'string' &&
    typeof meta.projectId === 'string' &&
    ['hook', 'stats', 'cta', 'transition'].includes(meta.sceneType as string)
  );
}
