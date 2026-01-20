import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur-lg bg-[var(--bg-primary)]/80 border-b border-[var(--border-color)]">
        <div className="container py-4">
          <a 
            href="/" 
            className="text-xl font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-2"
          >
            <span className="text-2xl">⚔️</span>
            WynnTracker
          </a>
        </div>
      </header>
      <main className="container py-8 md:py-12">
        {children}
      </main>
      <footer className="border-t border-[var(--border-color)] mt-auto">
        <div className="container py-6 text-center text-sm text-[var(--text-muted)]">
          Tracking Wynncraft character stats over time
        </div>
      </footer>
    </div>
  );
}
