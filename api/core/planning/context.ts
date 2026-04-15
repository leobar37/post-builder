import { readFile } from 'fs/promises';
import { getLogger } from '../logger.js';
import { resolveProjectContextPath } from '../utils/paths.js';
import type { ProjectContext, VideoContext, SceneContext } from './types.js';

/**
 * Context builder for hierarchical context (Project → Video → Scene)
 * 
 * Reads project context from filesystem and combines with video/scene contexts
 */
export class ContextBuilder {
  private logger = getLogger().child('ContextBuilder');

  /**
   * Build a complete context prompt by combining all 3 levels
   */
  async buildContextPrompt(
    contextId: string,
    videoContext?: VideoContext,
    sceneContext?: SceneContext
  ): Promise<string> {
    this.logger.debug(`Building context prompt for: ${contextId}`);

    const projectContext = await this.loadProjectContext(contextId);
    
    const parts: string[] = [];

    // Project context (from filesystem)
    parts.push(`## Project Context\n`);
    parts.push(`Context ID: ${contextId}`);
    parts.push(`Path: projects/${contextId}/`);
    
    if (projectContext.brand) {
      parts.push(`\nBrand:`);
      if (projectContext.brand.colors) {
        parts.push(`- Colors: ${projectContext.brand.colors.join(', ')}`);
      }
      if (projectContext.brand.voice) {
        parts.push(`- Voice: ${projectContext.brand.voice}`);
      }
    }

    if (projectContext.audience) {
      parts.push(`\nTarget Audience:`);
      if (projectContext.audience.ageRange) {
        parts.push(`- Age: ${projectContext.audience.ageRange}`);
      }
      if (projectContext.audience.fitnessLevel) {
        parts.push(`- Fitness Level: ${projectContext.audience.fitnessLevel}`);
      }
      if (projectContext.audience.interests) {
        parts.push(`- Interests: ${projectContext.audience.interests.join(', ')}`);
      }
    }

    // Video context
    if (videoContext) {
      parts.push(`\n## Video Context\n`);
      
      if (videoContext.theme) {
        parts.push(`Theme: ${videoContext.theme}`);
      }
      if (videoContext.objective) {
        parts.push(`Objective: ${videoContext.objective}`);
      }
      
      if (videoContext.visualStyle) {
        parts.push(`\nVisual Style:`);
        if (videoContext.visualStyle.mood) {
          parts.push(`- Mood: ${videoContext.visualStyle.mood}`);
        }
        if (videoContext.visualStyle.colorPalette) {
          parts.push(`- Colors: ${videoContext.visualStyle.colorPalette.join(', ')}`);
        }
        if (videoContext.visualStyle.typography) {
          parts.push(`- Typography: ${videoContext.visualStyle.typography}`);
        }
      }
    }

    // Scene context
    if (sceneContext) {
      parts.push(`\n## Scene Context\n`);
      
      if (sceneContext.action) {
        parts.push(`Action: ${sceneContext.action}`);
      }
      if (sceneContext.emotion) {
        parts.push(`Emotion: ${sceneContext.emotion}`);
      }
      
      if (sceneContext.visualElements) {
        parts.push(`\nVisual Elements:`);
        if (sceneContext.visualElements.people !== undefined) {
          parts.push(`- People: ${sceneContext.visualElements.people}`);
        }
        if (sceneContext.visualElements.location) {
          parts.push(`- Location: ${sceneContext.visualElements.location}`);
        }
        if (sceneContext.visualElements.lighting) {
          parts.push(`- Lighting: ${sceneContext.visualElements.lighting}`);
        }
      }

      if (sceneContext.textOverlay) {
        parts.push(`\nText Overlay:`);
        if (sceneContext.textOverlay.headline) {
          parts.push(`- Headline: "${sceneContext.textOverlay.headline}"`);
        }
        if (sceneContext.textOverlay.subheadline) {
          parts.push(`- Subheadline: "${sceneContext.textOverlay.subheadline}"`);
        }
      }
    }

    return parts.join('\n');
  }

  /**
   * Load project context from filesystem
   */
  async loadProjectContext(contextId: string): Promise<ProjectContext> {
    const context: ProjectContext = {
      name: contextId,
      contextId,
    };

    try {
      // Try to read system.md for basic info
      const systemPath = resolveProjectContextPath(contextId, 'system.md');
      const systemContent = await readFile(systemPath, 'utf-8').catch(() => null);
      
      if (systemContent) {
        this.logger.debug(`Loaded system.md for ${contextId}`);
      }

      // Try to read brand.md
      const brandPath = resolveProjectContextPath(contextId, 'brand.md');
      const brandContent = await readFile(brandPath, 'utf-8').catch(() => null);
      
      if (brandContent) {
        context.brand = { voice: brandContent.substring(0, 200) };
      }

      // Try to read audience.md
      const audiencePath = resolveProjectContextPath(contextId, 'audience.md');
      const audienceContent = await readFile(audiencePath, 'utf-8').catch(() => null);
      
      if (audienceContent) {
        context.audience = {
          ageRange: this.extractAgeRange(audienceContent),
        };
      }

    } catch (error) {
      this.logger.warn(`Failed to load project context for ${contextId}: ${error}`);
    }

    return context;
  }

  /**
   * Extract age range from audience text
   */
  private extractAgeRange(text: string): string | undefined {
    const match = text.match(/(\d{2}-\d{2}|\d{2}\+).*?(years old|años)/i);
    return match ? match[1] : undefined;
  }
}

// Factory function
export function createContextBuilder(): ContextBuilder {
  return new ContextBuilder();
}
