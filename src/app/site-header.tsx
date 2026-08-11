'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';
import { DumbbellIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';

const navigation = [
  { href: '/dashboard', label: 'Log' },
  { href: '/dashboard/workout/new', label: 'New workout' },
];

/** App-wide header: brand mark, primary navigation, theme and account controls. */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2 font-heading text-sm font-semibold tracking-[0.16em] uppercase"
        >
          <DumbbellIcon className="size-4 text-primary" />
          Lifting Diary
        </Link>

        <Show when="signed-in">
          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            {navigation.map((item) => (
              <Button
                key={item.href}
                render={<Link href={item.href} />}
                nativeButton={false}
                variant="ghost"
                size="sm"
                className={cn(
                  'font-medium text-muted-foreground',
                  pathname === item.href && 'bg-muted text-foreground',
                )}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </Show>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Start logging</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
