# Auth Coding Standards

## The rule

**Clerk is the only authentication in this app. Nothing else authenticates a user.**

The package is `@clerk/nextjs` v7 (Clerk Core 3). Sessions, sign-in, sign-up,
sign-out, and the user record all belong to Clerk. This app stores a Clerk user
id and nothing more.

## What is forbidden

- **Any other auth library.** No NextAuth/Auth.js, no Lucia, no Passport, no
  hand-rolled JWTs or session cookies.
- **A users table.** We do not mirror, cache, or sync Clerk users into Postgres.
  `userId` columns hold the Clerk id (`text`) and are not foreign keys.
- **Passwords, tokens, or session data in our database.** Clerk holds them.
- **`CLERK_SECRET_KEY` outside server code.** Never in a `'use client'` file,
  never behind a `NEXT_PUBLIC_` name, never sent to the browser.
- **Trusting a user id from the request.** Not from a prop, route param, search
  param, form field, header, or cookie. See `docs/data-fetching.md`.
- **Removed Core 3 APIs.** `authMiddleware()`, `withClerkMiddleware()`,
  `<SignedIn>`, `<SignedOut>`, `<Protect>`, and `createRouteMatcher()` are gone
  or deprecated. The replacements are below.
- **Editing `src/proxy.ts` to add auth checks.** It stays as it is (see below).

## Setup — already done, do not redo

Three pieces exist and are the whole integration:

1. `src/app/layout.tsx` wraps the tree in `<ClerkProvider>`.
2. `src/proxy.ts` exports `clerkMiddleware()` with its `config.matcher`.
   (Next 16 renamed `middleware.ts` to `proxy.ts`.)
3. `.env` holds `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

`src/proxy.ts` must stay a bare `clerkMiddleware()`. It attaches the session to
the request; it does **not** gate routes. Clerk Core 3 moved protection out of
middleware and onto each resource, and this app follows that.

## Reading the session

**Server components, server actions, route handlers** — `auth()` from
`@clerk/nextjs/server`. It is async; always `await` it.

```ts
import { auth } from '@clerk/nextjs/server';

const { isAuthenticated, userId } = await auth();
```

Use `isAuthenticated` for the check, `userId` for the value. Do not reach for
`currentUser()` or `clerkClient()` just to get an id — `auth()` already has it,
without a network call.

**Client components** — `useAuth()` (ids, `getToken`) or `useUser()` (profile
fields) from `@clerk/nextjs`. Both need `isLoaded` handled before `isSignedIn`,
or the UI flashes signed-out on first paint.

Client-side checks are cosmetic. They decide what renders, never what is
allowed. Every real decision happens on the server.

## Protecting a resource

**Protect at the resource, not in the middleware.** Every page, layout, server
action, and route handler that requires a session says so itself.

The default is `auth.protect()`. It redirects an unauthenticated visitor to
sign-in from a page, and returns 401 from an action or route handler:

```tsx
import { auth } from '@clerk/nextjs/server';

export default async function Page() {
  await auth.protect();
  // ...
}
```

```ts
'use server';
import { auth } from '@clerk/nextjs/server';

export async function createWorkout(formData: FormData) {
  const { userId } = await auth.protect();
  // ...
}
```

When the unauthenticated case needs its own UI or a different destination, check
explicitly instead:

```tsx
const { isAuthenticated, redirectToSignIn } = await auth();
if (!isAuthenticated) return redirectToSignIn();
```

Put the check on the page rather than a shared layout when only some routes
under it are private — a layout does not re-run on every navigation, so it is a
weaker guarantee than a per-page check.

Protecting the page is not enough on its own. The query still filters on
`userId` (`docs/data-fetching.md`); the two locks are independent.

## Auth UI

Clerk's own components only. They are exempt from the "shadcn only" rule in
`docs/ui.md`, and they are the only exemption.

- `<SignInButton>` / `<SignUpButton>` — entry points. `mode="modal"` matches
  what the header already does.
- `<UserButton>` — the account menu and sign-out. Do not build a sign-out
  button; call nothing manually.
- `<Show when="signed-in">` / `<Show when="signed-out">` — conditional rendering,
  with an optional `fallback`. This replaces `<SignedIn>` / `<SignedOut>`.
- `<Show when={{ role: 'admin' }}>` — replaces `<Protect>`.

Never build a custom sign-in or sign-up form, and never post credentials to our
own endpoint. `<Show>` hides pixels and nothing else — never rely on it to keep
data out of a response.

Style Clerk components through their `appearance` prop, not by targeting their
internal class names.

## The user id

`userId` from `auth()` is an opaque Clerk string (`user_...`). Store it in `text`
columns exactly as given.

- `workouts.userId` is `not null` — every workout belongs to someone.
- `exercises.userId` is nullable, and null means built-in and shared. Null is the
  only case where a row is legitimately not the caller's.
- Never display a raw id. Use `useUser()` or `<UserButton>` for anything a person
  reads.

## Checklist for anything auth-touching

1. Is Clerk the only thing deciding who the user is?
2. Does every private page, action, and handler protect itself, rather than
   relying on `src/proxy.ts`?
3. Does `userId` come from `await auth()` and never from the request?
4. Is the auth UI a Clerk component rather than something hand-built?
5. Is `CLERK_SECRET_KEY` confined to server code?

If any answer is no, the code is wrong.

## Known gap

`src/app/dashboard/page.tsx` does not call `auth.protect()`. It is safe today
only because `getWorkoutsForDate` returns `[]` without a session, which renders
an empty dashboard to a signed-out visitor instead of sending them to sign-in.
Add the guard when the page is next touched.
