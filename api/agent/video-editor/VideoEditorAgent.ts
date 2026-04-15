import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { Agent } from '../core/Agent.js';
import type { AgentConfig, AgentSession } from '../core/types.js';
import { buildVideoEditorSystemPrompt } from './prompts/system.js';
import type { VideoEditorSession } from './types.js';
import { createVideoEditorTools } from './tools/index.js';
import { AcpClient } from '../../core/opencode/acp-client.js';

export interface VideoEditorConfig extends AgentConfig {
  defaultSceneDuration?: number;
  brandColors?: string[];
}

export class VideoEditorAgent extends Agent {
  private sceneContext: Map<string, unknown> = new Map();
  private acpClient: AcpClient;

  constructor(config: VideoEditorConfig) {
    super(config);

    // Initialize ACP client
    this.acpClient = new AcpClient({
      apiKey: process.env.OPENCODE_API_KEY,
    });

    // Register tools
    const tools = createVideoEditorTools(this.acpClient);
    Object.entries(tools).forEach(([name, tool]) => {
      this.registerTool(name, tool);
    });
  }

  /**
   * Set scene context for better responses
   */
  setSceneContext(sessionId: string, context: unknown): void {
    this.sceneContext.set(sessionId, context);
  }

  /**
   * Build system prompt specific to video editing
   */
  protected buildSystemPrompt(session: AgentSession): string {
    return buildVideoEditorSystemPrompt(session as VideoEditorSession);
  }

  /**
   * Get AI model based on configuration
   */
  protected getModel(): import('ai').LanguageModelV1 {
    const modelName = this.config.model;

    if (modelName.startsWith('claude')) {
      return anthropic(modelName);
    }
    if (modelName.startsWith('gpt')) {
      return openai(modelName);
    }

    // Default to Claude
    return anthropic('claude-3-5-sonnet-20241022');
  }

  /**
   * Process message with video editor specific logic
   */
  async processMessage(
    session: VideoEditorSession,
    userMessage: string
  ): Promise<ReadableStream> {
    const context = this.sceneContext.get(session.sessionId);
    if (context) {
      // Context is handled at system prompt or message level
    }

    return super.processMessage(session, userMessage);
  }
}
