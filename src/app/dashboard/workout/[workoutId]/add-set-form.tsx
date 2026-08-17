'use client';

import { useState, useTransition } from 'react';
import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WeightUnit } from '@/lib/weight';
import { addSetAction } from './actions';

const UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

const SET_TYPES = [
  { value: 'working', label: 'Working' },
  { value: 'warmup', label: 'Warm-up' },
];

/**
 * Logs a set against one exercise.
 *
 * Weight, unit, and set type stay put after a successful save, so a lifter
 * repeating the same set only retypes the reps. A weight of 0 means bodyweight.
 */
export function AddSetForm({
  workoutId,
  workoutExerciseId,
}: {
  workoutId: string;
  workoutExerciseId: string;
}) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [setType, setSetType] = useState<'warmup' | 'working'>('working');
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await addSetAction({
        workoutId,
        workoutExerciseId,
        weight: Number(weight),
        unit,
        reps: Number(reps),
        setType,
      });

      if (result.ok) {
        setReps('');
        setError(undefined);
      } else {
        setError(
          result.errors.weight?.[0] ??
            result.errors.reps?.[0] ??
            'That set is not valid.',
        );
      }
    });
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Field className="w-24">
        <FieldLabel htmlFor={`weight-${workoutExerciseId}`}>Weight</FieldLabel>
        <Input
          id={`weight-${workoutExerciseId}`}
          type="number"
          inputMode="decimal"
          min={0}
          max={2000}
          step="0.5"
          value={weight}
          placeholder="0"
          onChange={(event) => setWeight(event.target.value)}
        />
      </Field>

      <Field className="w-20">
        <FieldLabel>Unit</FieldLabel>
        <Select
          items={UNITS}
          value={unit}
          onValueChange={(value) => setUnit(value as WeightUnit)}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNITS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field className="w-24">
        <FieldLabel htmlFor={`reps-${workoutExerciseId}`}>Reps</FieldLabel>
        <Input
          id={`reps-${workoutExerciseId}`}
          type="number"
          inputMode="numeric"
          min={0}
          max={1000}
          step="1"
          value={reps}
          placeholder="0"
          onChange={(event) => setReps(event.target.value)}
        />
      </Field>

      <Field className="w-32">
        <FieldLabel>Type</FieldLabel>
        <Select
          items={SET_TYPES}
          value={setType}
          onValueChange={(value) => setSetType(value as 'warmup' | 'working')}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SET_TYPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Button type="submit" variant="outline" disabled={pending}>
        <PlusIcon data-icon="inline-start" />
        {pending ? 'Adding...' : 'Add set'}
      </Button>

      <FieldError className="w-full">{error}</FieldError>
    </form>
  );
}
