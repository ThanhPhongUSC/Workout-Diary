import { auth } from '@clerk/nextjs/server';

import { db } from '@/db';

export type ExerciseHistory = {
  name: string;
  muscleGroup: string | null;
  lastPerformed: Date;
  sessions: number;
  sets: number;
  bestWeightKg: number;
  bestReps: number;
};

/** How many recent sessions a history preview looks back over. */
const SESSION_WINDOW = 20;

/**
 * The exercises the signed-in user can log: the built-in catalog plus their own,
 * alphabetically.
 *
 * A null `userId` is a built-in exercise shared by everyone — the one case where
 * a row without the caller's id is legitimately theirs to read.
 */
export async function getExerciseOptions() {
  const { userId } = await auth();
  if (!userId) return [];

  return db.query.exercises.findMany({
    where: { OR: [{ userId: { isNull: true } }, { userId }] },
    columns: { id: true, name: true, muscleGroup: true },
    orderBy: { name: 'asc' },
  });
}

/**
 * A per-exercise summary of the signed-in user's recent training, most recently
 * performed first.
 *
 * Entries and sets carry no user id, so they are loaded through the parent
 * workout — its `userId` predicate is what makes this the caller's data only.
 * The window is bounded, so the rollup stays small enough to do in memory.
 */
export async function getRecentExercises(limit = 4) {
  const { userId } = await auth();
  if (!userId) return [];

  const rows = await db.query.workouts.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    limit: SESSION_WINDOW,
    columns: { startedAt: true },
    with: {
      entries: {
        columns: { id: true },
        with: {
          exercise: { columns: { name: true, muscleGroup: true } },
          sets: { columns: { reps: true, weightKg: true } },
        },
      },
    },
  });

  const history = new Map<string, ExerciseHistory>();

  for (const workout of rows) {
    for (const { exercise, sets } of workout.entries) {
      // The relation is typed nullable even though the column is not null.
      if (!exercise) continue;

      const current = history.get(exercise.name) ?? {
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        lastPerformed: workout.startedAt,
        sessions: 0,
        sets: 0,
        bestWeightKg: 0,
        bestReps: 0,
      };

      current.sessions += 1;
      current.sets += sets.length;

      for (const set of sets) {
        const weight = Number(set.weightKg);
        if (weight > current.bestWeightKg) {
          current.bestWeightKg = weight;
          current.bestReps = set.reps;
        }
      }

      history.set(current.name, current);
    }
  }

  return [...history.values()].slice(0, limit);
}
