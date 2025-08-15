'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { WeeklyReviewService } from '@/services/weekly-review';
import { WeeklyReviewStats } from '@/types/weekly-review';
import { 
  X, 
  Inbox, 
  CheckSquare, 
  FolderOpen, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  Zap,
  AlertCircle,
  Target
} from 'lucide-react';

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function WeeklyReviewModal({ isOpen, onClose, onComplete }: WeeklyReviewModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState<WeeklyReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadWeeklyStats();
    }
  }, [isOpen, user]);

  const loadWeeklyStats = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    
    try {
      const weeklyStats = await WeeklyReviewService.generateWeeklyStats(user.uid);
      setStats(weeklyStats);
    } catch (err) {
      console.error('Failed to load weekly stats:', err);
      setError('Failed to load weekly review data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!user || !stats) return;

    try {
      await WeeklyReviewService.saveWeeklyReviewSession(user.uid, {
        userId: user.uid,
        weekStart: stats.weekStart,
        weekEnd: stats.weekEnd,
        completedAt: new Date(),
        stats
      });
      
      onComplete?.();
      onClose();
    } catch (err) {
      console.error('Failed to save weekly review:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                📊 Weekly Review
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {stats ? `Week of ${stats.weekStart.toLocaleDateString()} - ${stats.weekEnd.toLocaleDateString()}` : 'Loading...'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Generating your weekly review...</span>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {stats && (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Inbox Card */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Inbox className="h-8 w-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-800">Inbox</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.inbox.totalUnprocessed}</p>
                        <p className="text-xs text-blue-600">items to process</p>
                      </div>
                    </div>
                  </div>

                  {/* Next Actions Card */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckSquare className="h-8 w-8 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">Next Actions</p>
                        <p className="text-2xl font-bold text-green-900">
                          {stats.nextActions.totalQueued + stats.nextActions.totalScheduled}
                        </p>
                        <p className="text-xs text-green-600">active actions</p>
                      </div>
                    </div>
                  </div>

                  {/* Projects Card */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <FolderOpen className="h-8 w-8 text-purple-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-800">Projects</p>
                        <p className="text-2xl font-bold text-purple-900">{stats.projects.totalActive}</p>
                        <p className="text-xs text-purple-600">active projects</p>
                      </div>
                    </div>
                  </div>

                  {/* Productivity Card */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Target className="h-8 w-8 text-orange-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-orange-800">Completed</p>
                        <p className="text-2xl font-bold text-orange-900">{stats.nextActions.completedThisWeek}</p>
                        <p className="text-xs text-orange-600">this week</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Inbox Insights */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Inbox className="h-5 w-5 text-blue-600 mr-2" />
                      Inbox Insights
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Items processed this week</span>
                        <span className="font-medium text-gray-900">{stats.inbox.processedThisWeek}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">2-minute rule candidates</span>
                        <span className="font-medium text-green-600 flex items-center">
                          <Zap className="h-4 w-4 mr-1" />
                          {stats.inbox.twoMinuteCandidates}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average time in inbox</span>
                        <span className="font-medium text-gray-900">
                          {stats.inbox.averageTimeInInbox} days
                        </span>
                      </div>
                      {stats.inbox.oldestItem && (
                        <div className="p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Oldest item: &ldquo;{stats.inbox.oldestItem.title}&rdquo; 
                            ({stats.inbox.oldestItem.daysInInbox} days)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Next Actions Insights */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckSquare className="h-5 w-5 text-green-600 mr-2" />
                      Next Actions Insights
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completed this week</span>
                        <span className="font-medium text-green-600">{stats.nextActions.completedThisWeek}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Queued actions</span>
                        <span className="font-medium text-gray-900">{stats.nextActions.totalQueued}</span>
                      </div>
                      {stats.nextActions.overdueItems > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Overdue items</span>
                          <span className="font-medium text-red-600">{stats.nextActions.overdueItems}</span>
                        </div>
                      )}
                      {stats.nextActions.topContext && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800">
                            Most productive context: {stats.nextActions.topContext.context} 
                            ({stats.nextActions.topContext.completionRate}% completion rate)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Progress */}
                {stats.projects.projectProgress.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FolderOpen className="h-5 w-5 text-purple-600 mr-2" />
                      Project Progress
                    </h3>
                    <div className="space-y-3">
                      {stats.projects.projectProgress.map((project) => (
                        <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{project.title}</p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full" 
                                  style={{ width: `${project.currentProgress}%` }}
                                />
                              </div>
                              <span>{project.currentProgress}% complete</span>
                            </div>
                          </div>
                          <div className="flex items-center ml-4">
                            {project.weeklyProgress > 0 ? (
                              <div className="flex items-center text-green-600">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">+{project.weeklyProgress}%</span>
                              </div>
                            ) : project.isStalled ? (
                              <div className="flex items-center text-red-600">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">Stalled</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-400">
                                <Minus className="h-4 w-4 mr-1" />
                                <span className="text-sm">No change</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flow Metrics */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 text-indigo-600 mr-2" />
                    Weekly Flow
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-indigo-600">{stats.flow.newItemsCaptured}</p>
                      <p className="text-xs text-gray-600">New items captured</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.flow.inboxToNextActions}</p>
                      <p className="text-xs text-gray-600">Inbox → Next Actions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.flow.nextActionsToDone}</p>
                      <p className="text-xs text-gray-600">Next Actions → Done</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center">
                        <p className={`text-2xl font-bold ${stats.flow.productivityVelocity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.flow.productivityVelocity > 0 ? '+' : ''}{stats.flow.productivityVelocity}%
                        </p>
                        {stats.flow.productivityVelocity >= 0 ? (
                          <TrendingUp className="h-5 w-5 text-green-600 ml-1" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600 ml-1" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">Productivity velocity</p>
                    </div>
                  </div>
                </div>

                {/* AI Insights */}
                {stats.insights.recommendations.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                      AI Recommendations
                    </h3>
                    <div className="space-y-3">
                      {stats.insights.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                          <p className="text-sm text-gray-700">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Review completed automatically saves your progress
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleComplete} disabled={!stats}>
                Mark Review Complete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
