import { type Express, type Request, type Response } from "express";
import { categories, insertCategorySchema, contentCategories } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";

export function setupCategoryRoutes(app: Express) {
  // Get all categories
  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      const allCategories = await db.select().from(categories);
      res.json(allCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create new category (admin only)
  app.post("/api/categories", async (req: Request, res: Response) => {
    if (!req.user?.id || req.user.role !== 'admin') {
      return res.status(401).json({ message: "Not authorized" });
    }

    try {
      const result = insertCategorySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: result.error.issues 
        });
      }

      const { name, description } = result.data;
      const slug = name.toLowerCase().replace(/\s+/g, '-');

      const [newCategory] = await db
        .insert(categories)
        .values({
          name,
          slug,
          description,
        })
        .returning();

      res.json(newCategory);
    } catch (error: any) {
      if (error.code === '23505') {
        res.status(400).json({ message: "Category already exists" });
      } else {
        console.error('Error creating category:', error);
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  // Assign categories to content
  app.post("/api/contents/:id/categories", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const contentId = parseInt(req.params.id);
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({ message: "categoryIds must be an array" });
    }

    try {
      // First remove existing categories
      await db
        .delete(contentCategories)
        .where(eq(contentCategories.contentId, contentId));

      // Then add new categories
      const categoryRelations = categoryIds.map(categoryId => ({
        contentId,
        categoryId: parseInt(categoryId),
      }));

      await db.insert(contentCategories).values(categoryRelations);

      // Fetch updated content with categories
      const content = await db.query.contents.findFirst({
        where: eq(contents.id, contentId),
        with: {
          categories: {
            with: {
              category: true,
            },
          },
        },
      });

      res.json(content);
    } catch (error) {
      console.error('Error updating content categories:', error);
      res.status(500).json({ message: "Failed to update content categories" });
    }
  });
}