import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { InboxItem, NextAction, Project, ProjectTask, NextActionStatus, ProjectStatus, ProjectTaskStatus, MaybeSomedayItem, MaybeSomedayStatus } from '@/types';

// Helper function to convert Firestore timestamps to Date objects
const convertTimestamps = (data: any) => ({
  ...data,
  createdAt: data.createdAt?.toDate() || new Date(),
  updatedAt: data.updatedAt?.toDate() || new Date(),
  scheduledDate: data.scheduledDate?.toDate(),
  completedDate: data.completedDate?.toDate(),
});

// Inbox Operations
export const inboxService = {
  // Get all inbox items for a user
  async getInboxItems(userId: string): Promise<InboxItem[]> {
    const q = query(
      collection(db, `users/${userId}/inbox`),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as InboxItem[];
  },

  // Subscribe to inbox changes
  subscribeToInbox(userId: string, callback: (items: InboxItem[]) => void) {
    const q = query(
      collection(db, `users/${userId}/inbox`),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      })) as InboxItem[];
      callback(items);
    });
  },

  // Add new inbox item
  async addInboxItem(userId: string, item: Omit<InboxItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    
    // Prepare document data, filtering out undefined values
    const docData: any = {
      title: item.title,
      userId,
      processed: false,
      createdAt: now,
      updatedAt: now,
    };
    
    // Only add fields that are not undefined
    if (item.description !== undefined) {
      docData.description = item.description;
    }
    if (item.notes !== undefined) {
      docData.notes = item.notes;
    }
    
    const docRef = await addDoc(collection(db, `users/${userId}/inbox`), docData);
    return docRef.id;
  },

  // Update inbox item
  async updateInboxItem(userId: string, itemId: string, updates: Partial<InboxItem>): Promise<void> {
    const docRef = doc(db, `users/${userId}/inbox`, itemId);
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };
    
    // Only add fields that are not undefined
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });
    
    await updateDoc(docRef, updateData);
  },

  // Delete inbox item
  async deleteInboxItem(userId: string, itemId: string): Promise<void> {
    const docRef = doc(db, `users/${userId}/inbox`, itemId);
    await deleteDoc(docRef);
  },
};

