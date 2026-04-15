import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import {
  ClientSideConnection,
  ndJsonStream,
  PROTOCOL_VERSION,
  type Client,
  type RequestPermissionRequest,
  type RequestPermissionResponse,
} from '@agentclientprotocol/sdk';
import { getLogger } from '../logger.js';
import { OpenCodeError } from '../errors.js';
import type {
  AcpPromptResponse,
  AcpSessionConfig,
  AcpSession,
  AcpToolCall,
} from './types.js';

/**
 * ACP Client using @agentclientprotocol/sdk
 * 
 * Handles communication with OpenCode ACP server using the official SDK
 */
// Track active sessions for cleanup
const activeSessions = new Map<string, AcpClient>();
const acpServerSessionIds = new Map<string, string>(); // Maps user sessionId → ACP server sessionId

export class AcpClient extends EventEmitter {
  private logger = getLogger().child('AcpClient');
  private connection: ClientSideConnection | null = null;
  private session: AcpSession | null = null;
  private process: ReturnType<typeof spawn> | null = null;
  private cwd: string;
  private sessionId: string | null = null;

  constructor(private config: AcpSessionConfig = {}) {
    super();
    this.cwd = config.cwd || process.cwd();
  }

  /**
   * Get an active session by ID
   */
  static getSession(sessionId: string): AcpClient | undefined {
    return activeSessions.get(sessionId);
  }

  /**
   * Shutdown a session by ID
   */
  static async shutdownSession(sessionId: string): Promise<void> {
    const client = activeSessions.get(sessionId);
    if (client) {
      await client.shutdown();
      activeSessions.delete(sessionId);
    }
  }

