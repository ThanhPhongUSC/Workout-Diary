'use client';

import { MoonIcon, SunIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Flips the `dark` class on `<html>` and remembers the choice.
 *
 * Both icons render and CSS picks the visible one, so the button never
 * disagrees with the server-rendered markup on first paint.
 */
export function ThemeToggle() {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => {
        const dark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
      }}
    >
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </Button>
  );
}
