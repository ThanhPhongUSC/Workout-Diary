# UI Coding Standards

## The rule

**Only shadcn/ui components may be used to build the UI. Do not create custom components.**

Every button, input, dialog, card, table, menu, badge, form field, and every other
interface element must come from a shadcn component installed into
`src/components/ui/`. If the UI needs an element, install it from the shadcn registry:

```
npx shadcn@latest add <component>
```

If a component does not exist in the registry, stop and ask before building anything.
Do not hand-roll a replacement.

## What is forbidden

- Writing a new component file that renders raw markup as a UI primitive
  (`<button>`, `<input>`, `<select>`, `<dialog>`, custom modals, custom dropdowns).
- Importing `@base-ui/react` directly. shadcn wraps Base UI internally, and that
  wrapper is the only supported entry point.
- Wrapper components that exist only to preset props on a shadcn component
  (`<PrimaryButton />`, `<SmallCard />`). Pass `variant` and `size` at the call site.
- Reimplementing something the registry already provides because the installed
  version is inconvenient.
- Third-party UI libraries. The dependency list for UI is shadcn, Tailwind, and
  `lucide-react` for icons. Nothing else.

## What is allowed

Composition in route and feature files. A page assembling `Card`, `Table`, and
`Button` into a workout log is not a custom component: it is a page. Put it in
`src/app/` next to the route that uses it.

That is the boundary. Assembling shadcn components is expected; creating new UI
primitives is not.

## Styling

- Tailwind utilities only, applied via the `className` prop on shadcn components.
- Use semantic theme tokens: `bg-background`, `text-foreground`, `text-muted-foreground`,
  `bg-card`, `border-border`, `bg-primary`, `text-destructive`.
- Never use raw palette colors (`bg-zinc-50`, `text-black`, `dark:bg-black`). They
  break theming and force manual `dark:` variants that the tokens handle already.
- No CSS modules, no styled-components, no inline `style` objects, no new global CSS.
  Theme values live in `src/app/globals.css` and are changed there or not at all.
- Merge classes with `cn()` from `@/lib/utils`.
- Icons come from `lucide-react`.

## Dates

Format dates with `date-fns`. Nothing else — no `toLocaleDateString`, no
`Intl.DateTimeFormat`, no manual string building, no other date library.

The display format is `do MMM yyyy`:

```ts
import { format } from 'date-fns';

format(date, 'do MMM yyyy');
```

```
1st Sep 2025
2nd Aug 2025
3rd Jan 2026
4th Jun 2024
```

`do` renders the ordinal day, so 1st/2nd/3rd/4th/21st all come out correctly
without any suffix logic of your own.

Rules:

- Keep the format string in one shared helper rather than repeating `'do MMM yyyy'`
  at every call site, so the format changes in one place.
- Timestamps from the database are `timestamptz` and arrive as `Date` objects from
  Drizzle. Pass them straight to `format` — do not stringify and reparse.
- If a screen needs a different shape (relative times, month headers), use the
  matching `date-fns` function. Do not hand-write the formatting.

## Editing `src/components/ui/`

These files are generated. Treat them as vendored code:

- Do not edit them to fit one screen. Use `className` and existing variants instead.
- Adding a variant to an existing `cva` block is acceptable when several screens
  need it. Rewriting the component is not.
- Re-running `npx shadcn@latest add` overwrites the file, so any edit must be one
  you are willing to reapply.

## Project setup

Configured in `components.json`: `base-nova` style, `neutral` base color, RSC on,
CSS variables on, `lucide` icons, alias `@/components/ui`. Do not change these
without changing every installed component to match.

## Type and theme

Three fonts are loaded in `src/app/layout.tsx` and reached only through Tailwind
utilities, never by importing the font object again:

- `font-sans` (Inter) — body copy, labels, inputs. The default on `<html>`.
- `font-heading` (Archivo) — `h1`–`h3`, card titles, and headline numbers. Base
  styles already apply it with `tracking-tight`; do not restate that.
- `font-mono` (Geist Mono) — the `eyebrow` utility only.

Two utilities in `globals.css` carry the recurring type treatments. Use them
rather than rebuilding the same stack of classes:

- `eyebrow` — the small uppercase mono label above a heading or on a stat tile.
- `metric` — a headline number on a stat tile.

Numerals that sit in a column (times, weights, counts, volumes) take
`tabular-nums` so they align between rows.

The palette is cool graphite neutrals plus a single warm signal hue. `primary`
is the only saturated colour in the system: spend it on the main action, an
active metric, or one accented word in a headline, and let borders, surfaces,
and text stay neutral. There are no gradients.

Clerk's components are themed once, through `appearance` on `ClerkProvider`,
with variables pointing at the CSS tokens (`var(--primary)` and friends) so they
follow the light/dark toggle. Clerk ignores some of those variables — its modal
surface stays light in both themes — which is a Clerk limitation, not something
to work around with custom CSS.
