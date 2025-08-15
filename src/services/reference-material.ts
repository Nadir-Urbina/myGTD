import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  UpdateData,
  WithFieldValue,
  DocumentData
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getStorage
} from 'firebase/storage';
import { db } from '@/lib/firebase';
import { 
  ReferenceItem, 
  ReferenceCategory, 
  ReferenceSearchFilters, 
  ReferenceStats,
  ReferenceItemType 
} from '@/types/reference-material';

// Initialize Firebase Storage
const storage = getStorage();

// Type aliases for Firestore operations
type FirestoreCreateData = WithFieldValue<DocumentData>;
type FirestoreUpdateData = UpdateData<DocumentData>;

// Helper function to convert Firestore timestamps to Date objects
const convertTimestamps = (data: Record<string, unknown>) => ({
  ...data,
  createdAt: (data.createdAt as {toDate(): Date})?.toDate() || new Date(),
  updatedAt: (data.updatedAt as {toDate(): Date})?.toDate() || new Date(),
  lastAccessed: (data.lastAccessed as {toDate(): Date})?.toDate(),
  lastChecked: ((data.linkMetadata as {lastChecked?: {toDate(): Date}})?.lastChecked)?.toDate(),
});

export class ReferenceService {
  // Get all reference items for a user
  static async getReferenceItems(
    userId: string, 
    filters?: ReferenceSearchFilters
  ): Promise<ReferenceItem[]> {
    let q = query(
      collection(db, `users/${userId}/referenceItems`),
      orderBy('updatedAt', 'desc')
    );

    // Apply filters
    if (filters?.type && filters.type.length > 0) {
      q = query(q, where('type', 'in', filters.type));
    }
    
    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters?.favorite) {
      q = query(q, where('favorite', '==', true));
    }

