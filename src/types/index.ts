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
  calendarInviteSent?: boolean; // whether calendar invite has been sent
  userEmail?: string; // email to send calendar invite to
}

export enum ProjectStatus {
  QUEUED = 'queued',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  BLOCKED = 'blocked'
}

export enum ProjectTaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELEGATED = 'delegated',
  IN_NEXT_ACTIONS = 'in_next_actions', // when linked to a next action (but not scheduled yet)
  SCHEDULED = 'scheduled', // when linked to a scheduled next action
  BLOCKED = 'blocked'
}

export interface Project extends BaseItem {
  status: ProjectStatus;
  tasks: ProjectTask[];
  completedAt?: Date;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: ProjectTaskStatus;
  parentTaskId?: string; // for subtasks
  nextActionId?: string; // reference to the next action if promoted
  delegatedTo?: string; // person/entity the task is delegated to
  blockedReason?: string; // why the task is blocked
  order: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  subtasks?: ProjectTask[]; // nested subtasks
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