import { users, linkedinAccounts, posts, type User, type InsertUser, type LinkedinAccount, type InsertLinkedinAccount, type Post, type InsertPost } from "../shared/schema";
import { eq, desc, and, count } from "drizzle-orm";
import type { Database } from "./db";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
  deletePost(id: string): Promise<void>;
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
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getLinkedinAccounts(userId: string): Promise<LinkedinAccount[]> {
    return await this.db
      .select()
      .from(linkedinAccounts)
      .where(eq(linkedinAccounts.userId, userId))
      .orderBy(desc(linkedinAccounts.createdAt));
  }

  async getLinkedinAccount(id: string): Promise<LinkedinAccount | undefined> {
    const [account] = await this.db
      .select()
      .from(linkedinAccounts)
      .where(eq(linkedinAccounts.id, id));
    return account || undefined;
  }

  async createLinkedinAccount(account: InsertLinkedinAccount): Promise<LinkedinAccount> {
    const [created] = await this.db
      .insert(linkedinAccounts)
      .values(account)
      .returning();
    return created;
  }

  async updateLinkedinAccount(id: string, updates: Partial<LinkedinAccount>): Promise<LinkedinAccount> {
    const [updated] = await this.db
      .update(linkedinAccounts)
      .set(updates)
      .where(eq(linkedinAccounts.id, id))
      .returning();
    return updated;
  }

  async getPosts(userId: string, limit?: number): Promise<Post[]> {
    let query = this.db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await this.db
      .select()
      .from(posts)
      .where(eq(posts.id, id));
    return post || undefined;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [created] = await this.db
      .insert(posts)
      .values(post)
      .returning();
    return created;
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const [updated] = await this.db
      .update(posts)
      .set(updates)
      .where(eq(posts.id, id))
      .returning();
    return updated;
  }

  async deletePost(id: string): Promise<void> {
    await this.db
      .delete(posts)
      .where(eq(posts.id, id));
  }

  async getScheduledPosts(): Promise<Post[]> {
    const now = new Date();
    return await this.db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.status, 'scheduled'),
          eq(posts.scheduledAt, now) // Note: In real implementation, this should be <= now
        )
      )
      .orderBy(posts.scheduledAt);
  }

  async getUserStats(userId: string): Promise<{
    totalPosts: number;
    scheduledPosts: number;
    publishedPosts: number;
    avgEngagement: number;
  }> {
    const [totalPosts] = await this.db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.userId, userId));

    const [scheduledPosts] = await this.db
      .select({ count: count() })
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.status, 'scheduled')));

    const [publishedPosts] = await this.db
      .select({ count: count() })
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.status, 'published')));

    return {
      totalPosts: totalPosts?.count || 0,
      scheduledPosts: scheduledPosts?.count || 0,
      publishedPosts: publishedPosts?.count || 0,
      avgEngagement: 0, // Would need to calculate from metrics
    };
  }
}

// Factory function to create storage instance with database
export function createStorage(db: Database): IStorage {
  return new DatabaseStorage(db);
}