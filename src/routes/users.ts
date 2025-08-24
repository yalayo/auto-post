import { Hono } from 'hono';
import { createStorage } from '../storage';
import { createD1Database } from '../db';

type Bindings = {
  DB: D1Database;
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Get user by ID
app.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const db = createD1Database(c.env.DB);
    const storage = createStorage(db);

    const user = await storage.getUser(userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json(user);
  } catch (error) {
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// Get user stats
app.get('/:userId/stats', async (c) => {
  try {
    const userId = c.req.param('userId');
    const db = createD1Database(c.env.DB);
    const storage = createStorage(db);

    const stats = await storage.getUserStats(userId);
    return c.json(stats);
  } catch (error) {
    return c.json({ error: 'Failed to fetch user stats' }, 500);
  }
});

// Get user's LinkedIn accounts
app.get('/:userId/linkedin-accounts', async (c) => {
  try {
    const userId = c.req.param('userId');
    const db = createD1Database(c.env.DB);
    const storage = createStorage(db);

    const accounts = await storage.getLinkedinAccounts(userId);
    return c.json(accounts);
  } catch (error) {
    return c.json({ error: 'Failed to fetch LinkedIn accounts' }, 500);
  }
});

// Get user's posts
app.get('/:userId/posts', async (c) => {
  try {
    const userId = c.req.param('userId');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit') as string) : undefined;
    const db = createD1Database(c.env.DB);
    const storage = createStorage(db);

    const posts = await storage.getPosts(userId, limit);
    return c.json(posts);
  } catch (error) {
    return c.json({ error: 'Failed to fetch posts' }, 500);
  }
});

export { app as usersRoutes };