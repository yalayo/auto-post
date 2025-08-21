import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const linkedinAccounts = pgTable("linkedin_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  linkedinId: text("linkedin_id").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'personal' or 'company'
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  followers: integer("followers").default(0),
  profilePicture: text("profile_picture"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  linkedinAccountId: varchar("linkedin_account_id").references(() => linkedinAccounts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  prompt: text("prompt"), // Original AI prompt if generated
  tone: text("tone"), // professional, casual, etc.
  hashtags: text("hashtags"),
  status: text("status").notNull(), // 'draft', 'scheduled', 'published', 'failed'
  linkedinPostId: text("linkedin_post_id"), // LinkedIn's ID after posting
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  metrics: jsonb("metrics"), // likes, comments, shares
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  linkedinAccounts: many(linkedinAccounts),
  posts: many(posts),
}));

export const linkedinAccountsRelations = relations(linkedinAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [linkedinAccounts.userId],
    references: [users.id],
  }),
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  linkedinAccount: one(linkedinAccounts, {
    fields: [posts.linkedinAccountId],
    references: [linkedinAccounts.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertLinkedinAccountSchema = createInsertSchema(linkedinAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LinkedinAccount = typeof linkedinAccounts.$inferSelect;
export type InsertLinkedinAccount = z.infer<typeof insertLinkedinAccountSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
