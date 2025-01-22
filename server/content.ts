import express, { type Express, type Request, type Response } from "express";
import { contents, images, type InsertContent, type InsertImage } from "@db/schema";
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

  // Get all contents with their images
  app.get("/api/contents", async (_req: Request, res: Response) => {
    try {
      const allContents = await db.query.contents.findMany({
        with: {
          images: true,
        },
        orderBy: (contents, { desc }) => [desc(contents.createdAt)],
      });
      res.json(allContents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contents" });
    }
  });

  // Create new content with multiple images
  app.post("/api/contents", upload.array('images', 5), async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { title, description } = req.body;
      const files = req.files as Express.Multer.File[];

      // First create the content
      const [newContent] = await db
        .insert(contents)
        .values({
          title,
          description,
          userId: req.user.id,
        } as InsertContent)
        .returning();

      // Then create image records for each uploaded file
      if (files && files.length > 0) {
        const imageValues = files.map(file => ({
          imageUrl: `/uploads/${file.filename}`,
          contentId: newContent.id,
        }));

        await db.insert(images).values(imageValues as InsertImage[]);
      }

      // Fetch the content with its images
      const contentWithImages = await db.query.contents.findFirst({
        where: eq(contents.id, newContent.id),
        with: {
          images: true,
        },
      });

      res.json(contentWithImages);
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
      // Delete associated images first (files and records)
      const contentImages = await db.select().from(images).where(eq(images.contentId, contentId));

      // Delete image files
      for (const image of contentImages) {
        const filePath = path.join(process.cwd(), image.imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete image records
      await db.delete(images).where(eq(images.contentId, contentId));

      // Delete the content
      await db.delete(contents).where(eq(contents.id, contentId));

      res.json({ message: "Content and associated images deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete content" });
    }
  });
}