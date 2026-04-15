import { VideoEditorAgent, type VideoEditorConfig } from './VideoEditorAgent.js';
import type { VideoEditorSession } from './types.js';

export { VideoEditorAgent };
export type { VideoEditorConfig, VideoEditorSession };

// Singleton instance
let agent: VideoEditorAgent | null = null;

export function getVideoEditorAgent(config?: VideoEditorConfig): VideoEditorAgent {
  if (!agent) {
    agent = new VideoEditorAgent(config || {
      model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
      apiKey: process.env.AI_API_KEY || '',
      temperature: 0.7,
      maxSteps: 5,
    });
  }
  return agent;
}
