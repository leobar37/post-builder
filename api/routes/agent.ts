import { Hono } from "hono";
import { stream } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { AgentFactory, type AgentType } from "../agent/AgentFactory.js";
import { SessionManager } from "../agent/core/SessionManager.js";
import { isVideoEditorSession } from "../agent/video-editor/types.js";
import type { Agent } from "../agent/core/Agent.js";

const app = new Hono();
const sessionManager = new SessionManager();

// Validation schemas
const createSessionSchema = z.object({
  sceneId: z.string(),
  videoId: z.string(),
  projectId: z.string(),
  sceneType: z.enum(["hook", "stats", "cta", "transition"]).optional(),
});

const chatSchema = z.object({
  sessionId: z.string(),
  message: z.string(),
});

// POST /api/agent/sessions - Create new session (or get existing)
app.post("/sessions", zValidator("json", createSessionSchema), async (c) => {
  const data = c.req.valid("json");

  // Use getOrCreateSession to reuse existing session for this scene
  const session = await sessionManager.getOrCreateSession({
    sceneId: data.sceneId,
    videoId: data.videoId,
    projectId: data.projectId,
    sceneType: data.sceneType || "hook",
  });

  return c.json(
    {
      success: true,
      sessionId: session.sessionId,
      status: "created",
    },
    201,
  );
});

// GET /api/agent/sessions/:id - Get session
app.get("/sessions/:id", async (c) => {
  const sessionId = c.req.param("id");
  const session = await sessionManager.getSession(sessionId);

  if (!session) {
    return c.json({ success: false, error: "Session not found" }, 404);
  }

  return c.json({
    success: true,
    session: {
      id: session.sessionId,
      messages: session.messages,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
  });
});

// GET /api/agent/sessions?sceneId=:id - Get sessions by scene
// GET /api/agent/sessions?videoId=:id - Get all sessions for a video
app.get("/sessions", async (c) => {
  const sceneId = c.req.query("sceneId");
  const videoId = c.req.query("videoId");

  if (sceneId) {
    const sessions = await sessionManager.getSessionsByScene(sceneId);
    return c.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.sessionId,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
      })),
    });
  }

  if (videoId) {
    const sessions = await sessionManager.getSessionsByVideo(videoId);
    return c.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.sessionId,
        sceneId: s.metadata?.sceneId,
        sceneType: s.metadata?.sceneType,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
      })),
    });
  }

  return c.json(
    { success: false, error: "sceneId or videoId query param required" },
    400,
  );
});

// POST /api/agent/chat - Main chat endpoint with streaming
app.post("/chat", zValidator("json", chatSchema), async (c) => {
  const { sessionId, message } = c.req.valid("json");

  // Get session
  const agentSession = await sessionManager.getSession(sessionId);
  if (!agentSession) {
    return c.json({ success: false, error: "Session not found" }, 404);
  }

  // Validate session type
  if (!isVideoEditorSession(agentSession)) {
    return c.json(
      { success: false, error: "Invalid session: missing required metadata" },
      400,
    );
  }

  // Get scene type and create the appropriate agent
  const sceneType = (agentSession.metadata?.sceneType as AgentType) || "hook";

  // Create agent using factory (singleton per scene type)
  let agent: Agent;
  try {
    agent = AgentFactory.getAgent(sceneType, {
      model: process.env.AGENT_MODEL || "claude-3-5-sonnet-20241022",
      apiKey: process.env.ANTHROPIC_API_KEY || "",
      temperature: 0.7,
      maxSteps: 5,
    });
  } catch (error) {
    // Fallback to hook agent if unknown scene type
    console.warn(
      `Unknown sceneType "${sceneType}", falling back to hook agent:`,
      error,
    );
    agent = AgentFactory.getAgent("hook", {
      model: process.env.AGENT_MODEL || "claude-3-5-sonnet-20241022",
      apiKey: process.env.ANTHROPIC_API_KEY || "",
      temperature: 0.7,
      maxSteps: 5,
    });
  }

  // Save user message
  await sessionManager.addMessage(sessionId, {
    role: "user",
    content: message,
  });

  // Return streaming response
  return stream(c, async (stream) => {
    const responseStream = await agent.processMessage(agentSession, message);
    const reader = responseStream.getReader();

    let assistantMessage = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // value is a Uint8Array
        const chunk = new TextDecoder().decode(value);
        assistantMessage += chunk;

        // Write to SSE stream
        await stream.write(chunk);
      }
    } finally {
      reader.releaseLock();

      // Save assistant message
      await sessionManager.addMessage(sessionId, {
        role: "assistant",
        content: assistantMessage,
      });
    }
  });
});

// DELETE /api/agent/sessions/:id - Archive session
app.delete("/sessions/:id", async (c) => {
  const sessionId = c.req.param("id");
  await sessionManager.archive(sessionId);
  return c.json({ success: true });
});

export default app;
