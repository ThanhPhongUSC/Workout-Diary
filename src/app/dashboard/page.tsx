import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { format, isValid, parseISO } from 'date-fns';
import {
  ActivityIcon,
  ArrowUpRightIcon,
  CalendarDaysIcon,
  DumbbellIcon,
  FlameIcon,
  HistoryIcon,
  LayersIcon,
  PlusIcon,
  type LucideIcon,
} from 'lucide-react';

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
import { getRecentExercises } from '@/data/exercises';
import { getRecentWorkouts, getTrainingStats, getWorkoutsForDate } from '@/data/workouts';
import {
  formatDate,
  formatShortDate,
  formatTime,
  formatVolume,
  formatWeekday,
  formatWeight,
} from '@/lib/format';
import { WorkoutDatePicker } from './workout-date-picker';

/** Falls back to today when the `date` search param is missing or unparseable. */
function resolveDate(value: string | string[] | undefined) {
  if (typeof value !== 'string') return new Date();
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date();
}

/** One headline number: label, value, and the unit or context beneath it. */
function StatTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <Card size="sm" className="justify-between">
      <CardHeader>
        <CardDescription className="eyebrow">{label}</CardDescription>
        <CardAction>
          <Icon className="size-4 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="metric break-words">{value}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage({
  searchParams,
}: PageProps<'/dashboard'>) {
  await auth.protect();

  const date = resolveDate((await searchParams).date);
  const day = format(date, 'yyyy-MM-dd');

  const [workouts, stats, recent, exercises] = await Promise.all([
    getWorkoutsForDate(date),
    getTrainingStats(),
    getRecentWorkouts(5),
    getRecentExercises(4),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Training log</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            {formatDate(date)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {workouts.length === 0
              ? 'Nothing logged yet for this day.'
              : `${workouts.length} session${workouts.length === 1 ? '' : 's'} logged on this day.`}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <WorkoutDatePicker date={date} />
          <Button
            render={<Link href={`/dashboard/workout/new?date=${day}`} />}
            nativeButton={false}
            size="lg"
            className="justify-center"
          >
            <PlusIcon data-icon="inline-start" />
            Log workout
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="This week"
          value={String(stats.sessions)}
          hint="sessions since Monday"
          icon={CalendarDaysIcon}
        />
        <StatTile
          label="Volume"
          value={formatVolume(stats.volumeKg)}
          hint="kg lifted this week"
          icon={FlameIcon}
        />
        <StatTile
          label="Sets"
          value={String(stats.sets)}
          hint="working sets this week"
          icon={LayersIcon}
        />
        <StatTile
          label="All time"
          value={String(stats.totalSessions)}
          hint="sessions on record"
          icon={ActivityIcon}
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Sessions</CardTitle>
            <CardDescription>{formatDate(date)}</CardDescription>
            <CardAction>
              <Badge variant="outline" className="rounded-sm tabular-nums">
                {workouts.length}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {workouts.length === 0 ? (
              <Empty className="px-(--card-spacing)">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <DumbbellIcon />
                  </EmptyMedia>
                  <EmptyTitle>No sessions logged</EmptyTitle>
                  <EmptyDescription>
                    Pick another date, or start a session for{' '}
                    {formatDate(date)}.
                  </EmptyDescription>
                </EmptyHeader>
                <Button
                  render={<Link href={`/dashboard/workout/new?date=${day}`} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                >
                  <PlusIcon data-icon="inline-start" />
                  Log workout
                </Button>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-(--card-spacing)">
                      Workout
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Started
                    </TableHead>
                    <TableHead className="text-right">Exercises</TableHead>
                    <TableHead className="text-right">Sets</TableHead>
                    <TableHead className="pr-(--card-spacing) text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workouts.map((workout) => (
                    <TableRow key={workout.id}>
                      <TableCell className="pl-(--card-spacing)">
                        <Button
                          render={
                            <Link href={`/dashboard/workout/${workout.id}`} />
                          }
                          nativeButton={false}
                          variant="link"
                          className="h-auto max-w-[16ch] justify-start truncate p-0 font-heading font-medium text-foreground sm:max-w-none"
                        >
                          {workout.title ?? 'Workout'}
                        </Button>
                        <span className="block text-xs text-muted-foreground sm:hidden">
                          {formatTime(workout.startedAt)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                        {formatTime(workout.startedAt)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {workout.exerciseCount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {workout.setCount}
                      </TableCell>
                      <TableCell className="pr-(--card-spacing) text-right">
                        <Badge
                          variant={workout.completedAt ? 'secondary' : 'outline'}
                          className="rounded-sm"
                        >
                          {workout.completedAt ? 'Done' : 'Open'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Recent sessions</CardTitle>
              <CardDescription>Your last five workouts</CardDescription>
              <CardAction>
                <HistoryIcon className="size-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent className="px-0">
              {recent.length === 0 ? (
                <p className="px-(--card-spacing) text-sm text-muted-foreground">
                  Sessions appear here as soon as you log one.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((workout) => (
                    <li key={workout.id}>
                      <Link
                        href={`/dashboard/workout/${workout.id}`}
                        className="group flex items-center gap-3 px-(--card-spacing) py-2.5 transition-colors hover:bg-muted/60"
                      >
                        <span className="flex w-11 shrink-0 flex-col items-center border-r border-border pr-3">
                          <span className="eyebrow">
                            {formatWeekday(workout.startedAt)}
                          </span>
                          <span className="mt-1 font-heading text-sm font-semibold tabular-nums">
                            {format(workout.startedAt, 'd')}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {workout.title ?? 'Workout'}
                          </span>
                          <span className="block text-xs text-muted-foreground tabular-nums">
                            {formatShortDate(workout.startedAt)} ·{' '}
                            {workout.exerciseCount} exercises · {workout.setCount}{' '}
                            sets
                          </span>
                        </span>
                        <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Exercise history</CardTitle>
              <CardDescription>Best sets from recent sessions</CardDescription>
              <CardAction>
                <DumbbellIcon className="size-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent className="px-0">
              {exercises.length === 0 ? (
                <p className="px-(--card-spacing) text-sm text-muted-foreground">
                  Add exercises to a session to build history here.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {exercises.map((exercise) => (
                    <li
                      key={exercise.name}
                      className="flex items-center justify-between gap-3 px-(--card-spacing) py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {exercise.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {exercise.muscleGroup ?? 'general'} ·{' '}
                          {formatShortDate(exercise.lastPerformed)} ·{' '}
                          {exercise.sets} sets
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-heading text-sm font-semibold tabular-nums">
                          {formatWeight(exercise.bestWeightKg)}
                        </span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {exercise.bestReps} reps
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
