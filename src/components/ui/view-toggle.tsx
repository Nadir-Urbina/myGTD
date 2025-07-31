'use client';

import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewType = 'list' | 'board';

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <div className={cn('flex items-center border border-gray-200 rounded-lg p-1 bg-gray-50', className)}>
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors',
          view === 'list'
            ? 'bg-white shadow-sm text-gray-900'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        <List className="h-4 w-4" />
        List
      </Button>
      <Button
        variant={view === 'board' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('board')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors',
          view === 'board'
            ? 'bg-white shadow-sm text-gray-900'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        Board
      </Button>
    </div>
  );
} 