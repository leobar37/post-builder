import { EventEmitter } from 'events';
import { z, type ZodType } from 'zod';
import { getLogger } from '../logger.js';
import { OpenCodeError } from '../errors.js';
import { AcpClient } from './acp-client.js';
import { getModelRegistry } from './model-registry.js';
import { getStructuredOutputValidator } from './validation.js';
import type {
  AcpSession,
  AcpSessionConfig,
  AcpMessage,
  AcpPromptResponse,
  AcpToolCall,
  Model,
  Provider,
  JsonSchema,
  StructuredPromptOptions,
  StructuredPromptResponse,
} from './types.js';
import { StructuredOutputError } from './types.js';

/**
 * OpenCode SDK - High-level interface for OpenCode integration
 * 
 * Provides a simplified API for:
 * - Connecting to OpenCode ACP
 * - Sending prompts
 * - Handling tool calls
 * - Streaming responses
 * - Listing available models
 * 
 * Usage:
 * ```typescript
 * const sdk = new OpenCodeSDK({ apiKey: '...' });
 * 
 * // List available models
 * const models = await sdk.listModels();
 * const providers = await sdk.listProviders();
 * 
 * await sdk.connect('session-123');
 * 
 * const response = await sdk.sendPrompt('Generate a video idea', {
 *   onToolCall: async (call) => {
 *     // Handle tool calls
 *     return { result: 'success' };
 *   }
 * });
 * 
 * await sdk.disconnect();
 * ```
 */
export class OpenCodeSDK extends EventEmitter {
  private client: AcpClient;
  private logger = getLogger().child('OpenCodeSDK');
  private messageHandler?: (message: AcpMessage) => void;
  private modelRegistry = getModelRegistry();

