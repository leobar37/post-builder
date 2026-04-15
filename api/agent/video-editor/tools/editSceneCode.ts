import { z } from 'zod';
import type { Tool } from 'ai';
import { nanoid } from 'nanoid';
import { AcpClient } from '../../../core/opencode/acp-client.js';
import { getSceneService } from '../../../services/scene.service.js';
import type { SceneCodeEditResponse } from '../../../types/index.js';

const editSceneCodeSchema = z.object({
  sceneId: z.string().describe('ID of the scene to edit'),
  description: z.string().describe('Description of what code changes to make'),
  requirements: z.array(z.string()).optional().describe('Specific requirements'),
});

export type EditSceneCodeInput = z.infer<typeof editSceneCodeSchema>;

/**
 * Get the callback URL for scene code editing
 * Uses environment variable or defaults to localhost
 */
function getCallbackUrl(sceneId: string, jobId: string): string {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/agent/callbacks/scene-edit/${sceneId}?jobId=${jobId}`;
}

/**
 * Get the scene code file path
 * Scenes are stored in the scenes directory
 */
function getSceneCodePath(sceneId: string): string {
  const basePath = process.env.SCENES_BASE_PATH || './scenes';
  return `${basePath}/${sceneId}.tsx`;
}

export function createEditSceneCodeTool(acpClient: AcpClient): Tool {
  return {
    description: `Generate or edit React/TypeScript code for video scenes using Remotion.
Use this tool when the user wants to:
- Create a new scene
- Modify existing scene code
- Add animations or effects
- Change layout or styling

This tool delegates ALL file operations to OpenCode. OpenCode will:
1. Read the scene code file
2. Make the requested changes
3. Save the file
4. Call the callback endpoint when done

The tool returns immediately with a job ID. Listen for events to know when editing is complete.`,
    parameters: editSceneCodeSchema,
    execute: async (input: EditSceneCodeInput): Promise<SceneCodeEditResponse> => {
      const jobId = nanoid();
      const sceneService = getSceneService();

      try {
        // 1. Start the job in the scene service
        await sceneService.startSceneCodeEdit(input.sceneId, jobId, {
          description: input.description,
          requirements: input.requirements,
        });

        // 2. Connect to OpenCode ACP
        const sessionId = `scene-edit-${jobId}`;
        await acpClient.connect(sessionId);

        // 3. Build the prompt with callback instructions
        const prompt = buildOpenCodePrompt(input, jobId);

        // 4. Send prompt to OpenCode (fire and forget)
        // OpenCode will handle file operations and call the callback
        await acpClient.sendPrompt(prompt);

        // 5. Return immediately with job info
        // Don't wait for OpenCode to finish
        return {
          success: true,
          sceneId: input.sceneId,
          jobId,
          status: 'editing',
          message: `Scene code editing started. OpenCode will call the callback when done.`,
        };
      } catch (error) {
        // If starting fails, mark as failed
        console.error('[editSceneCode] Failed to start editing:', error);
        throw new Error(
          `Failed to start scene code editing: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      // Note: We don't disconnect ACP here - OpenCode is still working
      // The callback handler will handle cleanup
    },
  };
}

function buildOpenCodePrompt(
  input: EditSceneCodeInput,
  jobId: string
): string {
  const sceneCodePath = getSceneCodePath(input.sceneId);
  const callbackUrl = getCallbackUrl(input.sceneId, jobId);

  const parts = [
    `# Scene Code Editing Task`,
    ``,
    `## Your Task`,
    `Edit the Remotion scene code at: ${sceneCodePath}`,
    ``,
    `## Description`,
    `${input.description}`,
    ``,
    `## Requirements`,
  ];

  if (input.requirements && input.requirements.length > 0) {
    parts.push(...input.requirements.map((r) => `- ${r}`));
  } else {
    parts.push('- Follow Remotion best practices');
    parts.push('- Use TypeScript with proper types');
    parts.push('- Export a default component');
    parts.push('- Use 1080x1920 dimensions for Instagram Reels');
  }

  parts.push(
    ``,
    `## Instructions`,
    `1. Read the current scene code from: ${sceneCodePath}`,
    `2. Make the requested changes`,
    `3. Save the modified code back to the same file`,
    `4. When finished (success or failure), POST to this callback URL:`,
    ``,
    `   POST ${callbackUrl}`,
    ``,
    `## Callback Body Format`,
    `On success:`,
    `\`\`\`json`,
    `{`,
    `  "status": "completed",`,
    `  "files": ["${sceneCodePath}"],`,
    `  "summary": "Brief description of changes made"`,
    `}`,
    `\`\`\``,
    ``,
    `On failure:`,
    `\`\`\`json`,
    `{`,
    `  "status": "failed",`,
    `  "error": "Description of what went wrong"`,
    `}`,
    `\`\`\``,
    ``,
    `## Important Notes`,
    `- Use your file tools to read and write the scene code`,
    `- You have full access to edit the file as needed`,
    `- Always call the callback when done, even on errors`,
    `- The callback is the ONLY way to report completion`,
    `- Do NOT return the code in your response`,
    ``,
    `Start by reading the file at ${sceneCodePath}`
  );

  return parts.join('\n');
}