// Next Actions Operations
export const nextActionsService = {
  // Get all next actions for a user
  async getNextActions(userId: string): Promise<NextAction[]> {
    const q = query(
      collection(db, `users/${userId}/nextActions`),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as NextAction[];
  },

  // Subscribe to next actions changes
  subscribeToNextActions(userId: string, callback: (actions: NextAction[]) => void) {
    const q = query(
      collection(db, `users/${userId}/nextActions`),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const actions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      })) as NextAction[];
      callback(actions);
    });
  },

  // Add new next action
  async addNextAction(userId: string, action: Omit<NextAction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    
    // Prepare document data, filtering out undefined values
    const docData: any = {
      title: action.title,
      userId,
      status: action.status || NextActionStatus.QUEUED,
      createdAt: now,
      updatedAt: now,
    };
    
    // Only add fields that are not undefined
    if (action.description !== undefined) {
      docData.description = action.description;
    }
    if (action.notes !== undefined) {
      docData.notes = action.notes;
    }
    if (action.context !== undefined) {
      docData.context = action.context;
    }
    if (action.estimatedDuration !== undefined) {
      docData.estimatedDuration = action.estimatedDuration;
    }
    if (action.projectId !== undefined) {
      docData.projectId = action.projectId;
    }
    if (action.projectTaskId !== undefined) {
      docData.projectTaskId = action.projectTaskId;
    }
    if (action.scheduledDate !== undefined) {
      docData.scheduledDate = Timestamp.fromDate(action.scheduledDate);
    }
    if (action.completedDate !== undefined) {
      docData.completedDate = Timestamp.fromDate(action.completedDate);
    }
    if (action.calendarInviteSent !== undefined) {
      docData.calendarInviteSent = action.calendarInviteSent;
    }
    if (action.userEmail !== undefined) {
      docData.userEmail = action.userEmail;
    }
    
    const docRef = await addDoc(collection(db, `users/${userId}/nextActions`), docData);
    return docRef.id;
  },

  // Update next action
  async updateNextAction(userId: string, actionId: string, updates: Partial<NextAction>): Promise<void> {
    const docRef = doc(db, `users/${userId}/nextActions`, actionId);
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };
    
    // Only add fields that are not undefined
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'scheduledDate' && value instanceof Date) {
          updateData[key] = Timestamp.fromDate(value);
        } else if (key === 'completedDate' && value instanceof Date) {
          updateData[key] = Timestamp.fromDate(value);
        } else {
          updateData[key] = value;
        }
      }
    });
    
    await updateDoc(docRef, updateData);
    
    // Sync status back to project if this next action is linked to a project task
    if (updates.status) {
      // Get the updated next action to sync with project
      const updatedAction = await getDocs(query(collection(db, `users/${userId}/nextActions`), where('__name__', '==', actionId)));
      if (!updatedAction.empty) {
        const actionData = { id: actionId, ...convertTimestamps(updatedAction.docs[0].data()) } as NextAction;
        await projectsService.syncTaskFromNextAction(userId, actionData);
      }
    }
  },

  // Delete next action
  async deleteNextAction(userId: string, actionId: string): Promise<void> {
    const docRef = doc(db, `users/${userId}/nextActions`, actionId);
    await deleteDoc(docRef);
  },

  // Convert inbox item to next action
  async convertInboxToNextAction(
    userId: string, 
    inboxItem: InboxItem, 
    nextActionData: Partial<NextAction>
  ): Promise<void> {
    const batch = writeBatch(db);
    
    // Prepare next action data, filtering out undefined values
    const nextActionDoc: any = {
      title: inboxItem.title,
      userId,
      status: NextActionStatus.QUEUED,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Only add fields that are not undefined
    if (inboxItem.description !== undefined) {
      nextActionDoc.description = inboxItem.description;
    }
    if (inboxItem.notes !== undefined) {
      nextActionDoc.notes = inboxItem.notes;
    }
    
    // Add additional next action data, filtering undefined values
    Object.entries(nextActionData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'scheduledDate' && value instanceof Date) {
          nextActionDoc[key] = Timestamp.fromDate(value);
        } else if (key === 'completedDate' && value instanceof Date) {
          nextActionDoc[key] = Timestamp.fromDate(value);
        } else {
          nextActionDoc[key] = value;
        }
      }
    });
    
    // Add to next actions
    const nextActionRef = doc(collection(db, `users/${userId}/nextActions`));
    batch.set(nextActionRef, nextActionDoc);
    
    // Mark inbox item as processed
    const inboxRef = doc(db, `users/${userId}/inbox`, inboxItem.id);
    batch.update(inboxRef, {
      processed: true,
      updatedAt: Timestamp.now(),
    });
    
    await batch.commit();
  },
};

