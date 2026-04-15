import { AgentFactory } from '../AgentFactory.js';
import type { AgentFactoryConfig } from '../AgentFactory.js';
import { BaseSceneAgent } from './BaseSceneAgent.js';
import { buildCTAPrompt } from './prompts/cta.js';
import type { AgentSession } from '../core/types.js';

export class CTAAgent extends BaseSceneAgent {
  constructor(config: AgentFactoryConfig) {
    super(config, 'cta');
  }

  protected buildScenePrompt(session: AgentSession): string {
    return buildCTAPrompt(session);
  }
}

AgentFactory.register('cta', CTAAgent);
