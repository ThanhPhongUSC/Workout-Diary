import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit workout</h1>
        <p className="text-sm text-muted-foreground">
          Started {formatDate(workout.startedAt)} at{' '}
          {formatTime(workout.startedAt)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workout details</CardTitle>
          <CardDescription>
            Everything here is optional except the date.
          </CardDescription>
          <CardAction>
            <Badge variant={workout.completedAt ? 'secondary' : 'outline'}>
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
