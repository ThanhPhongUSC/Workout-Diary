import { auth } from '@clerk/nextjs/server';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import {
  ArrowRightIcon,
  ClockIcon,
  LineChartIcon,
  NotebookPenIcon,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/** A fixed sample session, shown only as a preview of what a log looks like. */
const sampleSets = [
  { exercise: 'Back squat', load: '120 kg', reps: '5 × 5', tag: 'Working' },
  { exercise: 'Romanian deadlift', load: '90 kg', reps: '3 × 8', tag: 'Working' },
  { exercise: 'Split squat', load: '24 kg', reps: '3 × 10', tag: 'Accessory' },
  { exercise: 'Hanging leg raise', load: 'Bodyweight', reps: '3 × 12', tag: 'Core' },
];

const principles = [
  {
    icon: NotebookPenIcon,
    title: 'Log in seconds',
    body: 'Title, date, notes. Sets go in as fast as you can type them, on the gym floor or after.',
  },
  {
    icon: LineChartIcon,
    title: 'Load you can read',
    body: 'Weekly tonnage, set counts, and session frequency, computed from what you actually lifted.',
  },
  {
    icon: ClockIcon,
    title: 'History that compounds',
    body: 'Every exercise keeps its own record, so your last best set is always one glance away.',
  },
];

export default async function Home() {
  const { isAuthenticated } = await auth();
  if (isAuthenticated) redirect('/dashboard');

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-20">
      <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0">
          <p className="eyebrow">A training journal, not a feed</p>
          <h1 className="mt-4 text-4xl leading-[1.02] font-semibold text-balance sm:text-5xl lg:text-6xl">
            Log the work.
            <span className="block text-primary">Watch it compound.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
            Lifting Diary keeps every session, set, and rep in one precise
            record — so progress is something you read, not something you guess.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <SignUpButton mode="modal">
              <Button size="lg" className="h-11 justify-center px-5 text-sm">
                Start logging
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button
                variant="outline"
                size="lg"
                className="h-11 justify-center px-5 text-sm"
              >
                I already train here
              </Button>
            </SignInButton>
          </div>

          <p className="mt-6 font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Kilograms or pounds · Bodyweight aware · Yours alone
          </p>
        </div>

        <Card className="min-w-0">
          <CardHeader className="border-b">
            <CardTitle className="tracking-tight">Lower body — heavy</CardTitle>
            <CardDescription className="tabular-nums">
              Monday · 18:30 · 4 exercises
            </CardDescription>
            <CardAction>
              <Badge variant="secondary" className="rounded-sm">
                Sample
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-(--card-spacing)">Exercise</TableHead>
                  <TableHead className="text-right">Load</TableHead>
                  <TableHead className="pr-(--card-spacing) text-right">
                    Sets
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleSets.map((set) => (
                  <TableRow key={set.exercise}>
                    <TableCell className="pl-(--card-spacing) font-medium">
                      <span className="block truncate">{set.exercise}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {set.tag}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {set.load}
                    </TableCell>
                    <TableCell className="pr-(--card-spacing) text-right tabular-nums">
                      {set.reps}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="mt-16 border-t border-border pt-10 sm:mt-24">
        <div className="grid gap-4 sm:grid-cols-3">
          {principles.map(({ icon: Icon, title, body }) => (
            <Card key={title} size="sm">
              <CardHeader>
                <Icon className="size-4 text-primary" />
                <CardTitle className="mt-2">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
