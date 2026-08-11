import type { Metadata } from 'next';
import { Archivo, Geist_Mono, Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';

import { SiteHeader } from './site-header';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Lifting Diary',
  description: 'A precise training journal: log sessions, sets, and progress.',
};

/** Applies the stored or system theme before first paint so it never flashes. */
const themeScript = `try{const t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch{}`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col bg-background text-foreground"
      >
        <ClerkProvider
          appearance={{
            // Pointed at the theme tokens rather than fixed colours, so Clerk's
            // own UI follows the light/dark toggle with everything else.
            variables: {
              colorPrimary: 'var(--primary)',
              colorPrimaryForeground: 'var(--primary-foreground)',
              colorBackground: 'var(--card)',
              colorForeground: 'var(--card-foreground)',
              colorMuted: 'var(--muted)',
              colorMutedForeground: 'var(--muted-foreground)',
              colorInput: 'var(--background)',
              colorInputForeground: 'var(--foreground)',
              colorBorder: 'var(--border)',
              colorRing: 'var(--ring)',
              colorDanger: 'var(--destructive)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-inter)',
            },
          }}
        >
          <SiteHeader />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
