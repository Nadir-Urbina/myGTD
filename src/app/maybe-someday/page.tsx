'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Cloud, Archive, Lightbulb, Clock, Trash2, ArrowRight } from 'lucide-react';
import { MaybeSomedayItem, MaybeSomedayStatus } from '@/types';
import { maybeSomedayService } from '@/services/firebase';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const statusConfig = {
  [MaybeSomedayStatus.MAYBE]: {
    label: 'Maybe',
    icon: Lightbulb,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
  },
  [MaybeSomedayStatus.SOMEDAY]: {
    label: 'Someday',
    icon: Cloud,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  [MaybeSomedayStatus.ARCHIVED]: {
    label: 'Archived',
    icon: Archive,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
};

const priorityConfig = {
  low: { label: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' },
  medium: { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  high: { label: 'High', color: 'text-red-600', bgColor: 'bg-red-50' },
};

export default function MaybeSomedayPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<MaybeSomedayItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemStatus, setNewItemStatus] = useState<MaybeSomedayStatus>(MaybeSomedayStatus.MAYBE);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    itemId: string | null;
  }>({ isOpen: false, itemId: null });

  useEffect(() => {
    if (!user) return;

    // Subscribe to maybe/someday changes
    const unsubscribe = maybeSomedayService.subscribeToMaybeSomedayItems(user.uid, (items) => {
      setItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || adding || !user) return;

    setAdding(true);
    try {
      await maybeSomedayService.addMaybeSomedayItem(user.uid, {
        title: newItemTitle.trim(),
        status: newItemStatus,
      });
      setNewItemTitle('');
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (item: MaybeSomedayItem, newStatus: MaybeSomedayStatus) => {
    if (!user) return;
    
    try {
      await maybeSomedayService.updateMaybeSomedayItem(user.uid, item.id, { status: newStatus });
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setDeleteConfirmation({ isOpen: true, itemId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.itemId || !user) return;

    try {
      await maybeSomedayService.deleteMaybeSomedayItem(user.uid, deleteConfirmation.itemId);
      setDeleteConfirmation({ isOpen: false, itemId: null });
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Group items by status
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.status]) {
      acc[item.status] = [];
    }
    acc[item.status].push(item);
    return acc;
  }, {} as Record<MaybeSomedayStatus, MaybeSomedayItem[]>);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Maybe/Someday</h1>
          <p className="text-gray-600 text-sm md:text-base">
            Ideas and tasks for the future. Things you might want to do someday but not now.
          </p>
        </div>

        {/* Quick add form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Input
                type="text"
                placeholder="Add a new maybe/someday item..."
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                className="flex-1"
              />
              <select
                value={newItemStatus}
                onChange={(e) => setNewItemStatus(e.target.value as MaybeSomedayStatus)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={MaybeSomedayStatus.MAYBE}>Maybe</option>
                <option value={MaybeSomedayStatus.SOMEDAY}>Someday</option>
              </select>
              <Button type="submit" disabled={adding} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                {adding ? 'Adding...' : 'Add Item'}
              </Button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading your maybe/someday items...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Render each status group */}
            {Object.entries(groupedItems).map(([status, statusItems]) => {
              const config = statusConfig[status as MaybeSomedayStatus];
              
              // Skip if no config found for this status
              if (!config) {
                console.warn('No config found for status:', status);
                return null;
              }
              
              const Icon = config.icon;

              return (
                <div key={status}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("p-2 rounded-lg", config.bgColor)}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {config.label} ({statusItems.length})
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {statusItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600">
                                  {item.title}
                                </h3>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(item.createdAt)}
                                  </div>
                                  {item.priority && (
                                    <div className={cn(
                                      "px-2 py-1 rounded-full text-xs font-medium",
                                      priorityConfig[item.priority].bgColor,
                                      priorityConfig[item.priority].color
                                    )}>
                                      {priorityConfig[item.priority].label} Priority
                                    </div>
                                  )}
                                  {item.reviewDate && (
                                    <div className="text-xs text-orange-600">
                                      Review: {formatDate(item.reviewDate)}
                                    </div>
                                  )}
                                  {item.tags && item.tags.length > 0 && (
                                    <div className="flex gap-1">
                                      {item.tags.slice(0, 3).map((tag, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                          {tag}
                                        </span>
                                      ))}
                                      {item.tags.length > 3 && (
                                        <span className="text-gray-400 text-xs">+{item.tags.length - 3}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Status change buttons */}
                            <div className="flex gap-1">
                              {Object.entries(statusConfig).map(([statusKey, statusConfigItem]) => {
                                if (statusKey === item.status) return null;
                                const StatusIcon = statusConfigItem.icon;
                                return (
                                  <button
                                    key={statusKey}
                                    onClick={() => handleStatusChange(item, statusKey as MaybeSomedayStatus)}
                                    className={cn(
                                      "p-1.5 rounded-md transition-colors text-xs",
                                      "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                                    )}
                                    title={`Move to ${statusConfigItem.label}`}
                                  >
                                    <StatusIcon className="h-3 w-3" />
                                  </button>
                                );
                              })}
                            </div>

                            {/* Actions */}
                            <Link 
                              href={`/maybe-someday/${item.id}`}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                              title="View details"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                              title="Delete item"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {statusItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No {config.label.toLowerCase()} items yet
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {items.length === 0 && !loading && (
              <div className="text-center py-12">
                <Cloud className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
                <p className="text-gray-600">
                  Start capturing ideas and tasks for the future using the form above.
                </p>
              </div>
            )}
          </div>
        )}

        <ConfirmationDialog
          isOpen={deleteConfirmation.isOpen}
          onCancel={() => setDeleteConfirmation({ isOpen: false, itemId: null })}
          onConfirm={confirmDelete}
          title="Delete Item"
          message="Are you sure you want to delete this maybe/someday item? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
        />
      </div>
    </AppLayout>
  );
} 