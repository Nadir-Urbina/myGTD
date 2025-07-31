'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { ViewToggle, ViewType } from '@/components/ui/view-toggle';
import { NextActionsKanbanBoard } from '@/components/ui/next-actions-kanban-board';
import { NextActionsList } from '@/components/ui/next-actions-list';
import { Plus } from 'lucide-react';
import { NextAction, NextActionStatus } from '@/types';
import { nextActionsService } from '@/services/firebase';

export default function NextActionsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<ViewType>('board');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    actionId: string | null;
  }>({ isOpen: false, actionId: null });

  useEffect(() => {
    if (!user) return;

    // Subscribe to next actions changes
    const unsubscribe = nextActionsService.subscribeToNextActions(user.uid, (actions) => {
      setNextActions(actions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim() || adding || !user) return;

    setAdding(true);
    try {
      await nextActionsService.addNextAction(user.uid, {
        title: newActionTitle.trim(),
        status: NextActionStatus.QUEUED,
      });
      setNewActionTitle('');
    } catch (error) {
      console.error('Error adding action:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (action: NextAction, newStatus: NextActionStatus) => {
    if (!user) return;
    
    try {
      const updates: Partial<NextAction> = { status: newStatus };
      
      if (newStatus === NextActionStatus.DONE && action.status !== NextActionStatus.DONE) {
        updates.completedDate = new Date();
      } else if (newStatus !== NextActionStatus.DONE) {
        updates.completedDate = undefined;
      }

      await nextActionsService.updateNextAction(user.uid, action.id, updates);
    } catch (error) {
      console.error('Error updating action status:', error);
    }
  };

  const handleDeleteAction = (actionId: string) => {
    setDeleteConfirmation({ isOpen: true, actionId });
  };

  const handleActionClick = (actionId: string) => {
    window.location.href = `/next-actions/${actionId}`;
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.actionId || !user) return;
    
    try {
      await nextActionsService.deleteNextAction(user.uid, deleteConfirmation.actionId);
    } catch (error) {
      console.error('Error deleting action:', error);
    } finally {
      setDeleteConfirmation({ isOpen: false, actionId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, actionId: null });
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Next Actions</h1>
              <p className="text-gray-600 text-sm md:text-base">
                Your actionable tasks organized by status. Focus on what needs to be done.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ViewToggle view={view} onViewChange={setView} />
            </div>
          </div>
        </div>

        {/* Quick add form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
          <form onSubmit={handleAddAction} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Input
              type="text"
              placeholder="Add a new next action..."
              value={newActionTitle}
              onChange={(e) => setNewActionTitle(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={adding} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {adding ? 'Adding...' : 'Add Action'}
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading your next actions...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {view === 'board' ? (
              <NextActionsKanbanBoard
                nextActions={nextActions}
                onStatusChange={handleStatusChange}
                onDeleteAction={handleDeleteAction}
                onActionClick={handleActionClick}
              />
            ) : (
              <NextActionsList
                nextActions={nextActions}
                onStatusChange={handleStatusChange}
                onDeleteAction={handleDeleteAction}
                onActionClick={handleActionClick}
              />
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Action"
        message="Are you sure you want to delete this action? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </AppLayout>
  );
} 