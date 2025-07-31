'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { NextAction, NextActionStatus } from '@/types';
import { nextActionsService } from '@/services/firebase';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  scheduledActions: NextAction[];
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useEffect(() => {
    if (!user) return;

    // Subscribe to next actions changes
    const unsubscribe = nextActionsService.subscribeToNextActions(user.uid, (actions) => {
      setNextActions(actions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const scheduledActions = nextActions.filter(action => 
    action.status === NextActionStatus.SCHEDULED && action.scheduledDate
  );

  // Get today's scheduled actions
  const today = new Date();
  const todaysActions = scheduledActions.filter(action => {
    if (!action.scheduledDate) return false;
    const actionDate = new Date(action.scheduledDate);
    return actionDate.toDateString() === today.toDateString();
  });

  // Calendar helper functions
  const getMonthData = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days: CalendarDay[] = [];
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isToday(date),
        scheduledActions: getActionsForDate(date),
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isToday(date),
        scheduledActions: getActionsForDate(date),
      });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isToday(date),
        scheduledActions: getActionsForDate(date),
      });
    }
    
    return days;
  };

  const getWeekData = (date: Date): CalendarDay[] => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      
      days.push({
        date: currentDate,
        isCurrentMonth: currentDate.getMonth() === date.getMonth(),
        isToday: isToday(currentDate),
        scheduledActions: getActionsForDate(currentDate),
      });
    }
    
    return days;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getActionsForDate = (date: Date): NextAction[] => {
    return scheduledActions.filter(action => {
      if (!action.scheduledDate) return false;
      const actionDate = new Date(action.scheduledDate);
      return actionDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      navigateMonth(direction);
    } else {
      navigateWeek(direction);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
    } else {
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startOfWeek.getFullYear()}`;
    }
  };

  const handleStatusChange = async (action: NextAction, newStatus: NextActionStatus) => {
    if (!user) return;
    
    try {
      const updates: Partial<NextAction> = { status: newStatus };
      
      if (newStatus === NextActionStatus.DONE && action.status !== NextActionStatus.DONE) {
        updates.completedDate = new Date();
      } else if (newStatus !== NextActionStatus.DONE) {
        updates.completedDate = undefined;
      }

      await nextActionsService.updateNextAction(user.uid, action.id, updates);
    } catch (error) {
      console.error('Error updating action status:', error);
    }
  };

  const days = viewMode === 'month' ? getMonthData(currentDate) : getWeekData(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
              <p className="text-gray-600 text-sm md:text-base">
                View and manage your scheduled next actions.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
            </div>
          </div>
        </div>

        {/* Today&apos;s Schedule */}
        {todaysActions.length > 0 && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 md:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-900">Today&apos;s Schedule</h2>
              <span className="text-sm text-blue-600">
                {todaysActions.length} action{todaysActions.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {todaysActions
                .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
                .map(action => (
                  <div 
                    key={action.id} 
                    className="bg-white rounded-lg p-3 border border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => window.location.href = `/next-actions/${action.id}`}
                  >
                    <h4 className="font-medium text-gray-900 mb-1 truncate">{action.title}</h4>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(action.scheduledDate!).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                      {action.estimatedDuration && (
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                          {action.estimatedDuration}m
                        </span>
                      )}
                    </div>
                    {action.context && (
                      <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block">
                        {action.context}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Calendar Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-900">
                {viewMode === 'month' ? formatMonthYear(currentDate) : formatWeekRange(currentDate)}
              </h2>
              <Button variant="outline" size="sm" onClick={() => navigate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading calendar...</div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Week day headers */}
              {weekDays.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {days.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "min-h-24 p-1 border-r border-b border-gray-100",
                    !day.isCurrentMonth && "bg-gray-50",
                    day.isToday && "bg-blue-50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    !day.isCurrentMonth ? "text-gray-400" : "text-gray-900",
                    day.isToday && "text-blue-600"
                  )}>
                    {day.date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {day.scheduledActions.map(action => (
                      <div
                        key={action.id}
                        className="bg-blue-100 text-blue-800 text-xs p-1 rounded cursor-pointer hover:bg-blue-200 transition-colors"
                        onClick={() => window.location.href = `/next-actions/${action.id}`}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="truncate">{action.title}</span>
                        </div>
                        {action.scheduledDate && (
                          <div className="text-xs text-blue-600 mt-1">
                            {new Date(action.scheduledDate).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                            {action.estimatedDuration && (
                              <span className="ml-1">({action.estimatedDuration}m)</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Actions List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Scheduled Actions</h3>
            <span className="text-sm text-gray-500">
              {scheduledActions.length} scheduled
            </span>
          </div>

          {scheduledActions.length > 0 ? (
            <div className="space-y-3">
              {scheduledActions
                .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
                .map(action => (
                  <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => window.location.href = `/next-actions/${action.id}`}
                    >
                      <h4 className="font-medium text-gray-900 truncate">{action.title}</h4>
                      <div className="flex items-center text-sm text-gray-500 mt-1 gap-3">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {formatDate(action.scheduledDate!)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(action.scheduledDate!).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                        {action.estimatedDuration && (
                          <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {action.estimatedDuration}min
                          </div>
                        )}
                        {action.context && (
                          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {action.context}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(action, NextActionStatus.DONE)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/next-actions/${action.id}`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-2">No scheduled actions</div>
              <p className="text-sm text-gray-400">
                Schedule your next actions to see them here.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 