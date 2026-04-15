import { Router } from 'express';
import { z } from 'zod';
import { getSceneService } from '../services/scene.service.js';
import { AcpClient } from '../core/opencode/acp-client.js';
import type { SceneCodeEditCallbackBody } from '../types/index.js';

const router = Router();
const sceneService = getSceneService();

// Validation schema for callback body
const callbackSchema = z.object({
  status: z.enum(['completed', 'failed']),
  files: z.array(z.string()).optional(),
  error: z.string().optional(),
  summary: z.string().optional(),
});

/**
 * POST /api/agent/callbacks/scene-edit/:sceneId
 * Callback endpoint for OpenCode to report scene code edit completion
 */
router.post('/scene-edit/:sceneId', async (req, res) => {
  try {
    const { sceneId } = req.params;
    const body = req.body as SceneCodeEditCallbackBody;

    // Validate request body
    const validation = callbackSchema.safeParse(body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid callback body',
        details: validation.error.issues,
      });
    }

    // Get the scene to find the job ID for ACP session cleanup
    const scene = await sceneService.getById(sceneId);

    // Complete the scene code edit
    const updatedScene = await sceneService.completeSceneCodeEdit(sceneId, {
      status: body.status,
      files: body.files,
      error: body.error,
      summary: body.summary,
    });

    // Cleanup ACP session if it exists
    if (scene.code_edit_job_id) {
      const sessionId = `scene-edit-${scene.code_edit_job_id}`;
      await AcpClient.shutdownSession(sessionId).catch((err) => {
        console.warn(`[AgentCallback] Failed to shutdown ACP session ${sessionId}:`, err);
      });
    }

    return res.json({
      success: true,
      sceneId: updatedScene.id,
      code_edit_status: updatedScene.code_edit_status,
      code_path: updatedScene.code_path,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Scene not found') {
      return res.status(404).json({
        success: false,
        error: 'Scene not found',
      });
    }

    console.error('[AgentCallback] Error handling callback:', err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

export default router;
