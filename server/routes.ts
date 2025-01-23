import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupEstablishmentRoutes } from "./establishment";
import { setupUserRoutes } from "./user";
import { db } from "@db";
import { websiteFeedback } from "@db/schema";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Setup establishment routes (/api/establishments/*)
  setupEstablishmentRoutes(app);

  // Setup user routes (/api/users/*)
  setupUserRoutes(app);

  // Website feedback endpoint
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

  const httpServer = createServer(app);
  return httpServer;
}