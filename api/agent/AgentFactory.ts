import type { AgentConfig } from './core/types.js';
import { Agent } from './core/Agent.js';

export type AgentType = 'hook' | 'stats' | 'cta' | 'transition';

export interface AgentFactoryConfig extends AgentConfig {
  defaultSceneDuration?: number;
  brandColors?: string[];
}

type AgentConstructor = new (config: AgentFactoryConfig) => Agent;

class AgentFactoryImpl {
  private registry: Map<AgentType, AgentConstructor> = new Map();

  register(sceneType: AgentType, constructor: AgentConstructor): void {
    this.registry.set(sceneType, constructor);
  }

  createAgent(sceneType: AgentType, config: AgentFactoryConfig): Agent {
    const Constructor = this.registry.get(sceneType);
    if (!Constructor) {
      const available = Array.from(this.registry.keys()).join(', ');
      throw new Error(`Unknown sceneType "${sceneType}". Available: ${available}`);
    }
    return new Constructor(config);
  }

  /**
   * Create a new agent instance.
   * Agents are NOT cached since they hold per-session state (tools, session context).
   * Caching would cause config mismatches under concurrent requests with different configs.
   */
  getAgent(sceneType: AgentType, config: AgentFactoryConfig): Agent {
    return this.createAgent(sceneType, config);
  }

  getAvailableAgents(): AgentType[] {
    return Array.from(this.registry.keys());
  }

  hasAgent(sceneType: AgentType): boolean {
    return this.registry.has(sceneType);
  }
}

export const AgentFactory = new AgentFactoryImpl();
