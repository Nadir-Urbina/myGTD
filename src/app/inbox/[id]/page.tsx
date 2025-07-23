'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { ArrowLeft, Save, Trash2, ArrowRight } from 'lucide-react';
import { InboxItem, NextActionStatus, MaybeSomedayStatus } from '@/types';
import { inboxService, nextActionsService, maybeSomedayService } from '@/services/firebase';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

interface InboxDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function InboxDetailPage({ params }: InboxDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<InboxItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    loadItem();
  }, [id, user]);

  const loadItem = async () => {
    if (!user) return;
    
    try {
      const items = await inboxService.getInboxItems(user.uid);
      const foundItem = items.find(i => i.id === id);
      if (foundItem) {
        setItem(foundItem);
        setTitle(foundItem.title);
        setDescription(foundItem.description || '');
        setNotes(foundItem.notes || '');
      } else {
        router.push('/inbox');
      }
    } catch (error) {
      console.error('Error loading item:', error);
      router.push('/inbox');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!item || saving || !user) return;

    setSaving(true);
    try {
      await inboxService.updateInboxItem(user.uid, item.id, {
        title,
        description: description || undefined,
        notes: notes || undefined,
      });
      
      // Update local state
      setItem({
        ...item,
        title,
        description: description || undefined,
        notes: notes || undefined,
      });
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!item) return;
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!item || !user) return;

    try {
      await inboxService.deleteInboxItem(user.uid, item.id);
      router.push('/inbox');
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const handleConvertToNextAction = async () => {
    if (!item || !user) return;

    try {
      await nextActionsService.convertInboxToNextAction(user.uid, item, {
        title,
        description: description || undefined,
        notes: notes || undefined,
        status: NextActionStatus.QUEUED,
      });
      router.push('/next-actions');
    } catch (error) {
      console.error('Error converting to next action:', error);
    }
  };

  const handleConvertToMaybeSomeday = async () => {
    if (!item || !user) return;

    try {
      await maybeSomedayService.convertInboxToMaybeSomeday(user.uid, item, {
        title,
        description: description || undefined,
        notes: notes || undefined,
        status: MaybeSomedayStatus.MAYBE,
      });
      router.push('/maybe-someday');
    } catch (error) {
      console.error('Error converting to maybe/someday:', error);
    }
  };

  const handleMarkAsProcessed = async () => {
    if (!item || !user) return;

    try {
      await inboxService.updateInboxItem(user.uid, item.id, {
        processed: true,
      });
      setItem({ ...item, processed: true });
    } catch (error) {
      console.error('Error marking as processed:', error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading item...          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </AppLayout>
  );
}

  if (!item) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Item not found</div>
            <Button onClick={() => router.push('/inbox')} className="mt-4">
              Back to Inbox
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 md:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/inbox')}
            className="self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inbox
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Inbox Item</h1>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDate(item.createdAt)}
              {item.processed && <span className="ml-2 text-green-600">• Processed</span>}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description (optional)"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes, context, or details..."
                    rows={6}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {!item.processed ? (
                  <>
                    <Button
                      onClick={handleConvertToNextAction}
                      className="w-full justify-start"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Convert to Next Action
                    </Button>
                    <Button
                      onClick={handleConvertToMaybeSomeday}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Convert to Maybe/Someday
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleMarkAsProcessed}
                      className="w-full justify-start"
                    >
                      Mark as Processed
                    </Button>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 bg-green-50 p-3 rounded">
                    ✓ This item has been processed
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <div className="font-medium">{formatDate(item.createdAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Last updated:</span>
                  <div className="font-medium">{formatDate(item.updatedAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className={`font-medium ${item.processed ? 'text-green-600' : 'text-orange-600'}`}>
                    {item.processed ? 'Processed' : 'Needs Processing'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 