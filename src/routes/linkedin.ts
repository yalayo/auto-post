import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createStorage } from '../storage';
import { createD1Database } from '../db';
import { LinkedInService, linkedInService } from '../../server/services/linkedin';

type Bindings = {
  DB: D1Database;
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const linkedinCallbackSchema = z.object({
  code: z.string(),
  userId: z.string(),
});

// Initiate LinkedIn OAuth
app.post('/auth', async (c) => {
  try {
    const state = Math.random().toString(36).substring(2, 15);
    const authUrl = LinkedInService.getAuthURL(state);
    
    return c.json({ authUrl, state });
  } catch (error) {
    return c.json({ error: 'Failed to initiate LinkedIn OAuth' }, 500);
  }
});

// LinkedIn OAuth callback
app.post('/auth/callback', zValidator('json', linkedinCallbackSchema), async (c) => {
  try {
    const { code, userId } = c.req.valid('json');
    const db = createD1Database(c.env.DB);
    const storage = createStorage(db);

    // Exchange code for access token
    const tokenData = await LinkedInService.exchangeCodeForToken(code);
    
    // Get LinkedIn profile
    const profile = await linkedInService.getProfile(tokenData.accessToken);
    const email = await linkedInService.getEmailAddress(tokenData.accessToken);
    
    // Create or update LinkedIn account
    const linkedinAccount = await storage.createLinkedinAccount({
      userId,
      linkedinId: profile.id,
      name: `${profile.firstName} ${profile.lastName}`,
      type: 'personal',
      accessToken: tokenData.accessToken,
      tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
      profilePicture: profile.profilePicture,
      followers: 0,
    });

    return c.json({ linkedinAccount });
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    return c.json({ error: 'Failed to connect LinkedIn account' }, 500);
  }
});

export { app as linkedinRoutes };