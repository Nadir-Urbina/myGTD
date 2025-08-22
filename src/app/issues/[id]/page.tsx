'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useSettings } from '@/contexts/settings-context';
import { AppLayout } from '@/components/app-layout';
import { IssuesKanbanBoard } from '@/components/ui/issues-kanban-board';
import { IssuesList } from '@/components/ui/issues-list';
import { IssueForm } from '@/components/ui/issue-form';
import { IssueTrackerForm } from '@/components/ui/issue-tracker-form';
import { ViewToggle, ViewType } from '@/components/ui/view-toggle';
import { Button } from '@/components/ui/button';
import { Issue, IssueTracker, IssueStatus, Project, IssueType, IssuePriority } from '@/types';
import { issuesService, issueTrackersService, projectsService } from '@/services/firebase';
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  Edit3, 
  Trash2, 
  FolderOpen, 
  Bug,
  ChevronRight,
  Home,
  BarChart3
} from 'lucide-react';

export default function IssueTrackerBoardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { aiAnalysisEnabled } = useSettings();
  const trackerId = params.id as string;

  const [tracker, setTracker] = useState<IssueTracker | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewType>('board');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showTrackerForm, setShowTrackerForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !trackerId) return;

    const loadData = async () => {
      try {
        // Load the specific tracker
        const trackerData = await issueTrackersService.getIssueTracker(user.uid, trackerId);
        
        if (!trackerData) {
          // Tracker not found, redirect back
          router.push('/issues');
          return;
        }
        
        setTracker(trackerData);
        
        // Load linked project if exists
        if (trackerData.projectId) {
          const projectsData = await projectsService.getProjects(user.uid);
          const linkedProject = projectsData.find(p => p.id === trackerData.projectId);
          setProject(linkedProject || null);
          setProjects(projectsData);
        } else {
          // Load all projects for the form
          const projectsData = await projectsService.getProjects(user.uid);
          setProjects(projectsData);
        }
      } catch (error) {
        console.error('Error loading tracker:', error);
        router.push('/issues');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, trackerId, router]);

  useEffect(() => {
    if (!user || !trackerId) return;

    // Subscribe to issues for this tracker
    const unsubscribeIssues = issuesService.subscribeToIssuesByTracker(user.uid, trackerId, (issuesData) => {
      setIssues(issuesData);
    });

    return () => {
      unsubscribeIssues();
    };
  }, [user, trackerId]);

  const handleCreateIssue = () => {
    setEditingIssue(null);
    setShowIssueForm(true);
  };

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
    setShowIssueForm(true);
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!user) return;
    
    try {
      await issuesService.deleteIssue(user.uid, issueId);
    } catch (error) {
      console.error('Error deleting issue:', error);
      // Could show a toast notification here
    }
  };

  const handleStatusChange = async (issueId: string, status: IssueStatus) => {
    if (!user) return;
    
    try {
      await issuesService.updateIssue(user.uid, issueId, { status });
    } catch (error) {
      console.error('Error updating issue status:', error);
      // Could show a toast notification here
    }
  };

  const handlePromoteToNextAction = async (issue: Issue) => {
    if (!user) return;
    
    try {
      // Convert issue to next action with default context
      await issuesService.convertIssueToNextAction(user.uid, issue, {
        context: '@computer', // Default context for development issues
      });
    } catch (error) {
      console.error('Error promoting issue to next action:', error);
      // Could show a toast notification here
    }
  };

  const handleSubmitIssue = async (issueData: Omit<Issue, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !tracker) return;

    setSubmitting(true);
    try {
      // Ensure the issue is linked to this tracker
      const issueWithTracker = {
        ...issueData,
        issueTrackerId: trackerId,
      };

      if (editingIssue) {
        // Update existing issue
        await issuesService.updateIssue(user.uid, editingIssue.id, issueWithTracker);
      } else {
        // Create new issue
        await issuesService.addIssue(user.uid, issueWithTracker);
      }
      
      setShowIssueForm(false);
      setEditingIssue(null);
    } catch (error) {
      console.error('Error saving issue:', error);
      // Could show a toast notification here
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTracker = async (trackerData: Omit<IssueTracker, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !tracker) return;

    setSubmitting(true);
    try {
      await issueTrackersService.updateIssueTracker(user.uid, tracker.id, trackerData);
      
      // Update local state
      setTracker(prev => prev ? { ...prev, ...trackerData, updatedAt: new Date() } : null);
      setShowTrackerForm(false);
    } catch (error) {
      console.error('Error updating tracker:', error);
      // Could show a toast notification here
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTracker = async () => {
    if (!user || !tracker) return;
    
    const confirmed = confirm(
      `Are you sure you want to delete "${tracker.name}"? This will also delete all associated issues and cannot be undone.`
    );
    
    if (confirmed) {
      try {
        await issueTrackersService.deleteIssueTracker(user.uid, tracker.id);
        router.push('/issues');
      } catch (error) {
        console.error('Error deleting tracker:', error);
        // Could show a toast notification here
      }
    }
  };

  const handleCancelForm = () => {
    setShowIssueForm(false);
    setShowTrackerForm(false);
    setEditingIssue(null);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading issue tracker...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!tracker) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Issue Tracker not found</h2>
            <p className="text-gray-600 mb-4">The issue tracker you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
            <Button onClick={() => router.push('/issues')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Issue Trackers
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Show Forms or Main View */}
          {showIssueForm ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <IssueForm
                issue={editingIssue || undefined}
                projects={projects}
                issueTrackerId={trackerId}
                onSubmit={handleSubmitIssue}
                onCancel={handleCancelForm}
                isSubmitting={submitting}
                // Pre-fill with tracker settings
                defaultType={tracker.settings.allowedIssueTypes[0]}
                defaultPriority={tracker.settings.defaultPriority}
                allowedTypes={tracker.settings.allowedIssueTypes}
              />
            </div>
          ) : showTrackerForm ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <IssueTrackerForm
                tracker={tracker}
                projects={projects}
                onSubmit={handleUpdateTracker}
                onCancel={handleCancelForm}
                isSubmitting={submitting}
              />
            </div>
          ) : (
            <>
              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center hover:text-gray-700 transition-colors"
                >
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </button>
                <ChevronRight className="h-4 w-4" />
                <button
                  onClick={() => router.push('/issues')}
                  className="hover:text-gray-700 transition-colors"
                >
                  Issue Trackers
                </button>
                <ChevronRight className="h-4 w-4" />
                <span className="text-gray-900 font-medium">{tracker.name}</span>
              </nav>

              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-2">
                    <button
                      onClick={() => router.push('/issues')}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Trackers
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Bug className="h-8 w-8 text-blue-600" />
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 truncate">{tracker.name}</h1>
                      {tracker.description && (
                        <p className="text-gray-600 mt-1">{tracker.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Project Link */}
                  {project && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-blue-600">
                      <FolderOpen className="h-4 w-4" />
                      <span>Linked to: {project.title}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-4">
                  {/* Tracker Settings */}
                  <Button
                    variant="outline"
                    onClick={() => setShowTrackerForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>

                  {/* Create Issue Button */}
                  <Button 
                    onClick={handleCreateIssue} 
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Issue
                  </Button>
                </div>
              </div>

              {/* Tracker Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Issues</p>
                      <p className="text-2xl font-bold text-gray-900">{issues.length}</p>
                    </div>
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {issues.filter(issue => issue.status === IssueStatus.OPEN).length}
                      </p>
                    </div>
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Bug className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {issues.filter(issue => issue.status === IssueStatus.IN_PROGRESS).length}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Settings className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Resolved</p>
                      <p className="text-2xl font-bold text-green-600">
                        {issues.filter(issue => issue.status === IssueStatus.RESOLVED).length}
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Bug className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* View Toggle and Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">Issues</h2>
                  <span className="text-sm text-gray-500">
                    {issues.length} total
                  </span>
                </div>

                <ViewToggle 
                  view={view} 
                  onViewChange={setView}
                />
              </div>

              {/* Issues Display */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {view === 'board' ? (
                  <IssuesKanbanBoard
                    issues={issues}
                    onEdit={handleEditIssue}
                    onDelete={handleDeleteIssue}
                    onPromoteToNextAction={handlePromoteToNextAction}
                    onStatusChange={handleStatusChange}
                    onCreateIssue={handleCreateIssue}
                    enableAI={aiAnalysisEnabled && tracker.settings.enableAIAnalysis}
                    showProjectInfo={false} // No need to show project info since we're in a specific tracker
                  />
                ) : (
                  <IssuesList
                    issues={issues}
                    onEdit={handleEditIssue}
                    onDelete={handleDeleteIssue}
                    onPromoteToNextAction={handlePromoteToNextAction}
                    onStatusChange={handleStatusChange}
                    onCreateIssue={handleCreateIssue}
                    enableAI={aiAnalysisEnabled && tracker.settings.enableAIAnalysis}
                    showProjectInfo={false} // No need to show project info since we're in a specific tracker
                  />
                )}
              </div>

              {/* Quick Actions */}
              {issues.length === 0 && (
                <div className="text-center py-12">
                  <Bug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No issues yet</h3>
                  <p className="text-gray-600 mb-4">Create your first issue to get started tracking work for {tracker.name}.</p>
                  <Button onClick={handleCreateIssue}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Issue
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
