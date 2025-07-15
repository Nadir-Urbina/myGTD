'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Clock, Calendar, CheckCircle, CircleDot, PlayCircle } from 'lucide-react';
import { NextAction, NextActionStatus } from '@/types';
import { nextActionsService } from '@/services/firebase';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Mock user ID for now - we'll add auth later
const MOCK_USER_ID = 'user_123';

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

export default function NextActionsPage() {
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    // Subscribe to next actions changes
    const unsubscribe = nextActionsService.subscribeToNextActions(MOCK_USER_ID, (actions) => {
      setNextActions(actions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim() || adding) return;

    setAdding(true);
    try {
      await nextActionsService.addNextAction(MOCK_USER_ID, {
        title: newActionTitle.trim(),
        status: NextActionStatus.QUEUED,
      });
      setNewActionTitle('');
    } catch (error) {
      console.error('Error adding action:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (action: NextAction, newStatus: NextActionStatus) => {
    try {
      const updates: Partial<NextAction> = { status: newStatus };
      
      if (newStatus === NextActionStatus.DONE && action.status !== NextActionStatus.DONE) {
        updates.completedDate = new Date();
      } else if (newStatus !== NextActionStatus.DONE) {
        updates.completedDate = undefined;
      }

      await nextActionsService.updateNextAction(MOCK_USER_ID, action.id, updates);
    } catch (error) {
      console.error('Error updating action status:', error);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    try {
      await nextActionsService.deleteNextAction(MOCK_USER_ID, actionId);
    } catch (error) {
      console.error('Error deleting action:', error);
    }
  };

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
        onClick={() => handleStatusChange(action, status)}
        className={cn(
          "flex items-center gap-1",
          isActive && "pointer-events-none"
        )}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Button>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Next Actions</h1>
          <p className="text-gray-600">
            Your actionable tasks organized by status. Focus on what needs to be done.
          </p>
        </div>

        {/* Quick add form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleAddAction} className="flex gap-4">
            <Input
              type="text"
              placeholder="Add a new next action..."
              value={newActionTitle}
              onChange={(e) => setNewActionTitle(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={adding}>
              <Plus className="h-4 w-4 mr-2" />
              {adding ? 'Adding...' : 'Add Action'}
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading your next actions...</div>
          </div>
        ) : (
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
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y">
                                             {actions.map((action) => (
                         <div key={action.id} className="p-4 hover:bg-gray-50 transition-colors">
                           <div className="flex items-center justify-between">
                             <div 
                               className="flex-1 min-w-0 cursor-pointer"
                               onClick={() => window.location.href = `/next-actions/${action.id}`}
                             >
                               <h3 className={cn(
                                 "font-medium truncate",
                                 action.status === NextActionStatus.DONE 
                                   ? "text-gray-500 line-through" 
                                   : "text-gray-900"
                               )}>
                                 {action.title}
                               </h3>
                              <div className="flex items-center text-sm text-gray-500 mt-1 gap-4">
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
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <div className="flex gap-1">
                                {Object.values(NextActionStatus).map((statusOption) => 
                                  renderStatusButton(action, statusOption)
                                )}
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteAction(action.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
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
        )}
      </div>
    </AppLayout>
  );
} 