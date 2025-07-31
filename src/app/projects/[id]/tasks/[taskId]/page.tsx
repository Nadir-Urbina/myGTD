'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { 
  ArrowLeft, Save, Trash2, ArrowRight, CheckCircle, 
  Play, Square, Ban, User, Calendar
} from 'lucide-react';
import { Project, ProjectTask, ProjectTaskStatus } from '@/types';
import { projectsService } from '@/services/firebase';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

interface TaskDetailPageProps {
  params: Promise<{ id: string; taskId: string }>;
}

const taskStatusConfig = {
  [ProjectTaskStatus.NOT_STARTED]: {
    label: 'Not Started',
    icon: Square,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  [ProjectTaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    icon: Play,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  [ProjectTaskStatus.COMPLETED]: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
  },
  [ProjectTaskStatus.DELEGATED]: {
    label: 'Delegated',
    icon: User,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
  [ProjectTaskStatus.IN_NEXT_ACTIONS]: {
    label: 'In Next Actions',
    icon: ArrowRight,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
  },
  [ProjectTaskStatus.SCHEDULED]: {
    label: 'Scheduled',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  [ProjectTaskStatus.BLOCKED]: {
    label: 'Blocked',
    icon: Ban,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
};

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id: projectId, taskId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [task, setTask] = useState<ProjectTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectTaskStatus>(ProjectTaskStatus.NOT_STARTED);
  const [delegatedTo, setDelegatedTo] = useState('');
  const [blockedReason, setBlockedReason] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    loadTaskData();
  }, [projectId, taskId]);

  const loadTaskData = async () => {
    try {
      const projects = await projectsService.getProjects(user.uid);
      const foundProject = projects.find(p => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
        const foundTask = foundProject.tasks?.find(t => t.id === taskId);
        if (foundTask) {
          setTask(foundTask);
          setTitle(foundTask.title);
          setDescription(foundTask.description || '');
          setStatus(foundTask.status);
          setDelegatedTo(foundTask.delegatedTo || '');
          setBlockedReason(foundTask.blockedReason || '');
        } else {
          router.push(`/projects/${projectId}`);
        }
      } else {
        router.push('/projects');
      }
    } catch (error) {
      console.error('Error loading task:', error);
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project || !task || saving || !user) return;

    setSaving(true);
    try {
      const updates: Partial<ProjectTask> = {
        title,
        description: description || undefined,
        status,
        delegatedTo: delegatedTo || undefined,
        blockedReason: blockedReason || undefined,
      };

      await projectsService.updateTaskInProject(user.uid, project.id, task.id, updates);
      
      setTask({
        ...task,
        ...updates,
      });
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!project || !task) return;

    try {
      await projectsService.deleteTaskFromProject(user.uid, project.id, task.id);
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const handleConvertToNextAction = async () => {
    if (!project || !task || !user) return;

    try {
      await projectsService.convertTaskToNextAction(user.uid, project.id, task.id);
      await loadTaskData(); // Refresh to see the status change
    } catch (error) {
      console.error('Error converting to next action:', error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading task...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!project || !task) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Task not found</div>
            <Button onClick={() => router.push('/projects')} className="mt-4">
              Back to Projects
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const config = taskStatusConfig[status];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 md:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/${project.id}`)}
            className="self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Task Details</h1>
            <p className="text-sm text-gray-500 mt-1">
              From project: {project.title}
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
              Delete Task
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Task Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Task Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Task description or details"
                    rows={4}
                  />
                </div>

                {status === ProjectTaskStatus.DELEGATED && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delegated To
                    </label>
                    <Input
                      value={delegatedTo}
                      onChange={(e) => setDelegatedTo(e.target.value)}
                      placeholder="Person or team responsible"
                    />
                  </div>
                )}

                {status === ProjectTaskStatus.BLOCKED && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blocked Reason
                    </label>
                    <Textarea
                      value={blockedReason}
                      onChange={(e) => setBlockedReason(e.target.value)}
                      placeholder="What's blocking this task?"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Status</h3>
              <div className="space-y-2">
                {Object.values(ProjectTaskStatus).map((statusOption) => {
                  const statusConfig = taskStatusConfig[statusOption];
                  const Icon = statusConfig.icon;
                  const isActive = status === statusOption;

                  return (
                    <button
                      key={statusOption}
                      onClick={() => setStatus(statusOption)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                        isActive 
                          ? `${statusConfig.bgColor} ${statusConfig.color}` 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {statusConfig.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {status !== ProjectTaskStatus.IN_NEXT_ACTIONS && 
                 status !== ProjectTaskStatus.SCHEDULED && 
                 status !== ProjectTaskStatus.COMPLETED && (
                  <Button
                    onClick={handleConvertToNextAction}
                    className="w-full justify-start"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Convert to Next Action
                  </Button>
                )}
                {task.nextActionId && (
                  <div className="text-sm bg-orange-50 text-orange-700 p-3 rounded">
                    ✓ This task is linked to a Next Action
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <div className="font-medium">{formatDate(task.createdAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Last updated:</span>
                  <div className="font-medium">{formatDate(task.updatedAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Current status:</span>
                  <div className={cn("font-medium flex items-center gap-1", config.color)}>
                    <config.icon className="h-3 w-3" />
                    {config.label}
                  </div>
                </div>
                {task.completedAt && (
                  <div>
                    <span className="text-gray-500">Completed:</span>
                    <div className="font-medium text-green-600">{formatDate(task.completedAt)}</div>
                  </div>
                )}
                {task.delegatedTo && (
                  <div>
                    <span className="text-gray-500">Delegated to:</span>
                    <div className="font-medium">{task.delegatedTo}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </AppLayout>
  );
} 