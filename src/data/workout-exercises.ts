import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db, workoutExercises } from '@/db';

/**
 * Appends an exercise to one of the signed-in user's workouts, or returns
 * undefined when the workout is not theirs.
 *
 * `workout_exercises` has no user id, so ownership is confirmed against the
 * parent workout first — a workout that is not the caller's is indistinguishable
 * from a missing one. The new entry goes last: `position` is one past the
 * highest already in the workout.
 */
export async function addWorkoutExercise(input: {
  workoutId: string;
  exerciseId: string;
}) {
  const { userId } = await auth.protect();

  const workout = await db.query.workouts.findFirst({
    where: { id: input.workoutId, userId },
    columns: { id: true },
    with: { entries: { columns: { position: true } } },
  });
  if (!workout) return undefined;

  // The exercise must be built-in or the caller's own; another user's private
  // exercise is not theirs to attach.
  const exercise = await db.query.exercises.findFirst({
    where: { id: input.exerciseId, OR: [{ userId: { isNull: true } }, { userId }] },
    columns: { id: true },
  });
  if (!exercise) return undefined;

  const position =
    workout.entries.reduce((max, entry) => Math.max(max, entry.position), 0) + 1;

  const [entry] = await db
    .insert(workoutExercises)
    .values({ workoutId: input.workoutId, exerciseId: input.exerciseId, position })
    .returning();

  return entry;
}

/**
 * Removes an exercise, and its sets by cascade, from one of the signed-in user's
 * workouts. Returns undefined when the entry is not reachable from a workout of
 * theirs.
 */
export async function removeWorkoutExercise(id: string) {
  const { userId } = await auth.protect();

  const entry = await db.query.workoutExercises.findFirst({
    where: { id, workout: { userId } },
    columns: { id: true, workoutId: true },
  });
  if (!entry) return undefined;

  await db.delete(workoutExercises).where(eq(workoutExercises.id, entry.id));

  return entry;
}
