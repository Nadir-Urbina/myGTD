'use client';

import { NextAction, NextActionStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { AITaskCard } from '@/components/ui/ai-task-card';
import { formatDate, cn } from '@/lib/utils';
import { Clock, Calendar, CheckCircle, CircleDot, ChevronRight } from 'lucide-react';

interface NextActionsKanbanBoardProps {
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
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    headerBg: 'bg-gray-100',
  },
  [NextActionStatus.SCHEDULED]: {
    label: 'Scheduled',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    headerBg: 'bg-blue-100',
  },
  [NextActionStatus.DONE]: {
    label: 'Done',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    headerBg: 'bg-green-100',
  },
};

const ActionCard = ({ 
  action, 
  onStatusChange, 
  onDeleteAction, 
  onActionClick 
}: {
  action: NextAction;
  onStatusChange: (action: NextAction, newStatus: NextActionStatus) => void;
  onDeleteAction: (actionId: string) => void;
  onActionClick: (actionId: string) => void;
}) => {
  const handleStatusClick = (newStatus: NextActionStatus) => {
    if (action.status !== newStatus) {
      onStatusChange(action, newStatus);
    }
  };

  return (
    <AITaskCard
      taskTitle={action.title}
      taskDescription={action.description}
      className="mb-3"
      enableAI={action.status !== NextActionStatus.DONE}
    >
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="p-4" onClick={() => onActionClick(action.id)}>
          <div className="flex items-start justify-between mb-3">
            <h3 className={cn(
              "font-medium text-sm leading-5 pr-2",
              action.status === NextActionStatus.DONE 
                ? "text-gray-500 line-through" 
                : "text-gray-900"
            )}>
              {action.title}
            </h3>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>

          {action.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
              {action.description}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(action.createdAt)}
            </div>

            {action.context && (
              <div className="inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                {action.context}
              </div>
            )}

            {action.estimatedDuration && (
              <div className="text-xs text-gray-500">
                ~{action.estimatedDuration}min
              </div>
            )}

            {action.scheduledDate && (
              <div className="flex items-center text-xs text-blue-600">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(action.scheduledDate)}
              </div>
            )}

            {action.completedDate && (
              <div className="flex items-center text-xs text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed {formatDate(action.completedDate)}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-1 mb-2">
            {Object.values(NextActionStatus).map((status) => {
              const config = statusConfig[status];
              const Icon = config.icon;
              const isActive = action.status === status;

              return (
                <Button
                  key={status}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusClick(status);
                  }}
                  className={cn(
                    "flex items-center gap-1 text-xs h-7 px-2",
                    isActive && "pointer-events-none"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span>{config.label}</span>
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteAction(action.id);
            }}
            className="w-full h-7 text-xs"
          >
            Delete
          </Button>
        </div>
      </div>
    </AITaskCard>
  );
};

const KanbanColumn = ({ 
  status, 
  actions, 
  onStatusChange, 
  onDeleteAction, 
  onActionClick 
}: {
  status: NextActionStatus;
  actions: NextAction[];
  onStatusChange: (action: NextAction, newStatus: NextActionStatus) => void;
  onDeleteAction: (actionId: string) => void;
  onActionClick: (actionId: string) => void;
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      "rounded-lg border-2 min-h-[400px] flex flex-col",
      config.borderColor,
      config.bgColor
    )}>
      <div className={cn(
        "p-4 rounded-t-lg border-b-2",
        config.headerBg,
        config.borderColor
      )}>
        <div className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5", config.color)} />
          <h3 className="font-semibold text-gray-900">
            {config.label}
          </h3>
          <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
            {actions.length}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1">
        {actions.length > 0 ? (
          <div className="space-y-3">
            {actions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onStatusChange={onStatusChange}
                onDeleteAction={onDeleteAction}
                onActionClick={onActionClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Icon className={cn("h-8 w-8 mx-auto mb-2 opacity-50", config.color)} />
            <p className="text-sm">No {config.label.toLowerCase()} actions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const NextActionsKanbanBoard = ({ 
  nextActions, 
  onStatusChange, 
  onDeleteAction, 
  onActionClick 
}: NextActionsKanbanBoardProps) => {
  const groupedActions = {
    [NextActionStatus.QUEUED]: nextActions.filter(action => action.status === NextActionStatus.QUEUED),
    [NextActionStatus.SCHEDULED]: nextActions.filter(action => action.status === NextActionStatus.SCHEDULED),
    [NextActionStatus.DONE]: nextActions.filter(action => action.status === NextActionStatus.DONE),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {Object.entries(groupedActions).map(([status, actions]) => (
        <KanbanColumn
          key={status}
          status={status as NextActionStatus}
          actions={actions}
          onStatusChange={onStatusChange}
          onDeleteAction={onDeleteAction}
          onActionClick={onActionClick}
        />
      ))}
    </div>
  );
}; 