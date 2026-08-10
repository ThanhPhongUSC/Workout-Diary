import { auth } from '@clerk/nextjs/server';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function Home() {
  const { isAuthenticated } = await auth();
  if (isAuthenticated) redirect('/dashboard');

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-6 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Lifting Diary</CardTitle>
          <CardDescription>
            Log your workouts, track your sets, and see your progress over time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <SignInButton mode="modal" />
          <SignUpButton mode="modal" />
        </CardContent>
      </Card>
    </main>
  );
}
