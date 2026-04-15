import { AgentFactory } from '../AgentFactory.js';
import type { AgentFactoryConfig } from '../AgentFactory.js';
import { BaseSceneAgent } from './BaseSceneAgent.js';
import { buildStatsPrompt } from './prompts/stats.js';
import type { AgentSession } from '../core/types.js';

export class StatsAgent extends BaseSceneAgent {
  constructor(config: AgentFactoryConfig) {
    super(config, 'stats');
  }

  protected buildScenePrompt(session: AgentSession): string {
    return buildStatsPrompt(session);
  }
}

AgentFactory.register('stats', StatsAgent);
