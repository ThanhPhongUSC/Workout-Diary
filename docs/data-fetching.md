# Data Fetching Standards

## The rule

**All data fetching in this app happens in server components. Nothing else fetches data.**

A server component reads the data it needs, awaits it, and renders. There is no
client-side fetching layer, no API layer in front of the database, and no other
path to the data.

## What is forbidden

- **Route handlers for reading data.** No `app/api/**/route.ts` that exists so
  something else can fetch from it.
- **Client components fetching.** No `fetch` in a `'use client'` file, no
  `useEffect` + `setState` loading, no SWR, no TanStack Query, no `axios`.
- **`fetch` against our own app.** A server component calling
  `fetch('/api/workouts')` is the same mistake with an extra network hop. Call
  the data helper directly.
- **Querying from anywhere except `src/data/`.** No `db` import in a page, layout,
  component, or route file.
- **Raw SQL.** No `db.execute(sql\`...\`)`, no template-literal queries, no
  string-built SQL. Drizzle's query builder and relational queries only.

Server actions (`'use server'`) are for **writes**, not reads. After a write,
revalidate and let the server component re-render with fresh data.

## Where queries live

Every database query is a helper function in `src/data/`, one file per table or
feature area:

```
src/data/
  workouts.ts
  exercises.ts
  sets.ts
```

Helpers are the only place `db` is imported. They take plain arguments, return
plain data, and are called directly (not over HTTP) from server components.

## Ownership — the critical rule

**A signed-in user may read only their own rows. Never anyone else's.**

Two rules make that true, and both are required:

**1. The user id comes from Clerk, never from the caller.**

Read it inside the helper with `auth()`. Do not accept a `userId` parameter, do
not take it from a route param, a search param, a form field, a cookie, or a
prop. Anything the client can send, the client can change.

**2. Every query filters on that user id.**

No query returns rows without a user predicate. `workouts.userId` is the anchor:

```ts
import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';

import { db, workouts } from '@/db';

/** Workouts belonging to the signed-in user, newest first. */
export async function getWorkouts() {
  const { userId } = await auth();
  if (!userId) return [];

  return db.query.workouts.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
  });
}

/** One workout, or undefined if it does not exist or is not the caller's. */
export async function getWorkout(id: string) {
  const { userId } = await auth();
  if (!userId) return undefined;

  return db.query.workouts.findFirst({
    where: { id, userId },
    with: { entries: { with: { exercise: true, sets: true } } },
  });
}
```

Note the `and userId` in `getWorkout`. Fetching by id alone and checking
ownership afterwards is not acceptable — filter in the query.

### Tables with no `userId` column

`workout_exercises` and `sets` do not carry a user id. They are reachable **only
through their parent workout**, so scope them by loading them via the workout:

```ts
// Correct: ownership is enforced by the parent workout's filter.
db.query.workouts.findFirst({
  where: { id: workoutId, userId },
  with: { entries: { with: { sets: true } } },
});
```

```ts
// Wrong: any signed-in user can pass any workoutExerciseId.
db.query.sets.findMany({ where: { workoutExerciseId } });
```

If a set or entry must be queried directly, join up to `workouts` and filter on
`workouts.userId` in the same query.

### Exercises

`exercises.userId` is nullable — a null row is a built-in exercise shared by
everyone. That is the one place another user's id is not required, and it is
still not "no filter":

```ts
where: or(isNull(exercises.userId), eq(exercises.userId, userId));
```

Never return rows where `userId` is some other user's id.

## Unauthenticated callers

If `auth()` returns no `userId`, the helper returns empty (`[]` or `undefined`).
Routes that require a session are already gated by `src/proxy.ts`; the check in
the helper is the second lock, not the first.

## Checklist for any new query

1. Is it a function in `src/data/`?
2. Does it get `userId` from `auth()` rather than an argument?
3. Does the query itself filter on that `userId` (directly or through `workouts`)?
4. Is it Drizzle, with no raw SQL?
5. Is it called from a server component, not a route handler or client component?

If any answer is no, the query is wrong.
