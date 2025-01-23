import { pgTable, text, serial, timestamp, varchar, integer, jsonb, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from 'drizzle-orm';

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: varchar("role", { length: 10 }).notNull().default('user'),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const establishments = pgTable("establishments", {
  id: serial("id").primaryKey(),
  yelpId: text("yelp_id").unique().notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  yelpRating: decimal("yelp_rating", { precision: 2, scale: 1 }),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const seats = pgTable("seats", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishment_id").references(() => establishments.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), 
  capacity: integer("capacity").notNull(), 
  comfortRating: varchar("comfort_rating", { length: 20 }).notNull(), 
  hasPowerOutlet: boolean("has_power_outlet").notNull(),
  noiseLevel: varchar("noise_level", { length: 20 }), 
  description: text("description"),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const websiteFeedback = pgTable("website_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).default('general'),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  status: varchar("status", { length: 20 }).default('pending').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const seatEditRequests = pgTable("seat_edit_requests", {
  id: serial("id").primaryKey(),
  seatId: integer("seat_id").references(() => seats.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }), 
  capacity: integer("capacity"), 
  comfortRating: varchar("comfort_rating", { length: 20 }), 
  hasPowerOutlet: boolean("has_power_outlet"),
  noiseLevel: varchar("noise_level", { length: 20 }), 
  description: text("description"),
  requestType: varchar("request_type", { length: 20 }).notNull(), // 'edit' or 'delete'
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  adminId: integer("admin_id").references(() => users.id),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  seatId: integer("seat_id").references(() => seats.id).notNull(),
  imageUrl: text("image_url").notNull(),
  publicId: text("public_id").notNull(),
  width: integer("width"),
  height: integer("height"),
  format: varchar("format", { length: 10 }),
  metadata: jsonb("metadata"),
  isVisible: boolean("is_visible").default(true).notNull(),
  moderationStatus: varchar("moderation_status", { length: 20 }).notNull().default('pending'),
  moderatedBy: integer("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const wifiSpeeds = pgTable("wifi_speeds", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishment_id").references(() => establishments.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  downloadSpeed: decimal("download_speed", { precision: 10, scale: 2 }).notNull(), 
  uploadSpeed: decimal("upload_speed", { precision: 10, scale: 2 }).notNull(), 
  latency: integer("latency"), 
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  category: varchar("category", { length: 50 }).notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const establishmentTags = pgTable("establishment_tags", {
  establishmentId: integer("establishment_id").references(() => establishments.id).notNull(),
  tagId: integer("tag_id").references(() => tags.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const userRelations = relations(users, ({ many }) => ({
  seats: many(seats),
  editRequests: many(seatEditRequests),
  moderatedImages: many(images, { relationName: 'moderator' }),
  websiteFeedback: many(websiteFeedback)
}));

export const establishmentRelations = relations(establishments, ({ many }) => ({
  seats: many(seats)
}));

export const seatRelations = relations(seats, ({ one, many }) => ({
  establishment: one(establishments, {
    fields: [seats.establishmentId],
    references: [establishments.id],
  }),
  user: one(users, {
    fields: [seats.userId],
    references: [users.id],
  }),
  images: many(images),
  editRequests: many(seatEditRequests)
}));

export const imageRelations = relations(images, ({ one }) => ({
  seat: one(seats, {
    fields: [images.seatId],
    references: [seats.id],
  }),
  moderator: one(users, {
    fields: [images.moderatedBy],
    references: [users.id],
  })
}));

export const seatEditRequestRelations = relations(seatEditRequests, ({ one }) => ({
  seat: one(seats, {
    fields: [seatEditRequests.seatId],
    references: [seats.id],
  }),
  user: one(users, {
    fields: [seatEditRequests.userId],
    references: [users.id],
  }),
  admin: one(users, {
    fields: [seatEditRequests.adminId],
    references: [users.id],
  })
}));

export const websiteFeedbackRelations = relations(websiteFeedback, ({ one }) => ({
  user: one(users, {
    fields: [websiteFeedback.userId],
    references: [users.id],
  })
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const insertEstablishmentSchema = createInsertSchema(establishments);
export const selectEstablishmentSchema = createSelectSchema(establishments);
export type InsertEstablishment = typeof establishments.$inferInsert;
export type SelectEstablishment = typeof establishments.$inferSelect;

export const insertSeatSchema = createInsertSchema(seats);
export const selectSeatSchema = createSelectSchema(seats);
export type InsertSeat = typeof seats.$inferInsert;
export type SelectSeat = typeof seats.$inferSelect;

export const insertImageSchema = createInsertSchema(images);
export const selectImageSchema = createSelectSchema(images);
export type InsertImage = typeof images.$inferInsert;
export type SelectImage = typeof images.$inferSelect;

export const insertSeatEditRequestSchema = createInsertSchema(seatEditRequests);
export const selectSeatEditRequestSchema = createSelectSchema(seatEditRequests);
export type InsertSeatEditRequest = typeof seatEditRequests.$inferInsert;
export type SelectSeatEditRequest = typeof seatEditRequests.$inferSelect;

export const insertWebsiteFeedbackSchema = createInsertSchema(websiteFeedback);
export const selectWebsiteFeedbackSchema = createSelectSchema(websiteFeedback);
export type InsertWebsiteFeedback = typeof websiteFeedback.$inferInsert;
export type SelectWebsiteFeedback = typeof websiteFeedback.$inferSelect;