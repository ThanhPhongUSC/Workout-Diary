import { isValid, parseISO } from 'date-fns';
import { DumbbellIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { getWorkoutsForDate } from '@/data/workouts';
import { formatDate, formatTime } from '@/lib/format';
import { WorkoutDatePicker } from './workout-date-picker';

/** Falls back to today when the `date` search param is missing or unparseable. */
function resolveDate(value: string | string[] | undefined) {
  if (typeof value !== 'string') return new Date();
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date();
}

export default async function DashboardPage({
  searchParams,
}: PageProps<'/dashboard'>) {
  const date = resolveDate((await searchParams).date);
  const workouts = await getWorkoutsForDate(date);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Workouts logged on {formatDate(date)}
          </p>
        </div>

        <WorkoutDatePicker date={date} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workouts</CardTitle>
          <CardDescription>{formatDate(date)}</CardDescription>
          <CardAction>
            <Badge variant="secondary">{workouts.length}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <DumbbellIcon />
                </EmptyMedia>
                <EmptyTitle>No workouts logged</EmptyTitle>
                <EmptyDescription>
                  Nothing recorded for {formatDate(date)}. Pick another date or
                  start a new session.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workout</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="text-right">Exercises</TableHead>
                  <TableHead className="text-right">Sets</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workouts.map((workout) => (
                  <TableRow key={workout.id}>
                    <TableCell className="font-medium">
                      {workout.title ?? 'Workout'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(workout.startedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {workout.exerciseCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {workout.setCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={workout.completedAt ? 'secondary' : 'outline'}
                      >
                        {workout.completedAt ? 'Completed' : 'In progress'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
