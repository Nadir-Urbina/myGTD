'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { AppLayout } from '@/components/app-layout';
import { IssueTrackerCard } from '@/components/ui/issue-tracker-card';
import { IssueTrackerForm } from '@/components/ui/issue-tracker-form';
import { Button } from '@/components/ui/button';
import { IssueTracker, Project, IssueType, IssuePriority } from '@/types';
import { issueTrackersService, projectsService } from '@/services/firebase';
import { Plus, Grid, List, Search, Folder } from 'lucide-react';

export default function IssuesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [trackers, setTrackers] = useState<IssueTracker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTracker, setEditingTracker] = useState<IssueTracker | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!user) return;

    // Subscribe to issue trackers changes
    const unsubscribeTrackers = issueTrackersService.subscribeToIssueTrackers(user.uid, (trackersData) => {
      setTrackers(trackersData);
      setLoading(false);
    });

    // Subscribe to projects for the dropdown
    const unsubscribeProjects = projectsService.subscribeToProjects(user.uid, (projectsData) => {
      setProjects(projectsData);
    });

    return () => {
      unsubscribeTrackers();
      unsubscribeProjects();
    };
  }, [user]);

  // Filter trackers based on search
  const filteredTrackers = trackers.filter(tracker => 
    tracker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tracker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tracker.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTracker = () => {
    setEditingTracker(null);
    setShowForm(true);
  };

  const handleEditTracker = (tracker: IssueTracker) => {
    setEditingTracker(tracker);
    setShowForm(true);
  };

  const handleDeleteTracker = async (trackerId: string) => {
    if (!user) return;
    
    try {
      await issueTrackersService.deleteIssueTracker(user.uid, trackerId);
    } catch (error) {
      console.error('Error deleting issue tracker:', error);
      // Could show a toast notification here
    }
  };

  const handleSubmitTracker = async (trackerData: Omit<IssueTracker, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    setSubmitting(true);
    try {
      if (editingTracker) {
        // Update existing tracker
        await issueTrackersService.updateIssueTracker(user.uid, editingTracker.id, trackerData);
      } else {
        // Create new tracker
        await issueTrackersService.addIssueTracker(user.uid, trackerData);
      }
      
      setShowForm(false);
      setEditingTracker(null);
    } catch (error) {
      console.error('Error saving issue tracker:', error);
      // Could show a toast notification here
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTracker(null);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading issue trackers...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Show Form or Main View */}
          {showForm ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <IssueTrackerForm
                tracker={editingTracker || undefined}
                projects={projects}
                onSubmit={handleSubmitTracker}
                onCancel={handleCancelForm}
                isSubmitting={submitting}
              />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Issue Trackers</h1>
                  <p className="text-gray-600 mt-1">
                    Manage issue tracker boards for your projects and products
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Create Tracker Button */}
                  <Button onClick={handleCreateTracker} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Issue Tracker
                  </Button>
                </div>
              </div>

              {/* Search and View Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search trackers..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {filteredTrackers.length} of {trackers.length} trackers
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm flex items-center gap-2 rounded-l-lg transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-blue-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm flex items-center gap-2 rounded-r-lg transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-blue-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    List
                  </button>
                </div>
              </div>

              {/* Trackers Display */}
              {filteredTrackers.length === 0 ? (
                <div className="text-center py-12">
                  {trackers.length === 0 ? (
                    <div>
                      <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No issue trackers yet</h3>
                      <p className="text-gray-600 mb-4">Create your first issue tracker to get started organizing your project issues.</p>
                      <Button onClick={handleCreateTracker}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Issue Tracker
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No trackers match your search</h3>
                      <p className="text-gray-600 mb-4">Try adjusting your search terms or create a new tracker.</p>
                      <Button onClick={() => setSearchTerm('')} variant="outline">
                        Clear Search
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }>
                  {filteredTrackers.map(tracker => (
                    <IssueTrackerCard
                      key={tracker.id}
                      tracker={tracker}
                      onEdit={handleEditTracker}
                      onDelete={handleDeleteTracker}
                      className={viewMode === 'list' ? 'flex-1' : undefined}
                    />
                  ))}
                </div>
              )}

              {/* Summary Stats */}
              {trackers.length > 0 && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Trackers</p>
                        <p className="text-2xl font-bold text-gray-900">{trackers.length}</p>
                      </div>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Folder className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Issues</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {trackers.reduce((sum, tracker) => sum + (tracker.issueCount || 0), 0)}
                        </p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Search className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Linked Projects</p>
                        <p className="text-2xl font-bold text-green-600">
                          {trackers.filter(tracker => tracker.projectId).length}
                        </p>
                      </div>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Folder className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {trackers.filter(tracker => {
                            if (!tracker.lastActivityAt) return false;
                            
                            // Ensure lastActivityAt is a Date object
                            const activityDate = tracker.lastActivityAt instanceof Date 
                              ? tracker.lastActivityAt 
                              : new Date(tracker.lastActivityAt);
                            
                            return (Date.now() - activityDate.getTime()) < (7 * 24 * 60 * 60 * 1000);
                          }).length}
                        </p>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Grid className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
