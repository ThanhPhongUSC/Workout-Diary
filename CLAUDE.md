# Lifting Diary

Workout logging app: Next.js 16 (App Router) + React 19, Clerk auth, Drizzle ORM on Neon Postgres, Tailwind v4 + shadcn/ui.

## READ THE DOCS FIRST

**Before generating any code, ALWAYS read the relevant file in `/docs` first.**
These files are the standards for this project and they override default habits,
training-data patterns, and anything in this file.

| Topic | Read |
| --- | --- |
| UI, components, styling, dates | `docs/ui.md` |

Check `/docs` at the start of every task — the list above may be out of date, so
list the directory rather than assuming these are the only files. If a task touches
an area a doc covers, read that doc before the first line of code, not after. If no
doc covers the area, follow the conventions already in the codebase.

## Layout

- `src/app/` — routes, `layout.tsx` wraps everything in `ClerkProvider`
- `src/proxy.ts` — Clerk middleware (Next 16 renamed `middleware.ts` to `proxy.ts`)
- `src/db/schema.ts` — Drizzle tables + relations, single source of truth
- `src/db/index.ts` — `db` client (`neon-http` driver), re-exports schema
- `src/components/ui/` — shadcn components (`base-nova` style, Base UI primitives)
- `src/lib/utils.ts` — `cn()` helper

## Commands

```
npm run dev          # next dev
npm run build
npm run lint
npm run db:push      # push schema to Neon (no migration files)
npm run db:generate  # emit SQL migration to ./drizzle
npm run db:studio
```

## Data model

`exercises` (null `userId` = built-in, shared) → `workouts` → `workout_exercises` → `sets`.

- Weights stored as `weightKg` numeric(8,3); `unit` records what the user typed. Weight 0 = bodyweight.
- `workouts.completedAt` null while in progress.
- Set type from `WorkoutSet`, not `Set`, to avoid shadowing the built-in.

## Notes

- Next 16 and Drizzle 1.0 RC differ from older APIs — check `node_modules/next/dist/docs/` and current Drizzle docs before writing code.
- Env: `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
- UI work is governed by `docs/ui.md` (shadcn only, no custom components, `date-fns` for dates). Read it first.
