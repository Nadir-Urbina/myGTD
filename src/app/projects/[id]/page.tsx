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
  Play, Square, Ban, User, ChevronDown, ChevronRight, Calendar
} from 'lucide-react';
import { Project, ProjectTask, ProjectStatus, ProjectTaskStatus } from '@/types';
import { projectsService } from '@/services/firebase';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Mock user ID for now
const MOCK_USER_ID = 'user_123';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

const projectStatusConfig = {
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

const taskStatusConfig = {
  [ProjectTaskStatus.NOT_STARTED]: {
    label: 'Not Started',
    icon: Square,
    color: 'text-gray-500',
  },
  [ProjectTaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    icon: Play,
    color: 'text-blue-500',
  },
  [ProjectTaskStatus.COMPLETED]: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-green-500',
  },
  [ProjectTaskStatus.DELEGATED]: {
    label: 'Delegated',
    icon: User,
    color: 'text-purple-500',
  },
  [ProjectTaskStatus.IN_NEXT_ACTIONS]: {
    label: 'In Next Actions',
    icon: ArrowRight,
    color: 'text-orange-500',
  },
  [ProjectTaskStatus.SCHEDULED]: {
    label: 'Scheduled',
    icon: Calendar,
    color: 'text-blue-600',
  },
  [ProjectTaskStatus.BLOCKED]: {
    label: 'Blocked',
    icon: Ban,
    color: 'text-red-500',
  },
};

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.QUEUED);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'project' | 'task';
    targetId: string | null;
  }>({ isOpen: false, type: 'project', targetId: null });

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const projects = await projectsService.getProjects(MOCK_USER_ID);
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
    if (!project || saving) return;

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

      await projectsService.updateProject(MOCK_USER_ID, project.id, updates);
      
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
    if (!project || !newTaskTitle.trim() || addingTask) return;

    setAddingTask(true);
    try {
      await projectsService.addTaskToProject(MOCK_USER_ID, project.id, {
        title: newTaskTitle.trim(),
        status: ProjectTaskStatus.NOT_STARTED,
        order: (project.tasks?.length || 0) + 1,
      });
      setNewTaskTitle('');
      await loadProject(); // Refresh project data
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setAddingTask(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: ProjectTaskStatus) => {
    if (!project) return;

    try {
      await projectsService.updateTaskInProject(MOCK_USER_ID, project.id, taskId, {
        status: newStatus,
      });
      await loadProject(); // Refresh to get updated data
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleConvertToNextAction = async (taskId: string) => {
    if (!project) return;

    try {
      await projectsService.convertTaskToNextAction(MOCK_USER_ID, project.id, taskId);
      await loadProject(); // Refresh to see the status change
    } catch (error) {
      console.error('Error converting to next action:', error);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setDeleteConfirmation({ isOpen: true, type: 'task', targetId: taskId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.targetId) return;

    try {
      if (deleteConfirmation.type === 'project') {
        await projectsService.deleteProject(MOCK_USER_ID, deleteConfirmation.targetId);
        router.push('/projects');
      } else {
        await projectsService.deleteTaskFromProject(MOCK_USER_ID, project!.id, deleteConfirmation.targetId);
        await loadProject(); // Refresh project data
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

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const renderTaskStatusButton = (task: ProjectTask, taskStatus: ProjectTaskStatus) => {
    const config = taskStatusConfig[taskStatus];
    const Icon = config.icon;
    const isActive = task.status === taskStatus;

    return (
      <Button
        key={taskStatus}
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={() => handleTaskStatusChange(task.id, taskStatus)}
        className={cn(
          "flex items-center gap-1 text-xs min-w-0",
          isActive && "pointer-events-none"
        )}
      >
        <Icon className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{config.label}</span>
      </Button>
    );
  };

  const renderTask = (task: ProjectTask, depth = 0) => {
    const config = taskStatusConfig[task.status];
    const Icon = config.icon;
    const isExpanded = expandedTasks.has(task.id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;

    return (
      <div key={task.id} className={cn("border-l-2 border-gray-200", depth > 0 && "ml-6")}>
        <div className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-start gap-3">
            {hasSubtasks && (
              <button
                onClick={() => toggleTaskExpansion(task.id)}
                className="mt-1 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            
            <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-2">
                 <Icon className={cn("h-4 w-4", config.color)} />
                 <h4 
                   className={cn(
                     "font-medium cursor-pointer hover:text-blue-600 transition-colors",
                     task.status === ProjectTaskStatus.COMPLETED 
                       ? "text-gray-500 line-through" 
                       : "text-gray-900"
                   )}
                   onClick={() => router.push(`/projects/${project!.id}/tasks/${task.id}`)}
                 >
                   {task.title}
                 </h4>
               </div>
              
              {task.description && (
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
              )}
              
              <div className="flex flex-wrap items-center text-xs text-gray-500 gap-3 mb-3">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDate(task.createdAt)}
                </div>
                {task.delegatedTo && (
                  <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    Delegated to: {task.delegatedTo}
                  </div>
                )}
                {task.completedAt && (
                  <div className="text-green-600">
                    Completed {formatDate(task.completedAt)}
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {Object.values(ProjectTaskStatus).map((statusOption) => 
                  renderTaskStatusButton(task, statusOption)
                )}
              </div>
              
                             <div className="flex flex-wrap gap-2">
                 {task.status !== ProjectTaskStatus.IN_NEXT_ACTIONS && 
                  task.status !== ProjectTaskStatus.SCHEDULED && 
                  task.status !== ProjectTaskStatus.COMPLETED && (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleConvertToNextAction(task.id)}
                   >
                     <ArrowRight className="h-3 w-3 mr-1" />
                     To Next Actions
                   </Button>
                 )}
                 {task.nextActionId && (
                   <div className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                     Linked to Next Action
                   </div>
                 )}
                 <Button
                   variant="destructive"
                   size="sm"
                   onClick={() => handleDeleteTask(task.id)}
                 >
                   <Trash2 className="h-3 w-3" />
                 </Button>
               </div>
            </div>
          </div>
        </div>
        
        {hasSubtasks && isExpanded && (
          <div className="ml-4">
            {task.subtasks!.map(subtask => renderTask(subtask, depth + 1))}
          </div>
        )}
      </div>
    );
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

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 md:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/projects')}
            className="self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Project Details</h1>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDate(project.createdAt)}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Main content */}
          <div className="xl:col-span-2 space-y-4 md:space-y-6">
            {/* Project Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Project Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the project"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes, context, or details..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Tasks</h3>
                <span className="text-sm text-gray-500">
                  {project.tasks?.length || 0} tasks
                </span>
              </div>

              {/* Add Task */}
              <div className="flex gap-2 mb-6">
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <Button
                  onClick={handleAddTask}
                  disabled={addingTask || !newTaskTitle.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Task List */}
              {project.tasks && project.tasks.length > 0 ? (
                <div className="space-y-2">
                  {project.tasks.map(task => renderTask(task))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No tasks yet. Add your first task to get started.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Status</h3>
              <div className="space-y-2">
                {Object.values(ProjectStatus).map((statusOption) => {
                  const config = projectStatusConfig[statusOption];
                  const Icon = config.icon;
                  const isActive = status === statusOption;

                  return (
                    <button
                      key={statusOption}
                      onClick={() => setStatus(statusOption)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                        isActive 
                          ? `${config.bgColor} ${config.color}` 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <div className="font-medium">{formatDate(project.createdAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Last updated:</span>
                  <div className="font-medium">{formatDate(project.updatedAt)}</div>
                </div>
                {project.completedAt && (
                  <div>
                    <span className="text-gray-500">Completed:</span>
                    <div className="font-medium text-green-600">{formatDate(project.completedAt)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
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