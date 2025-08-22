'use client';

import { useState, useEffect } from 'react';
import { Issue, IssueType, IssuePriority, IssueStatus, IssueEffort, Project } from '@/types';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
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
  X,
  Plus,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IssueFormProps {
  issue?: Issue;
  projects?: Project[];
  issueTrackerId: string; // Required: which tracker this issue belongs to
  onSubmit: (issueData: Omit<Issue, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  className?: string;
  // Tracker-specific props
  defaultType?: IssueType;
  defaultPriority?: IssuePriority;
  allowedTypes?: IssueType[];
}

export function IssueForm({
  issue,
  projects = [],
  issueTrackerId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
  defaultType,
  defaultPriority,
  allowedTypes
}: IssueFormProps) {
  const { t } = useLanguage();
  
  // Form state
  const [formData, setFormData] = useState({
    title: issue?.title || '',
    description: issue?.description || '',
    notes: issue?.notes || '',
    type: issue?.type || defaultType || IssueType.BUG,
    priority: issue?.priority || defaultPriority || IssuePriority.MEDIUM,
    status: issue?.status || IssueStatus.OPEN,

    assignee: issue?.assignee || '',
    reporter: issue?.reporter || '',
    estimatedEffort: issue?.estimatedEffort || '',
    reproductionSteps: issue?.reproductionSteps || '',
    acceptanceCriteria: issue?.acceptanceCriteria || '',
    environment: issue?.environment || '',
    labels: issue?.labels || [],
  });

  const [newLabel, setNewLabel] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when issue changes
  useEffect(() => {
    if (issue) {
      setFormData({
        title: issue.title,
        description: issue.description || '',
        notes: issue.notes || '',
        type: issue.type,
        priority: issue.priority,
        status: issue.status,

        assignee: issue.assignee || '',
        reporter: issue.reporter || '',
        estimatedEffort: issue.estimatedEffort || '',
        reproductionSteps: issue.reproductionSteps || '',
        acceptanceCriteria: issue.acceptanceCriteria || '',
        environment: issue.environment || '',
        labels: issue.labels || [],
      });
    }
  }, [issue]);

  // Type configuration
  const typeConfig = {
    [IssueType.BUG]: { 
      icon: Bug, 
      label: 'Bug', 
      color: 'text-red-500 bg-red-50 border-red-200 hover:bg-red-100',
      description: 'Something is not working correctly'
    },
    [IssueType.FEATURE]: { 
      icon: Lightbulb, 
      label: 'Feature', 
      color: 'text-blue-500 bg-blue-50 border-blue-200 hover:bg-blue-100',
      description: 'A new feature or enhancement'
    },
    [IssueType.IMPROVEMENT]: { 
      icon: TrendingUp, 
      label: 'Improvement', 
      color: 'text-green-500 bg-green-50 border-green-200 hover:bg-green-100',
      description: 'An improvement to existing functionality'
    },
    [IssueType.RESEARCH]: { 
      icon: Search, 
      label: 'Research', 
      color: 'text-purple-500 bg-purple-50 border-purple-200 hover:bg-purple-100',
      description: 'Research or investigation needed'
    },
    [IssueType.QUESTION]: { 
      icon: HelpCircle, 
      label: 'Question', 
      color: 'text-yellow-500 bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
      description: 'A question that needs an answer'
    },
  };

  // Priority configuration
  const priorityConfig = {
    [IssuePriority.CRITICAL]: { 
      icon: AlertTriangle, 
      label: 'Critical', 
      color: 'text-red-600 bg-red-100 border-red-300 hover:bg-red-200',
      description: 'Blocks release or causes data loss'
    },
    [IssuePriority.HIGH]: { 
      icon: ArrowUp, 
      label: 'High', 
      color: 'text-orange-600 bg-orange-100 border-orange-300 hover:bg-orange-200',
      description: 'Important issue that should be fixed soon'
    },
    [IssuePriority.MEDIUM]: { 
      icon: Minus, 
      label: 'Medium', 
      color: 'text-yellow-600 bg-yellow-100 border-yellow-300 hover:bg-yellow-200',
      description: 'Normal priority issue'
    },
    [IssuePriority.LOW]: { 
      icon: ArrowDown, 
      label: 'Low', 
      color: 'text-gray-600 bg-gray-100 border-gray-300 hover:bg-gray-200',
      description: 'Nice to have, not urgent'
    },
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.type === IssueType.BUG && !formData.reproductionSteps.trim()) {
      newErrors.reproductionSteps = 'Reproduction steps are required for bugs';
    }

    if (formData.type === IssueType.FEATURE && !formData.acceptanceCriteria.trim()) {
      newErrors.acceptanceCriteria = 'Acceptance criteria are required for features';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Build the issue data
    const issueData: Omit<Issue, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      type: formData.type,
      priority: formData.priority,
      status: formData.status,
      issueTrackerId: issueTrackerId,
      assignee: formData.assignee.trim() || undefined,
      reporter: formData.reporter.trim() || undefined,
      estimatedEffort: formData.estimatedEffort as IssueEffort || undefined,
      reproductionSteps: formData.reproductionSteps.trim() || undefined,
      acceptanceCriteria: formData.acceptanceCriteria.trim() || undefined,
      environment: formData.environment.trim() || undefined,
      labels: formData.labels.length > 0 ? formData.labels : undefined,
      // Preserve existing analysis data
      is2MinuteRuleCandidate: issue?.is2MinuteRuleCandidate,
      isProjectCandidate: issue?.isProjectCandidate,
      aiAnalysisDate: issue?.aiAnalysisDate,
      aiAnalysisData: issue?.aiAnalysisData,
      // Preserve dates for existing issues
      resolvedAt: issue?.resolvedAt,
      closedAt: issue?.closedAt,
      nextActionId: issue?.nextActionId,
      attachments: issue?.attachments,
    };

    onSubmit(issueData);
  };

  const handleInputChange = (field: string, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addLabel = () => {
    const trimmedLabel = newLabel.trim();
    if (trimmedLabel && !formData.labels.includes(trimmedLabel)) {
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, trimmedLabel]
      }));
      setNewLabel('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(label => label !== labelToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLabel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {issue ? 'Edit Issue' : 'Create New Issue'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Brief description of the issue"
            className={errors.title ? 'border-red-300' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-600 mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Detailed description of the issue"
            rows={3}
          />
        </div>
      </div>

      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Issue Type *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {Object.entries(typeConfig)
            .filter(([type]) => !allowedTypes || allowedTypes.includes(type as IssueType))
            .map(([type, config]) => {
            const Icon = config.icon;
            const isSelected = formData.type === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleInputChange('type', type)}
                className={cn(
                  'flex items-center gap-3 p-3 border rounded-lg text-left transition-colors',
                  isSelected 
                    ? config.color 
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <Icon className="h-5 w-5" />
                <div>
                  <div className="font-medium text-sm">{config.label}</div>
                  <div className="text-xs text-gray-500">{config.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Priority Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority *
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {Object.entries(priorityConfig).map(([priority, config]) => {
            const Icon = config.icon;
            const isSelected = formData.priority === priority;
            return (
              <button
                key={priority}
                type="button"
                onClick={() => handleInputChange('priority', priority)}
                className={cn(
                  'flex items-center gap-2 p-3 border rounded-lg transition-colors',
                  isSelected 
                    ? config.color 
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <Icon className="h-4 w-4" />
                <div>
                  <div className="font-medium text-sm">{config.label}</div>
                  <div className="text-xs text-gray-500">{config.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>



      {/* Assignment and Reporter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
            Assignee
          </label>
          <Input
            id="assignee"
            value={formData.assignee}
            onChange={(e) => handleInputChange('assignee', e.target.value)}
            placeholder="Who should work on this?"
          />
        </div>
        <div>
          <label htmlFor="reporter" className="block text-sm font-medium text-gray-700 mb-1">
            Reporter
          </label>
          <Input
            id="reporter"
            value={formData.reporter}
            onChange={(e) => handleInputChange('reporter', e.target.value)}
            placeholder="Who reported this issue?"
          />
        </div>
      </div>

      {/* Labels */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Labels
        </label>
        <div className="space-y-2">
          {/* Existing Labels */}
          {formData.labels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  <Tag className="h-3 w-3" />
                  {label}
                  <button
                    type="button"
                    onClick={() => removeLabel(label)}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Add New Label */}
          <div className="flex gap-2">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a label..."
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addLabel}
              variant="outline"
              size="sm"
              disabled={!newLabel.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Type-specific Fields */}
      {formData.type === IssueType.BUG && (
        <div className="space-y-4">
          <div>
            <label htmlFor="reproductionSteps" className="block text-sm font-medium text-gray-700 mb-1">
              Reproduction Steps *
            </label>
            <Textarea
              id="reproductionSteps"
              value={formData.reproductionSteps}
              onChange={(e) => handleInputChange('reproductionSteps', e.target.value)}
              placeholder="1. Go to...&#10;2. Click on...&#10;3. Expected vs actual behavior"
              rows={4}
              className={errors.reproductionSteps ? 'border-red-300' : ''}
            />
            {errors.reproductionSteps && (
              <p className="text-sm text-red-600 mt-1">{errors.reproductionSteps}</p>
            )}
          </div>
          <div>
            <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">
              Environment
            </label>
            <Input
              id="environment"
              value={formData.environment}
              onChange={(e) => handleInputChange('environment', e.target.value)}
              placeholder="Browser, OS, device, etc."
            />
          </div>
        </div>
      )}

      {formData.type === IssueType.FEATURE && (
        <div>
          <label htmlFor="acceptanceCriteria" className="block text-sm font-medium text-gray-700 mb-1">
            Acceptance Criteria *
          </label>
          <Textarea
            id="acceptanceCriteria"
            value={formData.acceptanceCriteria}
            onChange={(e) => handleInputChange('acceptanceCriteria', e.target.value)}
            placeholder="Given... When... Then...&#10;Or list of requirements for completion"
            rows={4}
            className={errors.acceptanceCriteria ? 'border-red-300' : ''}
          />
          {errors.acceptanceCriteria && (
            <p className="text-sm text-red-600 mt-1">{errors.acceptanceCriteria}</p>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes
        </label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Any additional notes or context..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (issue ? 'Update Issue' : 'Create Issue')}
        </Button>
      </div>
    </form>
  );
}
