import { AgentFactory } from '../AgentFactory.js';
import type { AgentFactoryConfig } from '../AgentFactory.js';
import { BaseSceneAgent } from './BaseSceneAgent.js';
import { buildHookPrompt } from './prompts/hook.js';
import type { AgentSession } from '../core/types.js';

export class HookAgent extends BaseSceneAgent {
  constructor(config: AgentFactoryConfig) {
    super(config, 'hook');
  }

  protected buildScenePrompt(session: AgentSession): string {
    return buildHookPrompt(session);
  }
}

// Register with factory
AgentFactory.register('hook', HookAgent);
