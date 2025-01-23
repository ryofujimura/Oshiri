import express, { type Express, type Request, type Response } from "express";
import { contents, images, type InsertContent, type InsertImage } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import multer from "multer";
import { uploadImage, deleteImage } from "./utils/cloudinary";

// Configure multer for handling file uploads (temporary storage)
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, '/tmp');  // Store temporarily in /tmp
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

const upload = multer({ storage: storage });

export function setupContentRoutes(app: Express) {
  // Get all contents with their images
  app.get("/api/contents", async (_req: Request, res: Response) => {
    try {
      const allContents = await db.query.contents.findMany({
        with: {
          images: true,
          user: {
            columns: {
              id: true,
              username: true,
              role: true
            }
          },
          categories: {
            with: {
              category: true
            }
          }
        },
        orderBy: (contents, { desc }) => [desc(contents.createdAt)],
      });
      res.json(allContents);
    } catch (error) {
      console.error('Error fetching contents:', error);
      res.status(500).json({ message: "Failed to fetch contents" });
    }
  });

  // Create new content with multiple images
  app.post("/api/contents", upload.array('images', 5), async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { title, description, categories } = req.body;
      const files = req.files as Express.Multer.File[];
      const categoryIds = categories ? JSON.parse(categories) : [];

      // First create the content
      const [newContent] = await db
        .insert(contents)
        .values({
          title,
          description,
          userId: req.user.id,
        } as InsertContent)
        .returning();

      // Upload images to Cloudinary and create image records
      if (files && files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const cloudinaryResult = await uploadImage(file);
          return {
            imageUrl: cloudinaryResult.secure_url,
            publicId: cloudinaryResult.public_id,
            width: cloudinaryResult.width,
            height: cloudinaryResult.height,
            format: cloudinaryResult.format,
            contentId: newContent.id,
          };
        });

        const imageData = await Promise.all(uploadPromises);
        await db.insert(images).values(imageData as InsertImage[]);
      }

      // Fetch the content with its images and categories
      const contentWithRelations = await db.query.contents.findFirst({
        where: eq(contents.id, newContent.id),
        with: {
          images: true,
          categories: {
            with: {
              category: true
            }
          },
          user: {
            columns: {
              id: true,
              username: true,
              role: true
            }
          }
        },
      });

      res.json(contentWithRelations);
    } catch (error) {
      console.error('Error creating content:', error);
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  // Update content
  app.put("/api/contents/:id", upload.array('images', 5), async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const contentId = parseInt(req.params.id);
    const { title, description } = req.body;
    const files = req.files as Express.Multer.File[];

    try {
      // First update the content
      await db
        .update(contents)
        .set({
          title,
          description,
        })
        .where(eq(contents.id, contentId));

      // If new images are uploaded, add them
      if (files && files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const cloudinaryResult = await uploadImage(file);
          return {
            imageUrl: cloudinaryResult.secure_url,
            publicId: cloudinaryResult.public_id,
            width: cloudinaryResult.width,
            height: cloudinaryResult.height,
            format: cloudinaryResult.format,
            contentId,
          };
        });

        const imageData = await Promise.all(uploadPromises);
        await db.insert(images).values(imageData as InsertImage[]);
      }

      // Fetch updated content with relations
      const updatedContent = await db.query.contents.findFirst({
        where: eq(contents.id, contentId),
        with: {
          images: true,
          categories: {
            with: {
              category: true
            }
          },
          user: {
            columns: {
              id: true,
              username: true,
              role: true
            }
          }
        },
      });

      res.json(updatedContent);
    } catch (error) {
      console.error('Error updating content:', error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // Delete content (admin only)
  app.delete("/api/contents/:id", async (req: Request, res: Response) => {
    if (!req.user?.id || req.user.role !== 'admin') {
      return res.status(401).json({ message: "Not authorized" });
    }

    const contentId = parseInt(req.params.id);

    try {
      // Delete associated images from Cloudinary first
      const contentImages = await db.select().from(images).where(eq(images.contentId, contentId));

      // Delete images from Cloudinary
      for (const image of contentImages) {
        if (image.publicId) {
          await deleteImage(image.publicId);
        }
      }

      // Delete image records
      await db.delete(images).where(eq(images.contentId, contentId));

      // Delete the content
      await db.delete(contents).where(eq(contents.id, contentId));

      res.json({ message: "Content and associated images deleted successfully" });
    } catch (error) {
      console.error('Error deleting content:', error);
      res.status(500).json({ message: "Failed to delete content" });
    }
  });
}