'use client';

import { Project, ProjectStatus, ProjectTaskStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { formatDate, cn } from '@/lib/utils';
import { Clock, CheckCircle, Play, Square, Ban, ChevronRight, FolderOpen } from 'lucide-react';

interface ProjectsListProps {
  projects: Project[];
  onStatusChange: (project: Project, newStatus: ProjectStatus) => void;
  onDeleteProject: (projectId: string) => void;
  onProjectClick: (projectId: string) => void;
}

const statusConfig = {
  [ProjectStatus.QUEUED]: {
    label: 'Planning',
    icon: Square,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  [ProjectStatus.IN_PROGRESS]: {
    label: 'In Progress',
    icon: Play,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
  },
  [ProjectStatus.BLOCKED]: {
    label: 'Paused',
    icon: Ban,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
  [ProjectStatus.DONE]: {
    label: 'Done',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
  },
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

const renderStatusButton = (project: Project, status: ProjectStatus, onStatusChange: (project: Project, newStatus: ProjectStatus) => void) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isActive = project.status === status;

  return (
    <Button
      key={status}
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={() => onStatusChange(project, status)}
      className={cn(
        "flex items-center gap-1 text-xs min-w-0 flex-1",
        isActive && "pointer-events-none"
      )}
    >
      <Icon className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">{config.label}</span>
    </Button>
  );
};

export function ProjectsList({ 
  projects, 
  onStatusChange, 
  onDeleteProject,
  onProjectClick 
}: ProjectsListProps) {
  const groupedProjects = {
    [ProjectStatus.QUEUED]: projects.filter(project => project.status === ProjectStatus.QUEUED),
    [ProjectStatus.IN_PROGRESS]: projects.filter(project => project.status === ProjectStatus.IN_PROGRESS),
    [ProjectStatus.BLOCKED]: projects.filter(project => project.status === ProjectStatus.BLOCKED),
    [ProjectStatus.DONE]: projects.filter(project => project.status === ProjectStatus.DONE),
  };

  return (
    <div className="space-y-8">
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
                {projectList.map((project) => {
                  const stats = getTasksStats(project);
                  
                  return (
                    <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Project Info */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => onProjectClick(project.id)}
                        >
                          <h3 className={cn(
                            "font-medium text-base mb-1",
                            project.status === ProjectStatus.DONE 
                              ? "text-gray-500 line-through" 
                              : "text-gray-900"
                          )}>
                            {project.title}
                          </h3>
                          
                          {project.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {project.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(project.createdAt)}
                            </div>
                            
                            {stats.total > 0 && (
                              <div className="flex items-center gap-2">
                                <span>{stats.completed}/{stats.total} tasks</span>
                                {stats.total > 0 && (
                                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                      style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                                    />
                                  </div>
                                )}
                                {stats.inProgress > 0 && (
                                  <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                                    {stats.inProgress} active
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {project.completedAt && (
                            <div className="flex items-center text-sm text-green-600 mt-2">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed {formatDate(project.completedAt)}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:ml-4">
                          <div className="flex gap-1">
                            {Object.values(ProjectStatus).map((statusOption) => 
                              renderStatusButton(project, statusOption, onStatusChange)
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onProjectClick(project.id)}
                              className="flex-shrink-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDeleteProject(project.id)}
                              className="flex-shrink-0"
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
  );
} 