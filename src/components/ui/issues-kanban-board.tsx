'use client';

import { useState, useMemo } from 'react';
import { Issue, IssueStatus, IssueType, IssuePriority } from '@/types';
import { IssueCard } from './issue-card';
import { Button } from './button';
import { useLanguage } from '@/contexts/language-context';
import { 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle, 
  GitBranch, 
  Ban,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IssuesKanbanBoardProps {
  issues: Issue[];
  onEdit?: (issue: Issue) => void;
  onDelete?: (issueId: string) => void;
  onPromoteToNextAction?: (issue: Issue) => void;
  onStatusChange?: (issueId: string, status: IssueStatus) => void;
  onCreateIssue?: () => void;
  enableAI?: boolean;
  showProjectInfo?: boolean;
  className?: string;
}

interface FilterState {
  type?: IssueType;
  priority?: IssuePriority;
  search?: string;
  projectId?: string;
}

export function IssuesKanbanBoard({
  issues,
  onEdit,
  onDelete,
  onPromoteToNextAction,
  onStatusChange,
  onCreateIssue,
  enableAI = true,
  showProjectInfo = true,
  className
}: IssuesKanbanBoardProps) {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<FilterState>({});
  const [showFilters, setShowFilters] = useState(false);

  // Status columns configuration
  const columns = [
    {
      status: IssueStatus.OPEN,
      title: 'Open',
      icon: Clock,
      color: 'bg-gray-50 border-gray-200',
      headerColor: 'text-gray-700',
      description: 'Issues waiting to be worked on'
    },
    {
      status: IssueStatus.IN_PROGRESS,
      title: 'In Progress',
      icon: Play,
      color: 'bg-blue-50 border-blue-200',
      headerColor: 'text-blue-700',
      description: 'Issues currently being worked on'
    },
    {
      status: IssueStatus.RESOLVED,
      title: 'Resolved',
      icon: CheckCircle,
      color: 'bg-green-50 border-green-200',
      headerColor: 'text-green-700',
      description: 'Issues that have been fixed'
    },
    {
      status: IssueStatus.CLOSED,
      title: 'Closed',
      icon: XCircle,
      color: 'bg-gray-50 border-gray-200',
      headerColor: 'text-gray-700',
      description: 'Issues that are completed'
    }
  ];

  // Filter issues based on current filters
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Type filter
      if (filters.type && issue.type !== filters.type) return false;
      
      // Priority filter
      if (filters.priority && issue.priority !== filters.priority) return false;
      
      // Project filter removed - issues are now organized by trackers
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(searchLower);
        const matchesDescription = issue.description?.toLowerCase().includes(searchLower) || false;
        const matchesLabels = issue.labels?.some(label => 
          label.toLowerCase().includes(searchLower)
        ) || false;
        
        if (!matchesTitle && !matchesDescription && !matchesLabels) return false;
      }
      
      return true;
    });
  }, [issues, filters]);

  // Group issues by status
  const issuesByStatus = useMemo(() => {
    const grouped: Record<IssueStatus, Issue[]> = {
      [IssueStatus.OPEN]: [],
      [IssueStatus.IN_PROGRESS]: [],
      [IssueStatus.RESOLVED]: [],
      [IssueStatus.CLOSED]: [],
      [IssueStatus.DUPLICATE]: [],
      [IssueStatus.WONT_FIX]: []
    };

    filteredIssues.forEach(issue => {
      grouped[issue.status].push(issue);
    });

    return grouped;
  }, [filteredIssues]);

  // Get unique values for filters
  const uniqueTypes = useMemo(() => 
    Array.from(new Set(issues.map(issue => issue.type))), [issues]
  );
  
  const uniquePriorities = useMemo(() => 
    Array.from(new Set(issues.map(issue => issue.priority))), [issues]
  );

  // Project filtering removed - issues are now organized by issue trackers
  const uniqueProjects = useMemo(() => [], []);

  const handleFilterChange = (key: keyof FilterState, value: string | IssueType | IssuePriority | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === prev[key] ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header with Filters */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Main Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
            <p className="text-gray-600">
              Track bugs, features, and improvements
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2',
                hasActiveFilters && 'border-blue-500 text-blue-600'
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </Button>
            
            {onCreateIssue && (
              <Button onClick={onCreateIssue} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Issue
              </Button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Filters</h3>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search issues..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All priorities</option>
                  {uniquePriorities.map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Filter removed - issues are now organized by trackers */}
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex gap-6 overflow-x-auto pb-4">
          {columns.map(column => {
            const columnIssues = issuesByStatus[column.status] || [];
            const Icon = column.icon;
            
            return (
              <div
                key={column.status}
                className={cn(
                  'flex-shrink-0 w-80 border-2 border-dashed rounded-lg',
                  column.color
                )}
              >
                {/* Column Header */}
                <div className={cn('p-4 border-b border-gray-200', column.headerColor)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <h3 className="font-semibold">{column.title}</h3>
                      <span className="bg-white bg-opacity-80 text-gray-600 text-sm px-2 py-0.5 rounded-full">
                        {columnIssues.length}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm opacity-75">{column.description}</p>
                </div>

                {/* Issues List */}
                <div className="p-4 space-y-3 h-96 overflow-y-auto">
                  {columnIssues.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No issues in {column.title.toLowerCase()}</p>
                    </div>
                  ) : (
                    columnIssues.map(issue => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onPromoteToNextAction={onPromoteToNextAction}
                        onStatusChange={onStatusChange}
                        enableAI={enableAI}
                        showProject={showProjectInfo}
                        compact={true}
                        className="bg-white"
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-6">
            <span>Total Issues: <strong>{filteredIssues.length}</strong></span>
            <span>Open: <strong>{issuesByStatus[IssueStatus.OPEN].length}</strong></span>
            <span>In Progress: <strong>{issuesByStatus[IssueStatus.IN_PROGRESS].length}</strong></span>
            <span>Resolved: <strong>{issuesByStatus[IssueStatus.RESOLVED].length}</strong></span>
          </div>
          
          {hasActiveFilters && (
            <span className="text-blue-600">
              Filtered from {issues.length} total issues
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