    const snapshot = await getDocs(q);
    let items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as unknown)) as ReferenceItem[];

    // Apply client-side filters
    if (filters?.query) {
      const searchQuery = filters.query.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(searchQuery) ||
        item.description?.toLowerCase().includes(searchQuery) ||
        item.content.toLowerCase().includes(searchQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery))
      );
    }

    if (filters?.tags && filters.tags.length > 0) {
      items = items.filter(item => 
        filters.tags!.some(tag => item.tags.includes(tag))
      );
    }

    if (filters?.dateRange) {
      items = items.filter(item => 
        item.createdAt >= filters.dateRange!.start &&
        item.createdAt <= filters.dateRange!.end
      );
    }

    return items;
  }

  // Subscribe to reference items changes
  static subscribeToReferenceItems(
    userId: string, 
    callback: (items: ReferenceItem[]) => void,
    filters?: ReferenceSearchFilters
  ) {
    let q = query(
      collection(db, `users/${userId}/referenceItems`),
      orderBy('updatedAt', 'desc')
    );

    // Apply basic filters (complex ones handled client-side)
    if (filters?.type && filters.type.length > 0) {
      q = query(q, where('type', 'in', filters.type));
    }

    return onSnapshot(q, (snapshot) => {
      let items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as unknown)) as ReferenceItem[];

      // Apply client-side filters
      if (filters) {
        items = this.applyClientFilters(items, filters);
      }

      callback(items);
    });
  }

  // Add new reference item
  static async addReferenceItem(
    userId: string, 
    item: Omit<ReferenceItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const now = Timestamp.now();
    
    const docData: FirestoreCreateData = {
      title: item.title,
      type: item.type,
      content: item.content,
      tags: item.tags || [],
      favorite: item.favorite || false,
      accessCount: item.accessCount || 0,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    // Add optional fields
    if (item.description !== undefined) docData.description = item.description;
    if (item.url !== undefined) docData.url = item.url;
    if (item.category !== undefined) docData.category = item.category;
    if (item.fileMetadata !== undefined) docData.fileMetadata = item.fileMetadata;
    if (item.linkMetadata !== undefined) docData.linkMetadata = item.linkMetadata;
    if (item.contactData !== undefined) docData.contactData = item.contactData;
    if (item.lastAccessed !== undefined) docData.lastAccessed = Timestamp.fromDate(item.lastAccessed);

    const docRef = await addDoc(collection(db, `users/${userId}/referenceItems`), docData);
    return docRef.id;
  }

  // Update reference item
  static async updateReferenceItem(
    userId: string, 
    itemId: string, 
    updates: Partial<ReferenceItem>
  ): Promise<void> {
    const docRef = doc(db, `users/${userId}/referenceItems`, itemId);
    const updateData: FirestoreUpdateData = {
      updatedAt: Timestamp.now(),
    };

    // Add fields that are not undefined
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'lastAccessed' && value instanceof Date) {
          updateData[key] = Timestamp.fromDate(value);
        } else {
          updateData[key] = value;
        }
      }
    });

    await updateDoc(docRef, updateData);
  }

  // Delete reference item
  static async deleteReferenceItem(userId: string, itemId: string): Promise<void> {
    // First get the item to check if it has files to delete
    const itemDoc = await getDoc(doc(db, `users/${userId}/referenceItems`, itemId));
    
    if (itemDoc.exists()) {
      const item = itemDoc.data() as ReferenceItem;
      
      // Delete associated file from storage if it exists
      if (item.fileMetadata?.storagePath) {
        try {
          const fileRef = ref(storage, item.fileMetadata.storagePath);
          await deleteObject(fileRef);
        } catch (error) {
          console.warn('Failed to delete file from storage:', error);
        }
      }
    }

    // Delete the document
    const docRef = doc(db, `users/${userId}/referenceItems`, itemId);
    await deleteDoc(docRef);
  }

  // Upload file and create reference item
  static async uploadFileAndCreateReference(
    userId: string,
    file: File,
    title?: string,
    description?: string,
    tags?: string[],
    category?: string
  ): Promise<string> {
    try {
      // Create a unique file path
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const storagePath = `users/${userId}/reference/${fileName}`;
      
      // Upload file to Firebase Storage
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      // Create reference item
      const referenceItem: Omit<ReferenceItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        title: title || file.name,
        description,
        type: 'file',
        content: file.name,
        tags: tags || [],
        category,
        favorite: false,
        accessCount: 0,
        fileMetadata: {
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          downloadUrl,
          storagePath
        }
      };

      return await this.addReferenceItem(userId, referenceItem);
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw new Error('Failed to upload file. Please try again.');
    }
  }

  // Track item access
  static async trackItemAccess(userId: string, itemId: string): Promise<void> {
    const docRef = doc(db, `users/${userId}/referenceItems`, itemId);
    const now = Timestamp.now();
    
    // Get current access count
    const itemDoc = await getDoc(docRef);
    const currentCount = itemDoc.exists() ? (itemDoc.data().accessCount || 0) : 0;
    
    await updateDoc(docRef, {
      lastAccessed: now,
      accessCount: currentCount + 1,
      updatedAt: now
    });
  }

  // Get reference categories
  static async getReferenceCategories(userId: string): Promise<ReferenceCategory[]> {
    const q = query(
      collection(db, `users/${userId}/referenceCategories`),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as unknown)) as ReferenceCategory[];
  }

  // Add reference category
  static async addReferenceCategory(
    userId: string,
    category: Omit<ReferenceCategory, 'id' | 'userId' | 'itemCount' | 'createdAt'>
  ): Promise<string> {
    const now = Timestamp.now();
    
    const docData: FirestoreCreateData = {
      name: category.name,
      userId,
      itemCount: 0,
      createdAt: now,
    };

    if (category.description !== undefined) docData.description = category.description;
    if (category.color !== undefined) docData.color = category.color;
    if (category.icon !== undefined) docData.icon = category.icon;

    const docRef = await addDoc(collection(db, `users/${userId}/referenceCategories`), docData);
    return docRef.id;
  }

  // Get reference statistics
  static async getReferenceStats(userId: string): Promise<ReferenceStats> {
    const [items, categories] = await Promise.all([
      this.getReferenceItems(userId),
      this.getReferenceCategories(userId)
    ]);

    // Calculate items by type
    const itemsByType: Record<ReferenceItemType, number> = {
      file: 0,
      link: 0,
      note: 0,
      contact: 0,
      procedure: 0
    };

    items.forEach(item => {
      itemsByType[item.type]++;
    });

    // Get recently added (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentlyAdded = items
      .filter(item => item.createdAt >= weekAgo)
      .slice(0, 5);

    // Get most accessed
    const mostAccessed = items
      .filter(item => item.accessCount > 0)
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 5);

    // Get tag statistics
    const tagCounts = new Map<string, number>();
    items.forEach(item => {
      item.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const tags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalItems: items.length,
      itemsByType,
      recentlyAdded,
      mostAccessed,
      categories,
      tags
    };
  }

  // Extract link metadata (simplified version)
  static async extractLinkMetadata(url: string): Promise<{
    title: string;
    description: string;
    siteName: string;
    lastChecked: Date;
    isValid: boolean;
  }> {
    try {
      // This would typically use a service like Open Graph or Meta Tags API
      // For now, we'll return basic metadata
      const urlObj = new URL(url);
      
      return {
        title: urlObj.hostname,
        description: `Link from ${urlObj.hostname}`,
        siteName: urlObj.hostname,
        lastChecked: new Date(),
        isValid: true
      };
    } catch {
      return {
        title: 'Invalid URL',
        description: 'Could not parse URL',
        siteName: 'Unknown',
        lastChecked: new Date(),
        isValid: false
      };
    }
  }

  // Convert inbox item to reference material
  static async convertInboxToReference(
    userId: string,
    inboxItem: {id: string; title: string; description?: string}, // InboxItem type
    referenceData: Partial<ReferenceItem>
  ): Promise<void> {
    const batch = writeBatch(db);

    // Create reference item
    const referenceDoc: FirestoreCreateData = {
      title: inboxItem.title,
      type: referenceData.type || 'note',
      content: inboxItem.description || inboxItem.title,
      tags: referenceData.tags || [],
      favorite: false,
      accessCount: 0,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Add additional reference data
    Object.entries(referenceData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'createdAt' && key !== 'updatedAt') {
        referenceDoc[key] = value;
      }
    });

    const referenceRef = doc(collection(db, `users/${userId}/referenceItems`));
    batch.set(referenceRef, referenceDoc);

    // Mark inbox item as processed
    const inboxRef = doc(db, `users/${userId}/inbox`, inboxItem.id);
    batch.update(inboxRef, {
      processed: true,
      updatedAt: Timestamp.now(),
    });

    await batch.commit();
  }

  // Helper method to apply client-side filters
  private static applyClientFilters(
    items: ReferenceItem[], 
    filters: ReferenceSearchFilters
  ): ReferenceItem[] {
    let filteredItems = [...items];

    if (filters.query) {
      const searchQuery = filters.query.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery) ||
        item.description?.toLowerCase().includes(searchQuery) ||
        item.content.toLowerCase().includes(searchQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery))
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredItems = filteredItems.filter(item => 
        filters.tags!.some(tag => item.tags.includes(tag))
      );
    }

    if (filters.dateRange) {
      filteredItems = filteredItems.filter(item => 
        item.createdAt >= filters.dateRange!.start &&
        item.createdAt <= filters.dateRange!.end
      );
    }

    return filteredItems;
  }
}
