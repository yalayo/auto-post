import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLinkedInPost, enhancePost } from "./services/gemini";
import { linkedInService, LinkedInService } from "./services/linkedin";
import { insertPostSchema, insertUserSchema } from "@shared/schema";
import { hashPassword, comparePasswords, sanitizeUser } from "./services/auth";
import { z } from "zod";

// Validation schemas
const authRegisterSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const authLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const generatePostSchema = z.object({
  prompt: z.string().min(1),
  tone: z.enum(['professional', 'casual', 'inspirational', 'educational']),
  length: z.enum(['short', 'medium', 'long']),
  hashtags: z.string().optional(),
});

const bulkGenerateSchema = z.object({
  prompt: z.string().min(1),
  tone: z.enum(['professional', 'casual', 'inspirational', 'educational']),
  length: z.enum(['short', 'medium', 'long']),
  hashtags: z.string().optional(),
  count: z.number().min(1).max(20), // Limit to 20 posts max
  userId: z.string(),
  linkedinAccountId: z.string(),
  startDate: z.string(),
  intervalHours: z.number().min(1).max(168), // Between 1 hour and 1 week
});

const createPostSchema = insertPostSchema.extend({
  scheduledAt: z.string().optional().transform(str => str ? new Date(str) : undefined),
});

const publishPostSchema = z.object({
  postId: z.string(),
  linkedinAccountId: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // User authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = authRegisterSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      res.status(201).json({ user: sanitizeUser(user) });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = authLoginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await comparePasswords(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // LinkedIn OAuth routes
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

  // Bulk post generation and scheduling
  app.post('/api/posts/bulk-generate', async (req, res) => {
    try {
      const validatedData = bulkGenerateSchema.parse(req.body);
      const { prompt, tone, length, hashtags, count, userId, linkedinAccountId, startDate, intervalHours } = validatedData;

      const generatedPosts = [];
      const errors = [];

      // Generate multiple unique posts
      for (let i = 0; i < count; i++) {
        try {
          // Add variation to the prompt to get different posts
          const variationPrompts = [
            `${prompt}`,
            `${prompt} - share a different perspective`,
            `${prompt} - focus on practical tips`,
            `${prompt} - include a personal story`,
            `${prompt} - highlight key benefits`,
            `${prompt} - discuss common challenges`,
            `${prompt} - provide actionable insights`,
            `${prompt} - share industry trends`,
          ];
          
          const promptVariation = variationPrompts[i % variationPrompts.length];
          
          const generatedPost = await generateLinkedInPost({
            prompt: promptVariation,
            tone,
            length,
            hashtags,
          });

          // Calculate scheduled time
          const scheduledAt = new Date(startDate);
          scheduledAt.setHours(scheduledAt.getHours() + (i * intervalHours));

          // Save to database
          const savedPost = await storage.createPost({
            userId,
            linkedinAccountId,
            content: generatedPost.content,
            prompt: promptVariation,
            tone,
            hashtags: hashtags || generatedPost.suggestedHashtags?.join(' '),
            status: 'scheduled',
            scheduledAt,
          });

          generatedPosts.push(savedPost);
        } catch (error) {
          console.error(`Error generating post ${i + 1}:`, error);
          errors.push(`Post ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      res.json({
        success: true,
        generated: generatedPosts.length,
        total: count,
        posts: generatedPosts,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error('Bulk generation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to generate posts' });
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
      let processed = 0;
      let failed = 0;
      
      for (const post of scheduledPosts) {
        if (post.scheduledAt && post.scheduledAt <= now) {
          try {
            const linkedinAccount = await storage.getLinkedinAccount(post.linkedinAccountId);
            if (linkedinAccount) {
              // Check if token needs refresh
              if (linkedinAccount.tokenExpiresAt && linkedinAccount.tokenExpiresAt < now) {
                if (linkedinAccount.refreshToken) {
                  const tokenData = await linkedInService.refreshAccessToken(linkedinAccount.refreshToken);
                  await storage.updateLinkedinAccount(post.linkedinAccountId, {
                    accessToken: tokenData.accessToken,
                    tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
                  });
                  linkedinAccount.accessToken = tokenData.accessToken;
                } else {
                  throw new Error('LinkedIn token expired and no refresh token available');
                }
              }

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
              processed++;
            } else {
              throw new Error('LinkedIn account not found');
            }
          } catch (error) {
            console.error(`Failed to publish scheduled post ${post.id}:`, error);
            await storage.updatePost(post.id, {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            });
            failed++;
          }
        }
      }

      res.json({ 
        message: 'Scheduled posts processed',
        processed,
        failed,
        total: scheduledPosts.length
      });
    } catch (error) {
      console.error('Scheduler error:', error);
      res.status(500).json({ error: 'Failed to process scheduled posts' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
