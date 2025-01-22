import express, { type Express, type Request, type Response } from "express";
import { contents, type InsertContent } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

export function setupContentRoutes(app: Express) {
  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));

  // Get all contents
  app.get("/api/contents", async (_req: Request, res: Response) => {
    try {
      const allContents = await db.select().from(contents).orderBy(contents.createdAt);
      res.json(allContents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contents" });
    }
  });

  // Create new content
  app.post("/api/contents", upload.single('image'), async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { title, description } = req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const [newContent] = await db
        .insert(contents)
        .values({
          title,
          description,
          imageUrl,
          userId: req.user.id,
        } as InsertContent)
        .returning();

      res.json(newContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  // Vote on content
  app.post("/api/contents/:id/vote", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const contentId = parseInt(req.params.id);
    const { type } = req.body;

    try {
      const [content] = await db.select().from(contents).where(eq(contents.id, contentId));

      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const [updatedContent] = await db
        .update(contents)
        .set({
          upvotes: type === 'up' ? content.upvotes + 1 : content.upvotes,
          downvotes: type === 'down' ? content.downvotes + 1 : content.downvotes,
        })
        .where(eq(contents.id, contentId))
        .returning();

      res.json(updatedContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update vote" });
    }
  });

  // Delete content
  app.delete("/api/contents/:id", async (req: Request, res: Response) => {
    if (!req.user?.role !== 'admin') {
      return res.status(401).json({ message: "Not authorized" });
    }

    const contentId = parseInt(req.params.id);

    try {
      await db.delete(contents).where(eq(contents.id, contentId));
      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete content" });
    }
  });
}