import { AgentFactory } from '../AgentFactory.js';
import type { AgentFactoryConfig } from '../AgentFactory.js';
import { BaseSceneAgent } from './BaseSceneAgent.js';
import { buildTransitionPrompt } from './prompts/transition.js';
import type { AgentSession } from '../core/types.js';

export class TransitionAgent extends BaseSceneAgent {
  constructor(config: AgentFactoryConfig) {
    super(config, 'transition');
  }

  protected buildScenePrompt(session: AgentSession): string {
    return buildTransitionPrompt(session);
  }
}

AgentFactory.register('transition', TransitionAgent);
