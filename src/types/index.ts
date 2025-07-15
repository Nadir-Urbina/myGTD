export interface BaseItem {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface InboxItem extends BaseItem {
  processed: boolean;
}

export enum NextActionStatus {
  QUEUED = 'queued',
  SCHEDULED = 'scheduled',
  DONE = 'done'
}

export interface NextAction extends BaseItem {
  status: NextActionStatus;
  context?: string; // @calls, @computer, @errands, etc.
  estimatedDuration?: number; // in minutes
  scheduledDate?: Date;
  completedDate?: Date;
  projectId?: string; // if this next action belongs to a project
  projectTaskId?: string; // reference to the original project task
}

export interface Project extends BaseItem {
  status: 'active' | 'someday' | 'completed' | 'archived';
  tasks: ProjectTask[];
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  isNextAction: boolean;
  nextActionId?: string; // reference to the next action if promoted
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  nextActionId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  emailSent: boolean;
  emailAccepted?: boolean;
  createdAt: Date;
} 