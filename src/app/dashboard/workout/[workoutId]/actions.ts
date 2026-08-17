'use server';

import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { format } from 'date-fns';
import { z } from 'zod';

import { addSet, deleteSet } from '@/data/sets';
import {
  addWorkoutExercise,
  removeWorkoutExercise,
} from '@/data/workout-exercises';
import { updateWorkout } from '@/data/workouts';

const updateWorkoutSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(120).nullable(),
  notes: z.string().trim().max(2000).nullable(),
  startedAt: z
    .date()
    .refine(
      (value) => value <= new Date(),
      'A workout cannot start in the future',
    ),
});

export async function updateWorkoutAction(
  input: z.infer<typeof updateWorkoutSchema>,
) {
  const parsed = updateWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { id, ...values } = parsed.data;
  const workout = await updateWorkout(id, values);
  if (!workout) notFound();

  const day = format(workout.startedAt, 'yyyy-MM-dd');
  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/workout/${id}`);
  redirect(`/dashboard?date=${day}`);
}

const addExerciseSchema = z.object({
  workoutId: z.uuid(),
  exerciseId: z.uuid(),
});

/** Adds an exercise to the workout and stays on the page. */
export async function addExerciseAction(
  input: z.infer<typeof addExerciseSchema>,
) {
  const parsed = addExerciseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const entry = await addWorkoutExercise(parsed.data);
  if (!entry) notFound();

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/workout/${parsed.data.workoutId}`);

  return { ok: true as const };
}

const removeExerciseSchema = z.object({
  workoutId: z.uuid(),
  workoutExerciseId: z.uuid(),
});

/** Removes an exercise, and its sets by cascade, from the workout. */
export async function removeExerciseAction(
  input: z.infer<typeof removeExerciseSchema>,
) {
  const parsed = removeExerciseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const entry = await removeWorkoutExercise(parsed.data.workoutExerciseId);
  if (!entry) notFound();

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/workout/${parsed.data.workoutId}`);

  return { ok: true as const };
}

const addSetSchema = z.object({
  workoutId: z.uuid(),
  workoutExerciseId: z.uuid(),
  // Bounded by the numeric(8,3) column and by what a human can actually lift.
  weight: z.number().min(0).max(2000),
  unit: z.enum(['kg', 'lb']),
  reps: z.int().min(0).max(1000),
  setType: z.enum(['warmup', 'working']),
});

/** Logs one set against an exercise in this workout. */
export async function addSetAction(input: z.infer<typeof addSetSchema>) {
  const parsed = addSetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { workoutId, ...values } = parsed.data;
  const set = await addSet(values);
  if (!set) notFound();

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/workout/${workoutId}`);

  return { ok: true as const };
}

const deleteSetSchema = z.object({
  workoutId: z.uuid(),
  setId: z.uuid(),
});

/** Deletes one set from this workout. */
export async function deleteSetAction(input: z.infer<typeof deleteSetSchema>) {
  const parsed = deleteSetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const set = await deleteSet(parsed.data.setId);
  if (!set) notFound();

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/workout/${parsed.data.workoutId}`);

  return { ok: true as const };
}
