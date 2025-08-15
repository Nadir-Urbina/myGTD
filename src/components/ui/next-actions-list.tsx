'use client';

import { NextAction, NextActionStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { AITaskCard } from '@/components/ui/ai-task-card';
import { formatDate, cn } from '@/lib/utils';
import { Clock, Calendar, CheckCircle, CircleDot } from 'lucide-react';

interface NextActionsListProps {
  nextActions: NextAction[];
  onStatusChange: (action: NextAction, newStatus: NextActionStatus) => void;
  onDeleteAction: (actionId: string) => void;
  onActionClick: (actionId: string) => void;
}

const statusConfig = {
  [NextActionStatus.QUEUED]: {
    label: 'Queued',
    icon: CircleDot,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  [NextActionStatus.SCHEDULED]: {
    label: 'Scheduled',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  [NextActionStatus.DONE]: {
    label: 'Done',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
  },
};

export const NextActionsList = ({ 
  nextActions, 
  onStatusChange, 
  onDeleteAction, 
  onActionClick 
}: NextActionsListProps) => {
  const groupedActions = {
    [NextActionStatus.QUEUED]: nextActions.filter(action => action.status === NextActionStatus.QUEUED),
    [NextActionStatus.SCHEDULED]: nextActions.filter(action => action.status === NextActionStatus.SCHEDULED),
    [NextActionStatus.DONE]: nextActions.filter(action => action.status === NextActionStatus.DONE),
  };

  const renderStatusButton = (action: NextAction, status: NextActionStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    const isActive = action.status === status;

    return (
      <Button
        key={status}
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={() => onStatusChange(action, status)}
        className={cn(
          "flex items-center gap-1 text-xs sm:text-sm min-w-0 flex-1 sm:flex-none",
          isActive && "pointer-events-none"
        )}
      >
        <Icon className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{config.label}</span>
      </Button>
    );
  };

  return (
    <div className="space-y-8">
      {/* Render each status group */}
      {Object.entries(groupedActions).map(([status, actions]) => {
        const config = statusConfig[status as NextActionStatus];
        const Icon = config.icon;

        return (
          <div key={status}>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2 rounded-lg", config.bgColor)}>
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {config.label} ({actions.length})
              </h2>
            </div>

            {actions.length > 0 ? (
              <div className="space-y-4">
                {actions.map((action) => (
                  <AITaskCard
                    key={action.id}
                    taskTitle={action.title}
                    taskDescription={action.description}
                    className="relative"
                    enableAI={action.status !== NextActionStatus.DONE}
                    userId={action.userId}
                    itemId={action.id}
                    existingAnalysis={{
                      is2MinuteRuleCandidate: action.is2MinuteRuleCandidate,
                      isProjectCandidate: action.isProjectCandidate,
                      aiAnalysisDate: action.aiAnalysisDate,
                      aiAnalysisData: action.aiAnalysisData
                    }}
                  >
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0">
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => onActionClick(action.id)}
                        >
                          <h3 className={cn(
                            "font-medium truncate",
                            action.status === NextActionStatus.DONE 
                              ? "text-gray-500 line-through" 
                              : "text-gray-900"
                          )}>
                            {action.title}
                          </h3>
                          <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1 gap-2 md:gap-4">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(action.createdAt)}
                            </div>
                            {action.context && (
                              <div className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {action.context}
                              </div>
                            )}
                            {action.estimatedDuration && (
                              <div className="text-xs">
                                ~{action.estimatedDuration}min
                              </div>
                            )}
                          </div>
                          {action.scheduledDate && (
                            <div className="flex items-center text-sm text-blue-600 mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              Scheduled for {formatDate(action.scheduledDate)}
                            </div>
                          )}
                          {action.completedDate && (
                            <div className="flex items-center text-sm text-green-600 mt-1">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed {formatDate(action.completedDate)}
                            </div>
                          )}
                          {action.calendarInviteSent && (
                            <div className="flex items-center text-sm text-blue-600 mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              Calendar invite sent
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:ml-4">
                          <div className="flex flex-wrap gap-1">
                            {Object.values(NextActionStatus).map((statusOption) => 
                              renderStatusButton(action, statusOption)
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteAction(action.id)}
                            className="w-full sm:w-auto"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AITaskCard>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="text-gray-500">
                  No {config.label.toLowerCase()} actions
                </div>
              </div>
            )}
          </div>
        );
      })}

      {nextActions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No next actions yet!</div>
          <p className="text-sm text-gray-400">
            Start by adding your first actionable task.
          </p>
        </div>
      )}
    </div>
  );
}; 