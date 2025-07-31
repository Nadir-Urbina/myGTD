'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { AppLayout } from '@/components/app-layout';
import { AITaskCard } from '@/components/ui/ai-task-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, ChevronRight, Clock, FolderPlus } from 'lucide-react';
import { InboxItem, ProjectStatus } from '@/types';
import { inboxService, projectsService } from '@/services/firebase';
import { formatDate } from '@/lib/utils';

export default function InboxPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    itemId: string | null;
  }>({ isOpen: false, itemId: null });
  const [convertingToProject, setConvertingToProject] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to inbox changes
    const unsubscribe = inboxService.subscribeToInbox(user.uid, (items) => {
      setInboxItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || adding || !user) return;

    setAdding(true);
    try {
      await inboxService.addInboxItem(user.uid, {
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
    if (!user) return;

    try {
      await inboxService.updateInboxItem(user.uid, item.id, {
        processed: true,
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = (itemId: string) => {
    setDeleteConfirmation({ isOpen: true, itemId });
  };

    const confirmDelete = async () => {
    if (!deleteConfirmation.itemId || !user) return;

    try {
      await inboxService.deleteInboxItem(user.uid, deleteConfirmation.itemId);
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeleteConfirmation({ isOpen: false, itemId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, itemId: null });
  };

  const handleConvertToProject = async (item: InboxItem) => {
    if (!user) return;

    setConvertingToProject(item.id);
    try {
      // Create new project with inbox item data
      const projectData = {
        title: item.title,
        description: item.description || '',
        status: ProjectStatus.QUEUED,
        tasks: [],
      };

      const newProject = await projectsService.addProject(user.uid, projectData);
      
      // Mark inbox item as processed
      await inboxService.updateInboxItem(user.uid, item.id, {
        processed: true,
      });

      // Optional: Navigate to the new project
      // window.location.href = `/projects/${newProject.id}`;
      
      // Show success feedback (you could add a toast notification here)
      console.log('Successfully converted inbox item to project:', newProject);
      
    } catch (error) {
      console.error('Error converting to project:', error);
    } finally {
      setConvertingToProject(null);
    }
  };

  const unprocessedItems = inboxItems.filter(item => !item.processed);
  const processedItems = inboxItems.filter(item => item.processed);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('inbox.title')}</h1>
          <p className="text-gray-600 text-sm md:text-base">
            {t('inbox.subtitle')}
          </p>
        </div>

        {/* Quick capture form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
          <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Input
              type="text"
              placeholder={t('inbox.placeholder')}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={adding} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {adding ? t('common.adding') : t('common.capture')}
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">{t('inbox.loadingInbox')}</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unprocessed items */}
            {unprocessedItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('inbox.needsProcessing')} ({unprocessedItems.length})
                </h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y">
                  {unprocessedItems.map((item) => (
                    <AITaskCard
                      key={item.id}
                      taskTitle={item.title}
                      taskDescription={item.description}
                      className="relative"
                    >
                      <div className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
                          <Link href={`/inbox/${item.id}`} className="flex-1 min-w-0">
                            <div className="cursor-pointer">
                              <h3 className="font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                                {item.title}
                              </h3>
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDate(item.createdAt)}
                              </div>
                            </div>
                          </Link>
                          <div className="flex items-center gap-2 sm:ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConvertToProject(item)}
                              disabled={convertingToProject === item.id}
                              className="flex-1 sm:flex-none"
                              title={t('inbox.convertToProject')}
                            >
                              <FolderPlus className="h-3 w-3 mr-1" />
                              {convertingToProject === item.id ? t('inbox.converting') : t('inbox.toProject')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsProcessed(item)}
                              className="flex-1 sm:flex-none"
                            >
                              {t('common.process')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.location.href = `/inbox/${item.id}`}
                              className="flex-shrink-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AITaskCard>
                  ))}
                </div>
              </div>
            )}

            {/* Processed items */}
            {processedItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('inbox.processed')} ({processedItems.length})
                </h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y">
                  {processedItems.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors opacity-60">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {item.title}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(item.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:ml-4">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTask(item.id)}
                            className="w-full sm:w-auto"
                          >
                            {t('common.delete')}
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
                <div className="text-gray-500 mb-4">{t('inbox.empty')}</div>
                <p className="text-sm text-gray-400">
                  {t('inbox.emptySubtitle')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title={t('dialog.deleteItem.title')}
        message={t('dialog.deleteItem.message')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </AppLayout>
  );
} 