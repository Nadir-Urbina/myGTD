'use client';

import { useState } from 'react';
import { Issue, IssueType, IssuePriority, IssueStatus } from '@/types';
import { AITaskCard } from './ai-task-card';
import { AIIssueCard } from './ai-issue-card';
import { ConfirmationDialog } from './confirmation-dialog';
import { Button } from './button';
import { useLanguage } from '@/contexts/language-context';
import { 
  Bug, 
  Lightbulb, 
  TrendingUp, 
  Search, 
  HelpCircle,
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  GitBranch,
  Ban,
  MoreHorizontal,
  Edit3,
  Trash2,
  ArrowRight,
  User,
  Tag,
  Calendar,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: Issue;
  onEdit?: (issue: Issue) => void;
  onDelete?: (issueId: string) => void;
  onPromoteToNextAction?: (issue: Issue) => void;
  onStatusChange?: (issueId: string, status: IssueStatus) => void;
  enableAI?: boolean;
  showProject?: boolean;
  compact?: boolean;
  className?: string;
}

export function IssueCard({
  issue,
  onEdit,
  onDelete,
  onPromoteToNextAction,
  onStatusChange,
  enableAI = true,
  showProject = true,
  compact = false,
  className
}: IssueCardProps) {
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

  // Color mapping for issue types
  const typeColors = {
    [IssueType.BUG]: 'text-red-500 bg-red-50 border-red-200',
    [IssueType.FEATURE]: 'text-blue-500 bg-blue-50 border-blue-200',
    [IssueType.IMPROVEMENT]: 'text-green-500 bg-green-50 border-green-200',
    [IssueType.RESEARCH]: 'text-purple-500 bg-purple-50 border-purple-200',
    [IssueType.QUESTION]: 'text-yellow-500 bg-yellow-50 border-yellow-200',
  };

  // Priority icons and colors
  const priorityConfig = {
    [IssuePriority.CRITICAL]: { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' },
    [IssuePriority.HIGH]: { icon: ArrowUp, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    [IssuePriority.MEDIUM]: { icon: Minus, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    [IssuePriority.LOW]: { icon: ArrowDown, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  };

  // Status icons and colors
  const statusConfig = {
    [IssueStatus.OPEN]: { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' },
    [IssueStatus.IN_PROGRESS]: { icon: Play, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    [IssueStatus.RESOLVED]: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
    [IssueStatus.CLOSED]: { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' },
    [IssueStatus.DUPLICATE]: { icon: GitBranch, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    [IssueStatus.WONT_FIX]: { icon: Ban, color: 'text-red-600', bgColor: 'bg-red-100' },
  };

  const TypeIcon = typeIcons[issue.type];
  const PriorityIcon = priorityConfig[issue.priority].icon;
  const StatusIcon = statusConfig[issue.status].icon;

  const handleDelete = () => {
    setDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    onDelete?.(issue.id);
    setDeleteConfirmation(false);
  };

  const handlePromoteToNextAction = () => {
    onPromoteToNextAction?.(issue);
    setShowMenu(false);
  };

  const handleStatusChange = (newStatus: IssueStatus) => {
    onStatusChange?.(issue.id, newStatus);
    setShowMenu(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    }).format(date);
  };

  const cardContent = (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200',
      compact ? 'p-3' : 'p-4',
      className
    )}>
      {/* Row 1: AI Analysis Chips - Only show when AI is enabled */}
      {enableAI && (
        <div className="flex items-center justify-end gap-2 mb-3 min-h-[28px]" id="ai-chips-row">
          {/* AI chips will be rendered here by AIIssueCard wrapper */}
        </div>
      )}

      {/* Row 2: Issue Title */}
      <div className="flex items-start gap-2 mb-3">
        {/* Type Icon */}
        <div className={cn(
          'flex items-center justify-center w-6 h-6 rounded border flex-shrink-0',
          typeColors[issue.type]
        )}>
          <TypeIcon className="h-3 w-3" />
        </div>
        
        {/* Title */}
        <h3 className={cn(
          'font-medium text-gray-900 flex-1',
          compact ? 'text-sm' : 'text-base'
        )}>
          {issue.title}
        </h3>

        {/* Actions Menu */}
        <div className="relative flex items-center gap-2 flex-shrink-0">
          {/* Priority Badge */}
          <div className={cn(
            'flex items-center justify-center w-5 h-5 rounded-full',
            priorityConfig[issue.priority].color,
            priorityConfig[issue.priority].bgColor
          )}>
            <PriorityIcon className="h-3 w-3" />
          </div>

          {/* More Actions */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-500" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute top-8 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48">
              <button
                onClick={() => onEdit?.(issue)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit3 className="h-4 w-4" />
                Edit Issue
              </button>
              
              {issue.status === IssueStatus.OPEN && (
                <button
                  onClick={handlePromoteToNextAction}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <ArrowRight className="h-4 w-4" />
                  Promote to Next Action
                </button>
              )}

              <div className="border-t border-gray-100 my-1"></div>
              
              {/* Status Change Options */}
              {issue.status !== IssueStatus.IN_PROGRESS && (
                <button
                  onClick={() => handleStatusChange(IssueStatus.IN_PROGRESS)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Play className="h-4 w-4" />
                  Mark In Progress
                </button>
              )}
              
              {issue.status !== IssueStatus.RESOLVED && (
                <button
                  onClick={() => handleStatusChange(IssueStatus.RESOLVED)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark Resolved
                </button>
              )}

              <div className="border-t border-gray-100 my-1"></div>
              
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Issue
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {issue.description && !compact && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {issue.description}
        </p>
      )}

      {/* Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {issue.labels.slice(0, compact ? 2 : 4).map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              <Tag className="h-3 w-3" />
              {label}
            </span>
          ))}
          {issue.labels.length > (compact ? 2 : 4) && (
            <span className="text-xs text-gray-500">
              +{issue.labels.length - (compact ? 2 : 4)} more
            </span>
          )}
        </div>
      )}

      {/* Row 3: Status and Date */}
      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
        {/* Column 1: Status */}
        <div className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-full w-fit',
          statusConfig[issue.status].color,
          statusConfig[issue.status].bgColor
        )}>
          <StatusIcon className="h-3 w-3" />
          <span className="capitalize">{issue.status.replace('_', ' ')}</span>
        </div>

        {/* Column 2: Created Date */}
        <div className="flex items-center gap-1 justify-end">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(issue.createdAt)}</span>
        </div>
      </div>

      {/* Reproduction Steps for Bugs */}
      {issue.type === IssueType.BUG && issue.reproductionSteps && !compact && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
          <div className="font-medium text-red-800 mb-1">Reproduction Steps:</div>
          <div className="text-red-700 line-clamp-2">{issue.reproductionSteps}</div>
        </div>
      )}

      {/* Acceptance Criteria for Features */}
      {issue.type === IssueType.FEATURE && issue.acceptanceCriteria && !compact && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-medium text-blue-800 mb-1">Acceptance Criteria:</div>
          <div className="text-blue-700 line-clamp-2">{issue.acceptanceCriteria}</div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {enableAI ? (
        <AIIssueCard
          issue={issue}
          className="relative"
          enableAI={enableAI}
        >
          {cardContent}
        </AIIssueCard>
      ) : (
        cardContent
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation}
        onCancel={() => setDeleteConfirmation(false)}
        onConfirm={confirmDelete}
        title="Delete Issue"
        message="Are you sure you want to delete this issue? This action cannot be undone."
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
