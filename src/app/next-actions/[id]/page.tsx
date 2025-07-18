'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { ArrowLeft, Save, Trash2, Calendar, Clock, CheckCircle, Plus, X } from 'lucide-react';
import { NextAction, NextActionStatus } from '@/types';
import { nextActionsService } from '@/services/firebase';
import { formatDate } from '@/lib/utils';

interface NextActionDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusOptions = [
  { value: NextActionStatus.QUEUED, label: 'Queued', color: 'bg-gray-100 text-gray-800' },
  { value: NextActionStatus.SCHEDULED, label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
  { value: NextActionStatus.DONE, label: 'Done', color: 'bg-green-100 text-green-800' },
];

const contextSuggestions = ['@calls', '@computer', '@errands', '@home', '@office', '@online'];

// Helper functions for email storage
const getStoredEmails = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('mygtd-used-emails');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const storeEmail = (email: string) => {
  if (typeof window === 'undefined') return;
  try {
    const stored = getStoredEmails();
    if (!stored.includes(email)) {
      const updated = [email, ...stored].slice(0, 10); // Keep only last 10 emails
      localStorage.setItem('mygtd-used-emails', JSON.stringify(updated));
    }
  } catch {
    // Ignore storage errors
  }
};

export default function NextActionDetailPage({ params }: NextActionDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
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
  
  // Updated email state management
  const [currentEmailInput, setCurrentEmailInput] = useState('');
  const [addedEmails, setAddedEmails] = useState<string[]>([]);
  const [previousEmails, setPreviousEmails] = useState<string[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  
  const [sendingInvite, setSendingInvite] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    if (user) {
      loadAction();
    }
    setPreviousEmails(getStoredEmails());
  }, [id, user]);

  const loadAction = async () => {
    if (!user) return;
    
    try {
      const actions = await nextActionsService.getNextActions(user.uid);
      const foundAction = actions.find(a => a.id === id);
      if (foundAction) {
        setAction(foundAction);
        setTitle(foundAction.title);
        setDescription(foundAction.description || '');
        setNotes(foundAction.notes || '');
        setContext(foundAction.context || '');
        setEstimatedDuration(foundAction.estimatedDuration || '');
        setStatus(foundAction.status);
        // Parse userEmail to add to addedEmails
        if (foundAction.userEmail) {
          const emails = foundAction.userEmail.split(',').map(email => email.trim()).filter(email => email);
          setAddedEmails(emails);
        }
        
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
    if (!action || !user || saving) return;

    setSaving(true);
    try {
      const updates: Partial<NextAction> = {
        title,
        description: description || undefined,
        notes: notes || undefined,
        context: context || undefined,
        estimatedDuration: estimatedDuration ? Number(estimatedDuration) : undefined,
        status,
        userEmail: addedEmails.join(', '), // Save as comma-separated for backward compatibility
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

      await nextActionsService.updateNextAction(user.uid, action.id, updates);
      
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

  const handleDelete = () => {
    if (!action) return;
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!action || !user) return;

    try {
      await nextActionsService.deleteNextAction(user.uid, action.id);
      router.push('/next-actions');
    } catch (error) {
      console.error('Error deleting action:', error);
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const handleContextSelect = (selectedContext: string) => {
    setContext(selectedContext);
  };

  const addEmail = () => {
    const email = currentEmailInput.trim();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (addedEmails.includes(email)) {
      alert('This email address has already been added.');
      return;
    }

    setAddedEmails([...addedEmails, email]);
    setCurrentEmailInput('');
    setShowEmailSuggestions(false);
    storeEmail(email); // Store in localStorage
    setPreviousEmails(getStoredEmails()); // Refresh the list
  };

  const removeEmail = (emailToRemove: string) => {
    setAddedEmails(addedEmails.filter(email => email !== emailToRemove));
  };

  const addFromSuggestion = (email: string) => {
    if (!addedEmails.includes(email)) {
      setAddedEmails([...addedEmails, email]);
    }
    setCurrentEmailInput('');
    setShowEmailSuggestions(false);
  };

  const sendCalendarInvite = async () => {
    if (!action || !user || sendingInvite || addedEmails.length === 0) return;

    if (!scheduledDate || !scheduledTime) {
      alert('Please set both date and time before sending a calendar invite.');
      return;
    }

    setSendingInvite(true);
    try {
      // First, update the action with scheduling information and mark as scheduled
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      const updates: Partial<NextAction> = {
        status: NextActionStatus.SCHEDULED,
        scheduledDate: scheduledDateTime,
        userEmail: addedEmails.join(', '), // Store all emails as comma-separated for backward compatibility
      };

      await nextActionsService.updateNextAction(user.uid, action.id, updates);

      // Now send the calendar invite
      const response = await fetch('/api/send-calendar-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionId: action.id,
          userEmails: addedEmails, // Send array of emails
          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Update local state to reflect all changes
        setAction({
          ...action,
          status: NextActionStatus.SCHEDULED,
          scheduledDate: scheduledDateTime,
          calendarInviteSent: true,
          userEmail: addedEmails.join(', '),
        });
        setStatus(NextActionStatus.SCHEDULED);
        const recipientCount = addedEmails.length;
        const message = recipientCount === 1 
          ? 'Action scheduled and calendar invite sent successfully! Check your email.'
          : `Action scheduled and calendar invites sent to ${recipientCount} recipients successfully!`;
        alert(message);
      } else {
        alert(`Error: ${result.error || 'Failed to send calendar invite'}`);
      }
    } catch (error) {
      console.error('Error sending calendar invite:', error);
      alert('Failed to send calendar invite. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading action...          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
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
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 md:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/next-actions')}
            className="self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Next Actions
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Next Action</h1>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDate(action.createdAt)}
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

            {/* Scheduling */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Scheduling
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Calendar Invite */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Calendar Invite
              </h3>
              
              {action.calendarInviteSent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center text-green-800 mb-2">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Calendar invite sent!</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Calendar invite was sent to:
                  </p>
                  <div className="text-sm text-green-700 mt-1 bg-green-100 p-2 rounded">
                    <div className="flex flex-wrap gap-1">
                      {action.userEmail?.split(',').map((email, index) => (
                        <span key={index} className="bg-green-200 text-green-800 text-xs font-medium px-2 py-1 rounded">
                          {email.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Addresses
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {addedEmails.map((email, index) => (
                        <span key={index} className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {email}
                          <button
                            onClick={() => removeEmail(email)}
                            className="ml-1 text-blue-800 hover:text-blue-900"
                            title="Remove email"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="relative">
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          value={currentEmailInput}
                          onChange={(e) => setCurrentEmailInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addEmail();
                            }
                          }}
                          onFocus={() => setShowEmailSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 150)}
                          placeholder="Add email address"
                          className="flex-1"
                        />
                        <Button onClick={addEmail} disabled={!currentEmailInput.trim() || addedEmails.includes(currentEmailInput.trim())}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Email suggestions dropdown */}
                      {showEmailSuggestions && previousEmails.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                            Previously used emails
                          </div>
                          {previousEmails
                            .filter(email => 
                              !addedEmails.includes(email) && 
                              email.toLowerCase().includes(currentEmailInput.toLowerCase())
                            )
                            .slice(0, 5)
                            .map((email, index) => (
                              <button
                                key={index}
                                onClick={() => addFromSuggestion(email)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                              >
                                {email}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Add one or more email addresses. Calendar invites will be sent to all recipients.
                    </p>
                  </div>
                  
                  <Button
                    onClick={sendCalendarInvite}
                    disabled={sendingInvite || addedEmails.length === 0 || !scheduledDate || !scheduledTime}
                    className="w-full"
                  >
                    {sendingInvite ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Scheduling & Sending...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule & Send Invite
                      </>
                    )}
                  </Button>
                  
                  {(!scheduledDate || !scheduledTime) && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ Set date and time above to schedule this action and send calendar invite
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
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
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
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