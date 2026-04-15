import { Router } from 'express';
import { getModelRegistry } from '../core/opencode/model-registry.js';

const router = Router();
const modelRegistry = getModelRegistry();

/**
 * GET /api/models
 * List all available models or filter by provider
 * Query params: provider (optional)
 */
router.get('/', async (req, res) => {
  try {
    const { provider } = req.query;
    const models = await modelRegistry.listModels(provider as string | undefined);
    
    res.json({
      success: true,
      count: models.length,
      models,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list models',
    });
  }
});

/**
 * GET /api/models/providers
 * List all providers with their models
 */
router.get('/providers', async (_req, res) => {
  try {
    const providers = await modelRegistry.listProviders();
    
    res.json({
      success: true,
      count: providers.length,
      providers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list providers',
    });
  }
});

/**
 * GET /api/models/:provider
 * Get models for a specific provider
 */
router.get('/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const models = await modelRegistry.getProviderModels(provider);
    
    res.json({
      success: true,
      provider,
      count: models.length,
      models,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get provider models',
    });
  }
});

/**
 * POST /api/models/refresh
 * Refresh models cache
 */
router.post('/refresh', async (_req, res) => {
  try {
    await modelRegistry.refresh();
    
    res.json({
      success: true,
      message: 'Models cache refreshed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh models',
    });
  }
});

export default router;
