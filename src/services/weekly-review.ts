import { 
  collection, 
  query, 
  orderBy, 
  getDocs,
  Timestamp,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { aiService } from '@/services/ai';
import { 
  InboxItem, 
  NextAction, 
  Project, 
  NextActionStatus, 
  ProjectStatus,
  ProjectTaskStatus 
} from '@/types';
import { 
  WeeklyReviewStats, 
  WeeklyReviewPreferences, 
  WeeklyReviewSession 
} from '@/types/weekly-review';

export class WeeklyReviewService {
  // Generate weekly review statistics
  static async generateWeeklyStats(userId: string): Promise<WeeklyReviewStats> {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const weekEnd = this.getWeekEnd(weekStart);

    // Fetch all necessary data
    const [inboxItems, nextActions, projects] = await Promise.all([
      this.getInboxItems(userId),
      this.getNextActions(userId),
      this.getProjects(userId)
    ]);

    // Calculate statistics
    const inboxStats = await this.calculateInboxStats(inboxItems, weekStart, weekEnd);
    const nextActionStats = this.calculateNextActionStats(nextActions, weekStart, weekEnd);
    const projectStats = this.calculateProjectStats(projects, weekStart, weekEnd);
    const issueStats = await this.calculateIssueStats(userId, weekStart, weekEnd);
    const flowStats = this.calculateFlowStats(inboxItems, nextActions, weekStart, weekEnd);
    const insights = await this.generateInsights(inboxItems, nextActions, projects);

    return {
      weekStart,
      weekEnd,
      inbox: inboxStats,
      nextActions: nextActionStats,
      projects: projectStats,
      issues: issueStats,
      flow: flowStats,
      insights
    };
  }

  // Calculate inbox statistics
  private static async calculateInboxStats(
    items: InboxItem[], 
    weekStart: Date, 
    weekEnd: Date
  ) {
    const unprocessedItems = items.filter(item => !item.processed);
    const processedThisWeek = items.filter(item => 
      item.processed && 
      item.updatedAt >= weekStart && 
      item.updatedAt <= weekEnd
    );

    // Calculate average time in inbox
    const totalDaysInInbox = unprocessedItems.reduce((sum, item) => {
      const daysInInbox = Math.floor(
        (Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + daysInInbox;
    }, 0);
    const averageTimeInInbox = unprocessedItems.length > 0 
      ? totalDaysInInbox / unprocessedItems.length 
      : 0;

    // Find oldest item
    const oldestItem = unprocessedItems.length > 0 
      ? unprocessedItems.reduce((oldest, item) => 
          item.createdAt < oldest.createdAt ? item : oldest
        )
      : null;

    // Get 2-minute rule candidates using AI
    const twoMinuteCandidates = [];
    for (const item of unprocessedItems.slice(0, 10)) { // Limit to avoid API costs
      try {
        const analysis = await aiService.analyzeTask(item.title, item.description);
        if (analysis.is2MinuteCandidate && analysis.confidence > 0.6) {
          twoMinuteCandidates.push(item);
        }
      } catch (error) {
        console.warn('AI analysis failed for item:', item.id, error);
      }
    }

    return {
      totalUnprocessed: unprocessedItems.length,
      twoMinuteCandidates: twoMinuteCandidates.length,
      processedThisWeek: processedThisWeek.length,
      averageTimeInInbox: Math.round(averageTimeInInbox * 10) / 10,
      oldestItem: oldestItem ? {
        title: oldestItem.title,
        daysInInbox: Math.floor(
          (Date.now() - oldestItem.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      } : undefined
    };
  }

  // Calculate next actions statistics
  private static calculateNextActionStats(
    actions: NextAction[], 
    weekStart: Date, 
    weekEnd: Date
  ) {
    const queuedActions = actions.filter(action => action.status === NextActionStatus.QUEUED);
    const scheduledActions = actions.filter(action => action.status === NextActionStatus.SCHEDULED);
    const completedThisWeek = actions.filter(action => 
      action.status === NextActionStatus.DONE &&
      action.completedDate &&
      action.completedDate >= weekStart &&
      action.completedDate <= weekEnd
    );
    const overdueActions = actions.filter(action => 
      action.scheduledDate && 
      action.scheduledDate < new Date() && 
      action.status !== NextActionStatus.DONE
    );

    // Find top context by completion rate
    const contextStats = new Map<string, { total: number; completed: number }>();
    actions.forEach(action => {
      if (action.context) {
        const stats = contextStats.get(action.context) || { total: 0, completed: 0 };
        stats.total++;
        if (action.status === NextActionStatus.DONE) stats.completed++;
        contextStats.set(action.context, stats);
      }
    });

    let topContext;
    let highestRate = 0;
    contextStats.forEach((stats, context) => {
      const rate = stats.total > 0 ? stats.completed / stats.total : 0;
      if (rate > highestRate) {
        highestRate = rate;
        topContext = { context, completionRate: Math.round(rate * 100) };
      }
    });

    return {
      totalQueued: queuedActions.length,
      totalScheduled: scheduledActions.length,
      completedThisWeek: completedThisWeek.length,
      overdueItems: overdueActions.length,
      topContext
    };
  }

  // Calculate project statistics
  private static calculateProjectStats(
    projects: Project[], 
    weekStart: Date, 
    weekEnd: Date
  ) {
    const activeProjects = projects.filter(project => 
      project.status === ProjectStatus.QUEUED || project.status === ProjectStatus.IN_PROGRESS
    );

    const projectProgress = activeProjects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(task => 
        task.status === ProjectTaskStatus.COMPLETED
      ).length;
      
      const currentProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      // Calculate weekly progress
      const tasksCompletedThisWeek = project.tasks.filter(task => 
        task.status === ProjectTaskStatus.COMPLETED &&
        task.completedAt &&
        task.completedAt >= weekStart &&
        task.completedAt <= weekEnd
      ).length;
      
      const weeklyProgress = totalTasks > 0 ? (tasksCompletedThisWeek / totalTasks) * 100 : 0;
      
      // Check if project is stalled (no activity in 2+ weeks)
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const recentActivity = project.tasks.some(task => 
        task.updatedAt >= twoWeeksAgo
      ) || project.updatedAt >= twoWeeksAgo;
      
      return {
        id: project.id,
        title: project.title,
        currentProgress: Math.round(currentProgress),
        weeklyProgress: Math.round(weeklyProgress * 10) / 10,
        isStalled: !recentActivity
      };
    });

    const stalledProjects = projectProgress.filter(p => p.isStalled).length;

    return {
      totalActive: activeProjects.length,
      stalledProjects,
      projectProgress
    };
  }

  // Calculate issue statistics
  private static async calculateIssueStats(
    userId: string,
    weekStart: Date,
    weekEnd: Date
  ) {
    // For now, return empty stats since we're still implementing the issue system
    // TODO: Implement actual issue statistics calculation
    return {
      totalOpen: 0,
      totalInProgress: 0,
      resolvedThisWeek: 0,
      createdThisWeek: 0,
      overdueIssues: 0,
      averageResolutionTime: 0,
      issuesByType: [],
      issuesByPriority: [],
      mostActiveProject: undefined,
      complexityDistribution: {
        simple: 0,
        moderate: 0,
        complex: 0
      }
    };
  }

  // Calculate flow statistics
  private static calculateFlowStats(
    inboxItems: InboxItem[], 
    nextActions: NextAction[], 
    weekStart: Date, 
    weekEnd: Date
  ) {
    const newItemsCaptured = inboxItems.filter(item => 
      item.createdAt >= weekStart && item.createdAt <= weekEnd
    ).length;

    const inboxToNextActions = nextActions.filter(action => 
      action.createdAt >= weekStart && 
      action.createdAt <= weekEnd &&
      action.projectId === undefined // Exclude project-derived actions
    ).length;

    const nextActionsToDone = nextActions.filter(action => 
      action.status === NextActionStatus.DONE &&
      action.completedDate &&
      action.completedDate >= weekStart &&
      action.completedDate <= weekEnd
    ).length;

    // Count issues converted to next actions this week
    // For now, we'll set this to 0 as we don't have the issue conversion tracking yet
    const issuesToNextActions = 0;

    // Calculate productivity velocity (simplified - could be more sophisticated)
    const thisWeekCompleted = nextActionsToDone;
    const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekEnd = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const lastWeekCompleted = nextActions.filter(action => 
      action.status === NextActionStatus.DONE &&
      action.completedDate &&
      action.completedDate >= lastWeekStart &&
      action.completedDate <= lastWeekEnd
    ).length;

    const productivityVelocity = lastWeekCompleted > 0 
      ? Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100)
      : thisWeekCompleted > 0 ? 100 : 0;

    return {
      newItemsCaptured,
      inboxToNextActions,
      nextActionsToDone,
      issuesToNextActions,
      productivityVelocity
    };
  }

  // Generate AI insights
  private static async generateInsights(
    inboxItems: InboxItem[], 
    nextActions: NextAction[], 
    projects: Project[]
  ) {
    const twoMinuteRuleSuggestions = [];
    const recommendations = [];

    // Get 2-minute rule suggestions for unprocessed inbox items
    const unprocessedItems = inboxItems.filter(item => !item.processed).slice(0, 5);
    
    for (const item of unprocessedItems) {
      try {
        const analysis = await aiService.analyzeTask(item.title, item.description);
        if (analysis.is2MinuteCandidate && analysis.confidence > 0.6) {
          twoMinuteRuleSuggestions.push({
            itemId: item.id,
            title: item.title,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning || 'Quick task that can be completed immediately'
          });
        }
      } catch (error) {
        console.warn('AI analysis failed for item:', item.id);
      }
    }

    // Generate recommendations based on patterns
    const overdueActions = nextActions.filter(action => 
      action.scheduledDate && 
      action.scheduledDate < new Date() && 
      action.status !== NextActionStatus.DONE
    );

    if (overdueActions.length > 0) {
      recommendations.push(`You have ${overdueActions.length} overdue next actions. Consider rescheduling or breaking them into smaller tasks.`);
    }

    if (inboxItems.filter(item => !item.processed).length > 10) {
      recommendations.push('Your inbox has more than 10 unprocessed items. Schedule time to process them this week.');
    }

    const stalledProjects = projects.filter(project => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      return project.updatedAt < twoWeeksAgo;
    });

    if (stalledProjects.length > 0) {
      recommendations.push(`${stalledProjects.length} projects haven't been updated in 2+ weeks. Consider adding next actions or moving to Maybe/Someday.`);
    }

    // Simple productivity trends
    const productivityTrends = [
      {
        metric: 'Inbox Processing',
        trend: 'stable' as const,
        change: 0
      }
    ];

    return {
      twoMinuteRuleSuggestions,
      issueComplexitySuggestions: [], // TODO: Implement issue complexity suggestions
      recommendations,
      productivityTrends
    };
  }

  // Helper methods for data fetching
  private static async getInboxItems(userId: string): Promise<InboxItem[]> {
    const q = query(
      collection(db, `users/${userId}/inbox`),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    } as unknown)) as InboxItem[];
  }

  private static async getNextActions(userId: string): Promise<NextAction[]> {
    const q = query(
      collection(db, `users/${userId}/nextActions`),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    } as unknown)) as NextAction[];
  }

  private static async getProjects(userId: string): Promise<Project[]> {
    const q = query(
      collection(db, `users/${userId}/projects`),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data())
    } as unknown)) as Project[];
  }

  // Helper methods
  private static convertTimestamps(data: Record<string, unknown>) {
    return {
      ...data,
      createdAt: (data.createdAt as {toDate(): Date})?.toDate() || new Date(),
      updatedAt: (data.updatedAt as {toDate(): Date})?.toDate() || new Date(),
      scheduledDate: (data.scheduledDate as {toDate(): Date})?.toDate(),
      completedDate: (data.completedDate as {toDate(): Date})?.toDate(),
    };
  }

  private static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as week start
    return new Date(d.setDate(diff));
  }

  private static getWeekEnd(weekStart: Date): Date {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  // Save user preferences
  static async saveWeeklyReviewPreferences(
    userId: string, 
    preferences: WeeklyReviewPreferences
  ): Promise<void> {
    const docRef = doc(db, `users/${userId}/settings/weeklyReview`);
    await setDoc(docRef, {
      ...preferences,
      updatedAt: Timestamp.now()
    });
  }

  // Get user preferences
  static async getWeeklyReviewPreferences(userId: string): Promise<WeeklyReviewPreferences | null> {
    const docRef = doc(db, `users/${userId}/settings/weeklyReview`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        lastReviewDate: data.lastReviewDate?.toDate(),
        nextReviewDate: data.nextReviewDate?.toDate(),
      } as WeeklyReviewPreferences;
    }
    
    return null;
  }

  // Save weekly review session
  static async saveWeeklyReviewSession(
    userId: string, 
    session: Omit<WeeklyReviewSession, 'id'>
  ): Promise<string> {
    const docRef = doc(collection(db, `users/${userId}/weeklyReviews`));
    await setDoc(docRef, {
      ...session,
      completedAt: session.completedAt ? Timestamp.fromDate(session.completedAt) : null,
      weekStart: Timestamp.fromDate(session.weekStart),
      weekEnd: Timestamp.fromDate(session.weekEnd),
      createdAt: Timestamp.now()
    });
    return docRef.id;
  }
}
