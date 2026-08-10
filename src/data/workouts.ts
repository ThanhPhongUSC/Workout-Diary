import { auth } from '@clerk/nextjs/server';
import { addDays, startOfDay } from 'date-fns';
import { and, eq } from 'drizzle-orm';

import { db, workouts } from '@/db';

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

  const rows = await db.query.workouts.findMany({
    where: { userId, startedAt: { gte: dayStart, lt: addDays(dayStart, 1) } },
    orderBy: { startedAt: 'asc' },
    with: {
      entries: {
        columns: { id: true },
        with: { sets: { columns: { id: true } } },
      },
    },
  });

  return rows.map(({ entries, ...workout }) => ({
    ...workout,
    exerciseCount: entries.length,
    setCount: entries.reduce((total, entry) => total + entry.sets.length, 0),
  }));
}

/**
 * One workout, or undefined when it does not exist or is not the caller's.
 *
 * The owner predicate is part of the query, so another user's workout is
 * indistinguishable from a missing one.
 */
export async function getWorkout(id: string) {
  const { userId } = await auth();
  if (!userId) return undefined;

  return db.query.workouts.findFirst({ where: { id, userId } });
}

/**
 * Starts a workout for the signed-in user and returns the new row.
 *
 * `userId` comes from the session, so a workout can only ever be created for
 * the caller. Input is assumed validated by the action that calls this.
 */
export async function createWorkout(input: {
  title?: string;
  notes?: string;
  startedAt?: Date;
}) {
  const { userId } = await auth.protect();

  const [workout] = await db
    .insert(workouts)
    .values({ ...input, userId })
    .returning();

  return workout;
}

/**
 * Updates one of the signed-in user's workouts, or returns undefined when the
 * id is not theirs.
 *
 * The owner predicate lives in the statement itself, so this can never write to
 * another user's row. Input is assumed validated by the action that calls this.
 */
export async function updateWorkout(
  id: string,
  input: { title: string | null; notes: string | null; startedAt: Date },
) {
  const { userId } = await auth.protect();

  const [workout] = await db
    .update(workouts)
    .set(input)
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
    .returning();

  return workout;
}
