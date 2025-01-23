import { pgTable, text, serial, timestamp, varchar, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from 'drizzle-orm';

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: varchar("role", { length: 10 }).notNull().default('user'),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const contentCategories = pgTable("content_categories", {
  contentId: integer("content_id").references(() => contents.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull()
});

// Keep the image_url column for now, we'll migrate data before removing it
export const contents = pgTable("contents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),  // Keeping this temporarily for data migration
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull()
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  publicId: text("public_id").notNull(),  // Cloudinary public ID
  width: integer("width"),
  height: integer("height"),
  format: varchar("format", { length: 10 }),
  metadata: jsonb("metadata"),  // For storing additional Cloudinary metadata
  contentId: integer("content_id").references(() => contents.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const contentRelations = relations(contents, ({ many, one }) => ({
  images: many(images),
  user: one(users, {
    fields: [contents.userId],
    references: [users.id],
  }),
  categories: many(contentCategories),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  contents: many(contentCategories),
}));

export const contentCategoryRelations = relations(contentCategories, ({ one }) => ({
  content: one(contents, {
    fields: [contentCategories.contentId],
    references: [contents.id],
  }),
  category: one(categories, {
    fields: [contentCategories.categoryId],
    references: [categories.id],
  }),
}));

export const imageRelations = relations(images, ({ one }) => ({
  content: one(contents, {
    fields: [images.contentId],
    references: [contents.id],
  }),
}));

export const insertContentSchema = createInsertSchema(contents);
export const selectContentSchema = createSelectSchema(contents);
export type InsertContent = typeof contents.$inferInsert;
export type SelectContent = typeof contents.$inferSelect;

export const insertImageSchema = createInsertSchema(images);
export const selectImageSchema = createSelectSchema(images);
export type InsertImage = typeof images.$inferInsert;
export type SelectImage = typeof images.$inferSelect;

export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);
export type InsertCategory = typeof categories.$inferInsert;
export type SelectCategory = typeof categories.$inferSelect;