'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReferenceService } from '@/services/reference-material';
import { ReferenceItem, ReferenceItemType, ReferenceSearchFilters } from '@/types/reference-material';
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  User, 
  Settings, 
  Star,
  Calendar,
  Eye,
  Download,
  ExternalLink,
  Trash2,
  Tag,
  Heart,
  BookOpen,
  File,
  Grid,
  List
} from 'lucide-react';

export default function ReferencePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ReferenceItemType | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addItemType, setAddItemType] = useState<ReferenceItemType>('note');

  useEffect(() => {
    if (!user) return;

    const filters: ReferenceSearchFilters = {
      query: searchQuery || undefined,
      type: selectedType === 'all' ? undefined : [selectedType],
      favorite: showFavoritesOnly || undefined
    };

    // Subscribe to reference items
    const unsubscribe = ReferenceService.subscribeToReferenceItems(
      user.uid,
      (items) => {
        setReferenceItems(items);
        setLoading(false);
      },
      filters
    );

    return () => unsubscribe();
  }, [user, searchQuery, selectedType, showFavoritesOnly]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    try {
      for (const file of Array.from(files)) {
        await ReferenceService.uploadFileAndCreateReference(
          user.uid,
          file,
          undefined, // Will use file name as title
          undefined, // No description
          [], // No tags initially
          undefined // No category initially
        );
      }
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };

  const toggleFavorite = async (item: ReferenceItem) => {
    if (!user) return;
    
    try {
      await ReferenceService.updateReferenceItem(user.uid, item.id, {
        favorite: !item.favorite
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const trackAccess = async (item: ReferenceItem) => {
    if (!user) return;
    
    try {
      await ReferenceService.trackItemAccess(user.uid, item.id);
    } catch (error) {
      console.error('Failed to track access:', error);
    }
  };

  const getTypeIcon = (type: ReferenceItemType) => {
    switch (type) {
      case 'file': return File;
      case 'link': return LinkIcon;
      case 'note': return FileText;
      case 'contact': return User;
      case 'procedure': return Settings;
      default: return FileText;
    }
  };

  const getTypeColor = (type: ReferenceItemType) => {
    switch (type) {
      case 'file': return 'text-blue-600 bg-blue-50';
      case 'link': return 'text-green-600 bg-green-50';
      case 'note': return 'text-yellow-600 bg-yellow-50';
      case 'contact': return 'text-purple-600 bg-purple-50';
      case 'procedure': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleItemClick = async (item: ReferenceItem) => {
    await trackAccess(item);
    
    if (item.type === 'link' && item.url) {
      window.open(item.url, '_blank');
    } else if (item.type === 'file' && item.fileMetadata?.downloadUrl) {
      window.open(item.fileMetadata.downloadUrl, '_blank');
    }
    // For notes, contacts, and procedures, we could open a detail modal
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                📚 {t('reference.title')}
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                {t('reference.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Add Button */}
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t('reference.addItem')}
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t('reference.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ReferenceItemType | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="file">{t('reference.types.file')}</option>
              <option value="link">{t('reference.types.link')}</option>
              <option value="note">{t('reference.types.note')}</option>
              <option value="contact">{t('reference.types.contact')}</option>
              <option value="procedure">{t('reference.types.procedure')}</option>
            </select>

            {/* Favorites Filter */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                showFavoritesOnly 
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-700' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              {t('reference.favorites')}
            </button>

            {/* File Upload */}
            <label className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
              <Upload className="h-4 w-4" />
              {t('reference.uploadFile')}
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
              />
            </label>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reference materials...</p>
          </div>
        ) : referenceItems.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('reference.noItems')}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {t('reference.noItemsDesc')}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                {t('reference.uploadFile')}
              </Button>
              <Button variant="outline" size="sm">
                <LinkIcon className="h-4 w-4 mr-2" />
                {t('reference.addLink')}
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                {t('reference.addNote')}
              </Button>
            </div>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {referenceItems.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              const typeColor = getTypeColor(item.type);

              return viewMode === 'grid' ? (
                // Grid Card View
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${typeColor}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Heart className={`h-4 w-4 ${item.favorite ? 'fill-current text-red-500' : 'text-gray-400'}`} />
                    </button>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 truncate mb-1">{item.title}</h3>
                  
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                  )}
                  
                  {/* File metadata */}
                  {item.type === 'file' && item.fileMetadata && (
                    <p className="text-xs text-gray-500 mb-2">
                      {formatFileSize(item.fileMetadata.size)}
                    </p>
                  )}
                  
                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{item.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.createdAt.toLocaleDateString()}</span>
                    {item.accessCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{item.accessCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // List Row View
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${typeColor} flex-shrink-0`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                        {item.favorite && (
                          <Heart className="h-4 w-4 fill-current text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      {item.description && (
                        <p className="text-sm text-gray-600 truncate">{item.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{item.createdAt.toLocaleDateString()}</span>
                        {item.type === 'file' && item.fileMetadata && (
                          <span>{formatFileSize(item.fileMetadata.size)}</span>
                        )}
                        {item.accessCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{item.accessCount} views</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Heart className={`h-4 w-4 ${item.favorite ? 'fill-current text-red-500' : 'text-gray-400'}`} />
                      </button>
                      
                      {item.type === 'link' && (
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      )}
                      
                      {item.type === 'file' && (
                        <Download className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
