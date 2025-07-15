'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Trash2, Calendar, Clock } from 'lucide-react';
import { NextAction, NextActionStatus } from '@/types';
import { nextActionsService } from '@/services/firebase';
import { formatDate } from '@/lib/utils';

// Mock user ID for now
const MOCK_USER_ID = 'user_123';

interface NextActionDetailPageProps {
  params: { id: string };
}

const statusOptions = [
  { value: NextActionStatus.QUEUED, label: 'Queued', color: 'bg-gray-100 text-gray-800' },
  { value: NextActionStatus.SCHEDULED, label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
  { value: NextActionStatus.DONE, label: 'Done', color: 'bg-green-100 text-green-800' },
];

const contextSuggestions = ['@calls', '@computer', '@errands', '@home', '@office', '@online'];

export default function NextActionDetailPage({ params }: NextActionDetailPageProps) {
  const router = useRouter();
  const [action, setAction] = useState<NextAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [context, setContext] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState<number | ''>('');
  const [status, setStatus] = useState<NextActionStatus>(NextActionStatus.QUEUED);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    loadAction();
  }, [params.id]);

  const loadAction = async () => {
    try {
      const actions = await nextActionsService.getNextActions(MOCK_USER_ID);
      const foundAction = actions.find(a => a.id === params.id);
      if (foundAction) {
        setAction(foundAction);
        setTitle(foundAction.title);
        setDescription(foundAction.description || '');
        setNotes(foundAction.notes || '');
        setContext(foundAction.context || '');
        setEstimatedDuration(foundAction.estimatedDuration || '');
        setStatus(foundAction.status);
        
        if (foundAction.scheduledDate) {
          const date = new Date(foundAction.scheduledDate);
          setScheduledDate(date.toISOString().split('T')[0]);
          setScheduledTime(date.toTimeString().slice(0, 5));
        }
      } else {
        router.push('/next-actions');
      }
    } catch (error) {
      console.error('Error loading action:', error);
      router.push('/next-actions');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!action || saving) return;

    setSaving(true);
    try {
      const updates: Partial<NextAction> = {
        title,
        description: description || undefined,
        notes: notes || undefined,
        context: context || undefined,
        estimatedDuration: estimatedDuration ? Number(estimatedDuration) : undefined,
        status,
      };

      // Handle scheduled date
      if (scheduledDate && scheduledTime) {
        updates.scheduledDate = new Date(`${scheduledDate}T${scheduledTime}`);
      } else if (scheduledDate) {
        updates.scheduledDate = new Date(`${scheduledDate}T09:00`);
      } else {
        updates.scheduledDate = undefined;
      }

      // Handle completion date
      if (status === NextActionStatus.DONE && action.status !== NextActionStatus.DONE) {
        updates.completedDate = new Date();
      } else if (status !== NextActionStatus.DONE) {
        updates.completedDate = undefined;
      }

      await nextActionsService.updateNextAction(MOCK_USER_ID, action.id, updates);
      
      // Update local state
      setAction({
        ...action,
        ...updates,
      });
    } catch (error) {
      console.error('Error saving action:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!action || !confirm('Are you sure you want to delete this action?')) return;

    try {
      await nextActionsService.deleteNextAction(MOCK_USER_ID, action.id);
      router.push('/next-actions');
    } catch (error) {
      console.error('Error deleting action:', error);
    }
  };

  const handleContextSelect = (selectedContext: string) => {
    setContext(selectedContext);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading action...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!action) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Action not found</div>
            <Button onClick={() => router.push('/next-actions')} className="mt-4">
              Back to Next Actions
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
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/next-actions')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Next Actions
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Next Action</h1>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDate(action.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

            {/* Scheduling */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Scheduling
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Status</h3>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatus(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      status === option.value
                        ? option.color
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Context & Duration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Context & Duration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Context
                  </label>
                  <Input
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g., @calls, @computer"
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {contextSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleContextSelect(suggestion)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Estimated Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value ? Number(e.target.value) : '')}
                    placeholder="30"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <div className="font-medium">{formatDate(action.createdAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Last updated:</span>
                  <div className="font-medium">{formatDate(action.updatedAt)}</div>
                </div>
                {action.scheduledDate && (
                  <div>
                    <span className="text-gray-500">Scheduled:</span>
                    <div className="font-medium">{formatDate(action.scheduledDate)}</div>
                  </div>
                )}
                {action.completedDate && (
                  <div>
                    <span className="text-gray-500">Completed:</span>
                    <div className="font-medium text-green-600">{formatDate(action.completedDate)}</div>
                  </div>
                )}
                {action.projectId && (
                  <div>
                    <span className="text-gray-500">Project:</span>
                    <div className="font-medium">Linked to project</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 