import { auth } from '@clerk/nextjs/server';
import { isValid, parseISO } from 'date-fns';

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
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">New workout</h1>
        <p className="text-sm text-muted-foreground">
          Start a session, then add exercises and sets to it.
        </p>
      </div>

      <Card>
        <CardHeader>
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
