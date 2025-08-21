import { users, linkedinAccounts, posts, type User, type InsertUser, type LinkedinAccount, type InsertLinkedinAccount, type Post, type InsertPost } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // LinkedIn account methods
  getLinkedinAccounts(userId: string): Promise<LinkedinAccount[]>;
  getLinkedinAccount(id: string): Promise<LinkedinAccount | undefined>;
  createLinkedinAccount(account: InsertLinkedinAccount): Promise<LinkedinAccount>;
  updateLinkedinAccount(id: string, updates: Partial<LinkedinAccount>): Promise<LinkedinAccount>;
  
  // Post methods
  getPosts(userId: string, limit?: number): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post>;
  getScheduledPosts(): Promise<Post[]>;
  
  // Analytics
  getUserStats(userId: string): Promise<{
    totalPosts: number;
    scheduledPosts: number;
    publishedPosts: number;
    avgEngagement: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getLinkedinAccounts(userId: string): Promise<LinkedinAccount[]> {
    return await db
      .select()
      .from(linkedinAccounts)
      .where(eq(linkedinAccounts.userId, userId))
      .orderBy(desc(linkedinAccounts.createdAt));
  }

  async getLinkedinAccount(id: string): Promise<LinkedinAccount | undefined> {
    const [account] = await db
      .select()
      .from(linkedinAccounts)
      .where(eq(linkedinAccounts.id, id));
    return account || undefined;
  }

  async createLinkedinAccount(account: InsertLinkedinAccount): Promise<LinkedinAccount> {
    const [newAccount] = await db
      .insert(linkedinAccounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async updateLinkedinAccount(id: string, updates: Partial<LinkedinAccount>): Promise<LinkedinAccount> {
    const [updated] = await db
      .update(linkedinAccounts)
      .set(updates)
      .where(eq(linkedinAccounts.id, id))
      .returning();
    return updated;
  }

  async getPosts(userId: string, limit = 50): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id));
    return post || undefined;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db
      .insert(posts)
      .values(post)
      .returning();
    return newPost;
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const [updated] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updated;
  }

  async getScheduledPosts(): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.status, 'scheduled'))
      .orderBy(posts.scheduledAt);
  }

  async getUserStats(userId: string): Promise<{
    totalPosts: number;
    scheduledPosts: number;
    publishedPosts: number;
    avgEngagement: number;
  }> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.userId, userId));

    const [scheduledResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.status, 'scheduled')));

    const [publishedResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.status, 'published')));

    // Calculate average engagement from metrics
    const publishedPosts = await db
      .select()
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.status, 'published')));

    let totalEngagement = 0;
    let engagementCount = 0;

    publishedPosts.forEach(post => {
      if (post.metrics && typeof post.metrics === 'object') {
        const metrics = post.metrics as any;
        const likes = metrics.likes || 0;
        const comments = metrics.comments || 0;
        const shares = metrics.shares || 0;
        totalEngagement += likes + comments + shares;
        engagementCount++;
      }
    });

    const avgEngagement = engagementCount > 0 ? totalEngagement / engagementCount : 0;

    return {
      totalPosts: totalResult.count,
      scheduledPosts: scheduledResult.count,
      publishedPosts: publishedResult.count,
      avgEngagement: Math.round(avgEngagement * 100) / 100,
    };
  }
}

export const storage = new DatabaseStorage();
