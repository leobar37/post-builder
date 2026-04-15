import { createEditSceneCodeTool } from './editSceneCode.js';
import { AcpClient } from '../../../core/opencode/acp-client.js';
import type { Tool } from 'ai';

export interface VideoEditorTools {
  editSceneCode: Tool;
}

export function createVideoEditorTools(acpClient: AcpClient): VideoEditorTools {
  return {
    editSceneCode: createEditSceneCodeTool(acpClient),
  };
}

export * from './editSceneCode.js';
