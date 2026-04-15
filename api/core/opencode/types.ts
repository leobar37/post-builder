/**
 * ACP (Agent Client Protocol) types
 * Based on ACP specification for JSON-RPC communication
 */

import { AppError } from '../errors.js';

// ============================================================================
// JSON-RPC Base Types
// ============================================================================

export interface JsonRpcRequest<T = unknown> {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: T;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number | string;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// ============================================================================
// ACP Types
// ============================================================================

export interface AcpCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
}

export interface AcpInitializeRequest {
  name: string;
  version: string;
}

export interface AcpInitializeResponse {
  protocol_version: string;
  capabilities: AcpCapabilities;
}

export interface AcpMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: AcpToolCall[];
  tool_results?: AcpToolResult[];
}

export interface AcpToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AcpToolResult {
  id: string;
  result?: unknown;
  error?: string;
}

export interface AcpPromptRequest {
  prompt: string;
  context?: Record<string, unknown>;
}

export interface AcpPromptResponse {
  role: 'assistant';
  content: string;
  tool_calls?: AcpToolCall[];
}

// ============================================================================
// Tool Types
// ============================================================================

export interface AcpTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface AcpResource {
  uri: string;
  name: string;
  mimeType?: string;
}

export interface AcpPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

// ============================================================================
// Event Types
// ============================================================================

export type AcpEventType = 
  | 'text'
  | 'tool_call'
  | 'tool_result'
  | 'reasoning'
  | 'error'
  | 'done';

export interface AcpEvent {
  type: AcpEventType;
  data: unknown;
  sessionId: string;
}

// ============================================================================
// Session Types
// ============================================================================

export interface AcpSessionConfig {
  apiKey?: string;
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
}

export type AcpSessionStatus = 
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface AcpSession {
  id: string;
  status: AcpSessionStatus;
  pid?: number;
  createdAt: Date;
  lastActivity: Date;
}

// ============================================================================
// Model Registry Types
// ============================================================================

/**
 * Model information from OpenCode CLI
 */
export interface Model {
  id: string;
  provider: string;
  fullId: string; // provider/model
}

/**
 * Provider with its available models
 */
export interface Provider {
  id: string;
  models: Model[];
}

/**
 * Extended session config with model selection
 */
export interface AcpSessionConfigExtended extends AcpSessionConfig {
  provider?: string;
  model?: string;
}

// ============================================================================
// Structured Output Types
// ============================================================================

/**
 * JSON Schema definition for structured output
 */
export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  const?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  description?: string;
  title?: string;
  default?: unknown;
  examples?: unknown[];
  additionalProperties?: boolean | JsonSchema;
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
}

/**
 * JSON Schema property definition
 */
export interface JsonSchemaProperty {
  type?: string;
  description?: string;
  title?: string;
  default?: unknown;
  examples?: unknown[];
  enum?: unknown[];
  const?: unknown;
  format?: string;
  items?: JsonSchema;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  additionalProperties?: boolean | JsonSchema;
}

/**
 * Output format for prompts
 */
export type OutputFormat = 'text' | 'json_schema';

/**
 * Request options for structured prompts
 */
export interface StructuredPromptOptions {
  schema: JsonSchema;
  outputFormat?: OutputFormat;
  retryCount?: number;
  systemPrompt?: string;
}

/**
 * Request for a structured prompt
 */
export interface StructuredPromptRequest {
  prompt: string;
  schema: JsonSchema;
  options?: Partial<StructuredPromptOptions>;
}

/**
 * Response wrapper for structured prompts
 */
export interface StructuredPromptResponse<T> {
  data: T;
  rawContent: string;
  stopReason?: string;
}

/**
 * Error thrown when structured output validation fails
 */
export class StructuredOutputError extends AppError {
  public readonly rawContent: string;
  public readonly parseError?: Error;
  public readonly validationErrors?: unknown[];

  constructor(
    message: string,
    options: {
      rawContent?: string;
      parseError?: Error;
      validationErrors?: unknown[];
      context?: Record<string, unknown>;
      cause?: unknown;
    } = {}
  ) {
    super(message, 'STRUCTURED_OUTPUT_ERROR', {
      context: {
        ...options.context,
        hasRawContent: !!options.rawContent,
        parseErrorMessage: options.parseError?.message,
        validationErrorCount: options.validationErrors?.length,
      },
      cause: options.cause,
    });
    this.rawContent = options.rawContent || '';
    this.parseError = options.parseError;
    this.validationErrors = options.validationErrors;
  }
}
