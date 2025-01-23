import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupEstablishmentRoutes } from "./establishment";
import { setupUserRoutes } from "./user";
import { db } from "@db";
import { websiteFeedback } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Setup establishment routes (/api/establishments/*)
  setupEstablishmentRoutes(app);

  // Setup user routes (/api/users/*)
  setupUserRoutes(app);

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

      const [feedback] = await db
        .update(websiteFeedback)
        .set({
          [type === 'up' ? 'upvotes' : 'downvotes']: db.raw('?? + 1', [type === 'up' ? 'upvotes' : 'downvotes']),
        })
        .where(eq(websiteFeedback.id, feedbackId))
        .returning();

      res.json(feedback);
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
        .set({ status })
        .where(eq(websiteFeedback.id, feedbackId))
        .returning();

      res.json(feedback);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}