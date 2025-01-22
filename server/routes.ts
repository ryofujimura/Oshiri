import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupContentRoutes } from "./content";
import express from "express";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Setup content routes (/api/contents/*)
  setupContentRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}