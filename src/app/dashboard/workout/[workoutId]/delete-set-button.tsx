'use client';

import { useTransition } from 'react';
import { XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { deleteSetAction } from './actions';

/** Deletes one logged set. */
export function DeleteSetButton({
  workoutId,
  setId,
}: {
  workoutId: string;
  setId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label="Delete set"
      className="text-muted-foreground hover:text-destructive"
      onClick={() =>
        startTransition(async () => {
          await deleteSetAction({ workoutId, setId });
        })
      }
    >
      <XIcon />
    </Button>
  );
}
