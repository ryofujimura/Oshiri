import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupEstablishmentRoutes } from "./establishment";
import { setupUserRoutes } from "./user";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Setup establishment routes (/api/establishments/*)
  setupEstablishmentRoutes(app);

  // Setup user routes (/api/users/*)
  setupUserRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}