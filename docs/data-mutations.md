# Data Mutation Standards

Reads are governed by `docs/data-fetching.md`. This document covers writes:
inserts, updates, and deletes.

## The rule

**Every mutation follows one path, and there is no other path:**

```
client component  ->  server action  ->  data helper  ->  Drizzle  ->  Postgres
  (typed call)       (actions.ts)      (src/data/*)
                      validates          owns the db
                      with zod           call
```

Three requirements, all mandatory:

1. **The database call lives in a helper in `src/data/`** that wraps Drizzle.
2. **The helper is invoked from a server action** in a colocated `actions.ts`.
3. **The action validates its arguments with zod** before doing anything else.

## What is forbidden

- **`db` imported outside `src/data/`.** Not in a page, layout, component, or
  `actions.ts`. An action calls a helper; it never writes a query itself.
- **Route handlers that mutate.** No `app/api/**/route.ts` existing so the client
  can POST to it. No `fetch()` from a client component to our own app.
- **`FormData` as a server action parameter.** See below — this is not negotiable.
- **`any`, untyped, or implicitly-typed action parameters.**
- **An action that trusts its input.** No zod schema, no mutation.
- **Mutating from a client component directly**, including any client-side ORM,
  SQL, or database client.
- **Raw SQL.** No `db.execute(sql\`...\`)`, no string-built SQL. Drizzle's query
  builder only, same as reads.
- **A `userId` passed in as an argument.** It comes from Clerk inside the helper.

## Where actions live

A server action sits in an `actions.ts` next to the route that uses it:

```
src/app/dashboard/
  page.tsx
  actions.ts          <- actions for the dashboard route
  workout-date-picker.tsx
src/app/workouts/[id]/
  page.tsx
  actions.ts          <- actions for the workout detail route
```

- The file is named `actions.ts`. Not `server-actions.ts`, not `mutations.ts`.
- `'use server'` goes at the top of the file, once, not on individual functions.
- One `actions.ts` per route segment. An action used by two routes moves to the
  nearest shared parent segment's `actions.ts`.
- Actions are thin: validate, call the helper, revalidate, return. Any logic
  beyond that belongs in the helper.

## Typed parameters — never `FormData`

**A server action takes typed arguments. It does not take `FormData`.**

`FormData` gives up every type the compiler could have checked: every field
arrives as `string | File | null`, every read needs a cast, and the action's
signature tells a caller nothing about what it wants.

```ts
// Wrong.
export async function createWorkout(formData: FormData) {
  const title = formData.get('title') as string;
}
```

```ts
// Right.
export async function createWorkout(input: { title: string; notes?: string }) {}
```

This means **no `<form action={createWorkout}>`**, because that binding is what
passes `FormData`. Forms are client components that collect their own state and
call the action with a typed object:

```tsx
'use client';

import { useState, useTransition } from 'react';

import { createWorkout } from './actions';

export function NewWorkoutForm() {
  const [title, setTitle] = useState('');
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      onClick={() => startTransition(() => createWorkout({ title }))}
    >
      Start workout
    </Button>
  );
}
```

Derive the parameter type from the zod schema rather than declaring it twice:

```ts
type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
```

## Validating with zod

**Every action validates its arguments with zod before touching anything.**

The arguments arrive over the network. A server action is a public HTTP endpoint
that anyone can call with any payload — TypeScript types are erased at runtime
and guarantee nothing about what actually shows up.

Rules:

- One schema per action, defined in the same `actions.ts`, named
  `<action>Schema`.
- Use `safeParse`. Never `parse` — an action reports failure, it does not throw
  into the client.
- Validation is the first statement in the action body.
- Constrain to what the column allows: lengths, ranges, enums, non-negative
  numbers. A schema that only checks types is not doing its job.
- Use zod 4's top-level format helpers (`z.uuid()`, `z.email()`), not the
  deprecated `z.string().uuid()` chain.

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createWorkout } from '@/data/workouts';

const createWorkoutSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export async function createWorkoutAction(
  input: z.infer<typeof createWorkoutSchema>,
) {
  const parsed = createWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, errors: z.flattenError(parsed.error).fieldErrors };
  }

  const workout = await createWorkout(parsed.data);
  revalidatePath('/dashboard');

  return { ok: true as const, workout };
}
```

Pass `parsed.data` to the helper, never the raw `input`. `parsed.data` is the
coerced, trimmed, narrowed value; `input` is whatever the caller sent.

## Mutation helpers

Helpers live in `src/data/`, in the same file as that table's read helpers —
`createWorkout` and `getWorkoutsForDate` both belong in `src/data/workouts.ts`.

A helper:

- is the only place `db` is imported;
- reads `userId` from `auth()` itself, and never accepts one as a parameter;
- takes plain typed arguments and returns plain data;
- assumes its input is already validated — it does not re-run zod.

```ts
import { auth } from '@clerk/nextjs/server';

import { db, workouts } from '@/db';

/** Starts a workout for the signed-in user and returns the new row. */
export async function createWorkout(input: { title?: string; notes?: string }) {
  const { userId } = await auth.protect();

  const [workout] = await db
    .insert(workouts)
    .values({ ...input, userId })
    .returning();

  return workout;
}
```

Use `.returning()` when the caller needs the row — a second query to read back
what you just wrote is wasted.

### Ownership on writes — the critical rule

**A write must not be able to touch another user's row.** For reads a missing
filter leaks data; for writes it destroys someone else's.

Every `update` and `delete` carries the user predicate in its `where`:

```ts
// Right: scoped by owner.
await db
  .delete(workouts)
  .where(and(eq(workouts.id, id), eq(workouts.userId, userId)));
```

```ts
// Wrong: any signed-in user can delete any workout by guessing an id.
await db.delete(workouts).where(eq(workouts.id, id));
```

Fetching the row, checking ownership in JS, then writing is not acceptable —
the predicate goes in the statement.

`workout_exercises` and `sets` have no `userId` column. Before writing to them,
confirm the parent workout belongs to the caller in the same helper, and treat a
miss as not-found:

```ts
const workout = await db.query.workouts.findFirst({
  where: { id: workoutId, userId },
  columns: { id: true },
});
if (!workout) return null;
```

`exercises` rows with a null `userId` are built-in and shared. They are readable
by everyone and **writable by no one** — never update or delete a row whose
`userId` is null.

## Multi-statement writes

The `neon-http` driver is non-interactive: `db.transaction()` with logic between
statements is not available. To send several statements together, use
`db.batch()`:

```ts
await db.batch([
  db.insert(workoutExercises).values(entry),
  db.insert(sets).values(newSets),
]);
```

If a write genuinely needs interactive transaction semantics, stop and ask —
that is a driver change (`neon-websockets`), not a decision to make inline.

## After the write

Every successful mutation invalidates the cache for what it changed:

- `revalidatePath('/dashboard')` for a route.
- `redirect()` after a create, when the user should land on the new resource.

Do not return fresh data for the client to hold in state. The server component
re-renders and re-reads through its own helper — that is the only read path.

## Return shape

Actions return a plain serializable object:

- Failure: `{ ok: false, errors }` from `z.flattenError(...).fieldErrors`.
- Success: `{ ok: true, ...data }`, or `{ ok: true }` when there is nothing to
  hand back.

Never throw a validation failure across the boundary. Let genuine faults — a
dropped connection, a constraint violation — throw and hit the error boundary;
do not wrap every helper call in a `try/catch` that swallows it.

## Checklist for any new mutation

1. Is the Drizzle call in a `src/data/` helper, and is `db` imported nowhere else?
2. Is it called from a server action in a colocated `actions.ts`?
3. Are the action's parameters typed, with no `FormData` anywhere?
4. Does a zod `safeParse` run first, and does the helper receive `parsed.data`?
5. Does the helper get `userId` from `auth()` rather than an argument?
6. Does every `update`/`delete` filter on that `userId` in the statement itself?
7. Does the action revalidate what it changed?

If any answer is no, the mutation is wrong.

## Current state

There are no mutations in the codebase yet — `src/data/workouts.ts` is
read-only and no `actions.ts` exists. This document defines the shape the first
one takes.

`zod` is **not yet a dependency**. Install it before writing the first action:

```
npm install zod
```
