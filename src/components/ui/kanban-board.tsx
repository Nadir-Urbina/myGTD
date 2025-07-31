'use client';

import { Project, ProjectStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { formatDate, cn } from '@/lib/utils';
import { Plus, Clock, CheckCircle, Play, Square, Ban, ChevronRight } from 'lucide-react';
import { ProjectTaskStatus } from '@/types';

interface KanbanBoardProps {
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
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    headerBg: 'bg-blue-100',
  },
  [ProjectStatus.IN_PROGRESS]: {
    label: 'In Progress',
    icon: Play,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    headerBg: 'bg-orange-100',
  },
  [ProjectStatus.BLOCKED]: {
    label: 'Paused',
    icon: Ban,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    headerBg: 'bg-purple-100',
  },
  [ProjectStatus.DONE]: {
    label: 'Done',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    headerBg: 'bg-green-100',
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

function ProjectCard({ 
  project, 
  onStatusChange, 
  onDeleteProject,
  onProjectClick 
}: { 
  project: Project;
  onStatusChange: (project: Project, newStatus: ProjectStatus) => void;
  onDeleteProject: (projectId: string) => void;
  onProjectClick: (projectId: string) => void;
}) {
  const stats = getTasksStats(project);
  const config = statusConfig[project.status];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow group">
      {/* Project Header */}
      <div 
        className="cursor-pointer mb-3"
        onClick={() => onProjectClick(project.id)}
      >
        <h3 className={cn(
          "font-medium text-sm line-clamp-2 mb-2",
          project.status === ProjectStatus.DONE 
            ? "text-gray-500 line-through" 
            : "text-gray-900"
        )}>
          {project.title}
        </h3>
        
        {project.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {project.description}
          </p>
        )}
      </div>

      {/* Project Stats */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="h-3 w-3 mr-1" />
          {formatDate(project.createdAt)}
        </div>
        
        {stats.total > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {stats.completed}/{stats.total} tasks
            </div>
            {stats.total > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 ml-2">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {stats.inProgress > 0 && (
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {stats.inProgress} active task{stats.inProgress > 1 ? 's' : ''}
          </div>
        )}

        {project.completedAt && (
          <div className="flex items-center text-xs text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed {formatDate(project.completedAt)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        {/* Status Change Buttons */}
        <div className="flex gap-1">
          {Object.values(ProjectStatus).filter(status => status !== project.status).slice(0, 2).map((status) => {
            const statusConf = statusConfig[status];
            const StatusIcon = statusConf.icon;
            return (
              <Button
                key={status}
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(project, status)}
                className="h-6 px-2 text-xs"
                title={`Move to ${statusConf.label}`}
              >
                <StatusIcon className="h-3 w-3" />
              </Button>
            );
          })}
        </div>

        {/* View/Delete Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onProjectClick(project.id)}
            className="h-6 px-2 text-xs"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteProject(project.id)}
            className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ 
  status, 
  projects, 
  onStatusChange, 
  onDeleteProject,
  onProjectClick 
}: {
  status: ProjectStatus;
  projects: Project[];
  onStatusChange: (project: Project, newStatus: ProjectStatus) => void;
  onDeleteProject: (projectId: string) => void;
  onProjectClick: (projectId: string) => void;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-t-lg border-b",
        config.headerBg,
        config.borderColor
      )}>
        <Icon className={cn("h-4 w-4", config.color)} />
        <h3 className="font-medium text-sm text-gray-900">
          {config.label}
        </h3>
        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
          {projects.length}
        </span>
      </div>

      {/* Column Content */}
      <div className={cn(
        "flex-1 p-3 space-y-3 min-h-[200px] rounded-b-lg",
        config.bgColor,
        config.borderColor,
        "border border-t-0"
      )}>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onStatusChange={onStatusChange}
            onDeleteProject={onDeleteProject}
            onProjectClick={onProjectClick}
          />
        ))}
        
        {projects.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-xs">No projects</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ 
  projects, 
  onStatusChange, 
  onDeleteProject,
  onProjectClick 
}: KanbanBoardProps) {
  const groupedProjects = {
    [ProjectStatus.QUEUED]: projects.filter(p => p.status === ProjectStatus.QUEUED),
    [ProjectStatus.IN_PROGRESS]: projects.filter(p => p.status === ProjectStatus.IN_PROGRESS),
    [ProjectStatus.BLOCKED]: projects.filter(p => p.status === ProjectStatus.BLOCKED),
    [ProjectStatus.DONE]: projects.filter(p => p.status === ProjectStatus.DONE),
  };

  return (
    <div className="w-full">
      {/* Desktop Board View */}
      <div className="hidden md:grid md:grid-cols-4 gap-4 h-full">
        {Object.entries(groupedProjects).map(([status, projectList]) => (
          <KanbanColumn
            key={status}
            status={status as ProjectStatus}
            projects={projectList}
            onStatusChange={onStatusChange}
            onDeleteProject={onDeleteProject}
            onProjectClick={onProjectClick}
          />
        ))}
      </div>

      {/* Mobile Stacked View */}
      <div className="md:hidden space-y-6">
        {Object.entries(groupedProjects).map(([status, projectList]) => (
          <KanbanColumn
            key={status}
            status={status as ProjectStatus}
            projects={projectList}
            onStatusChange={onStatusChange}
            onDeleteProject={onDeleteProject}
            onProjectClick={onProjectClick}
          />
        ))}
      </div>
    </div>
  );
} 