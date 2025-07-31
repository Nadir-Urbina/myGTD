'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { 
  ArrowLeft, Save, Trash2, Plus, ArrowRight, Clock, CheckCircle, 
  Play, Square, Ban, User, Calendar, MoreHorizontal, Edit3
} from 'lucide-react';
import { Project, ProjectTask, ProjectStatus, ProjectTaskStatus } from '@/types';
import { projectsService } from '@/services/firebase';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

const projectStatusConfig = {
  [ProjectStatus.QUEUED]: {
    label: 'Planning',
    icon: Square,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  [ProjectStatus.IN_PROGRESS]: {
    label: 'In Progress',
    icon: Play,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  [ProjectStatus.BLOCKED]: {
    label: 'Paused',
    icon: Ban,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  [ProjectStatus.DONE]: {
    label: 'Done',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
};

const taskStatusConfig = {
  [ProjectTaskStatus.NOT_STARTED]: {
    label: 'Not Started',
    icon: Square,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
  [ProjectTaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    icon: Play,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  [ProjectTaskStatus.COMPLETED]: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  [ProjectTaskStatus.DELEGATED]: {
    label: 'Delegated',
    icon: User,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  [ProjectTaskStatus.IN_NEXT_ACTIONS]: {
    label: 'In Next Actions',
    icon: ArrowRight,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  [ProjectTaskStatus.SCHEDULED]: {
    label: 'Scheduled',
    icon: Calendar,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  [ProjectTaskStatus.BLOCKED]: {
    label: 'Blocked',
    icon: Ban,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.QUEUED);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'project' | 'task';
    targetId: string | null;
  }>({ isOpen: false, type: 'project', targetId: null });

  useEffect(() => {
    if (user) {
      loadProject();
    }
  }, [id, user]);

  const loadProject = async () => {
    if (!user) return;
    
    try {
      const projects = await projectsService.getProjects(user.uid);
      const foundProject = projects.find(p => p.id === id);
      if (foundProject) {
        setProject(foundProject);
        setTitle(foundProject.title);
        setDescription(foundProject.description || '');
        setNotes(foundProject.notes || '');
        setStatus(foundProject.status);
      } else {
        router.push('/projects');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project || saving || !user) return;

    setSaving(true);
    try {
      const updates: Partial<Project> = {
        title,
        description: description || undefined,
        notes: notes || undefined,
        status,
      };

      if (status === ProjectStatus.DONE && project.status !== ProjectStatus.DONE) {
        updates.completedAt = new Date();
      } else if (status !== ProjectStatus.DONE) {
        updates.completedAt = undefined;
      }

      await projectsService.updateProject(user.uid, project.id, updates);
      
      setProject({
        ...project,
        ...updates,
      });
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!project) return;
    setDeleteConfirmation({ isOpen: true, type: 'project', targetId: project.id });
  };

  const handleAddTask = async () => {
    if (!project || !newTaskTitle.trim() || addingTask || !user) return;

    setAddingTask(true);
    try {
      await projectsService.addTaskToProject(user.uid, project.id, {
        title: newTaskTitle.trim(),
        status: ProjectTaskStatus.NOT_STARTED,
        order: (project.tasks?.length || 0) + 1,
      });
      setNewTaskTitle('');
      await loadProject();
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setAddingTask(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: ProjectTaskStatus) => {
    if (!project || !user) return;

    try {
      await projectsService.updateTaskInProject(user.uid, project.id, taskId, {
        status: newStatus,
      });
      await loadProject();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleConvertToNextAction = async (taskId: string) => {
    if (!project || !user) return;

    try {
      await projectsService.convertTaskToNextAction(user.uid, project.id, taskId);
      await loadProject();
    } catch (error) {
      console.error('Error converting to next action:', error);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setDeleteConfirmation({ isOpen: true, type: 'task', targetId: taskId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.targetId || !user) return;

    try {
      if (deleteConfirmation.type === 'project') {
        await projectsService.deleteProject(user.uid, deleteConfirmation.targetId);
        router.push('/projects');
      } else {
        await projectsService.deleteTaskFromProject(user.uid, project!.id, deleteConfirmation.targetId);
        await loadProject();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setDeleteConfirmation({ isOpen: false, type: 'project', targetId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, type: 'project', targetId: null });
  };

  const getTaskStats = () => {
    if (!project?.tasks) return { total: 0, completed: 0, percentage: 0 };
    
    const total = project.tasks.length;
    const completed = project.tasks.filter(task => task.status === ProjectTaskStatus.COMPLETED).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, percentage };
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading project...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Project not found</div>
            <Button onClick={() => router.push('/projects')} className="mt-4">
              Back to Projects
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const stats = getTaskStats();
  const statusConfig = projectStatusConfig[status];
  const StatusIcon = statusConfig.icon;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/projects')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Project Title */}
        <div className="mb-8">
          {editingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setEditingTitle(false);
                if (e.key === 'Escape') {
                  setTitle(project.title);
                  setEditingTitle(false);
                }
              }}
              className="text-4xl font-bold border-none shadow-none p-0 h-auto bg-transparent focus:ring-0"
              autoFocus
            />
          ) : (
            <h1 
              className="text-4xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors"
              onClick={() => setEditingTitle(true)}
            >
              {title}
            </h1>
          )}
        </div>

        {/* Properties Bar */}
        <div className="flex flex-wrap items-center gap-6 mb-8 pb-4 border-b border-gray-200">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-16">Status</span>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className={cn(
                  "appearance-none border rounded-md px-3 py-1 text-sm font-medium cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  statusConfig.bgColor,
                  statusConfig.color,
                  statusConfig.borderColor
                )}
              >
                {Object.entries(projectStatusConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Completion */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-20">Completion</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {stats.percentage}%
              </span>
            </div>
          </div>

          {/* Task Count */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-16">Tasks</span>
            <span className="text-sm font-medium text-gray-700">
              {stats.completed}/{stats.total}
            </span>
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-16">Created</span>
            <span className="text-sm text-gray-700">
              {formatDate(project.createdAt)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          {editingDescription ? (
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => setEditingDescription(false)}
              placeholder="Add a description..."
              className="border-none shadow-none p-0 resize-none bg-transparent focus:ring-0 text-gray-700"
              rows={3}
              autoFocus
            />
          ) : (
            <div 
              className="text-gray-700 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors min-h-[60px] flex items-start"
              onClick={() => setEditingDescription(true)}
            >
              {description || (
                <span className="text-gray-400 italic">Add a description...</span>
              )}
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
            <span className="text-sm text-gray-500">
              {stats.total} task{stats.total !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Add Task */}
          <div className="flex gap-2 mb-6">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a task..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
              }}
            />
            <Button
              onClick={handleAddTask}
              disabled={addingTask || !newTaskTitle.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Tasks Table */}
          {project.tasks && project.tasks.length > 0 ? (
            <div className="space-y-2">
              {project.tasks.map((task) => {
                const taskConfig = taskStatusConfig[task.status];
                const TaskIcon = taskConfig.icon;
                
                return (
                  <div 
                    key={task.id} 
                    className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    {/* Status */}
                    <div className="relative">
                      <select
                        value={task.status}
                        onChange={(e) => handleTaskStatusChange(task.id, e.target.value as ProjectTaskStatus)}
                        className={cn(
                          "appearance-none border rounded px-2 py-1 text-xs font-medium cursor-pointer focus:ring-1 focus:ring-blue-500",
                          taskConfig.bgColor,
                          taskConfig.color
                        )}
                      >
                        {Object.entries(taskStatusConfig).map(([key, config]) => (
                          <option key={key} value={key}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Task Title */}
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "font-medium",
                        task.status === ProjectTaskStatus.COMPLETED 
                          ? "text-gray-500 line-through" 
                          : "text-gray-900"
                      )}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {task.description}
                        </div>
                      )}
                    </div>

                    {/* Created Date */}
                    <div className="text-xs text-gray-500">
                      {formatDate(task.createdAt)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {task.status !== ProjectTaskStatus.IN_NEXT_ACTIONS && 
                       task.status !== ProjectTaskStatus.SCHEDULED && 
                       task.status !== ProjectTaskStatus.COMPLETED && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConvertToNextAction(task.id)}
                          className="h-7 px-2 text-xs"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-gray-400 mb-2">No tasks yet</div>
              <div className="text-sm">Add your first task to get started</div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title={deleteConfirmation.type === 'project' ? 'Delete Project' : 'Delete Task'}
        message={
          deleteConfirmation.type === 'project'
            ? 'Are you sure you want to delete this project? This will also delete all tasks and cannot be undone.'
            : 'Are you sure you want to delete this task? This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </AppLayout>
  );
} 