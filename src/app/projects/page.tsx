'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, FolderOpen, Clock, CheckCircle, Play, Square, Ban, ChevronRight } from 'lucide-react';
import { Project, ProjectStatus, ProjectTaskStatus } from '@/types';
import { projectsService } from '@/services/firebase';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Mock user ID for now
const MOCK_USER_ID = 'user_123';

const statusConfig = {
  [ProjectStatus.QUEUED]: {
    label: 'Queued',
    icon: Square,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  [ProjectStatus.IN_PROGRESS]: {
    label: 'In Progress',
    icon: Play,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  [ProjectStatus.DONE]: {
    label: 'Done',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
  },
  [ProjectStatus.BLOCKED]: {
    label: 'Blocked',
    icon: Ban,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    projectId: string | null;
  }>({ isOpen: false, projectId: null });

  useEffect(() => {
    // Subscribe to projects changes
    const unsubscribe = projectsService.subscribeToProjects(MOCK_USER_ID, (projects) => {
      setProjects(projects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim() || adding) return;

    setAdding(true);
    try {
      await projectsService.addProject(MOCK_USER_ID, {
        title: newProjectTitle.trim(),
        status: ProjectStatus.QUEUED,
        tasks: [],
      });
      setNewProjectTitle('');
    } catch (error) {
      console.error('Error adding project:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (project: Project, newStatus: ProjectStatus) => {
    try {
      const updates: Partial<Project> = { status: newStatus };
      
      if (newStatus === ProjectStatus.DONE && project.status !== ProjectStatus.DONE) {
        updates.completedAt = new Date();
      } else if (newStatus !== ProjectStatus.DONE) {
        updates.completedAt = undefined;
      }

      await projectsService.updateProject(MOCK_USER_ID, project.id, updates);
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setDeleteConfirmation({ isOpen: true, projectId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.projectId) return;
    
    try {
      await projectsService.deleteProject(MOCK_USER_ID, deleteConfirmation.projectId);
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setDeleteConfirmation({ isOpen: false, projectId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, projectId: null });
  };

  const getTasksStats = (project: Project) => {
    const tasks = project.tasks || [];
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === ProjectTaskStatus.COMPLETED).length;
    const inProgress = tasks.filter(task => 
      task.status === ProjectTaskStatus.IN_PROGRESS || 
      task.status === ProjectTaskStatus.IN_NEXT_ACTIONS ||
      task.status === ProjectTaskStatus.SCHEDULED
    ).length;
    
    return { total, completed, inProgress };
  };

  const groupedProjects = {
    [ProjectStatus.QUEUED]: projects.filter(project => project.status === ProjectStatus.QUEUED),
    [ProjectStatus.IN_PROGRESS]: projects.filter(project => project.status === ProjectStatus.IN_PROGRESS),
    [ProjectStatus.BLOCKED]: projects.filter(project => project.status === ProjectStatus.BLOCKED),
    [ProjectStatus.DONE]: projects.filter(project => project.status === ProjectStatus.DONE),
  };

  const renderStatusButton = (project: Project, status: ProjectStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    const isActive = project.status === status;

    return (
      <Button
        key={status}
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={() => handleStatusChange(project, status)}
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
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600 text-sm md:text-base">
            Manage your multi-step initiatives and track progress toward your goals.
          </p>
        </div>

        {/* Quick add form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
          <form onSubmit={handleAddProject} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Input
              type="text"
              placeholder="Start a new project..."
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={adding} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {adding ? 'Creating...' : 'Create Project'}
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading your projects...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Render each status group */}
            {Object.entries(groupedProjects).map(([status, projectList]) => {
              const config = statusConfig[status as ProjectStatus];
              const Icon = config.icon;

              return (
                <div key={status}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("p-2 rounded-lg", config.bgColor)}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {config.label} ({projectList.length})
                    </h2>
                  </div>

                  {projectList.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y">
                      {projectList.map((project) => {
                        const stats = getTasksStats(project);
                        
                        return (
                          <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0">
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => window.location.href = `/projects/${project.id}`}
                              >
                                <h3 className={cn(
                                  "font-medium truncate",
                                  project.status === ProjectStatus.DONE 
                                    ? "text-gray-500 line-through" 
                                    : "text-gray-900"
                                )}>
                                  {project.title}
                                </h3>
                                <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1 gap-2 md:gap-4">
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDate(project.createdAt)}
                                  </div>
                                  {stats.total > 0 && (
                                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                                      <span>{stats.completed}/{stats.total} tasks</span>
                                      {stats.inProgress > 0 && (
                                        <span className="text-blue-600">({stats.inProgress} active)</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {project.description && (
                                  <p className="text-sm text-gray-600 mt-1 truncate">
                                    {project.description}
                                  </p>
                                )}
                                {project.completedAt && (
                                  <div className="flex items-center text-sm text-green-600 mt-1">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed {formatDate(project.completedAt)}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:ml-4">
                                <div className="flex flex-wrap gap-1">
                                  {Object.values(ProjectStatus).map((statusOption) => 
                                    renderStatusButton(project, statusOption)
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.location.href = `/projects/${project.id}`}
                                    className="flex-shrink-0"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteProject(project.id)}
                                    className="w-full sm:w-auto"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="text-gray-500">
                        No {config.label.toLowerCase()} projects
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {projects.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500 mb-4">No projects yet!</div>
                <p className="text-sm text-gray-400">
                  Create your first project to start organizing your multi-step initiatives.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Project"
        message="Are you sure you want to delete this project? This will also delete all tasks and cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </AppLayout>
  );
} 