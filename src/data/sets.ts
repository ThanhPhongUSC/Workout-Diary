import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db, sets } from '@/db';
import { toKg, type WeightUnit } from '@/lib/weight';

/**
 * Appends a set to one of the signed-in user's exercises, or returns undefined
 * when the exercise is not reachable from a workout of theirs.
 *
 * The typed weight is converted here and stored in kilograms, with `unit`
 * recording what was typed so it reads back unchanged. The new set goes last:
 * `position` is one past the highest already on the exercise.
 */
export async function addSet(input: {
  workoutExerciseId: string;
  weight: number;
  unit: WeightUnit;
  reps: number;
  setType: 'warmup' | 'working';
}) {
  const { userId } = await auth.protect();

  const entry = await db.query.workoutExercises.findFirst({
    where: { id: input.workoutExerciseId, workout: { userId } },
    columns: { id: true },
    with: { sets: { columns: { position: true } } },
  });
  if (!entry) return undefined;

  const position =
    entry.sets.reduce((max, set) => Math.max(max, set.position), 0) + 1;

  const [set] = await db
    .insert(sets)
    .values({
      workoutExerciseId: input.workoutExerciseId,
      position,
      weightKg: toKg(input.weight, input.unit).toFixed(3),
      unit: input.unit,
      reps: input.reps,
      setType: input.setType,
    })
    .returning();

  return set;
}

/**
 * Deletes one set, or returns undefined when it is not reachable from a workout
 * of the signed-in user's.
 */
export async function deleteSet(id: string) {
  const { userId } = await auth.protect();

  const set = await db.query.sets.findFirst({
    where: { id, entry: { workout: { userId } } },
    columns: { id: true },
  });
  if (!set) return undefined;

  await db.delete(sets).where(eq(sets.id, set.id));

  return set;
}
