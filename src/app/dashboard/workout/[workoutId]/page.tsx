import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeftIcon } from 'lucide-react';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getWorkout } from '@/data/workouts';
import { formatDate, formatTime } from '@/lib/format';
import { EditWorkoutForm } from './edit-workout-form';

export default async function EditWorkoutPage({
  params,
}: PageProps<'/dashboard/workout/[workoutId]'>) {
  await auth.protect();

  const { workoutId } = await params;
  // A non-uuid id would make Postgres throw rather than render a 404.
  if (!z.uuid().safeParse(workoutId).success) notFound();

  const workout = await getWorkout(workoutId);
  if (!workout) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <Button
        render={
          <Link
            href={`/dashboard?date=${format(workout.startedAt, 'yyyy-MM-dd')}`}
          />
        }
        nativeButton={false}
        variant="ghost"
        size="sm"
        className="-ml-2 mb-4 text-muted-foreground"
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Back to log
      </Button>

      <div className="mb-6 border-b border-border pb-6">
        <p className="eyebrow">Session</p>
        <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-4xl">
          {workout.title ?? 'Workout'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground tabular-nums">
          Started {formatDate(workout.startedAt)} at{' '}
          {formatTime(workout.startedAt)}
        </p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Workout details</CardTitle>
          <CardDescription>
            Everything here is optional except the date.
          </CardDescription>
          <CardAction>
            <Badge
              variant={workout.completedAt ? 'secondary' : 'outline'}
              className="rounded-sm"
            >
              {workout.completedAt ? 'Completed' : 'In progress'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <EditWorkoutForm workout={workout} />
        </CardContent>
      </Card>
    </main>
  );
}
