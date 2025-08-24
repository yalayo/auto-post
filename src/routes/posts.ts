import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createStorage } from '../storage';
import { createD1Database } from '../db';
import { generateLinkedInPost } from '../../server/services/gemini';
import { linkedInService } from '../../server/services/linkedin';
import { insertPostSchema } from '../../shared/schema';

import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

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
  count: z.number().min(1).max(20),
  userId: z.string(),
  linkedinAccountId: z.string().optional().nullable(),
  startDate: z.string(),
  intervalHours: z.number().min(1).max(168),
});

const createPostSchema = insertPostSchema.extend({
  scheduledAt: z.string().optional().transform(str => str ? new Date(str) : undefined),
});

const publishPostSchema = z.object({
  postId: z.string(),
  linkedinAccountId: z.string(),
});

// Generate single post
app.post('/generate', zValidator('json', generatePostSchema), async (c) => {
  try {
    const validatedData = c.req.valid('json');
    const generatedPost = await generateLinkedInPost(validatedData);
    return c.json(generatedPost);
  } catch (error) {
    console.error('Post generation error:', error);
    return c.json({ error: 'Failed to generate post' }, 500);
  }
});

// Bulk generate posts
app.post('/bulk-generate', zValidator('json', bulkGenerateSchema), async (c) => {
  try {
    const validatedData = c.req.valid('json');
    const { prompt, tone, length, hashtags, count, userId, linkedinAccountId, startDate, intervalHours } = validatedData;
    
    const db = createD1Database(c.env.DB);
    const storage = createStorage(db);
    
    const generatedPosts = [];
    const errors = [];

    for (let i = 0; i < count; i++) {
      try {
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

        let scheduledAt = null;
        let status = 'draft';
        
        if (linkedinAccountId) {
          scheduledAt = new Date(startDate);
          scheduledAt.setHours(scheduledAt.getHours() + (i * intervalHours));
          status = 'scheduled';
        }

        const savedPost = await storage.createPost({
          userId,
          linkedinAccountId: linkedinAccountId || null,
          content: generatedPost.content,
          prompt: promptVariation,
          tone,
          hashtags: hashtags || generatedPost.suggestedHashtags?.join(' '),
          status,
          scheduledAt,
        });

        generatedPosts.push(savedPost);
      } catch (error) {
        console.error(`Error generating post ${i + 1}:`, error);
        errors.push(`Post ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return c.json({
      success: true,
      generated: generatedPosts.length,
      total: count,
      posts: generatedPosts,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Bulk generation error:', error);
    return c.json({ error: 'Failed to generate posts' }, 500);
  }
});

// Create post
app.post('/', zValidator('json', createPostSchema), async (c) => {
  try {
    const validatedData = c.req.valid('json');
    const db = createD1Database(c.env.DB);
    const storage = createStorage(db);
    
    const post = await storage.createPost({
      ...validatedData,
      status: validatedData.scheduledAt ? 'scheduled' : 'draft',
    });
    return c.json(post);
  } catch (error) {
    console.error('Create post error:', error);
    return c.json({ error: 'Failed to create post' }, 500);
  }
});

// Publish post
app.post('/publish', zValidator('json', publishPostSchema), async (c) => {
  try {
    const { postId, linkedinAccountId } = c.req.valid('json');
    const db = createD1Database(c.env.DB);
    const storage = createStorage(db);
    
    const post = await storage.getPost(postId);
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const linkedinAccount = await storage.getLinkedinAccount(linkedinAccountId);
    if (!linkedinAccount) {
      return c.json({ error: 'LinkedIn account not found' }, 404);
    }

    // Check if token needs refresh (token refresh logic would go here)
    const now = new Date();
    if (linkedinAccount.tokenExpiresAt && linkedinAccount.tokenExpiresAt < now) {
      return c.json({ error: 'LinkedIn token expired' }, 401);
    }

    // Publish to LinkedIn
    const personUrn = `urn:li:person:${linkedinAccount.linkedinId}`;
    const linkedinPostId = await linkedInService.publishPost(
      linkedinAccount.accessToken,
      post.content,
      personUrn
    );

    const updatedPost = await storage.updatePost(postId, {
      status: 'published',
      linkedinPostId,
      publishedAt: new Date(),
    });

    return c.json(updatedPost);
  } catch (error) {
    console.error('Publish post error:', error);
    return c.json({ error: 'Failed to publish post' }, 500);
  }
});

// Update post
app.put('/:postId', async (c) => {
  try {
    const postId = c.req.param('postId');
    const updates = await c.req.json();
    const db = createD1Database(c.env.DB);
    const storage = createStorage(db);
    
    const updatedPost = await storage.updatePost(postId, updates);
    return c.json(updatedPost);
  } catch (error) {
    console.error('Update post error:', error);
    return c.json({ error: 'Failed to update post' }, 500);
  }
});

// Delete post
app.delete('/:postId', async (c) => {
  try {
    const postId = c.req.param('postId');
    const db = createD1Database(c.env.DB);
    const storage = createStorage(db);
    
    await storage.deletePost(postId);
    return c.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return c.json({ error: 'Failed to delete post' }, 500);
  }
});

// Process scheduled posts
app.post('/process-scheduled', async (c) => {
  try {
    const db = createD1Database(c.env.DB);
    const storage = createStorage(db);
    
    const scheduledPosts = await storage.getScheduledPosts();
    const now = new Date();
    let processed = 0;
    let failed = 0;
    
    for (const post of scheduledPosts) {
      if (post.scheduledAt && post.scheduledAt <= now && post.linkedinAccountId) {
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

    return c.json({ 
      message: 'Scheduled posts processed',
      processed,
      failed,
      total: scheduledPosts.length
    });
  } catch (error) {
    console.error('Scheduler error:', error);
    return c.json({ error: 'Failed to process scheduled posts' }, 500);
  }
});

export { app as postsRoutes };