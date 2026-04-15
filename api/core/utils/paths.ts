import { join, resolve } from 'path';
import { getConfig } from '../config.js';

/**
 * Resolve path relative to project root
 */
export function resolveProjectPath(...segments: string[]): string {
  return resolve(process.cwd(), ...segments);
}

/**
 * Resolve path relative to videos base directory
 */
export function resolveVideoPath(videoId: string, ...segments: string[]): string {
  const basePath = getConfig('videosBasePath');
  return resolve(basePath, videoId, ...segments);
}

/**
 * Resolve path relative to projects base directory
 */
export function resolveProjectContextPath(contextId: string, ...segments: string[]): string {
  const basePath = getConfig('projectsBasePath');
  return resolve(basePath, contextId, ...segments);
}

/**
 * Resolve path to a scene composition file
 */
export function resolveCompositionPath(videoId: string, sceneNumber: number): string {
  return resolveVideoPath(videoId, 'compositions', `Scene${String(sceneNumber).padStart(2, '0')}.tsx`);
}

/**
 * Resolve path to a scene output file
 */
export function resolveSceneOutputPath(videoId: string, sceneNumber: number): string {
  return resolveVideoPath(videoId, 'scenes', `scene-${String(sceneNumber).padStart(2, '0')}.mp4`);
}

/**
 * Resolve path to final video output
 */
export function resolveFinalOutputPath(videoId: string): string {
  return resolveVideoPath(videoId, 'output', 'reel-final.mp4');
}

/**
 * Get relative path from project root
 */
export function getRelativePath(absolutePath: string): string {
  return absolutePath.replace(resolve(process.cwd()), '').replace(/^\//, '');
}