  constructor(config: AcpSessionConfig = {}) {
    super();
    this.client = new AcpClient(config);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connected', (session) => {
      this.logger.info(`Session connected: ${session.id}`);
      this.emit('connected', session);
    });

    this.client.on('disconnected', ({ code }) => {
      this.logger.info(`Session disconnected: ${code}`);
      this.emit('disconnected', { code });
    });

    this.client.on('error', (error) => {
      this.logger.error('Session error', error);
      this.emit('error', error);
    });
  }

  /**
   * List all available models
   * @param provider Optional provider ID to filter models
   */
  async listModels(provider?: string): Promise<Model[]> {
    this.logger.debug(`Listing models${provider ? ` for provider: ${provider}` : ''}`);
    return this.modelRegistry.listModels(provider);
  }

  /**
   * List all providers with their models
   */
  async listProviders(): Promise<Provider[]> {
    this.logger.debug('Listing providers');
    return this.modelRegistry.listProviders();
  }

  /**
   * Get models for a specific provider
   */
  async getProviderModels(providerId: string): Promise<Model[]> {
    this.logger.debug(`Getting models for provider: ${providerId}`);
    return this.modelRegistry.getProviderModels(providerId);
  }

  /**
   * Refresh models cache
   */
  async refreshModels(): Promise<void> {
    this.logger.info('Refreshing models cache');
    await this.modelRegistry.refresh();
  }

  /**
   * Connect to OpenCode ACP
   */
  async connect(sessionId: string): Promise<AcpSession> {
    return this.client.connect(sessionId);
  }

  /**
   * Disconnect from OpenCode
   */
  async disconnect(): Promise<void> {
    await this.client.shutdown();
  }

  /**
   * Send a prompt and get response
   */
  async sendPrompt(
    prompt: string,
    options?: {
      context?: Record<string, unknown>;
      onToolCall?: (toolCall: AcpToolCall) => Promise<unknown>;
    }
  ): Promise<AcpPromptResponse> {
    if (!this.client.isConnected()) {
      throw new OpenCodeError('Not connected to OpenCode');
    }

    this.logger.debug(`Sending prompt: ${prompt.substring(0, 100)}...`);

    const response = await this.client.sendPrompt(prompt, options?.context);

    // Handle tool calls if provided
    if (response.tool_calls && options?.onToolCall) {
      for (const toolCall of response.tool_calls) {
        try {
          const result = await options.onToolCall(toolCall);
          await this.client.sendToolResult(toolCall.id, result);
        } catch (error) {
          await this.client.sendToolResult(toolCall.id, {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return response;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client.isConnected();
  }

  /**
   * Get current session
   */
  getSession(): AcpSession | null {
    return this.client.getSession();
  }

  /**
   * Send a prompt with structured output (JSON)
   * 
   * This method wraps the prompt with instructions to return JSON,
   * parses the response, and validates it against the provided schema.
   * 
   * @param prompt The prompt to send
   * @param schema JSON Schema or Zod schema to validate the response
   * @param options Additional options for structured output
   * @returns Validated structured response
   */
  async sendPromptStructured<T>(
    prompt: string,
    schema: JsonSchema | ZodType<T>,
    options?: Partial<StructuredPromptOptions>
  ): Promise<StructuredPromptResponse<T>> {
    const retryCount = options?.retryCount ?? 2;
    const validator = getStructuredOutputValidator();

    // Convert JsonSchema to ZodSchema if needed
    const zodSchema: ZodType<T> = schema instanceof z.ZodType
      ? schema
      : validator.jsonSchemaToZod(schema) as ZodType<T>;

    // Build the enhanced prompt with JSON instructions
    const schemaDescription = schema instanceof z.ZodType
      ? JSON.stringify(schema)
      : JSON.stringify(schema);

    let enhancedPrompt = `${prompt}

IMPORTANT: You must respond with ONLY valid JSON that matches this exact schema:
\`\`\`json
${schemaDescription}
\`\`\`

Do not include any text before or after the JSON. Your entire response must be the JSON object.`;

    let lastError: StructuredOutputError | undefined;
    let rawContent = '';

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        this.logger.debug(`Structured prompt attempt ${attempt + 1}/${retryCount + 1}`);

        const response = await this.client.sendPrompt(enhancedPrompt);
        rawContent = response.content;

        // Try to extract JSON from the response
        const jsonContent = this.extractJson(response.content);

        // Validate the JSON
        const parseResult = validator.parseAndValidate(jsonContent || rawContent, zodSchema as z.ZodType<T>);

        // Handle the result explicitly
        if ((parseResult as { success: boolean }).success) {
          // Validation succeeded
          this.logger.debug('Structured output validated successfully');
          return {
            data: (parseResult as { success: true; data: T }).data,
            rawContent: jsonContent || rawContent,
            stopReason: response.content,
          };
        }

        // Validation failed - prepare retry prompt
        const validationError = (parseResult as { success: false; error: StructuredOutputError }).error;
        lastError = validationError;

        if (attempt < retryCount) {
          const validationErrors = validationError.validationErrors || [];
          const errorContext = validationErrors
            .map((e: { path?: string; message?: string }) => `- ${e.path || 'root'}: ${e.message}`)
            .join('\n');

          // Enhance prompt for retry
          enhancedPrompt = `${prompt}

The previous response was not valid. The validation errors were:
${errorContext}

Please provide a valid JSON response that matches this schema:
\`\`\`json
${schemaDescription}
\`\`\`

Respond with ONLY the JSON object.`;
          continue;
        }
      } catch (error) {
        if (error instanceof OpenCodeError) {
          throw error;
        }
        lastError = new StructuredOutputError(`Structured prompt failed: ${error}`, {
          rawContent,
          cause: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }

    // All retries exhausted
    throw lastError || new StructuredOutputError('Structured prompt failed after all retries', {
      rawContent,
    });
  }

  /**
   * Extract JSON from a response that may contain extra text
   */
  private extractJson(content: string): string | null {
    // Try to find JSON between code blocks
    const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Try to find first { and last }
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return content.slice(firstBrace, lastBrace + 1);
    }

    // Try to find first [ and last ]
    const firstBracket = content.indexOf('[');
    const lastBracket = content.lastIndexOf(']');

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      return content.slice(firstBracket, lastBracket + 1);
    }

    return null;
  }
}

// Factory function for convenience
export function createOpenCodeSDK(config?: AcpSessionConfig): OpenCodeSDK {
  return new OpenCodeSDK(config);
}
