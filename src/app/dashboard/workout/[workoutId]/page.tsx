import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeftIcon, DumbbellIcon } from 'lucide-react';
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getExerciseOptions } from '@/data/exercises';
import { getWorkout } from '@/data/workouts';
import { formatDate, formatTime, formatWeight } from '@/lib/format';
import { AddExerciseForm } from './add-exercise-form';
import { AddSetForm } from './add-set-form';
import { DeleteSetButton } from './delete-set-button';
import { EditWorkoutForm } from './edit-workout-form';
import { RemoveExerciseButton } from './remove-exercise-button';

export default async function EditWorkoutPage({
  params,
}: PageProps<'/dashboard/workout/[workoutId]'>) {
  await auth.protect();

  const { workoutId } = await params;
  // A non-uuid id would make Postgres throw rather than render a 404.
  if (!z.uuid().safeParse(workoutId).success) notFound();

  const workout = await getWorkout(workoutId);
  if (!workout) notFound();

  const exerciseOptions = await getExerciseOptions();

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

      <section className="mt-6">
        <div className="mb-4">
          <p className="eyebrow">Exercises</p>
          <h2 className="mt-1 text-xl font-semibold">
            {workout.entries.length} logged
          </h2>
          <div className="mt-3">
            <AddExerciseForm
              workoutId={workout.id}
              exercises={exerciseOptions}
            />
          </div>
        </div>

        {workout.entries.length === 0 ? (
          <Card>
            <CardContent>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <DumbbellIcon />
                  </EmptyMedia>
                  <EmptyTitle>No exercises yet</EmptyTitle>
                  <EmptyDescription>
                    Exercises and their sets appear here once you add them.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {workout.entries.map((entry, index) => (
              <Card key={entry.id}>
                <CardHeader className="border-b">
                  <CardTitle>{entry.exercise?.name ?? 'Exercise'}</CardTitle>
                  <CardDescription>
                    {entry.exercise?.muscleGroup ?? 'general'} ·{' '}
                    {entry.sets.length} set
                    {entry.sets.length === 1 ? '' : 's'}
                  </CardDescription>
                  <CardAction className="flex items-center gap-1">
                    <Badge variant="outline" className="rounded-sm tabular-nums">
                      {index + 1}
                    </Badge>
                    <RemoveExerciseButton
                      workoutId={workout.id}
                      workoutExerciseId={entry.id}
                    />
                  </CardAction>
                </CardHeader>
                <CardContent className="px-0">
                  {entry.sets.length === 0 ? (
                    <p className="px-(--card-spacing) text-sm text-muted-foreground">
                      No sets logged for this exercise.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 pl-(--card-spacing)">
                            Set
                          </TableHead>
                          <TableHead className="text-right">Weight</TableHead>
                          <TableHead className="text-right">Reps</TableHead>
                          <TableHead className="text-right">Type</TableHead>
                          <TableHead className="w-10 pr-(--card-spacing)" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entry.sets.map((set, setIndex) => (
                          <TableRow key={set.id}>
                            <TableCell className="pl-(--card-spacing) text-muted-foreground tabular-nums">
                              {setIndex + 1}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatWeight(Number(set.weightKg), set.unit)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {set.reps}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={
                                  set.setType === 'warmup'
                                    ? 'outline'
                                    : 'secondary'
                                }
                                className="rounded-sm"
                              >
                                {set.setType}
                              </Badge>
                            </TableCell>
                            <TableCell className="pr-(--card-spacing) text-right">
                              <DeleteSetButton
                                workoutId={workout.id}
                                setId={set.id}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
                {entry.notes ? (
                  <CardContent className="pt-0 text-sm text-muted-foreground">
                    {entry.notes}
                  </CardContent>
                ) : null}
                <CardContent className="border-t pt-(--card-spacing)">
                  <AddSetForm
                    workoutId={workout.id}
                    workoutExerciseId={entry.id}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
