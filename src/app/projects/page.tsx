'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { ViewToggle, ViewType } from '@/components/ui/view-toggle';
import { KanbanBoard } from '@/components/ui/kanban-board';
import { ProjectsList } from '@/components/ui/projects-list';
import { Plus } from 'lucide-react';
import { Project, ProjectStatus } from '@/types';
import { projectsService } from '@/services/firebase';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';

export default function ProjectsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<ViewType>('board');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    projectId: string | null;
  }>({ isOpen: false, projectId: null });

  useEffect(() => {
    if (!user) return;

    // Subscribe to projects changes
    const unsubscribe = projectsService.subscribeToProjects(user.uid, (projects) => {
      setProjects(projects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim() || adding || !user) return;

    setAdding(true);
    try {
      await projectsService.addProject(user.uid, {
        title: newProjectTitle.trim(),
        status: ProjectStatus.QUEUED,
        tasks: [],
      });
      setNewProjectTitle('');
    } catch (error) {
      console.error('Error adding project:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (project: Project, newStatus: ProjectStatus) => {
    if (!user) return;
    
    try {
      const updates: Partial<Project> = { status: newStatus };
      
      if (newStatus === ProjectStatus.DONE && project.status !== ProjectStatus.DONE) {
        updates.completedAt = new Date();
      } else if (newStatus !== ProjectStatus.DONE) {
        updates.completedAt = undefined;
      }

      await projectsService.updateProject(user.uid, project.id, updates);
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setDeleteConfirmation({ isOpen: true, projectId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.projectId || !user) return;
    
    try {
      await projectsService.deleteProject(user.uid, deleteConfirmation.projectId);
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setDeleteConfirmation({ isOpen: false, projectId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, projectId: null });
  };

  const handleProjectClick = (projectId: string) => {
    window.location.href = `/projects/${projectId}`;
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {t('projects.title')}
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                {t('projects.description')}
              </p>
            </div>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>

        {/* Quick add form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
          <form onSubmit={handleAddProject} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Input
              type="text"
              placeholder={t('projects.quickAdd.placeholder')}
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={adding} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {adding ? t('projects.quickAdd.creating') : t('projects.quickAdd.create')}
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">{t('common.loading')}</div>
          </div>
        ) : (
          <div className="min-h-[500px]">
            {view === 'board' ? (
              <KanbanBoard
                projects={projects}
                onStatusChange={handleStatusChange}
                onDeleteProject={handleDeleteProject}
                onProjectClick={handleProjectClick}
              />
            ) : (
              <ProjectsList
                projects={projects}
                onStatusChange={handleStatusChange}
                onDeleteProject={handleDeleteProject}
                onProjectClick={handleProjectClick}
              />
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title={t('projects.deleteDialog.title')}
        message={t('projects.deleteDialog.message')}
        confirmText={t('projects.deleteDialog.confirm')}
        cancelText={t('projects.deleteDialog.cancel')}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </AppLayout>
  );
} 