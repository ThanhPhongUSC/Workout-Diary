import { auth } from '@clerk/nextjs/server';
import { addDays, startOfDay } from 'date-fns';

import { db } from '@/db';

/**
 * Workouts the signed-in user started on `date`, oldest first.
 *
 * The day boundary is resolved in the server's timezone. `userId` comes from
 * the session, never from the caller, so this can only ever return the
 * caller's own workouts.
 */
export async function getWorkoutsForDate(date: Date) {
  const { userId } = await auth();
  if (!userId) return [];

  const dayStart = startOfDay(date);

  const workouts = await db.query.workouts.findMany({
    where: { userId, startedAt: { gte: dayStart, lt: addDays(dayStart, 1) } },
    orderBy: { startedAt: 'asc' },
    with: {
      entries: {
        columns: { id: true },
        with: { sets: { columns: { id: true } } },
      },
    },
  });

  return workouts.map(({ entries, ...workout }) => ({
    ...workout,
    exerciseCount: entries.length,
    setCount: entries.reduce((total, entry) => total + entry.sets.length, 0),
  }));
}
