export interface BaseItem {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  
  // AI Analysis results (cached to avoid repeated API calls)
  is2MinuteRuleCandidate?: boolean;
  isProjectCandidate?: boolean;
  aiAnalysisDate?: Date;
  aiAnalysisData?: {
    confidence: number;
    reasoning?: string;
    estimatedDuration?: string;
    projectReasoning?: string; // reasoning for project candidate suggestion
  };
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

export enum MaybeSomedayStatus {
  SOMEDAY = 'someday',
  MAYBE = 'maybe',
  ARCHIVED = 'archived'
}

export interface MaybeSomedayItem extends BaseItem {
  status: MaybeSomedayStatus;
  reviewDate?: Date; // when to review this item again
  priority?: 'low' | 'medium' | 'high'; // priority within maybe/someday
  tags?: string[]; // for organizing maybe/someday items
}

// Issue Tracker Types
export enum IssueType {
  BUG = 'bug',
  FEATURE = 'feature',
  IMPROVEMENT = 'improvement',
  RESEARCH = 'research',
  QUESTION = 'question'
}

export enum IssuePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  DUPLICATE = 'duplicate',
  WONT_FIX = 'wont_fix'
}

export enum IssueComplexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex'
}

export enum IssueEffort {
  SMALL = 'small',   // 1-2 hours
  MEDIUM = 'medium', // 1-3 days
  LARGE = 'large'    // 1+ weeks
}

export interface IssueTracker extends BaseItem {
  name: string; // "Website Redesign", "Mobile App v2", etc.
  projectId?: string; // Optional link to existing project
  settings: {
    allowedIssueTypes: IssueType[];
    defaultPriority: IssuePriority;
    autoPromoteToNextActions: boolean;
    enableAIAnalysis: boolean;
  };
  issueCount?: number; // cached count for performance
  lastActivityAt?: Date; // when last issue was created/updated
}

export interface Issue extends BaseItem {
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  issueTrackerId: string; // Link to specific issue tracker board
  labels?: string[]; // for categorization (e.g., "frontend", "backend", "ui", "performance")
  assignee?: string; // who's responsible (could be user ID or email)
  reporter?: string; // who reported it (user ID or email)
  resolvedAt?: Date;
  closedAt?: Date;
  
  // GTD Integration
  nextActionId?: string; // when promoted to next action
  estimatedEffort?: IssueEffort;
  
  // AI Analysis for issues - stored analysis result
  aiComplexityAnalysis?: Record<string, unknown>; // AI complexity analysis data
  aiAnalysisDate?: Date; // when the AI analysis was last performed
  
  // Additional metadata
  reproductionSteps?: string; // for bugs
  acceptanceCriteria?: string; // for features
  environment?: string; // browser, OS, etc. for bugs
  attachments?: string[]; // file URLs or references
}

// For linking issues to projects or other entities
export interface IssueReference {
  issueId: string;
  referencedBy: 'project' | 'nextAction' | 'maybeSomeday';
  referenceId: string;
  linkType: 'blocks' | 'relates' | 'duplicates' | 'implements';
  createdAt: Date;
} 