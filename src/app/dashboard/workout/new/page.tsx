import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { isValid, parseISO } from 'date-fns';
import { ArrowLeftIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { NewWorkoutForm } from './new-workout-form';

/** Falls back to today when the `date` search param is missing or unparseable. */
function resolveDate(value: string | string[] | undefined) {
  if (typeof value !== 'string') return new Date();
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date();
}

export default async function NewWorkoutPage({
  searchParams,
}: PageProps<'/dashboard/workout/new'>) {
  await auth.protect();

  const defaultDate = resolveDate((await searchParams).date);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <Button
        render={<Link href="/dashboard" />}
        nativeButton={false}
        variant="ghost"
        size="sm"
        className="-ml-2 mb-4 text-muted-foreground"
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Back to log
      </Button>

      <div className="mb-6 border-b border-border pb-6">
        <p className="eyebrow">New session</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">New workout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start a session, then add exercises and sets to it.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Workout details</CardTitle>
          <CardDescription>
            Everything here is optional except the date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewWorkoutForm defaultDate={defaultDate} />
        </CardContent>
      </Card>
    </main>
  );
}
