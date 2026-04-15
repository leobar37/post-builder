import { createEditSceneCodeTool } from './editSceneCode.js';
import { AcpClient } from '../../../core/opencode/acp-client.js';
import type { Tool } from 'ai';

export interface SceneTools {
  editSceneCode: Tool;
}

export function createSceneTools(acpClient: AcpClient): SceneTools {
  return {
    editSceneCode: createEditSceneCodeTool(acpClient),
  };
}

export * from './editSceneCode.js';
