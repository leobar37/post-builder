// Instagram Post Builder API Server
// Express server that handles post export via Browserless

import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';
import exportRoutes from './routes/export.routes';
import videoRoutes from './routes/videos';

const app = express();
const PORT = parseInt(process.env.PORT || '3458', 10);
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/export', exportRoutes);
app.use('/api/videos', videoRoutes);

// Error handler - must have 4 params for Express to recognize it as error middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Instagram Post Builder API running on ${HOST}:${PORT}`);
  console.log(`📍 Export endpoint: http://localhost:${PORT}/export`);
  console.log(`💊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Tailscale access: http://100.123.96.35:${PORT}`);
});
