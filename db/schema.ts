import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
export const homework = pgTable('homework', {
  id: serial().primaryKey(),
  poster: text().notNull(),
  text: text().notNull(),
  date: text().notNull(),
  fileName: text('file_name'),
  fileKey: text('file_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
