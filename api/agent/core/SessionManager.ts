import type { AgentSession, SessionMetadata } from './types.js';
import { sessionRepository } from '../../db/repositories/session.repository.js';

export class SessionManager {
  async createSession(metadata: SessionMetadata & { sceneId: string; videoId: string; projectId: string }): Promise<AgentSession> {
    return sessionRepository.create({
      messages: [],
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      sceneId: metadata.sceneId,
      videoId: metadata.videoId,
      projectId: metadata.projectId,
    });
  }

  async getSession(sessionId: string): Promise<AgentSession | null> {
    return sessionRepository.get(sessionId);
  }

  async getSessionsByScene(sceneId: string): Promise<AgentSession[]> {
    return sessionRepository.getByScene(sceneId);
  }

  async getSessionsByVideo(videoId: string): Promise<AgentSession[]> {
    return sessionRepository.getByVideo(videoId);
  }

  async getOrCreateSession(metadata: SessionMetadata & { sceneId: string; videoId: string; projectId: string }): Promise<AgentSession> {
    // Use atomic upsert to avoid race conditions on concurrent requests
    return sessionRepository.upsertActiveSession(
      metadata.sceneId,
      metadata.videoId,
      metadata.projectId,
      (metadata.sceneType as string) || 'hook',
      metadata,
    );
  }

  async addMessage(
    sessionId: string,
    message: { role: 'user' | 'assistant'; content: string }
  ): Promise<AgentSession> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    session.messages.push(message);
    session.updatedAt = new Date();

    return sessionRepository.update(sessionId, session);
  }

  async archive(sessionId: string): Promise<void> {
    sessionRepository.archive(sessionId);
  }
}
