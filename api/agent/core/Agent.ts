import { streamText, type CoreMessage, type Tool, type UserContent } from 'ai';
import type { AgentConfig, AgentSession } from './types.js';

export abstract class Agent {
  protected config: AgentConfig;
  protected tools: Map<string, Tool> = new Map();

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Register a tool for this agent
   */
  registerTool(name: string, tool: Tool): void {
    this.tools.set(name, tool);
  }

  /**
   * Build system prompt for the agent
   * Override in subclasses
   */
  protected abstract buildSystemPrompt(session: AgentSession): string;

  /**
   * Process a user message and return a stream
   * Supports multimodal content: string, text parts, image parts
   */
  async processMessage(
    session: AgentSession,
    content: UserContent
  ): Promise<ReadableStream> {
    // Build user message with multimodal support
    const userMessage: CoreMessage = {
      role: 'user',
      content,
    };

    const messages: CoreMessage[] = [
      { role: 'system', content: this.buildSystemPrompt(session) },
      ...session.messages,
      userMessage,
    ];

    const result = await streamText({
      model: this.getModel(),
      messages,
      tools: Object.fromEntries(this.tools),
      maxSteps: this.config.maxSteps || 5,
      temperature: this.config.temperature || 0.7,
    });

    return result.toDataStream();
  }

  /**
   * Get AI model instance
   */
  protected abstract getModel(): import('ai').LanguageModelV1;

  /**
   * Get registered tools as record
   */
  protected getToolsRecord(): Record<string, Tool> {
    return Object.fromEntries(this.tools);
  }
}