// Projects Operations
export const projectsService = {
  // Get all projects for a user
  async getProjects(userId: string): Promise<Project[]> {
    const q = query(
      collection(db, `users/${userId}/projects`),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Project[];
  },

  // Subscribe to projects changes
  subscribeToProjects(userId: string, callback: (projects: Project[]) => void) {
    const q = query(
      collection(db, `users/${userId}/projects`),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      })) as Project[];
      callback(projects);
    });
  },

  // Add new project
  async addProject(userId: string, project: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    
    const docData: any = {
      title: project.title,
      userId,
      status: project.status || ProjectStatus.QUEUED,
      tasks: project.tasks || [],
      createdAt: now,
      updatedAt: now,
    };
    
    // Only add fields that are not undefined
    if (project.description !== undefined) {
      docData.description = project.description;
    }
    if (project.notes !== undefined) {
      docData.notes = project.notes;
    }
    if (project.completedAt !== undefined) {
      docData.completedAt = Timestamp.fromDate(project.completedAt);
    }
    
    const docRef = await addDoc(collection(db, `users/${userId}/projects`), docData);
    return docRef.id;
  },

  // Update project
  async updateProject(userId: string, projectId: string, updates: Partial<Project>): Promise<void> {
    const docRef = doc(db, `users/${userId}/projects`, projectId);
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };
    
    // Only add fields that are not undefined
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'completedAt' && value instanceof Date) {
          updateData[key] = Timestamp.fromDate(value);
        } else {
          updateData[key] = value;
        }
      }
    });
    
    await updateDoc(docRef, updateData);
  },

  // Delete project
  async deleteProject(userId: string, projectId: string): Promise<void> {
    const docRef = doc(db, `users/${userId}/projects`, projectId);
    await deleteDoc(docRef);
  },

  // Add task to project
  async addTaskToProject(userId: string, projectId: string, task: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const projectRef = doc(db, `users/${userId}/projects`, projectId);
    const projectSnap = await getDocs(query(collection(db, `users/${userId}/projects`), where('__name__', '==', projectId)));
    
    if (!projectSnap.empty) {
      const projectData = projectSnap.docs[0].data() as Project;
      const newTask: ProjectTask = {
        ...task,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedTasks = [...(projectData.tasks || []), newTask];
      
      await updateDoc(projectRef, {
        tasks: updatedTasks,
        updatedAt: Timestamp.now(),
      });
    }
  },

  // Update task in project
  async updateTaskInProject(userId: string, projectId: string, taskId: string, updates: Partial<ProjectTask>): Promise<void> {
    const projectRef = doc(db, `users/${userId}/projects`, projectId);
    const projectSnap = await getDocs(query(collection(db, `users/${userId}/projects`), where('__name__', '==', projectId)));
    
    if (!projectSnap.empty) {
      const projectData = projectSnap.docs[0].data() as Project;
      const updatedTasks = (projectData.tasks || []).map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              ...updates, 
              updatedAt: new Date(),
              ...(updates.status === ProjectTaskStatus.COMPLETED && !task.completedAt ? { completedAt: new Date() } : {})
            }
          : task
      );
      
      await updateDoc(projectRef, {
        tasks: updatedTasks,
        updatedAt: Timestamp.now(),
      });
    }
  },

  // Delete task from project
  async deleteTaskFromProject(userId: string, projectId: string, taskId: string): Promise<void> {
    const projectRef = doc(db, `users/${userId}/projects`, projectId);
    const projectSnap = await getDocs(query(collection(db, `users/${userId}/projects`), where('__name__', '==', projectId)));
    
    if (!projectSnap.empty) {
      const projectData = projectSnap.docs[0].data() as Project;
      const updatedTasks = (projectData.tasks || []).filter(task => task.id !== taskId);
      
      await updateDoc(projectRef, {
        tasks: updatedTasks,
        updatedAt: Timestamp.now(),
      });
    }
  },

  // Convert project task to next action
  async convertTaskToNextAction(
    userId: string,
    projectId: string,
    taskId: string,
    nextActionData?: Partial<NextAction>
  ): Promise<string> {
    const batch = writeBatch(db);
    
    // Get the project to find the task
    const projectSnap = await getDocs(query(collection(db, `users/${userId}/projects`), where('__name__', '==', projectId)));
    
    if (!projectSnap.empty) {
      const projectData = projectSnap.docs[0].data() as Project;
      const task = (projectData.tasks || []).find(t => t.id === taskId);
      
      if (task) {
        // Create next action
        const nextActionRef = doc(collection(db, `users/${userId}/nextActions`));
        const nextActionDoc: any = {
          title: task.title,
          userId,
          status: NextActionStatus.QUEUED,
          projectId,
          projectTaskId: taskId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        // Add optional fields
        if (task.description !== undefined) {
          nextActionDoc.description = task.description;
        }
        if (nextActionData) {
          Object.entries(nextActionData).forEach(([key, value]) => {
            if (value !== undefined) {
              if (key === 'scheduledDate' && value instanceof Date) {
                nextActionDoc[key] = Timestamp.fromDate(value);
              } else if (key === 'completedDate' && value instanceof Date) {
                nextActionDoc[key] = Timestamp.fromDate(value);
              } else {
                nextActionDoc[key] = value;
              }
            }
          });
        }
        
        batch.set(nextActionRef, nextActionDoc);
        
        // Update task status in project
        const updatedTasks = (projectData.tasks || []).map(t => 
          t.id === taskId 
            ? { 
                ...t, 
                status: ProjectTaskStatus.IN_NEXT_ACTIONS,
                nextActionId: nextActionRef.id,
                updatedAt: new Date()
              }
            : t
        );
        
        const projectRef = doc(db, `users/${userId}/projects`, projectId);
        batch.update(projectRef, {
          tasks: updatedTasks,
          updatedAt: Timestamp.now(),
        });
        
        await batch.commit();
        return nextActionRef.id;
      }
    }
    
    throw new Error('Task not found');
  },

  // Sync task status from next action completion
  async syncTaskFromNextAction(userId: string, nextAction: NextAction): Promise<void> {
    if (!nextAction.projectId || !nextAction.projectTaskId) return;
    
    let newTaskStatus: ProjectTaskStatus;
    
    if (nextAction.status === NextActionStatus.DONE) {
      newTaskStatus = ProjectTaskStatus.COMPLETED;
    } else if (nextAction.status === NextActionStatus.SCHEDULED) {
      newTaskStatus = ProjectTaskStatus.SCHEDULED;
    } else {
      // If next action is queued, keep it as "in next actions"
      newTaskStatus = ProjectTaskStatus.IN_NEXT_ACTIONS;
    }
    
    await this.updateTaskInProject(
      userId, 
      nextAction.projectId, 
      nextAction.projectTaskId, 
      { 
        status: newTaskStatus,
        ...(nextAction.status === NextActionStatus.DONE && nextAction.completedDate ? { completedAt: nextAction.completedDate } : {})
      }
    );
  },
}; 

