import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLinkedInPost, enhancePost } from "./services/gemini";
import { linkedInService, LinkedInService } from "./services/linkedin";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";

// Validation schemas
const generatePostSchema = z.object({
  prompt: z.string().min(1),
  tone: z.enum(['professional', 'casual', 'inspirational', 'educational']),
  length: z.enum(['short', 'medium', 'long']),
  hashtags: z.string().optional(),
});

const createPostSchema = insertPostSchema.extend({
  scheduledAt: z.string().optional().transform(str => str ? new Date(str) : undefined),
});

const publishPostSchema = z.object({
  postId: z.string(),
  linkedinAccountId: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/linkedin', async (req, res) => {
    try {
      const state = Math.random().toString(36).substring(2, 15);
      const authUrl = LinkedInService.getAuthURL(state);
      
      // In a real app, store state in session for security
      res.json({ authUrl, state });
    } catch (error) {
      res.status(500).json({ error: 'Failed to initiate LinkedIn OAuth' });
    }
  });

  app.post('/api/auth/linkedin/callback', async (req, res) => {
    try {
      const { code, userId } = req.body;
      
      if (!code || !userId) {
        return res.status(400).json({ error: 'Missing code or userId' });
      }

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
        followers: 0, // Would need separate API call to get actual follower count
      });

      res.json({ linkedinAccount });
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      res.status(500).json({ error: 'Failed to connect LinkedIn account' });
    }
  });

  // User routes
  app.get('/api/user/:userId', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.get('/api/user/:userId/stats', async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.params.userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user stats' });
    }
  });

  // LinkedIn accounts routes
  app.get('/api/user/:userId/linkedin-accounts', async (req, res) => {
    try {
      const accounts = await storage.getLinkedinAccounts(req.params.userId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch LinkedIn accounts' });
    }
  });

  // AI-powered post generation
  app.post('/api/posts/generate', async (req, res) => {
    try {
      const validatedData = generatePostSchema.parse(req.body);
      const generatedPost = await generateLinkedInPost(validatedData);
      res.json(generatedPost);
    } catch (error) {
      console.error('Post generation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to generate post' });
    }
  });

  // Posts routes
  app.get('/api/user/:userId/posts', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const posts = await storage.getPosts(req.params.userId, limit);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  app.post('/api/posts', async (req, res) => {
    try {
      const validatedData = createPostSchema.parse(req.body);
      const post = await storage.createPost({
        ...validatedData,
        status: validatedData.scheduledAt ? 'scheduled' : 'draft',
      });
      res.json(post);
    } catch (error) {
      console.error('Create post error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid post data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  app.post('/api/posts/publish', async (req, res) => {
    try {
      const { postId, linkedinAccountId } = publishPostSchema.parse(req.body);
      
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const linkedinAccount = await storage.getLinkedinAccount(linkedinAccountId);
      if (!linkedinAccount) {
        return res.status(404).json({ error: 'LinkedIn account not found' });
      }

      // Check if token needs refresh
      const now = new Date();
      if (linkedinAccount.tokenExpiresAt && linkedinAccount.tokenExpiresAt < now) {
        if (linkedinAccount.refreshToken) {
          const tokenData = await linkedInService.refreshAccessToken(linkedinAccount.refreshToken);
          await storage.updateLinkedinAccount(linkedinAccountId, {
            accessToken: tokenData.accessToken,
            tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
          });
          linkedinAccount.accessToken = tokenData.accessToken;
        } else {
          return res.status(401).json({ error: 'LinkedIn token expired and no refresh token available' });
        }
      }

      // Publish to LinkedIn
      const personUrn = `urn:li:person:${linkedinAccount.linkedinId}`;
      const linkedinPostId = await linkedInService.publishPost(
        linkedinAccount.accessToken,
        post.content,
        personUrn
      );

      // Update post status
      const updatedPost = await storage.updatePost(postId, {
        status: 'published',
        linkedinPostId,
        publishedAt: new Date(),
      });

      res.json(updatedPost);
    } catch (error) {
      console.error('Publish post error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to publish post' });
    }
  });

  app.put('/api/posts/:postId', async (req, res) => {
    try {
      const { postId } = req.params;
      const updates = req.body;
      
      const updatedPost = await storage.updatePost(postId, updates);
      res.json(updatedPost);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update post' });
    }
  });

  // Scheduled posts processing (would typically be called by a cron job)
  app.post('/api/posts/process-scheduled', async (req, res) => {
    try {
      const scheduledPosts = await storage.getScheduledPosts();
      const now = new Date();
      
      for (const post of scheduledPosts) {
        if (post.scheduledAt && post.scheduledAt <= now) {
          try {
            const linkedinAccount = await storage.getLinkedinAccount(post.linkedinAccountId);
            if (linkedinAccount) {
              const personUrn = `urn:li:person:${linkedinAccount.linkedinId}`;
              const linkedinPostId = await linkedInService.publishPost(
                linkedinAccount.accessToken,
                post.content,
                personUrn
              );

              await storage.updatePost(post.id, {
                status: 'published',
                linkedinPostId,
                publishedAt: new Date(),
              });
            }
          } catch (error) {
            console.error(`Failed to publish scheduled post ${post.id}:`, error);
            await storage.updatePost(post.id, {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      res.json({ message: 'Scheduled posts processed' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process scheduled posts' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
