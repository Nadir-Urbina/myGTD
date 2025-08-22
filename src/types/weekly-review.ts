export interface WeeklyReviewStats {
  // Time period for the review
  weekStart: Date;
  weekEnd: Date;
  
  // Inbox statistics
  inbox: {
    totalUnprocessed: number;
    twoMinuteCandidates: number;
    processedThisWeek: number;
    averageTimeInInbox: number; // in days
    oldestItem?: {
      title: string;
      daysInInbox: number;
    };
  };
  
  // Next Actions statistics
  nextActions: {
    totalQueued: number;
    totalScheduled: number;
    completedThisWeek: number;
    overdueItems: number;
    topContext?: {
      context: string;
      completionRate: number;
    };
  };
  
  // Project statistics
  projects: {
    totalActive: number;
    stalledProjects: number; // no activity in 2+ weeks
    projectProgress: Array<{
      id: string;
      title: string;
      currentProgress: number; // 0-100
      weeklyProgress: number; // change this week
      isStalled: boolean;
    }>;
  };

  // Issues statistics
  issues: {
    totalOpen: number;
    totalInProgress: number;
    resolvedThisWeek: number;
    createdThisWeek: number;
    overdueIssues: number; // issues open for more than 2 weeks
    averageResolutionTime: number; // in days
    issuesByType: Array<{
      type: 'bug' | 'feature' | 'improvement' | 'research' | 'question';
      count: number;
      resolved: number;
    }>;
    issuesByPriority: Array<{
      priority: 'low' | 'medium' | 'high' | 'critical';
      count: number;
      resolved: number;
    }>;
    mostActiveProject?: {
      projectId: string;
      projectTitle: string;
      issueCount: number;
    };
    complexityDistribution: {
      simple: number;
      moderate: number;
      complex: number;
    };
  };
  
  // System flow metrics
  flow: {
    newItemsCaptured: number;
    inboxToNextActions: number;
    nextActionsToDone: number;
    issuesToNextActions: number; // issues promoted to next actions this week
    productivityVelocity: number; // percentage change vs last week
  };
  
  // AI insights
  insights: {
    twoMinuteRuleSuggestions: Array<{
      itemId: string;
      title: string;
      confidence: number;
      reasoning: string;
    }>;
    issueComplexitySuggestions: Array<{
      issueId: string;
      title: string;
      complexity: 'simple' | 'moderate' | 'complex';
      confidence: number;
      recommendedApproach?: string;
      suggestedBreakdown?: string[];
    }>;
    recommendations: string[];
    productivityTrends: Array<{
      metric: string;
      trend: 'up' | 'down' | 'stable';
      change: number;
    }>;
  };
}

export interface WeeklyReviewPreferences {
  enabled: boolean;
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Monday, 5 = Friday
  timeOfDay: string; // HH:MM format
  timezone: string;
  notificationMethods: {
    browser: boolean;
    email: boolean;
  };
  lastReviewDate?: Date;
  nextReviewDate?: Date;
}

export interface WeeklyReviewSession {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  completedAt?: Date;
  stats: WeeklyReviewStats;
  userActions?: Array<{
    action: 'inbox_processed' | 'next_action_completed' | 'project_updated';
    itemId: string;
    timestamp: Date;
  }>;
}
