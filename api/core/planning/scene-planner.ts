import { getLogger } from '../logger.js';
import { getEventBus } from '../events/bus.js';
import { EventTypes } from '../events/events.js';
import { createContextBuilder } from './context.js';
import type { VideoContext, ScenePlan, PlanningResult, SceneContext } from './types.js';

/**
 * Scene Planner
 * 
 * Plans scenes for a video based on hierarchical context
 */
export class ScenePlanner {
  private logger = getLogger().child('ScenePlanner');
  private contextBuilder = createContextBuilder();

  /**
   * Plan scenes for a video
   */
  async planScenes(
    contextId: string,
    videoContext: VideoContext,
    sceneCount: number = 3
  ): Promise<PlanningResult> {
    this.logger.info(`Planning ${sceneCount} scenes for: ${contextId}`);

    // Build context prompt
    const contextPrompt = await this.contextBuilder.buildContextPrompt(
      contextId,
      videoContext
    );

    // Generate scene plans (in real implementation, this would call OpenCode)
    const scenes: ScenePlan[] = [];
    
    for (let i = 1; i <= sceneCount; i++) {
      const scene = this.generateScenePlan(i, sceneCount, videoContext);
      scenes.push(scene);
    }

    const result: PlanningResult = {
      title: videoContext.theme || 'Untitled Video',
      description: `Video with ${sceneCount} scenes`,
      totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
      scenes,
    };

    // Emit event
    getEventBus().emit(
      EventTypes.SCENE_PLANNED,
      {
        videoId: contextId,
        sceneCount,
        scenes: scenes.map(s => ({
          sequence: s.sequence,
          description: s.description,
          prompt: s.prompt,
        })),
      },
      'ScenePlanner'
    );

    return result;
  }

  /**
   * Generate a single scene plan
   */
  private generateScenePlan(
    sequence: number,
    totalScenes: number,
    videoContext: VideoContext
  ): ScenePlan {
    const isFirst = sequence === 1;
    const isLast = sequence === totalScenes;

    // Default scene contexts based on position
    const sceneContext: SceneContext = {
      action: isFirst 
        ? 'Hook: Capture attention with dynamic movement'
        : isLast 
          ? 'CTA: Clear call to action'
          : `Scene ${sequence}: Deliver key message`,
      emotion: isFirst ? 'excitement' : isLast ? 'urgency' : 'motivation',
      visualElements: {
        people: 1,
        location: 'gym',
        lighting: 'studio',
      },
      textOverlay: isFirst ? {
        headline: '¿Listo para transformar tu vida?',
        position: 'center',
      } : isLast ? {
        cta: '¡Únete hoy!',
        position: 'bottom',
      } : undefined,
    };

    return {
      sequence,
      description: sceneContext.action!,
      duration: 6, // Default MiniMax duration
      prompt: this.buildScenePrompt(sceneContext, videoContext),
      context: sceneContext,
    };
  }

  /**
   * Build generation prompt for a scene
   */
  private buildScenePrompt(sceneContext: SceneContext, videoContext: VideoContext): string {
    const parts: string[] = [];

    // Action
    if (sceneContext.action) {
      parts.push(sceneContext.action);
    }

    // Visual elements
    if (sceneContext.visualElements) {
      const ve = sceneContext.visualElements;
      if (ve.people) parts.push(`${ve.people} person${ve.people > 1 ? 's' : ''}`);
      if (ve.location) parts.push(`at ${ve.location}`);
      if (ve.lighting) parts.push(`${ve.lighting} lighting`);
    }

    // Style from video context
    if (videoContext.visualStyle?.mood) {
      parts.push(`${videoContext.visualStyle.mood} mood`);
    }

    return parts.join(', ');
  }

  /**
   * Regenerate a specific scene
   */
  async regenerateScene(
    contextId: string,
    videoContext: VideoContext,
    sequence: number,
    feedback?: string
  ): Promise<ScenePlan> {
    this.logger.info(`Regenerating scene ${sequence} for: ${contextId}`);

    // In real implementation, this would use feedback to improve the scene
    const scene = this.generateScenePlan(sequence, 3, videoContext);
    
    if (feedback) {
      scene.prompt += ` (improved based on: ${feedback})`;
    }

    return scene;
  }
}

// Factory function
export function createScenePlanner(): ScenePlanner {
  return new ScenePlanner();
}
