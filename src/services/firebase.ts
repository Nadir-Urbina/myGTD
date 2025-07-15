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
import { InboxItem, NextAction, Project, NextActionStatus } from '@/types';

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
    const docRef = await addDoc(collection(db, `users/${userId}/inbox`), {
      ...item,
      userId,
      processed: false,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  // Update inbox item
  async updateInboxItem(userId: string, itemId: string, updates: Partial<InboxItem>): Promise<void> {
    const docRef = doc(db, `users/${userId}/inbox`, itemId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
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
    const docRef = await addDoc(collection(db, `users/${userId}/nextActions`), {
      ...action,
      userId,
      status: action.status || NextActionStatus.QUEUED,
      createdAt: now,
      updatedAt: now,
      scheduledDate: action.scheduledDate ? Timestamp.fromDate(action.scheduledDate) : null,
      completedDate: action.completedDate ? Timestamp.fromDate(action.completedDate) : null,
    });
    return docRef.id;
  },

  // Update next action
  async updateNextAction(userId: string, actionId: string, updates: Partial<NextAction>): Promise<void> {
    const docRef = doc(db, `users/${userId}/nextActions`, actionId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    if (updates.scheduledDate) {
      updateData.scheduledDate = Timestamp.fromDate(updates.scheduledDate);
    }
    if (updates.completedDate) {
      updateData.completedDate = Timestamp.fromDate(updates.completedDate);
    }
    
    await updateDoc(docRef, updateData);
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
    
    // Add to next actions
    const nextActionRef = doc(collection(db, `users/${userId}/nextActions`));
    batch.set(nextActionRef, {
      title: inboxItem.title,
      description: inboxItem.description,
      notes: inboxItem.notes,
      userId,
      status: NextActionStatus.QUEUED,
      ...nextActionData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    // Mark inbox item as processed
    const inboxRef = doc(db, `users/${userId}/inbox`, inboxItem.id);
    batch.update(inboxRef, {
      processed: true,
      updatedAt: Timestamp.now(),
    });
    
    await batch.commit();
  },
}; 