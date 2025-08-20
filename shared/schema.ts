import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const downloadItems = pgTable("download_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  title: text("title"),
  downloadType: text("download_type").notNull().default("video"), // video, audio
  status: text("status").notNull().default("pending"), // pending, downloading, ready, failed
  progress: integer("progress").default(0), // 0-100
  fileSize: text("file_size"),
  duration: text("duration"),
  quality: text("quality"),
  fileName: text("file_name"),
  errorMessage: text("error_message"),
  downloadSpeed: text("download_speed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDownloadItemSchema = createInsertSchema(downloadItems).pick({
  url: true,
  title: true,
  downloadType: true,
  status: true,
  progress: true,
  fileSize: true,
  duration: true,
  quality: true,
  fileName: true,
  errorMessage: true,
  downloadSpeed: true,
});

export type InsertDownloadItem = z.infer<typeof insertDownloadItemSchema>;
export type DownloadItem = typeof downloadItems.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
