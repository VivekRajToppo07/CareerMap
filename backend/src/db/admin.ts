import { db } from './index.ts';
import { users, assessments, savedPaths, pathProgress } from './schema.ts';
import { desc } from 'drizzle-orm';

export const getAdminData = async () => {
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  const allAssessments = await db.select().from(assessments).orderBy(desc(assessments.createdAt));
  const allPaths = await db.select().from(savedPaths).orderBy(desc(savedPaths.createdAt));
  const allProgress = await db.select().from(pathProgress).orderBy(desc(pathProgress.createdAt));

  return {
    users: allUsers,
    assessments: allAssessments,
    savedPaths: allPaths,
    pathProgress: allProgress
  };
};
