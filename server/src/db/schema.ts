import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const links = pgTable("links", {
  id: text("id").primaryKey(),
  originalUrl: text("original_url").notNull(),
  shortUrl: text("short_url").notNull().unique(),
  accessCount: integer("access_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
