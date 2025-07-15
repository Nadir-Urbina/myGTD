'use client';

import { Navigation } from './navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation />
      <main className="flex-1 ml-64 overflow-hidden">
        <div className="h-full p-8">
          {children}
        </div>
      </main>
    </div>
  );
} 