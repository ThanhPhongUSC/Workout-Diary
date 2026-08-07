'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { z } from 'zod';

import { createWorkout } from '@/data/workouts';

const createWorkoutSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  startedAt: z
    .date()
    .refine((value) => value <= new Date(), 'A workout cannot start in the future'),
});

export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>,
) {
  const parsed = createWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const workout = await createWorkout(parsed.data);

  const day = format(workout.startedAt, 'yyyy-MM-dd');
  revalidatePath('/dashboard');
  redirect(`/dashboard?date=${day}`);
}
