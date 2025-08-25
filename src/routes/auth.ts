import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createStorage } from '../storage';
import { createD1Database } from '../db';
import { hashPassword, comparePasswords, sanitizeUser } from '../services/auth';
import { insertUserSchema } from '../../shared/schema';

import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

const authRegisterSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const authLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Register route
app.post('/register', zValidator('json', authRegisterSchema), async (c) => {
  try {
    const validatedData = c.req.valid('json');
    const db = createD1Database(c.env.DB);
    const storage = createStorage(db);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return c.json({ error: 'User already exists with this email' }, 400);
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(validatedData.password);
    const user = await storage.createUser({
      ...validatedData,
      password: hashedPassword,
    });

    return c.json({ user: sanitizeUser(user) }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Login route
app.post('/login', zValidator('json', authLoginSchema), async (c) => {
  try {
    const validatedData = c.req.valid('json');
    const db = createD1Database(c.env.DB);
    const storage = createStorage(db);
    
    // Find user by email
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const isValidPassword = await comparePasswords(validatedData.password, user.password);
    if (!isValidPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    return c.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

export { app as authRoutes };