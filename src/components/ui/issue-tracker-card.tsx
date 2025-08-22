'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IssueTracker, IssueType } from '@/types';
import { ConfirmationDialog } from './confirmation-dialog';
import { Button } from './button';
import { useLanguage } from '@/contexts/language-context';
import { 
  Bug, 
  Lightbulb, 
  TrendingUp, 
  Search, 
  HelpCircle,
  MoreHorizontal,
  Edit3,
  Trash2,
  ExternalLink,
  Calendar,
  Settings,
  BarChart3,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IssueTrackerCardProps {
  tracker: IssueTracker;
  onEdit?: (tracker: IssueTracker) => void;
  onDelete?: (trackerId: string) => void;
  className?: string;
}

export function IssueTrackerCard({
  tracker,
  onEdit,
  onDelete,
  className
}: IssueTrackerCardProps) {
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  // Icon mapping for issue types
  const typeIcons = {
    [IssueType.BUG]: Bug,
    [IssueType.FEATURE]: Lightbulb,
    [IssueType.IMPROVEMENT]: TrendingUp,
    [IssueType.RESEARCH]: Search,
    [IssueType.QUESTION]: HelpCircle,
  };

  const handleDelete = () => {
    setDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    onDelete?.(tracker.id);
    setDeleteConfirmation(false);
  };

  const formatDate = (date: Date | unknown) => {
    // Handle null/undefined dates
    if (!date) {
      return 'No date';
    }
    
    // Ensure we have a proper Date object
    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else if ((date as Record<string, unknown>)?.toDate && typeof (date as Record<string, unknown>).toDate === 'function') {
      // Handle Firestore Timestamp objects
      dateObj = ((date as Record<string, unknown>).toDate as () => Date)();
    } else {
      // Try to convert to Date
      dateObj = new Date(date as string | number | Date);
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    }).format(dateObj);
  };

  return (
    <>
      <div className={cn(
        'bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200',
        className
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <Link href={`/issues/${tracker.id}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate">
                {tracker.name}
              </h3>
            </Link>
            {tracker.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {tracker.description}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          <div className="relative ml-4">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute top-10 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48">
                <Link
                  href={`/issues/${tracker.id}`}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowMenu(false)}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Board
                </Link>
                
                <button
                  onClick={() => {
                    onEdit?.(tracker);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Tracker
                </button>

                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Tracker
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {tracker.issueCount || 0} issues
            </span>
          </div>
          
          {tracker.lastActivityAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {formatDate(tracker.lastActivityAt)}
              </span>
            </div>
          )}
        </div>

        {/* Allowed Issue Types */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Issue Types:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {tracker.settings.allowedIssueTypes.map((type) => {
              const Icon = typeIcons[type];
              return (
                <span
                  key={type}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  <Icon className="h-3 w-3" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              );
            })}
          </div>
        </div>

        {/* Project Link */}
        {tracker.projectId && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <FolderOpen className="h-4 w-4" />
            <span>Linked to Project</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Created {formatDate(tracker.createdAt)}
          </div>
          
          <Link href={`/issues/${tracker.id}`}>
            <Button size="sm" className="flex items-center gap-2">
              <ExternalLink className="h-3 w-3" />
              Open Board
            </Button>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation}
        onCancel={() => setDeleteConfirmation(false)}
        onConfirm={confirmDelete}
        title="Delete Issue Tracker"
        message={`Are you sure you want to delete "${tracker.name}"? This will also delete all associated issues and cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Click outside handler for menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  );
}
