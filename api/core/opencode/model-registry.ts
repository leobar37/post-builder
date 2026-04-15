import { exec } from 'child_process';
import { promisify } from 'util';
import { getLogger } from '../logger.js';
import type { Model, Provider } from './types.js';

const execAsync = promisify(exec);

/**
 * Model Registry
 * 
 * Manages discovery and caching of available AI models from OpenCode CLI.
 * Uses `opencode models` command to fetch available models.
 */
export class ModelRegistry {
  private logger = getLogger().child('ModelRegistry');
  private cache: Map<string, Model[]> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * List all available models
   */
  async listModels(provider?: string): Promise<Model[]> {
    const cacheKey = provider || 'all';
    
    // Check cache
    if (this.isCacheValid(cacheKey)) {
      this.logger.debug(`Returning cached models for ${cacheKey}`);
      return this.cache.get(cacheKey) || [];
    }

    try {
      const models = await this.fetchModels(provider);
      this.cache.set(cacheKey, models);
      this.cacheTimestamp = Date.now();
      return models;
    } catch (error) {
      this.logger.error('Failed to fetch models', error as Error);
      // Return cached data even if expired
      return this.cache.get(cacheKey) || [];
    }
  }

  /**
   * List all providers with their models
   */
  async listProviders(): Promise<Provider[]> {
    const models = await this.listModels();
    const providerMap = new Map<string, Model[]>();

    for (const model of models) {
      if (!providerMap.has(model.provider)) {
        providerMap.set(model.provider, []);
      }
      providerMap.get(model.provider)!.push(model);
    }

    return Array.from(providerMap.entries()).map(([id, models]) => ({
      id,
      models,
    }));
  }

  /**
   * Get models for a specific provider
   */
  async getProviderModels(providerId: string): Promise<Model[]> {
    return this.listModels(providerId);
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamp = 0;
    this.logger.info('Model cache cleared');
  }

  /**
   * Refresh models from CLI
   */
  async refresh(): Promise<void> {
    this.clearCache();
    await this.listModels();
    this.logger.info('Models refreshed');
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    if (!this.cache.has(key)) return false;
    const age = Date.now() - this.cacheTimestamp;
    return age < this.CACHE_TTL;
  }

  /**
   * Fetch models from OpenCode CLI
   */
  private async fetchModels(provider?: string): Promise<Model[]> {
    const command = provider 
      ? `opencode models ${provider}`
      : 'opencode models';

    this.logger.debug(`Executing: ${command}`);

    const { stdout } = await execAsync(command, {
      timeout: 30000,
      env: { ...process.env },
    });

    return this.parseModelsOutput(stdout);
  }

  /**
   * Parse CLI output into Model objects
   * Format: provider/model
   */
  private parseModelsOutput(output: string): Model[] {
    const lines = output.trim().split('\n');
    const models: Model[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Parse provider/model format
      const slashIndex = trimmed.indexOf('/');
      if (slashIndex === -1) continue;

      const provider = trimmed.substring(0, slashIndex);
      const id = trimmed.substring(slashIndex + 1);

      models.push({
        id,
        provider,
        fullId: trimmed,
      });
    }

    this.logger.info(`Parsed ${models.length} models`);
    return models;
  }
}

// Singleton instance
let registry: ModelRegistry | null = null;

/**
 * Get the global model registry instance
 */
export function getModelRegistry(): ModelRegistry {
  if (!registry) {
    registry = new ModelRegistry();
  }
  return registry;
}

/**
 * Set the global model registry instance
 */
export function setModelRegistry(instance: ModelRegistry): void {
  registry = instance;
}
