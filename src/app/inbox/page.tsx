'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ChevronRight, Clock } from 'lucide-react';
import { InboxItem } from '@/types';
import { inboxService } from '@/services/firebase';
import { formatDate } from '@/lib/utils';

// Mock user ID for now - we'll add auth later
const MOCK_USER_ID = 'user_123';

export default function InboxPage() {
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    // Subscribe to inbox changes
    const unsubscribe = inboxService.subscribeToInbox(MOCK_USER_ID, (items) => {
      setInboxItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || adding) return;

    setAdding(true);
    try {
      await inboxService.addInboxItem(MOCK_USER_ID, {
        title: newTaskTitle.trim(),
        processed: false,
      });
      setNewTaskTitle('');
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleMarkAsProcessed = async (item: InboxItem) => {
    try {
      await inboxService.updateInboxItem(MOCK_USER_ID, item.id, {
        processed: true,
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (itemId: string) => {
    try {
      await inboxService.deleteInboxItem(MOCK_USER_ID, itemId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const unprocessedItems = inboxItems.filter(item => !item.processed);
  const processedItems = inboxItems.filter(item => item.processed);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inbox</h1>
          <p className="text-gray-600">
            Capture everything that has your attention. We'll help you organize it later.
          </p>
        </div>

        {/* Quick capture form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleAddTask} className="flex gap-4">
            <Input
              type="text"
              placeholder="What's on your mind?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={adding}>
              <Plus className="h-4 w-4 mr-2" />
              {adding ? 'Adding...' : 'Capture'}
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading your inbox...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unprocessed items */}
            {unprocessedItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Needs Processing ({unprocessedItems.length})
                </h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y">
                  {unprocessedItems.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => window.location.href = `/inbox/${item.id}`}
                        >
                          <h3 className="font-medium text-gray-900 truncate">
                            {item.title}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(item.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsProcessed(item)}
                          >
                            Process
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `/inbox/${item.id}`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processed items */}
            {processedItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Processed ({processedItems.length})
                </h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y">
                  {processedItems.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors opacity-60">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {item.title}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(item.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTask(item.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inboxItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">Your inbox is empty!</div>
                <p className="text-sm text-gray-400">
                  Start by capturing something that has your attention.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
} 