  /**
   * Start ACP session by spawning OpenCode process
   */
  async connect(sessionId: string): Promise<AcpSession> {
    try {
      this.logger.info(`Starting ACP session: ${sessionId}`);

      const env: Record<string, string> = {
        ...process.env as Record<string, string>,
        ...this.config.env,
      };

      if (this.config.apiKey) {
        env.OPENCODE_API_KEY = this.config.apiKey;
      }

      this.process = spawn('opencode', ['acp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
        cwd: this.cwd,
      });

      this.session = {
        id: sessionId,
        status: 'connecting',
        pid: this.process.pid,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      // Create Web Streams from stdio
      const stdinStream = this.process.stdin as NodeJS.WritableStream;
      const stdoutStream = this.process.stdout as NodeJS.ReadableStream;

      // Convert Node streams to Web Streams
      const writableWebStream = this.nodeWritableToWeb(stdinStream);
      const readableWebStream = this.nodeReadableToWeb(stdoutStream);

      // Create ACP stream
      const stream = ndJsonStream(writableWebStream, readableWebStream);

      // Create client implementation
      const client: Client = {
        sessionUpdate: async (params) => {
          this.session!.lastActivity = new Date();
          this.emit('sessionUpdate', params);
        },
        requestPermission: async (params: RequestPermissionRequest): Promise<RequestPermissionResponse> => {
          this.logger.debug(`Permission requested: ${params.options[0]?.name || 'unknown tool'}`);
          // Auto-grant permission for now - return first option (usually "Allow")
          const firstOption = params.options[0];
          if (firstOption) {
            return {
              outcome: 'selected' as const,
              optionId: firstOption.optionId,
            } as unknown as RequestPermissionResponse;
          }
          return { outcome: 'cancelled' } as unknown as RequestPermissionResponse;
        },
      };

      // Create connection using SDK with factory function
      this.connection = new ClientSideConnection((_agent) => client, stream);

      // Setup error handling
      this.process.on('error', (error) => {
        this.logger.error('ACP process error', error);
        if (this.session) {
          this.session.status = 'error';
        }
        this.emit('error', error);
      });

      this.process.on('close', (code) => {
        this.logger.info(`ACP process closed with code: ${code}`);
        if (this.session) {
          this.session.status = 'disconnected';
        }
        this.emit('disconnected', { code });
      });

      // Initialize connection
      const initResult = await this.connection.initialize({
        protocolVersion: PROTOCOL_VERSION,
        clientInfo: {
          name: 'video-pipeline-agent',
          version: '1.0.0',
        },
        clientCapabilities: {},
      });

      this.logger.debug(`ACP initialized with protocol version: ${initResult.protocolVersion}`);

      // Create new session
      const sessionResult = await this.connection.newSession({
        cwd: this.cwd,
        mcpServers: [],
      });

      this.session.id = sessionResult.sessionId;
      this.session.status = 'connected';
      this.sessionId = sessionId;

      // Track this session for cleanup using server-assigned session ID
      activeSessions.set(sessionResult.sessionId, this);
      acpServerSessionIds.set(sessionId, sessionResult.sessionId);

      this.emit('connected', this.session);

      return this.session;
    } catch (error) {
      throw new OpenCodeError(`Failed to connect ACP session: ${error}`, {
        sessionId,
        cause: error,
      });
    }
  }

  /**
   * Convert Node.js WritableStream to Web WritableStream
   */
  private nodeWritableToWeb(stream: NodeJS.WritableStream): WritableStream<Uint8Array> {
    return new WritableStream({
      write(chunk) {
        return new Promise<void>((resolve, reject) => {
          stream.write(chunk, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      },
      close() {
        stream.end();
        return Promise.resolve();
      },
    });
  }

  /**
   * Convert Node.js ReadableStream to Web ReadableStream
   */
  private nodeReadableToWeb(stream: NodeJS.ReadableStream): ReadableStream<Uint8Array> {
    const reader = stream as NodeJS.ReadableStream & { on(event: string, cb: (data: Buffer) => void): void };
    return new ReadableStream<Uint8Array>({
      start(controller) {
        reader.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        reader.on('end', () => {
          controller.close();
        });
        reader.on('error', (err) => {
          controller.error(err);
        });
      },
    });
  }

  /**
   * Send a prompt to the agent
   */
  async sendPrompt(prompt: string, _context?: Record<string, unknown>): Promise<AcpPromptResponse> {
    if (!this.connection || !this.session || this.session.status !== 'connected') {
      throw new OpenCodeError('ACP session not connected', { sessionId: this.session?.id });
    }

    this.session.lastActivity = new Date();

    try {
      const response = await this.connection.prompt({
        sessionId: this.session.id,
        prompt: [
          {
            type: 'text',
            text: prompt,
          },
        ],
      });

      this.logger.debug(`Prompt completed with stop reason: ${response.stopReason}`);

      // Return a simplified response
      return {
        role: 'assistant',
        content: `Stopped: ${response.stopReason}`,
        tool_calls: [],
      };
    } catch (error) {
      this.logger.error('Prompt failed', error);
      throw new OpenCodeError(`Prompt failed: ${error}`, {
        sessionId: this.session?.id,
        cause: error,
      });
    }
  }

  /**
   * Send a tool result back to the agent
   */
  async sendToolResult(toolCallId: string, result: unknown): Promise<void> {
    if (!this.connection || !this.session) {
      throw new OpenCodeError('ACP session not connected', { sessionId: this.session?.id });
    }

    // SDK handles tool results through session updates
    this.logger.debug(`Tool result for ${toolCallId}: ${JSON.stringify(result)}`);
  }

  /**
   * Shutdown the ACP session
   */
  async shutdown(): Promise<void> {
    if (!this.process) return;

    try {
      if (this.connection && this.session) {
        await this.connection.unstable_closeSession?.({
          sessionId: this.session.id,
        });
      }
    } catch (error) {
      this.logger.warn(`Shutdown request failed: ${error}`);
    }

    this.process.kill();
    this.process = null;
    this.connection = null;
    this.session = null;

    // Remove from active sessions tracking using both maps
    if (this.sessionId) {
      const acpServerId = acpServerSessionIds.get(this.sessionId);
      if (acpServerId) activeSessions.delete(acpServerId);
      acpServerSessionIds.delete(this.sessionId);
      this.sessionId = null;
    }
  }

  /**
   * Get all active ACP sessions for cleanup
   */
  static getAllSessions(): AcpClient[] {
    return Array.from(activeSessions.values());
  }

  /**
   * Get current session
   */
  getSession(): AcpSession | null {
    return this.session;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.session?.status === 'connected' && this.connection !== null;
  }
}
