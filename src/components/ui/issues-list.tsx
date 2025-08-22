'use client';

import { useState, useMemo } from 'react';
import { Issue, IssueStatus, IssueType, IssuePriority } from '@/types';
import { IssueCard } from './issue-card';
import { Button } from './button';
import { useLanguage } from '@/contexts/language-context';
import { 
  Plus,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Calendar,
  Tag,
  User,
  AlertTriangle,
  List,
  Grid
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IssuesListProps {
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
  status?: IssueStatus;
  search?: string;
  projectId?: string;
  assignee?: string;
}

type SortField = 'title' | 'createdAt' | 'priority' | 'status' | 'type';
type SortDirection = 'asc' | 'desc';

export function IssuesList({
  issues,
  onEdit,
  onDelete,
  onPromoteToNextAction,
  onStatusChange,
  onCreateIssue,
  enableAI = true,
  showProjectInfo = true,
  className
}: IssuesListProps) {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<FilterState>({});
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'compact' | 'comfortable'>('comfortable');

  // Priority order for sorting
  const priorityOrder = {
    [IssuePriority.CRITICAL]: 4,
    [IssuePriority.HIGH]: 3,
    [IssuePriority.MEDIUM]: 2,
    [IssuePriority.LOW]: 1
  };

  // Status order for sorting
  const statusOrder = {
    [IssueStatus.OPEN]: 1,
    [IssueStatus.IN_PROGRESS]: 2,
    [IssueStatus.RESOLVED]: 3,
    [IssueStatus.CLOSED]: 4,
    [IssueStatus.DUPLICATE]: 5,
    [IssueStatus.WONT_FIX]: 6
  };

  // Filter and sort issues
  const processedIssues = useMemo(() => {
    const filteredIssues = issues.filter(issue => {
      // Type filter
      if (filters.type && issue.type !== filters.type) return false;
      
      // Priority filter
      if (filters.priority && issue.priority !== filters.priority) return false;
      
      // Status filter
      if (filters.status && issue.status !== filters.status) return false;
      
      // Project filter removed - issues are now organized by trackers
      
      // Assignee filter
      if (filters.assignee && issue.assignee !== filters.assignee) return false;
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(searchLower);
        const matchesDescription = issue.description?.toLowerCase().includes(searchLower) || false;
        const matchesLabels = issue.labels?.some(label => 
          label.toLowerCase().includes(searchLower)
        ) || false;
        const matchesAssignee = issue.assignee?.toLowerCase().includes(searchLower) || false;
        
        if (!matchesTitle && !matchesDescription && !matchesLabels && !matchesAssignee) return false;
      }
      
      return true;
    });

    // Sort issues
    filteredIssues.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filteredIssues;
  }, [issues, filters, sortField, sortDirection]);

  // Get unique values for filters
  const uniqueTypes = useMemo(() => 
    Array.from(new Set(issues.map(issue => issue.type))), [issues]
  );
  
  const uniquePriorities = useMemo(() => 
    Array.from(new Set(issues.map(issue => issue.priority))), [issues]
  );

  const uniqueStatuses = useMemo(() => 
    Array.from(new Set(issues.map(issue => issue.status))), [issues]
  );

  const uniqueAssignees = useMemo(() => 
    Array.from(new Set(issues.map(issue => issue.assignee).filter(Boolean))), [issues]
  );

  // Project filtering removed - issues are now organized by trackers
  const uniqueProjects = useMemo(() => [], []);

  const handleFilterChange = (key: keyof FilterState, value: string | IssueType | IssuePriority | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === prev[key] ? undefined : value
    }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  const SortIcon = sortDirection === 'asc' ? SortAsc : SortDesc;

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Main Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
            <p className="text-gray-600">
              {processedIssues.length} of {issues.length} issues
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('compact')}
                className={cn(
                  'px-3 py-2 text-sm flex items-center gap-2 rounded-l-lg transition-colors',
                  viewMode === 'compact' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <List className="h-4 w-4" />
                Compact
              </button>
              <button
                onClick={() => setViewMode('comfortable')}
                className={cn(
                  'px-3 py-2 text-sm flex items-center gap-2 rounded-r-lg transition-colors',
                  viewMode === 'comfortable' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Grid className="h-4 w-4" />
                Comfortable
              </button>
            </div>

            {/* Filters Toggle */}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                    placeholder="Search..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All statuses</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
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

              {/* Assignee Filter */}
              {uniqueAssignees.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={filters.assignee || ''}
                    onChange={(e) => handleFilterChange('assignee', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All assignees</option>
                    {uniqueAssignees.map(assignee => (
                      <option key={assignee} value={assignee}>
                        {assignee}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Project Filter removed - issues are now organized by trackers */}
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">Sort by:</span>
          
          <button
            onClick={() => handleSort('createdAt')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors',
              sortField === 'createdAt' && 'bg-blue-100 text-blue-700'
            )}
          >
            <Calendar className="h-4 w-4" />
            Date
            {sortField === 'createdAt' && <SortIcon className="h-3 w-3" />}
          </button>

          <button
            onClick={() => handleSort('priority')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors',
              sortField === 'priority' && 'bg-blue-100 text-blue-700'
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            Priority
            {sortField === 'priority' && <SortIcon className="h-3 w-3" />}
          </button>

          <button
            onClick={() => handleSort('status')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors',
              sortField === 'status' && 'bg-blue-100 text-blue-700'
            )}
          >
            <Tag className="h-4 w-4" />
            Status
            {sortField === 'status' && <SortIcon className="h-3 w-3" />}
          </button>

          <button
            onClick={() => handleSort('title')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors',
              sortField === 'title' && 'bg-blue-100 text-blue-700'
            )}
          >
            Title
            {sortField === 'title' && <SortIcon className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto">
        {processedIssues.length === 0 ? (
          <div className="text-center py-12">
            {hasActiveFilters ? (
              <div>
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No issues match your filters</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters to see more results.</p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div>
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No issues yet</h3>
                <p className="text-gray-600 mb-4">Create your first issue to get started.</p>
                {onCreateIssue && (
                  <Button onClick={onCreateIssue}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Issue
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={cn(
            'grid gap-4',
            viewMode === 'compact' 
              ? 'grid-cols-1' 
              : 'grid-cols-1 lg:grid-cols-2'
          )}>
            {processedIssues.map(issue => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onEdit={onEdit}
                onDelete={onDelete}
                onPromoteToNextAction={onPromoteToNextAction}
                onStatusChange={onStatusChange}
                enableAI={enableAI}
                showProject={showProjectInfo}
                compact={viewMode === 'compact'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
