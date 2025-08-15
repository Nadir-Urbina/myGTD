export type ReferenceItemType = 'file' | 'link' | 'note' | 'contact' | 'procedure';

export interface ReferenceItem {
  id: string;
  title: string;
  description?: string;
  type: ReferenceItemType;
  content: string; // For notes, procedures, or file path
  url?: string; // For links
  tags: string[];
  category?: string;
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  
  // File-specific metadata
  fileMetadata?: {
    originalName: string;
    size: number;
    mimeType: string;
    downloadUrl: string;
    storagePath: string;
  };
  
  // Link-specific metadata
  linkMetadata?: {
    title?: string;
    description?: string;
    imageUrl?: string;
    siteName?: string;
    lastChecked?: Date;
    isValid: boolean;
  };
  
  // Contact-specific data
  contactData?: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    position?: string;
    notes?: string;
  };
  
  // Usage tracking
  lastAccessed?: Date;
  accessCount: number;
}

export interface ReferenceCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  userId: string;
  itemCount: number;
  createdAt: Date;
}

export interface ReferenceSearchFilters {
  query?: string;
  type?: ReferenceItemType[];
  category?: string;
  tags?: string[];
  favorite?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ReferenceStats {
  totalItems: number;
  itemsByType: Record<ReferenceItemType, number>;
  recentlyAdded: ReferenceItem[];
  mostAccessed: ReferenceItem[];
  categories: ReferenceCategory[];
  tags: Array<{
    name: string;
    count: number;
  }>;
}
