import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const assessments = pgTable('assessments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  degree: text('degree').notNull(),
  experience: text('experience').default(''),
  internships: text('internships').default(''),
  projects: text('projects').default(''),
  programmingLanguages: text('programming_languages').notNull(),
  interests: text('interests').notNull(),
  workStyle: text('work_style').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const savedPaths = pgTable('saved_paths', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  fitExplanation: text('fit_explanation').notNull(),
  skillsToDevelop: jsonb('skills_to_develop').notNull(), // Array of strings
  createdAt: timestamp('created_at').defaultNow(),
});

export const pathProgress = pgTable('path_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  pathTitle: text('path_title').notNull(),
  roadmap: jsonb('roadmap'), // Cache the generated roadmap
  completedSteps: jsonb('completed_steps').default('[]'), // Array of step numbers
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  assessments: many(assessments),
  savedPaths: many(savedPaths),
  pathProgress: many(pathProgress),
}));

export const pathProgressRelations = relations(pathProgress, ({ one }) => ({
  user: one(users, {
    fields: [pathProgress.userId],
    references: [users.id],
  }),
}));

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
}));

export const savedPathsRelations = relations(savedPaths, ({ one }) => ({
  user: one(users, {
    fields: [savedPaths.userId],
    references: [users.id],
  }),
}));
