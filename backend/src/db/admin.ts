import { db } from './index.ts';
import { users, assessments, savedPaths, pathProgress } from './schema.ts';
import { desc, count } from 'drizzle-orm';

export const getAdminData = async () => {
  const [
    allUsers,
    allAssessments,
    allPaths,
    allProgress,
    usersCount,
    assessmentsCount,
    pathsCount,
    progressCount
  ] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)).limit(50),
    db.select().from(assessments).orderBy(desc(assessments.createdAt)).limit(50),
    db.select().from(savedPaths).orderBy(desc(savedPaths.createdAt)).limit(50),
    db.select().from(pathProgress).orderBy(desc(pathProgress.createdAt)).limit(50),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(assessments),
    db.select({ value: count() }).from(savedPaths),
    db.select({ value: count() }).from(pathProgress),
  ]);

  return {
    users: allUsers,
    assessments: allAssessments,
    savedPaths: allPaths,
    pathProgress: allProgress,
    totals: {
      users: usersCount[0].value,
      assessments: assessmentsCount[0].value,
      savedPaths: pathsCount[0].value,
      pathProgress: progressCount[0].value,
    }
  };
};
