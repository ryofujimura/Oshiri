import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupEstablishmentRoutes } from "./establishment";
import { setupUserRoutes } from "./user";
import { db } from "@db";
import { websiteFeedback, users, seats } from "@db/schema"; // Added import for seats schema
import { eq, sql, and, not } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

export function registerRoutes(app: Express): Server {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Setup establishment routes (/api/establishments/*)
  setupEstablishmentRoutes(app);

  // Setup user routes (/api/users/*)
  setupUserRoutes(app);

  // Profile update route
  app.put('/api/user/profile', async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send('Authentication required');
      }

      const { username, currentPassword, newPassword } = req.body;

      // First verify the current password
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      const isPasswordValid = await crypto.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).send('Current password is incorrect');
      }

      // If changing username, check if it's taken
      if (username !== user.username) {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(and(
            eq(users.username, username),
            not(eq(users.id, req.user!.id))
          ))
          .limit(1);

        if (existingUser) {
          return res.status(400).send('Username is already taken');
        }
      }

      // Prepare update data
      const updates: Record<string, any> = { username };

      // If changing password, hash the new one
      if (newPassword) {
        updates.password = await crypto.hash(newPassword);
      }

      // Update the user
      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, req.user!.id))
        .returning();

      res.json({
        message: 'Profile updated successfully',
        user: { id: updatedUser.id, username: updatedUser.username }
      });
    } catch (error) {
      next(error);
    }
  });

  // Get all feedback
  app.get('/api/feedback', async (_req, res, next) => {
    try {
      const feedback = await db.query.websiteFeedback.findMany({
        with: {
          user: true,
        },
        orderBy: (feedback, { desc }) => [desc(feedback.createdAt)],
      });

      res.json(feedback);
    } catch (error) {
      next(error);
    }
  });

  // Submit new feedback
  app.post('/api/feedback', async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send('Authentication required');
      }

      const { content, category = 'general' } = req.body;
      if (!content) {
        return res.status(400).send('Feedback content is required');
      }

      const [feedback] = await db
        .insert(websiteFeedback)
        .values({
          userId: req.user!.id,
          content,
          category,
          status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'declined',
        })
        .returning();

      res.json(feedback);
    } catch (error) {
      next(error);
    }
  });

  // Vote on feedback
  app.post('/api/feedback/:id/vote', async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send('Authentication required');
      }

      const feedbackId = parseInt(req.params.id);
      const { type } = req.body;

      if (!['up', 'down'].includes(type)) {
        return res.status(400).send('Invalid vote type');
      }

      // Use SQL expressions to increment the vote count
      const updates = type === 'up'
        ? { upvotes: sql`${websiteFeedback.upvotes} + 1` }
        : { downvotes: sql`${websiteFeedback.downvotes} + 1` };

      const [updatedFeedback] = await db
        .update(websiteFeedback)
        .set(updates)
        .where(eq(websiteFeedback.id, feedbackId))
        .returning();

      if (!updatedFeedback) {
        return res.status(404).send('Feedback not found');
      }

      res.json(updatedFeedback);
    } catch (error) {
      next(error);
    }
  });

  // Admin routes
  app.get('/api/admin/feedback', async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== 'admin') {
        return res.status(403).send('Admin access required');
      }

      const feedback = await db.query.websiteFeedback.findMany({
        with: {
          user: true,
        },
        orderBy: (feedback, { desc }) => [desc(feedback.createdAt)],
      });

      res.json(feedback);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/admin/feedback/:id', async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== 'admin') {
        return res.status(403).send('Admin access required');
      }

      const feedbackId = parseInt(req.params.id);
      const { status } = req.body;

      if (!['pending', 'in-progress', 'completed', 'declined'].includes(status)) {
        return res.status(400).send('Invalid status');
      }

      const [feedback] = await db
        .update(websiteFeedback)
        .set({
          status: status as 'pending' | 'in-progress' | 'completed' | 'declined'
        })
        .where(eq(websiteFeedback.id, feedbackId))
        .returning();

      res.json(feedback);
    } catch (error) {
      next(error);
    }
  });

  // Toggle seat review visibility
  app.patch('/api/seats/:id/visibility', async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== 'admin') {
        return res.status(403).send('Admin access required');
      }

      const seatId = parseInt(req.params.id);
      const { isVisible } = req.body;

      if (typeof isVisible !== 'boolean') {
        return res.status(400).send('Invalid visibility value');
      }

      const [updatedSeat] = await db
        .update(seats)
        .set({ isVisible })
        .where(eq(seats.id, seatId))
        .returning();

      if (!updatedSeat) {
        return res.status(404).send('Review not found');
      }

      res.json(updatedSeat);
    } catch (error) {
      next(error);
    }
  });

  // Update the existing reviews endpoint to return all reviews for admins
  app.get('/api/users/reviews', async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send('Authentication required');
      }

      const query = db.query.seats.findMany({
        with: {
          establishment: true,
          user: true,
        },
        where: req.user!.role === 'admin' ? undefined : eq(seats.userId, req.user!.id),
        orderBy: (seats, { desc }) => [desc(seats.createdAt)],
      });

      const reviews = await query;
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}