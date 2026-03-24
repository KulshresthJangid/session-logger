import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';

import authRoutes from './modules/auth/auth.routes';
import clientsRoutes from './modules/clients/clients.routes';
import sessionsRoutes from './modules/sessions/sessions.routes';
import reportsRoutes from './modules/reports/reports.routes';

const app = express();

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/reports', reportsRoutes);

// Serve the compiled React frontend in production.
// The frontend build is output to frontend/dist and referenced relative to
// this compiled file at backend/dist/app.js → ../../frontend/dist.
if (env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use('/session-logger', express.static(frontendDist));
  // SPA fallback — any /session-logger/* path that isn't a static file
  // gets index.html so React Router handles it client-side.
  app.get('/session-logger/*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler — must be last
app.use(errorHandler);

export default app;
