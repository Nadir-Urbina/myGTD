'use client';

import { useState, useEffect } from 'react';
import { IssueTracker, IssueType, IssuePriority, Project } from '@/types';
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
  X,
  Settings,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IssueTrackerFormProps {
  tracker?: IssueTracker;
  projects?: Project[];
  onSubmit: (trackerData: Omit<IssueTracker, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export function IssueTrackerForm({
  tracker,
  projects = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  className
}: IssueTrackerFormProps) {
  const { t } = useLanguage();
  
  // Form state
  const [formData, setFormData] = useState({
    title: tracker?.title || '',
    name: tracker?.name || '',
    description: tracker?.description || '',
    notes: tracker?.notes || '',
    projectId: tracker?.projectId || '',
    settings: {
      allowedIssueTypes: tracker?.settings.allowedIssueTypes || [IssueType.BUG, IssueType.FEATURE],
      defaultPriority: tracker?.settings.defaultPriority || IssuePriority.MEDIUM,
      autoPromoteToNextActions: tracker?.settings.autoPromoteToNextActions || false,
      enableAIAnalysis: tracker?.settings.enableAIAnalysis ?? true,
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when tracker changes
  useEffect(() => {
    if (tracker) {
      setFormData({
        title: tracker.title,
        name: tracker.name,
        description: tracker.description || '',
        notes: tracker.notes || '',
        projectId: tracker.projectId || '',
        settings: {
          allowedIssueTypes: tracker.settings.allowedIssueTypes,
          defaultPriority: tracker.settings.defaultPriority,
          autoPromoteToNextActions: tracker.settings.autoPromoteToNextActions,
          enableAIAnalysis: tracker.settings.enableAIAnalysis ?? true,
        }
      });
    }
  }, [tracker]);

  // Issue type configuration
  const issueTypeConfig = {
    [IssueType.BUG]: { 
      icon: Bug, 
      label: 'Bug', 
      color: 'text-red-500 bg-red-50 border-red-200',
      description: 'Something is not working correctly'
    },
    [IssueType.FEATURE]: { 
      icon: Lightbulb, 
      label: 'Feature', 
      color: 'text-blue-500 bg-blue-50 border-blue-200',
      description: 'A new feature or enhancement'
    },
    [IssueType.IMPROVEMENT]: { 
      icon: TrendingUp, 
      label: 'Improvement', 
      color: 'text-green-500 bg-green-50 border-green-200',
      description: 'An improvement to existing functionality'
    },
    [IssueType.RESEARCH]: { 
      icon: Search, 
      label: 'Research', 
      color: 'text-purple-500 bg-purple-50 border-purple-200',
      description: 'Research or investigation needed'
    },
    [IssueType.QUESTION]: { 
      icon: HelpCircle, 
      label: 'Question', 
      color: 'text-yellow-500 bg-yellow-50 border-yellow-200',
      description: 'A question that needs an answer'
    },
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tracker name is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.settings.allowedIssueTypes.length === 0) {
      newErrors.allowedIssueTypes = 'At least one issue type must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Build the tracker data
    const trackerData: Omit<IssueTracker, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      title: formData.title.trim(),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      projectId: formData.projectId || undefined,
      settings: formData.settings,
      // Preserve existing counts and dates for existing trackers
      issueCount: tracker?.issueCount,
      lastActivityAt: tracker?.lastActivityAt,
      // Preserve existing analysis data
      is2MinuteRuleCandidate: tracker?.is2MinuteRuleCandidate,
      isProjectCandidate: tracker?.isProjectCandidate,
      aiAnalysisDate: tracker?.aiAnalysisDate,
      aiAnalysisData: tracker?.aiAnalysisData,
    };

    onSubmit(trackerData);
  };

  const handleInputChange = (field: string, value: string | boolean | IssueType[] | IssuePriority) => {
    if (field.startsWith('settings.')) {
      const settingKey = field.replace('settings.', '');
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingKey]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleIssueType = (type: IssueType) => {
    const currentTypes = formData.settings.allowedIssueTypes;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    handleInputChange('settings.allowedIssueTypes', newTypes);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {tracker ? 'Edit Issue Tracker' : 'Create New Issue Tracker'}
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
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Tracker Name *
          </label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Website Redesign, Mobile App v2"
            className={errors.name ? 'border-red-300' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Title (for BaseItem compatibility) */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Internal title for the tracker"
            className={errors.title ? 'border-red-300' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-600 mt-1">{errors.title}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            This is used internally for search and organization
          </p>
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
            placeholder="Brief description of what this tracker is for"
            rows={3}
          />
        </div>
      </div>

      {/* Project Assignment */}
      {projects.length > 0 && (
        <div>
          <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
            <FolderOpen className="inline h-4 w-4 mr-1" />
            Link to Project (Optional)
          </label>
          <select
            id="projectId"
            value={formData.projectId}
            onChange={(e) => handleInputChange('projectId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">No project linked</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Linking to a project allows for better organization and reporting
          </p>
        </div>
      )}

      {/* Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-5 w-5 text-gray-500" />
          <h3 className="text-base font-medium text-gray-900">Tracker Settings</h3>
        </div>

        {/* Allowed Issue Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Allowed Issue Types *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(issueTypeConfig).map(([type, config]) => {
              const Icon = config.icon;
              const isSelected = formData.settings.allowedIssueTypes.includes(type as IssueType);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleIssueType(type as IssueType)}
                  className={cn(
                    'flex items-center gap-2 p-3 border rounded-lg text-left transition-colors',
                    isSelected 
                      ? config.color 
                      : 'border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium text-sm">{config.label}</div>
                    <div className="text-xs opacity-75">{config.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.allowedIssueTypes && (
            <p className="text-sm text-red-600 mt-1">{errors.allowedIssueTypes}</p>
          )}
        </div>

        {/* Default Priority */}
        <div>
          <label htmlFor="defaultPriority" className="block text-sm font-medium text-gray-700 mb-1">
            Default Priority
          </label>
          <select
            id="defaultPriority"
            value={formData.settings.defaultPriority}
            onChange={(e) => handleInputChange('settings.defaultPriority', e.target.value as IssuePriority)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={IssuePriority.LOW}>Low</option>
            <option value={IssuePriority.MEDIUM}>Medium</option>
            <option value={IssuePriority.HIGH}>High</option>
            <option value={IssuePriority.CRITICAL}>Critical</option>
          </select>
        </div>

        {/* Settings Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto-promote to Next Actions</label>
              <p className="text-xs text-gray-500">Automatically suggest promoting resolved issues to next actions</p>
            </div>
            <input
              type="checkbox"
              checked={formData.settings.autoPromoteToNextActions}
              onChange={(e) => handleInputChange('settings.autoPromoteToNextActions', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable AI Analysis</label>
              <p className="text-xs text-gray-500">Use AI to analyze issue complexity and provide recommendations</p>
            </div>
            <input
              type="checkbox"
              checked={formData.settings.enableAIAnalysis}
              onChange={(e) => handleInputChange('settings.enableAIAnalysis', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Any additional notes about this tracker..."
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
          {isSubmitting ? 'Saving...' : (tracker ? 'Update Tracker' : 'Create Tracker')}
        </Button>
      </div>
    </form>
  );
}
