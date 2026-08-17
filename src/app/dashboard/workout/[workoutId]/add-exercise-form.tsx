'use client';

import { useState, useTransition } from 'react';
import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, FieldError } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addExerciseAction } from './actions';

type ExerciseOption = {
  id: string;
  name: string;
  muscleGroup: string | null;
};

/**
 * Picks an exercise from the catalog and appends it to this workout.
 *
 * The action revalidates the route rather than returning the new row, so the
 * server component re-renders with it.
 */
export function AddExerciseForm({
  workoutId,
  exercises,
}: {
  workoutId: string;
  exercises: ExerciseOption[];
}) {
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const items = exercises.map((exercise) => ({
    value: exercise.id,
    label: exercise.name,
  }));

  function submit() {
    if (!exerciseId) {
      setError('Pick an exercise first.');
      return;
    }

    startTransition(async () => {
      const result = await addExerciseAction({ workoutId, exerciseId });
      if (result.ok) {
        setExerciseId(null);
        setError(undefined);
      } else {
        setError(result.errors.exerciseId?.[0] ?? 'That exercise is not valid.');
      }
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Field orientation="horizontal">
        <Select
          items={items}
          value={exerciseId}
          onValueChange={(value) => {
            setExerciseId(value);
            setError(undefined);
          }}
        >
          <SelectTrigger size="default" className="h-9 w-full sm:w-72">
            <SelectValue placeholder="Choose an exercise" />
          </SelectTrigger>
          <SelectContent>
            {exercises.map((exercise) => (
              <SelectItem key={exercise.id} value={exercise.id}>
                {exercise.name}
                <span className="text-xs text-muted-foreground">
                  {exercise.muscleGroup ?? 'general'}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={pending}>
          <PlusIcon data-icon="inline-start" />
          {pending ? 'Adding...' : 'Add exercise'}
        </Button>
      </Field>
      <FieldError>{error}</FieldError>
    </form>
  );
}
