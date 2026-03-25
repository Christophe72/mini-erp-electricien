import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Mini ERP Électricien',
  description: 'Gestion simple clients, travaux et trésorerie',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script src="/theme-init.js" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <div className="fixed right-3 top-2 z-50">
          <ThemeToggle />
        </div>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <header className="mb-6 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 dark:shadow-slate-800/50">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Mini ERP Électricien</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Clients, interventions, trésorerie et seuil mensuel
                </p>
              </div>

              <nav className="flex flex-wrap items-center gap-2 text-sm">
                <Link className="rounded-lg bg-slate-100 px-3 py-2 font-medium hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="rounded-lg bg-slate-100 px-3 py-2 font-medium hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700" href="/clients">
                  Clients
                </Link>
                <Link className="rounded-lg bg-slate-100 px-3 py-2 font-medium hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700" href="/interventions">
                  Interventions
                </Link>
                <Link className="rounded-lg bg-slate-100 px-3 py-2 font-medium hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700" href="/tresorerie">
                  Trésorerie
                </Link>
                <Link className="rounded-lg bg-slate-100 px-3 py-2 font-medium hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700" href="/parametres">
                  Paramètres
                </Link>
              </nav>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
