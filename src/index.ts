import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createD1Database } from './db';
import { createStorage } from './storage';
import { authRoutes } from './routes/auth';
import { postsRoutes } from './routes/posts';
import { usersRoutes } from './routes/users';
import { linkedinRoutes } from './routes/linkedin';

import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors());

// Initialize database and storage middleware
app.use('*', async (c, next) => {
  const db = createD1Database(c.env.DB);
  const storage = createStorage(db);
  c.set('db', db);
  c.set('storage', storage);
  await next();
});

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/posts', postsRoutes);
app.route('/api/user', usersRoutes);
app.route('/api/linkedin', linkedinRoutes);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Handle preflight requests
app.options('*', (c) => {
  return new Response(null, { status: 204 });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Worker error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;