// Maybe/Someday Operations
export const maybeSomedayService = {
  // Get all maybe/someday items for a user
  async getMaybeSomedayItems(userId: string): Promise<MaybeSomedayItem[]> {
    const q = query(
      collection(db, `users/${userId}/maybeSomeday`),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as MaybeSomedayItem[];
  },

  // Subscribe to maybe/someday items changes
  subscribeToMaybeSomedayItems(userId: string, callback: (items: MaybeSomedayItem[]) => void) {
    const q = query(
      collection(db, `users/${userId}/maybeSomeday`),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      })) as MaybeSomedayItem[];
      callback(items);
    });
  },

  // Add new maybe/someday item
  async addMaybeSomedayItem(userId: string, item: Omit<MaybeSomedayItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    
    // Prepare document data, filtering out undefined values
    const docData: any = {
      title: item.title,
      userId,
      status: item.status || MaybeSomedayStatus.MAYBE,
      createdAt: now,
      updatedAt: now,
    };
    
    // Only add fields that are not undefined
    if (item.description !== undefined) {
      docData.description = item.description;
    }
    if (item.notes !== undefined) {
      docData.notes = item.notes;
    }
    if (item.priority !== undefined) {
      docData.priority = item.priority;
    }
    if (item.tags !== undefined) {
      docData.tags = item.tags;
    }
    if (item.reviewDate !== undefined) {
      docData.reviewDate = Timestamp.fromDate(item.reviewDate);
    }
    
    const docRef = await addDoc(collection(db, `users/${userId}/maybeSomeday`), docData);
    return docRef.id;
  },

  // Update maybe/someday item
  async updateMaybeSomedayItem(userId: string, itemId: string, updates: Partial<MaybeSomedayItem>): Promise<void> {
    const itemRef = doc(db, `users/${userId}/maybeSomeday`, itemId);
    
    // Prepare update data, filtering out undefined values
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };
    
    // Only add fields that are not undefined
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'reviewDate' && value instanceof Date) {
          updateData[key] = Timestamp.fromDate(value);
        } else {
          updateData[key] = value;
        }
      }
    });
    
    await updateDoc(itemRef, updateData);
  },

  // Delete maybe/someday item
  async deleteMaybeSomedayItem(userId: string, itemId: string): Promise<void> {
    const itemRef = doc(db, `users/${userId}/maybeSomeday`, itemId);
    await deleteDoc(itemRef);
  },

  // Convert inbox item to maybe/someday
  async convertInboxToMaybeSomeday(
    userId: string, 
    inboxItem: InboxItem, 
    maybeSomedayData: Partial<MaybeSomedayItem>
  ): Promise<void> {
    const batch = writeBatch(db);
    
    // Prepare maybe/someday data, filtering out undefined values
    const maybeSomedayDoc: any = {
      title: inboxItem.title,
      userId,
      status: MaybeSomedayStatus.MAYBE,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Only add fields that are not undefined
    if (inboxItem.description !== undefined) {
      maybeSomedayDoc.description = inboxItem.description;
    }
    if (inboxItem.notes !== undefined) {
      maybeSomedayDoc.notes = inboxItem.notes;
    }
    
    // Add additional maybe/someday data, filtering undefined values
    Object.entries(maybeSomedayData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'reviewDate' && value instanceof Date) {
          maybeSomedayDoc[key] = Timestamp.fromDate(value);
        } else {
          maybeSomedayDoc[key] = value;
        }
      }
    });
    
    // Add to maybe/someday
    const maybeSomedayRef = doc(collection(db, `users/${userId}/maybeSomeday`));
    batch.set(maybeSomedayRef, maybeSomedayDoc);
    
    // Mark inbox item as processed
    const inboxRef = doc(db, `users/${userId}/inbox`, inboxItem.id);
    batch.update(inboxRef, {
      processed: true,
      updatedAt: Timestamp.now(),
    });
    
    await batch.commit();
  },

  // Convert maybe/someday item to next action
  async convertMaybeSomedayToNextAction(
    userId: string,
    maybeSomedayItem: MaybeSomedayItem,
    nextActionData?: Partial<NextAction>
  ): Promise<void> {
    const batch = writeBatch(db);
    
    // Prepare next action data
    const nextActionDoc: any = {
      title: maybeSomedayItem.title,
      userId,
      status: NextActionStatus.QUEUED,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Only add fields that are not undefined
    if (maybeSomedayItem.description !== undefined) {
      nextActionDoc.description = maybeSomedayItem.description;
    }
    if (maybeSomedayItem.notes !== undefined) {
      nextActionDoc.notes = maybeSomedayItem.notes;
    }
    
    // Add additional next action data, filtering undefined values
    if (nextActionData) {
      Object.entries(nextActionData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'scheduledDate' && value instanceof Date) {
            nextActionDoc[key] = Timestamp.fromDate(value);
          } else if (key === 'completedDate' && value instanceof Date) {
            nextActionDoc[key] = Timestamp.fromDate(value);
          } else {
            nextActionDoc[key] = value;
          }
        }
      });
    }
    
    // Add to next actions
    const nextActionRef = doc(collection(db, `users/${userId}/nextActions`));
    batch.set(nextActionRef, nextActionDoc);
    
    // Delete maybe/someday item
    const maybeSomedayRef = doc(db, `users/${userId}/maybeSomeday`, maybeSomedayItem.id);
    batch.delete(maybeSomedayRef);
    
    await batch.commit();
  },
}; 