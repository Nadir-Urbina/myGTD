'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Inbox, CheckSquare, Calendar, FolderOpen } from 'lucide-react';

const navigationItems = [
  {
    name: 'Inbox',
    href: '/inbox',
    icon: Inbox,
    description: 'Capture new tasks and ideas',
  },
  {
    name: 'Next Actions',
    href: '/next-actions',
    icon: CheckSquare,
    description: 'Your actionable tasks',
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    description: 'Scheduled actions',
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: FolderOpen,
    description: 'Multi-step initiatives',
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-r border-gray-200 w-64 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">MyGTD</h1>
        
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5" />
                <div>
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 