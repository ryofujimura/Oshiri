import { pgTable, text, serial, timestamp, varchar, integer } from "drizzle-orm/pg-core";
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

export const contents = pgTable("contents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull()
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  contentId: integer("content_id").references(() => contents.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const contentRelations = relations(contents, ({ many, one }) => ({
  images: many(images),
  user: one(users, {
    fields: [contents.userId],
    references: [users.id],
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