'use client';

import { useTransition } from 'react';
import { Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { removeExerciseAction } from './actions';

/** Removes one exercise, and its sets by cascade, from the workout. */
export function RemoveExerciseButton({
  workoutId,
  workoutExerciseId,
}: {
  workoutId: string;
  workoutExerciseId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label="Remove exercise"
      className="text-muted-foreground hover:text-destructive"
      onClick={() =>
        startTransition(async () => {
          await removeExerciseAction({ workoutId, workoutExerciseId });
        })
      }
    >
      <Trash2Icon />
    </Button>
  );
}
