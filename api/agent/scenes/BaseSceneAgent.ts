import type { AgentSession } from '../core/types.js';
import { Agent } from '../core/Agent.js';
import type { AgentFactoryConfig } from '../AgentFactory.js';
import { AcpClient } from '../../core/opencode/acp-client.js';
import { createSceneTools } from './tools/index.js';

export abstract class BaseSceneAgent extends Agent {
  protected sceneType: string;

  constructor(config: AgentFactoryConfig, sceneType: string) {
    super(config);
    this.sceneType = sceneType;

    // Initialize ACP client and register shared tools
    const acpClient = new AcpClient({ apiKey: process.env.OPENCODE_API_KEY });
    const tools = createSceneTools(acpClient);
    Object.entries(tools).forEach(([name, tool]) => {
      this.registerTool(name, tool);
    });
  }

  protected abstract buildScenePrompt(session: AgentSession): string;

  protected buildSystemPrompt(session: AgentSession): string {
    return this.buildScenePrompt(session);
  }

  protected getModel(): import('ai').LanguageModelV1 {
    const modelName = this.config.model;
    if (modelName.startsWith('claude')) {
      const { anthropic } = require('@ai-sdk/anthropic');
      return anthropic(modelName);
    }
    if (modelName.startsWith('gpt')) {
      const { openai } = require('@ai-sdk/openai');
      return openai(modelName);
    }
    const { anthropic } = require('@ai-sdk/anthropic');
    return anthropic('claude-3-5-sonnet-20241022');
  }
}
