# Routing Coding Standards

## The rule

**Every route in this app lives under `/dashboard`. `/` exists only to redirect there.**

There is one application, and its root is `/dashboard`. A new screen is a new
segment underneath it — never a new top-level path.

```
/                                  redirect to /dashboard
/dashboard                         the workout log
/dashboard/workout/new             create a workout
/dashboard/workout/[workoutId]     edit a workout
```

Route protection is **not** covered here. Read `docs/auth.md` — it owns who may
reach a route and how that is enforced.

## What is forbidden

- **Top-level routes beside `/dashboard`.** No `/workouts`, no `/settings`, no
  `/profile`. They go to `/dashboard/settings`, `/dashboard/profile`, and so on.
- **Hand-written page prop types.** Next 16 generates `PageProps<'/route'>` and
  `LayoutProps<'/route'>` as globals. Use them; do not type `params` yourself.
- **Reading `params` or `searchParams` synchronously.** Both are Promises in
  Next 16 and must be awaited.
- **`<a href="/dashboard/...">` for internal navigation.** Use `next/link`.
- **`router.push()` inside a server action.** Server code redirects with
  `redirect()` from `next/navigation`.
- **Route groups, parallel routes, or intercepting routes** (`(group)`, `@slot`,
  `(.)path`) added speculatively. Introduce one only when a screen genuinely
  needs it.
- **Editing the `config.matcher` in `src/proxy.ts` when adding a route.** It
  already matches everything; a new route needs no change there.

## Segment naming

- Segments are lowercase and hyphenated: `workout/new`, not `workout/New`.
- Segments read as nouns and are singular: `workout/[workoutId]`, not
  `workouts/[id]`.
- Dynamic segments are camelCase and carry the entity name — `[workoutId]`, not
  `[id]`. This is what makes `PageProps<'/dashboard/workout/[workoutId]'>`
  readable at the call site.

## Files inside a route folder

A route folder holds the page and everything only that page uses:

```
src/app/dashboard/workout/[workoutId]/
  page.tsx              server component, the route itself
  edit-workout-form.tsx client component, colocated
  actions.ts            server actions for this route
```

- `page.tsx` is an `async` server component. It awaits its params, loads data,
  and composes shadcn components (`docs/ui.md`).
- Client components are kebab-case files colocated in the route folder, named
  for what they are (`workout-date-picker.tsx`, `new-workout-form.tsx`).
- Server actions live in `actions.ts` in the same folder, marked `'use server'`
  (`docs/data-mutations.md`).
- Once a second route needs something, it stops being route-local: queries move
  to `src/data/`, helpers to `src/lib/`. Do not import across route folders.
- No `index.ts` barrel files anywhere in `src/app/`.

## Params and search params

Both are Promises. Await them inside the component:

```tsx
export default async function EditWorkoutPage({
  params,
}: PageProps<'/dashboard/workout/[workoutId]'>) {
  const { workoutId } = await params;
}
```

**Validate a dynamic segment before it reaches the database.** A route param is
a string from the URL and can be anything. An id that is not a uuid must 404,
not throw:

```tsx
import { notFound } from 'next/navigation';
import { z } from 'zod';

const { workoutId } = await params;
// A non-uuid id would make Postgres throw rather than render a 404.
if (!z.uuid().safeParse(workoutId).success) notFound();

const workout = await getWorkout(workoutId);
if (!workout) notFound();
```

Search params hold **view state** — which day the dashboard is showing, which
tab is open. They are always optional and always have a fallback, because a user
can type anything into the address bar:

```tsx
/** Falls back to today when the `date` search param is missing or unparseable. */
function resolveDate(value: string | string[] | undefined) {
  if (typeof value !== 'string') return new Date();
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date();
}
```

Search params never carry identity or ownership. A `userId` in the URL is not
the caller — see `docs/data-fetching.md`.

Dates in a URL use `yyyy-MM-dd` (`?date=2026-08-07`), formatted with `date-fns`.
That is a wire format and is unrelated to the display format in `docs/ui.md`.

## Linking

Internal navigation uses `next/link` with a literal path starting `/dashboard`:

```tsx
<Link href={`/dashboard/workout/${workout.id}`}>{workout.title}</Link>
```

When a link should look like a button, render the shadcn `Button` as a `Link`
rather than nesting one inside the other:

```tsx
<Button
  render={<Link href={`/dashboard/workout/new?date=${format(date, 'yyyy-MM-dd')}`} />}
  nativeButton={false}
  size="lg"
>
  <PlusIcon data-icon="inline-start" />
  New workout
</Button>
```

Write hrefs as template literals. Do not assemble paths from a base-URL variable
or a helper that hides which route is being linked.

## Redirecting

From a server action, after the write and after revalidation:

```ts
const day = format(workout.startedAt, 'yyyy-MM-dd');
revalidatePath('/dashboard');
revalidatePath(`/dashboard/workout/${id}`);
redirect(`/dashboard?date=${day}`);
```

- `redirect()` throws, so nothing after it runs. It goes last.
- Revalidate every path whose data the write changed, before redirecting.
- Redirect targets are app-absolute (`/dashboard?date=...`), never relative.
- A redirect after a mutation lands on the screen that shows the result — the
  dashboard for the affected day, not a generic index.

## Checklist for any new route

1. Does the path sit under `/dashboard`?
2. Is the folder lowercase-hyphenated, with a camelCase dynamic segment?
3. Does `page.tsx` use `PageProps<'/its/path'>` and await `params`/`searchParams`?
4. Is every dynamic segment validated before it hits a query, with `notFound()`
   for a bad or missing record?
5. Does every search param have a fallback?
6. Are its client components and `actions.ts` colocated, and does nothing import
   across route folders?
7. Does it protect itself per `docs/auth.md`?

If any answer is no, the route is wrong.

## The root route

`/` is the one route outside `/dashboard`, and it holds the signed-out landing
page. A signed-in visitor never sees it:

```tsx
const { isAuthenticated } = await auth();
if (isAuthenticated) redirect('/dashboard');
```

That check goes at the top of `src/app/page.tsx` and nowhere else. Do not add
further top-level routes to sit beside it.
