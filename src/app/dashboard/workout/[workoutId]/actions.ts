'use server';

import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { format } from 'date-fns';
import { z } from 'zod';

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
