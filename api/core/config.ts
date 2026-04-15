import { z } from 'zod';
import { ConfigError } from './errors.js';

/**
 * Configuration schema using Zod for type-safe environment variables
 */
export const configSchema = z.object({
  // Server
  port: z.coerce.number().default(3458),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  databaseUrl: z.string().default('./data/reels.db'),

  // OpenCode
  opencodeApiKey: z.string().optional(),
  opencodeTimeout: z.coerce.number().default(180000), // 3 minutes
  opencodeMaxRetries: z.coerce.number().default(2),

  // MiniMax
  minimaxApiKey: z.string().optional(),
  minimaxBaseUrl: z.string().default('https://api.minimax.io/v1'),

  // Paths
  videosBasePath: z.string().default('./videos'),
  projectsBasePath: z.string().default('./projects'),

  // Remotion
  remotionPort: z.coerce.number().default(3001),
});

export type Config = z.infer<typeof configSchema>;

let cachedConfig: Config | null = null;

/**
 * Load and validate configuration from environment variables
 * Uses caching to avoid re-parsing on every call
 */
export function loadConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const config = configSchema.parse({
      port: process.env.PORT,
      host: process.env.HOST,
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL,
      opencodeApiKey: process.env.OPENCODE_API_KEY,
      opencodeTimeout: process.env.OPENCODE_TIMEOUT,
      opencodeMaxRetries: process.env.OPENCODE_MAX_RETRIES,
      minimaxApiKey: process.env.MINIMAX_API_KEY,
      minimaxBaseUrl: process.env.MINIMAX_BASE_URL,
      videosBasePath: process.env.VIDEOS_BASE_PATH,
      projectsBasePath: process.env.PROJECTS_BASE_PATH,
      remotionPort: process.env.REMOTION_PORT,
    });

    cachedConfig = config;
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new ConfigError(`Invalid configuration: ${issues}`);
    }
    throw new ConfigError('Failed to load configuration', { cause: error });
  }
}

/**
 * Reset cached configuration (useful for testing)
 */
export function resetConfig(): void {
  cachedConfig = null;
}

/**
 * Get a specific config value with type safety
 */
export function getConfig<K extends keyof Config>(key: K): Config[K] {
  return loadConfig()[key];
}
