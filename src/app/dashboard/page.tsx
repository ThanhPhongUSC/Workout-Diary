'use client';

import { useState } from 'react';
import { CalendarIcon, DumbbellIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatTime } from '@/lib/format';

/** Placeholder rows. Replaced by a real query once data fetching is added. */
const placeholderWorkouts = [
  {
    id: '1',
    title: 'Push Day',
    startedAt: new Date(2025, 8, 1, 7, 15),
    exercises: 5,
    sets: 18,
    completed: true,
  },
  {
    id: '2',
    title: 'Evening Accessories',
    startedAt: new Date(2025, 8, 1, 18, 40),
    exercises: 3,
    sets: 9,
    completed: false,
  },
];

export default function DashboardPage() {
  const [date, setDate] = useState(() => new Date());
  const [open, setOpen] = useState(false);

  const workouts = placeholderWorkouts;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Workouts logged on {formatDate(date)}
          </p>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={<Button variant="outline" size="lg" />}
            className="w-48 justify-start font-normal"
          >
            <CalendarIcon data-icon="inline-start" />
            {formatDate(date)}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              defaultMonth={date}
              onSelect={(selected) => {
                if (selected) {
                  setDate(selected);
                  setOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
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
                      {workout.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(workout.startedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {workout.exercises}
                    </TableCell>
                    <TableCell className="text-right">{workout.sets}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={workout.completed ? 'secondary' : 'outline'}
                      >
                        {workout.completed ? 'Completed' : 'In progress'}
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
