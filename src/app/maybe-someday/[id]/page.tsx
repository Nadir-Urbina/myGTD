'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { ArrowLeft, Save, Trash2, ArrowRight, Calendar, Tag, Cloud, Lightbulb, Archive } from 'lucide-react';
import { MaybeSomedayItem, MaybeSomedayStatus } from '@/types';
import { maybeSomedayService } from '@/services/firebase';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MaybeSomedayDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusOptions = [
  { value: MaybeSomedayStatus.MAYBE, label: 'Maybe', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-800' },
  { value: MaybeSomedayStatus.SOMEDAY, label: 'Someday', icon: Cloud, color: 'bg-blue-100 text-blue-800' },
  { value: MaybeSomedayStatus.ARCHIVED, label: 'Archived', icon: Archive, color: 'bg-gray-100 text-gray-800' },
];

const priorityOptions = [
  { value: '', label: 'No Priority' },
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
];

export default function MaybeSomedayDetailPage({ params }: MaybeSomedayDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<MaybeSomedayItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<MaybeSomedayStatus>(MaybeSomedayStatus.MAYBE);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | ''>('');
  const [reviewDate, setReviewDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [convertConfirmation, setConvertConfirmation] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadItem = async () => {
      try {
        const items = await maybeSomedayService.getMaybeSomedayItems(user.uid);
        const foundItem = items.find(i => i.id === id);
        
        if (foundItem) {
          setItem(foundItem);
          setTitle(foundItem.title);
          setDescription(foundItem.description || '');
          setNotes(foundItem.notes || '');
          setStatus(foundItem.status);
          setPriority(foundItem.priority || '');
          setReviewDate(foundItem.reviewDate ? foundItem.reviewDate.toISOString().split('T')[0] : '');
          setTagsInput(foundItem.tags?.join(', ') || '');
        } else {
          router.push('/maybe-someday');
        }
      } catch (error) {
        console.error('Error loading item:', error);
        router.push('/maybe-someday');
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id, user, router]);

  const handleSave = async () => {
    if (!item || !user || !title.trim()) return;

    setSaving(true);
    try {
      const updates: Partial<MaybeSomedayItem> = {
        title: title.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
        priority: priority === '' ? undefined : (priority as 'low' | 'medium' | 'high'),
        reviewDate: reviewDate ? new Date(reviewDate) : undefined,
        tags: tagsInput.trim() ? tagsInput.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      };

      await maybeSomedayService.updateMaybeSomedayItem(user.uid, item.id, updates);
      
      // Update local state
      setItem({ ...item, ...updates });
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !user) return;

    try {
      await maybeSomedayService.deleteMaybeSomedayItem(user.uid, item.id);
      router.push('/maybe-someday');
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleConvertToNextAction = async () => {
    if (!item || !user) return;

    setConverting(true);
    try {
      await maybeSomedayService.convertMaybeSomedayToNextAction(user.uid, item);
      router.push('/next-actions');
    } catch (error) {
      console.error('Error converting item:', error);
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading item...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!item) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Item not found</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/maybe-someday"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit Maybe/Someday Item</h1>
              <p className="text-gray-600 text-sm md:text-base mt-1">
                Update details or convert to a next action when ready.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={() => setConvertConfirmation(true)}
              disabled={converting}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              {converting ? 'Converting...' : 'Convert to Next Action'}
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
                    Title *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's this idea about?"
                    required
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
                    placeholder="Additional notes, thoughts, or context..."
                    rows={6}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Review Date
                    </label>
                    <Input
                      type="date"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="h-4 w-4 inline mr-1" />
                    Tags (comma-separated)
                  </label>
                  <Input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="travel, learning, hobby, etc."
                  />
                  {tagsInput && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tagsInput.split(',').map((tag, idx) => {
                        const trimmedTag = tag.trim();
                        if (!trimmedTag) return null;
                        return (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {trimmedTag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Status</h3>
              <div className="space-y-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={status === option.value}
                        onChange={(e) => setStatus(e.target.value as MaybeSomedayStatus)}
                        className="sr-only"
                      />
                      <div className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-lg border-2 cursor-pointer transition-all",
                        status === option.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}>
                        <Icon className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-medium">{option.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Item Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Item Information</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created:</span>
                  <br />
                  {formatDate(item.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <br />
                  {formatDate(item.updatedAt)}
                </div>
                {item.reviewDate && (
                  <div>
                    <span className="font-medium">Review Date:</span>
                    <br />
                    {formatDate(item.reviewDate)}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Actions</h3>
              <div className="space-y-2">
                <Button
                  onClick={() => setConvertConfirmation(true)}
                  disabled={converting}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Convert to Next Action
                </Button>
                <Button
                  onClick={() => setDeleteConfirmation(true)}
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Item
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation */}
        <ConfirmationDialog
          isOpen={deleteConfirmation}
          onCancel={() => setDeleteConfirmation(false)}
          onConfirm={handleDelete}
          title="Delete Item"
          message="Are you sure you want to delete this maybe/someday item? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
        />

        {/* Convert Confirmation */}
        <ConfirmationDialog
          isOpen={convertConfirmation}
          onCancel={() => setConvertConfirmation(false)}
          onConfirm={handleConvertToNextAction}
          title="Convert to Next Action"
          message="This will move the item to your Next Actions list and remove it from Maybe/Someday. Are you ready to take action on this?"
          confirmText="Convert"
          variant="info"
        />
      </div>
    </AppLayout>
  );
} 