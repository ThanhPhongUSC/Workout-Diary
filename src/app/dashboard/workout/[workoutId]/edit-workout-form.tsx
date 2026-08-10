'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { isSameDay, startOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/format';
import { updateWorkoutAction } from './actions';

type FieldErrors = {
  id?: string[];
  title?: string[];
  notes?: string[];
  startedAt?: string[];
};

type EditableWorkout = {
  id: string;
  title: string | null;
  notes: string | null;
  startedAt: Date;
};

/**
 * Edits an existing workout's fields and hands them to the action as a typed
 * object.
 *
 * Keeping the same day keeps the original clock time, so re-saving an unchanged
 * form does not quietly move the session to midnight. On success the action
 * redirects, so only the failure branch is handled here.
 */
export function EditWorkoutForm({ workout }: { workout: EditableWorkout }) {
  const [title, setTitle] = useState(workout.title ?? '');
  const [notes, setNotes] = useState(workout.notes ?? '');
  const [day, setDay] = useState(workout.startedAt);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await updateWorkoutAction({
        id: workout.id,
        title: title.trim() || null,
        notes: notes.trim() || null,
        startedAt: isSameDay(day, workout.startedAt)
          ? workout.startedAt
          : startOfDay(day),
      });

      if (!result.ok) setErrors(result.errors);
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            value={title}
            maxLength={120}
            placeholder="Push day"
            onChange={(event) => setTitle(event.target.value)}
          />
          <FieldDescription>
            Optional. Defaults to &ldquo;Workout&rdquo; on the dashboard.
          </FieldDescription>
          <FieldError>{errors.title?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel>Date</FieldLabel>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger
              render={<Button variant="outline" size="lg" />}
              className="w-48 justify-start font-normal"
            >
              <CalendarIcon data-icon="inline-start" />
              {formatDate(day)}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={day}
                defaultMonth={day}
                disabled={{ after: new Date() }}
                onSelect={(selected) => {
                  if (selected) {
                    setDay(selected);
                    setCalendarOpen(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          <FieldError>{errors.startedAt?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <Textarea
            id="notes"
            value={notes}
            maxLength={2000}
            rows={4}
            placeholder="How the session felt, what to change next time."
            onChange={(event) => setNotes(event.target.value)}
          />
          <FieldError>{errors.notes?.[0]}</FieldError>
        </Field>

        <Field orientation="horizontal">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? 'Saving...' : 'Save changes'}
          </Button>
          <Button
            render={<Link href="/dashboard" />}
            nativeButton={false}
            variant="ghost"
            size="lg"
          >
            Cancel
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
