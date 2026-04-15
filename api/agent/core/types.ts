import type { CoreMessage, Tool, UserContent } from 'ai';

export interface AgentConfig {
  model: string;
  apiKey: string;
  temperature?: number;
  maxSteps?: number;
}

export interface AgentSession {
  sessionId: string;
  messages: CoreMessage[];
  metadata: SessionMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionMetadata {
  [key: string]: unknown;
  sceneId?: string;
  videoId?: string;
  projectId?: string;
  sceneType?: 'hook' | 'stats' | 'cta' | 'transition';
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: unknown) => Promise<unknown>;
}

export interface AgentContext {
  session: AgentSession;
  tools: Map<string, Tool>;
}

// Re-export types from AI SDK
export type { UserContent };

export interface ImagePart {
  type: 'image';
  image: string | Uint8Array;
  mimeType?: string;
}

export interface TextPart {
  type: 'text';
  text: string;
}
