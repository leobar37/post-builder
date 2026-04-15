// Instagram Post Builder API Server
// Express server with Projects → Videos → Scenes architecture

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import projectsRoutes from "./routes/projects.js";
import videosRoutes from "./routes/videos.js";
import scenesRoutes from "./routes/scenes.js";
import eventsRoutes from "./routes/events.js";
import exportRoutes from "./routes/export.routes.js";
import modelsRoutes from "./routes/models.js";
import agentCallbacksRoutes from "./routes/agent-callbacks.js";
import agentRoutes from "./routes/agent.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3458", 10);
const HOST = "0.0.0.0";

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/projects", projectsRoutes);
app.use("/api/videos", videosRoutes);
app.use("/api/scenes", scenesRoutes);
app.use("/events", eventsRoutes);
app.use("/export", exportRoutes);
app.use("/api/models", modelsRoutes);
app.use("/api/agent/callbacks", agentCallbacksRoutes);

// Hono Agent Routes - adapt Hono fetch to Express
app.use("/api/agent", async (req, res, next) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const rawBody = req.method !== "GET" && req.method !== "HEAD"
      ? await getRawBody(req)
      : undefined;

    const honoRequest = new Request(url.toString(), {
      method: req.method,
      headers: new Headers(
        Object.entries(req.headers).map(([k, v]): [string, string] => [k, String(v)]),
      ),
      body: rawBody ? new Uint8Array(rawBody) : undefined,
    });

    const response = await agentRoutes.fetch(honoRequest, {
      req,
      res,
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = await response.text();
    res.send(body);
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("API Error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  },
);

app.listen(PORT, HOST, () => {
  console.log(`🚀 API running on ${HOST}:${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
});

export * from "./core/index.js";

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Get raw body buffer from Express request preserving content type.
 * Needed because Hono expects a ReadableStream body, not pre-parsed JSON.
 */
async function getRawBody(req: express.Request): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────

import { closeDatabase } from "./db/client.js";
import { AcpClient } from "./core/opencode/acp-client.js";

async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Kill all active ACP sessions
  const activeSessions = AcpClient.getAllSessions();
  await Promise.all(
    activeSessions.map((client) =>
      client.shutdown().catch((err) =>
        console.warn("Failed to shutdown ACP session:", err),
      ),
    ),
  );

  // Close database
  closeDatabase();

  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
