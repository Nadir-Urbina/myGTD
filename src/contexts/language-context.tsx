'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // App Name
    'app.name': 'EffectivO',
    'app.description': 'A powerful productivity app for managing projects, tasks, and next actions with smart AI assistance',
    
    // Navigation
    'nav.inbox': 'Inbox',
    'nav.inbox.description': 'Capture new tasks and ideas',
    'nav.nextActions': 'Next Actions',
    'nav.nextActions.description': 'Your actionable tasks',
    'nav.calendar': 'Calendar',
    'nav.calendar.description': 'Scheduled actions',
    'nav.projects': 'Projects',
    'nav.projects.description': 'Multi-step initiatives',
    'nav.issues': 'Issues',
    'nav.issues.description': 'Track bugs and feature requests',
    'nav.maybeSomeday': 'Maybe/Someday',
    'nav.maybeSomeday.description': 'Ideas for the future',
    'nav.settings': 'Settings',
    'nav.settings.description': 'App preferences',
    'nav.signOut': 'Sign out',
    
    // Common
    'common.loading': 'Loading...',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.capture': 'Capture',
    'common.process': 'Process',
    'common.adding': 'Adding...',
    'common.redirecting': 'Redirecting to your dashboard...',
    
    // Inbox
    'inbox.title': 'Inbox',
    'inbox.subtitle': 'Capture everything that has your attention. We\'ll help you organize it later.',
    'inbox.placeholder': 'What\'s on your mind?',
    'inbox.needsProcessing': 'Needs Processing',
    'inbox.processed': 'Processed',
    'inbox.empty': 'Your inbox is empty!',
    'inbox.emptySubtitle': 'Start by capturing something that has your attention.',
    'inbox.loadingInbox': 'Loading your inbox...',
    
    // Confirmation Dialog
    'dialog.deleteItem.title': 'Delete Item',
    'dialog.deleteItem.message': 'Are you sure you want to delete this item? This action cannot be undone.',
    
    // Language Toggle
    'language.toggle': 'Switch language',
    'language.english': 'English',
    'language.spanish': 'Spanish',

    // Authentication
    'auth.signInWithGoogle': 'Continue with Google',
    'auth.signUpWithGoogle': 'Sign up with Google',
    'auth.orSignInWith': 'Or sign in with email',
    'auth.orSignUpWith': 'Or sign up with email',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': 'Don\'t have an account?',
    'auth.linkGoogleAccount': 'Link Google Account',
    'auth.googleLinked': 'Google account linked successfully',

    // AI Features
    'ai.twoMinuteRule.candidate': '2-Minute Rule Candidate',
    'ai.twoMinuteRule.tooltip': 'AI suggests this task might take 2 minutes or less',
    'ai.twoMinuteRule.confidence': 'Confidence',
    'ai.twoMinuteRule.estimatedTime': 'Estimated time',
    'ai.twoMinuteRule.reasoning': 'AI reasoning',
    'ai.analyzing': 'AI analyzing...',
    'ai.analysisComplete': 'Analysis complete',
    'ai.settings.title': 'AI Features',
    'ai.settings.enable': 'Enable AI task analysis',
    'ai.settings.description': 'Use AI to identify 2-minute rule candidates',

    // Weekly Review
    'weeklyReview.title': 'Weekly Review',
    'weeklyReview.subtitle': 'Review your productivity and system health',
    'weeklyReview.button': 'Start Weekly Review',
    'weeklyReview.loading': 'Generating your weekly review...',
    'weeklyReview.complete': 'Mark Review Complete',
    'weeklyReview.completed': 'Weekly review completed successfully!',

    // Reference Material
    'reference.title': 'Reference',
    'reference.subtitle': 'Store and organize your reference materials',
    'reference.description': 'Your digital filing cabinet',
    'reference.addItem': 'Add Reference',
    'reference.search': 'Search reference materials...',
    'reference.noItems': 'No reference materials yet',
    'reference.noItemsDesc': 'Start by adding documents, links, or notes you want to reference later.',
    'reference.types.file': 'File',
    'reference.types.link': 'Link',
    'reference.types.note': 'Note',
    'reference.types.contact': 'Contact',
    'reference.types.procedure': 'Procedure',
    'reference.uploadFile': 'Upload File',
    'reference.addLink': 'Add Link',
    'reference.addNote': 'Add Note',
    'reference.addContact': 'Add Contact',
    'reference.categories': 'Categories',
    'reference.tags': 'Tags',
    'reference.favorites': 'Favorites',
    'reference.recent': 'Recently Added',
    'reference.mostAccessed': 'Most Accessed',
    
    // Settings Page
    'settings.title': 'Settings',
    'settings.subtitle': 'Customize your EffectivO experience and preferences.',
    'settings.language.title': 'Language & Region',
    'settings.language.subtitle': 'Choose your preferred language',
    'settings.notifications.title': 'Notifications',
    'settings.notifications.subtitle': 'Manage your notification preferences',
    'settings.notifications.email': 'Email Notifications',
    'settings.notifications.emailDesc': 'Receive updates about your tasks',
    'settings.ai.subtitle': 'Intelligent task analysis and automation',
    'settings.ai.activeStatus': 'AI analysis is active',
    'settings.ai.activeDesc': 'Your tasks will be automatically analyzed to identify 2-minute rule candidates.',

    // Landing Page
    'landing.nav.subtitle': 'Productive & Effective',
    'landing.nav.signIn': 'Sign In',
    'landing.nav.getStarted': 'Get Started Free',

    // Hero Section
    'landing.hero.title': 'Master',
    'landing.hero.subtitle': 'Transform chaos into clarity with EffectivO. Built on proven productivity principles, our app helps you capture, organize, and execute everything that has your attention.',
    'landing.hero.startFree': 'Start Free Today',
    'landing.hero.watchDemo': 'Watch Demo',
    'landing.hero.noCreditCard': '✨ No credit card required • 🚀 Set up in 2 minutes',

    // GTD Catchphrases
    'landing.catchphrase.twoMinute': 'the 2-Minute Rule',
    'landing.catchphrase.stressFree': 'Stress-Free Productivity',
    'landing.catchphrase.mindLikeWater': 'Mind Like Water',
    'landing.catchphrase.captureEverything': 'Capturing Everything',
    'landing.catchphrase.weeklyReviews': 'Weekly Reviews',
    'landing.catchphrase.nextAction': 'Next Action Thinking',
    'landing.catchphrase.trustedSystem': 'the Trusted System',
    'landing.catchphrase.clearMind': 'Clearing Your Mind',

    // Features Section
    'landing.features.title': 'Everything You Need for Stress-Free Productivity',
    'landing.features.subtitle': 'EffectivO implements every aspect of proven productivity methodologies, giving you a complete system for managing your life and work stress-free.',
    'landing.features.inbox.title': 'Smart Inbox',
    'landing.features.inbox.description': 'Capture everything that has your attention in one trusted place. Never lose a thought or task again.',
    'landing.features.nextActions.title': 'Next Actions',
    'landing.features.nextActions.description': 'Transform ideas into actionable tasks. Schedule, prioritize, and track your progress effortlessly.',
    'landing.features.projects.title': 'Project Management',
    'landing.features.projects.description': 'Break down complex goals into manageable steps. Track multi-step initiatives with ease.',
    'landing.features.maybeSomeday.title': 'Maybe/Someday',
    'landing.features.maybeSomeday.description': 'Park future ideas safely. Review and activate them when the time is right.',
    'landing.features.calendar.title': 'Calendar Integration',
    'landing.features.calendar.description': 'Schedule actions and automatically send calendar invites. Your tasks, perfectly timed.',
    'landing.features.sync.title': 'Real-time Sync',
    'landing.features.sync.description': 'Access your tasks anywhere, anytime. Changes sync instantly across all your devices.',

    // Benefits Section
    'landing.benefits.title': 'Why Choose EffectivO?',
    'landing.benefits.subtitle': 'Join thousands who\'ve transformed their productivity with our proven system.',
    'landing.benefits.clearMind.title': 'Clear Your Mind',
    'landing.benefits.clearMind.description': 'Stop trying to remember everything. Let EffectivO be your external brain.',
    'landing.benefits.focus.title': 'Focus on What Matters',
    'landing.benefits.focus.description': 'See exactly what needs your attention right now. No more overwhelm.',
    'landing.benefits.trusted.title': 'Trusted System',
    'landing.benefits.trusted.description': 'Built on proven productivity principles. Stress-free productivity guaranteed.',

    // Pricing Section
    'landing.pricing.title': 'Simple, Transparent Pricing',
    'landing.pricing.subtitle': 'Start free, upgrade when you\'re ready for advanced features.',
    'landing.pricing.monthly': 'Monthly',
    'landing.pricing.yearly': 'Yearly',
    'landing.pricing.savePercent': 'Save 33%',
    'landing.pricing.mostPopular': 'Most Popular',
    'landing.pricing.free.name': 'Free',
    'landing.pricing.free.price': '$0',
    'landing.pricing.free.period': 'forever',
    'landing.pricing.free.description': 'Perfect for getting started with GTD',
    'landing.pricing.premium.name': 'Premium',
    'landing.pricing.premium.price': '$5.99',
    'landing.pricing.premium.period': 'per month',
    'landing.pricing.premium.yearlyPrice': '$49.99',
    'landing.pricing.premium.yearlyPeriod': 'per year',
    'landing.pricing.premium.description': 'For serious productivity enthusiasts',
    'landing.pricing.premium.monthlyWhenBilled': 'per month when billed annually',

    // Pricing Features
    'landing.pricing.feature.unlimitedTasks': 'Unlimited tasks in Inbox',
    'landing.pricing.feature.basicActions': 'Basic Next Actions',
    'landing.pricing.feature.projectTracking': 'Simple project tracking',
    'landing.pricing.feature.maybeLists': 'Maybe/Someday lists',
    'landing.pricing.feature.mobileAccess': 'Mobile access',
    'landing.pricing.feature.emailSupport': 'Email support',
    'landing.pricing.feature.everythingFree': 'Everything in Free',
    'landing.pricing.feature.calendarIntegration': 'Calendar integration',
    'landing.pricing.feature.emailInvites': 'Automatic email invites',
    'landing.pricing.feature.advancedScheduling': 'Advanced scheduling',
    'landing.pricing.feature.prioritySupport': 'Priority support',
    'landing.pricing.feature.exportBackup': 'Export & backup',
    'landing.pricing.feature.customContexts': 'Custom contexts',
    'landing.pricing.feature.analytics': 'Analytics & insights',

    // Pricing CTAs
    'landing.pricing.free.cta': 'Get Started Free',
    'landing.pricing.premium.cta': 'Start Premium Trial',

    // CTA Section
    'landing.cta.title': 'Ready to Get Things Done?',
    'landing.cta.subtitle': 'Join thousands of productive people who trust EffectivO to manage their life and work. Start your stress-free productivity journey today.',
    'landing.cta.button': 'Start Your Free Account',
    'landing.cta.guarantee': 'No credit card required • Cancel anytime • 30-day money-back guarantee',

    // Footer
    'landing.footer.description': 'The complete productivity system for stress-free task management.',
    'landing.footer.product': 'Product',
    'landing.footer.features': 'Features',
    'landing.footer.pricing': 'Pricing',
    'landing.footer.security': 'Security',
    'landing.footer.company': 'Company',
    'landing.footer.about': 'About',
    'landing.footer.blog': 'Blog',
    'landing.footer.contact': 'Contact',
    'landing.footer.support': 'Support',
    'landing.footer.helpCenter': 'Help Center',
    'landing.footer.privacy': 'Privacy Policy',
    'landing.footer.terms': 'Terms of Service',
    'landing.footer.copyright': '© 2024 EffectivO. All rights reserved.',

    // Projects
    'projects.title': 'Projects',
    'projects.description': 'Manage your multi-step initiatives and track progress toward your goals.',
    'projects.quickAdd.placeholder': 'Start a new project...',
    'projects.quickAdd.create': 'Create Project',
    'projects.quickAdd.creating': 'Creating...',
    'projects.deleteDialog.title': 'Delete Project',
    'projects.deleteDialog.message': 'Are you sure you want to delete this project? This will also delete all tasks and cannot be undone.',
    'projects.deleteDialog.confirm': 'Delete',
    'projects.deleteDialog.cancel': 'Cancel',

    // Inbox to Project conversion
    'inbox.convertToProject': 'Convert this item to a project',
    'inbox.toProject': 'To Project',
    'inbox.converting': 'Converting...',

    // Issues
    'issues.title': 'Issues',
    'issues.description': 'Track bugs, feature requests, and improvements for your projects.',
    'issues.newIssue': 'New Issue',
    'issues.createIssue': 'Create Issue',
    'issues.editIssue': 'Edit Issue',
    'issues.updateIssue': 'Update Issue',
    'issues.deleteIssue': 'Delete Issue',
    'issues.promoteToNextAction': 'Promote to Next Action',
    'issues.markInProgress': 'Mark In Progress',
    'issues.markResolved': 'Mark Resolved',
    'issues.noIssues': 'No issues yet',
    'issues.noIssuesSubtitle': 'Create your first issue to get started.',
    'issues.noMatchingFilters': 'No issues match your filters',
    'issues.noMatchingFiltersSubtitle': 'Try adjusting your filters to see more results.',
    'issues.clearFilters': 'Clear Filters',
    'issues.filters': 'Filters',
    'issues.search': 'Search issues...',
    'issues.searchLabel': 'Search',
    'issues.allTypes': 'All types',
    'issues.allPriorities': 'All priorities',
    'issues.allStatuses': 'All statuses',
    'issues.allProjects': 'All projects',
    'issues.allAssignees': 'All assignees',
    'issues.sortBy': 'Sort by:',
    'issues.sortByDate': 'Date',
    'issues.sortByPriority': 'Priority',
    'issues.sortByStatus': 'Status',
    'issues.sortByTitle': 'Title',
    'issues.viewMode.compact': 'Compact',
    'issues.viewMode.comfortable': 'Comfortable',
    
    // Issue Types
    'issues.type.bug': 'Bug',
    'issues.type.feature': 'Feature',
    'issues.type.improvement': 'Improvement',
    'issues.type.research': 'Research',
    'issues.type.question': 'Question',
    'issues.type.bug.description': 'Something is not working correctly',
    'issues.type.feature.description': 'A new feature or enhancement',
    'issues.type.improvement.description': 'An improvement to existing functionality',
    'issues.type.research.description': 'Research or investigation needed',
    'issues.type.question.description': 'A question that needs an answer',
    
    // Issue Priorities
    'issues.priority.low': 'Low',
    'issues.priority.medium': 'Medium',
    'issues.priority.high': 'High',
    'issues.priority.critical': 'Critical',
    'issues.priority.low.description': 'Nice to have, not urgent',
    'issues.priority.medium.description': 'Normal priority issue',
    'issues.priority.high.description': 'Important issue that should be fixed soon',
    'issues.priority.critical.description': 'Blocks release or causes data loss',
    
    // Issue Statuses
    'issues.status.open': 'Open',
    'issues.status.inProgress': 'In Progress',
    'issues.status.resolved': 'Resolved',
    'issues.status.closed': 'Closed',
    'issues.status.duplicate': 'Duplicate',
    'issues.status.wontFix': 'Won\'t Fix',
    
    // Issue Form
    'issues.form.title': 'Title',
    'issues.form.titleRequired': 'Title is required',
    'issues.form.titlePlaceholder': 'Brief description of the issue',
    'issues.form.description': 'Description',
    'issues.form.descriptionPlaceholder': 'Detailed description of the issue',
    'issues.form.type': 'Issue Type',
    'issues.form.typeRequired': 'Issue type is required',
    'issues.form.priority': 'Priority',
    'issues.form.priorityRequired': 'Priority is required',
    'issues.form.project': 'Project',
    'issues.form.noProject': 'No project',
    'issues.form.assignee': 'Assignee',
    'issues.form.assigneePlaceholder': 'Who should work on this?',
    'issues.form.reporter': 'Reporter',
    'issues.form.reporterPlaceholder': 'Who reported this issue?',
    'issues.form.labels': 'Labels',
    'issues.form.labelsPlaceholder': 'Add a label...',
    'issues.form.addLabel': 'Add Label',
    'issues.form.reproductionSteps': 'Reproduction Steps',
    'issues.form.reproductionStepsRequired': 'Reproduction steps are required for bugs',
    'issues.form.reproductionStepsPlaceholder': '1. Go to...\\n2. Click on...\\n3. Expected vs actual behavior',
    'issues.form.acceptanceCriteria': 'Acceptance Criteria',
    'issues.form.acceptanceCriteriaRequired': 'Acceptance criteria are required for features',
    'issues.form.acceptanceCriteriaPlaceholder': 'Given... When... Then...\\nOr list of requirements for completion',
    'issues.form.environment': 'Environment',
    'issues.form.environmentPlaceholder': 'Browser, OS, device, etc.',
    'issues.form.notes': 'Additional Notes',
    'issues.form.notesPlaceholder': 'Any additional notes or context...',
    'issues.form.cancel': 'Cancel',
    'issues.form.saving': 'Saving...',
    
    // Issue Detail
    'issues.detail.backToIssues': 'Back to Issues',
    'issues.detail.edit': 'Edit',
    'issues.detail.delete': 'Delete',
    'issues.detail.deleteConfirm': 'Are you sure you want to delete this issue? This action cannot be undone.',
    'issues.detail.notFound': 'Issue not found',
    'issues.detail.notFoundSubtitle': 'The issue you\'re looking for doesn\'t exist or has been deleted.',
    'issues.detail.loading': 'Loading issue...',
    'issues.detail.created': 'Created',
    'issues.detail.updated': 'Updated',
    'issues.detail.reproductionSteps': 'Reproduction Steps:',
    'issues.detail.acceptanceCriteria': 'Acceptance Criteria:',
    'issues.detail.notes': 'Notes:',
    
    // AI Analysis
    'issues.ai.analyzing': 'Analyzing...',
    'issues.ai.analysis': 'AI Analysis',
    'issues.ai.confidence': 'confidence',
    'issues.ai.complexity.simple': 'Simple',
    'issues.ai.complexity.moderate': 'Moderate',
    'issues.ai.complexity.complex': 'Complex',
    'issues.ai.complexity.simple.description': 'Quick task, 1-4 hours',
    'issues.ai.complexity.moderate.description': 'Medium effort, 1-3 days',
    'issues.ai.complexity.complex.description': 'Large effort, 1+ weeks',
    'issues.ai.estimatedTime': 'Estimated time',
    'issues.ai.reasoning': 'Reasoning:',
    'issues.ai.recommendedApproach': 'Recommended Approach:',
    'issues.ai.suggestedBreakdown': 'Suggested Breakdown:',
    'issues.ai.technicalConsiderations': 'Technical Considerations:',
    
    // Issue Stats
    'issues.stats.total': 'Total Issues',
    'issues.stats.open': 'Open',
    'issues.stats.inProgress': 'In Progress',
    'issues.stats.resolved': 'Resolved',
    'issues.stats.filteredFrom': 'Filtered from {total} total issues',
    
    // Issue Trackers
    'issueTrackers.title': 'Issue Trackers',
    'issueTrackers.description': 'Manage issue tracker boards for your projects and products',
    'issueTrackers.newTracker': 'New Issue Tracker',
    'issueTrackers.createTracker': 'Create Issue Tracker',
    'issueTrackers.editTracker': 'Edit Issue Tracker',
    'issueTrackers.updateTracker': 'Update Tracker',
    'issueTrackers.deleteTracker': 'Delete Tracker',
    'issueTrackers.noTrackers': 'No issue trackers yet',
    'issueTrackers.noTrackersSubtitle': 'Create your first issue tracker to get started organizing your project issues.',
    'issueTrackers.noMatchingSearch': 'No trackers match your search',
    'issueTrackers.noMatchingSearchSubtitle': 'Try adjusting your search terms or create a new tracker.',
    'issueTrackers.clearSearch': 'Clear Search',
    'issueTrackers.searchPlaceholder': 'Search trackers...',
    'issueTrackers.backToTrackers': 'Back to Trackers',
    'issueTrackers.openBoard': 'Open Board',
    'issueTrackers.settings': 'Settings',
    'issueTrackers.linkedProject': 'Linked to',
    
    // Issue Tracker Form
    'issueTrackers.form.trackerName': 'Tracker Name',
    'issueTrackers.form.trackerNameRequired': 'Tracker name is required',
    'issueTrackers.form.trackerNamePlaceholder': 'e.g., Website Redesign, Mobile App v2',
    'issueTrackers.form.title': 'Title',
    'issueTrackers.form.titleRequired': 'Title is required',
    'issueTrackers.form.titlePlaceholder': 'Internal title for the tracker',
    'issueTrackers.form.titleHelp': 'This is used internally for search and organization',
    'issueTrackers.form.description': 'Description',
    'issueTrackers.form.descriptionPlaceholder': 'Brief description of what this tracker is for',
    'issueTrackers.form.linkProject': 'Link to Project (Optional)',
    'issueTrackers.form.noProjectLinked': 'No project linked',
    'issueTrackers.form.linkProjectHelp': 'Linking to a project allows for better organization and reporting',
    'issueTrackers.form.trackerSettings': 'Tracker Settings',
    'issueTrackers.form.allowedIssueTypes': 'Allowed Issue Types',
    'issueTrackers.form.allowedIssueTypesRequired': 'At least one issue type must be selected',
    'issueTrackers.form.defaultPriority': 'Default Priority',
    'issueTrackers.form.autoPromoteToNextActions': 'Auto-promote to Next Actions',
    'issueTrackers.form.autoPromoteToNextActionsHelp': 'Automatically suggest promoting resolved issues to next actions',
    'issueTrackers.form.enableAIAnalysis': 'Enable AI Analysis',
    'issueTrackers.form.enableAIAnalysisHelp': 'Use AI to analyze issue complexity and provide recommendations',
    'issueTrackers.form.notes': 'Notes',
    'issueTrackers.form.notesPlaceholder': 'Any additional notes about this tracker...',
    'issueTrackers.form.cancel': 'Cancel',
    'issueTrackers.form.saving': 'Saving...',
    'issueTrackers.form.createTracker': 'Create Tracker',
    'issueTrackers.form.updateTracker': 'Update Tracker',
    
    // Issue Tracker Stats
    'issueTrackers.stats.totalTrackers': 'Total Trackers',
    'issueTrackers.stats.totalIssues': 'Total Issues',
    'issueTrackers.stats.linkedProjects': 'Linked Projects',
    'issueTrackers.stats.recentActivity': 'Recent Activity',
    'issueTrackers.stats.issueCount': 'issues',
    'issueTrackers.stats.lastActivity': 'Last activity',
    'issueTrackers.stats.created': 'Created',
    
    // Issue Tracker Board
    'issueTrackers.board.breadcrumb.home': 'Home',
    'issueTrackers.board.breadcrumb.trackers': 'Issue Trackers',
    'issueTrackers.board.backToTrackers': 'Back to Trackers',
    'issueTrackers.board.newIssue': 'New Issue',
    'issueTrackers.board.issues': 'Issues',
    'issueTrackers.board.total': 'total',
    'issueTrackers.board.noIssues': 'No issues yet',
    'issueTrackers.board.noIssuesSubtitle': 'Create your first issue to get started tracking work for {trackerName}.',
    'issueTrackers.board.createFirstIssue': 'Create First Issue',
    'issueTrackers.board.deleteConfirm': 'Are you sure you want to delete "{trackerName}"? This will also delete all associated issues and cannot be undone.',
    'issueTrackers.board.trackerNotFound': 'Issue Tracker not found',
    'issueTrackers.board.trackerNotFoundSubtitle': 'The issue tracker you\'re looking for doesn\'t exist or has been deleted.',
    'issueTrackers.board.loading': 'Loading issue tracker...',
  },
  es: {
    // App Name
    'app.name': 'EffectivO',
    'app.description': 'Una poderosa aplicación de productividad para gestionar proyectos, tareas y próximas acciones con asistencia inteligente de IA',
    
    // Navigation
    'nav.inbox': 'Bandeja de Entrada',
    'nav.inbox.description': 'Captura nuevas tareas e ideas',
    'nav.nextActions': 'Próximas Acciones',
    'nav.nextActions.description': 'Tus tareas accionables',
    'nav.calendar': 'Calendario',
    'nav.calendar.description': 'Acciones programadas',
    'nav.projects': 'Proyectos',
    'nav.projects.description': 'Iniciativas de múltiples pasos',
    'nav.issues': 'Problemas',
    'nav.issues.description': 'Rastrea errores y solicitudes de funciones',
    'nav.maybeSomeday': 'Tal vez/Algún día',
    'nav.maybeSomeday.description': 'Ideas para el futuro',
    'nav.settings': 'Configuración',
    'nav.settings.description': 'Preferencias de la app',
    'nav.signOut': 'Cerrar sesión',
    
    // Common
    'common.loading': 'Cargando...',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.save': 'Guardar',
    'common.edit': 'Editar',
    'common.add': 'Agregar',
    'common.capture': 'Capturar',
    'common.process': 'Procesar',
    'common.adding': 'Agregando...',
    'common.redirecting': 'Redirigiendo a tu panel...',
    
    // Inbox
    'inbox.title': 'Bandeja de Entrada',
    'inbox.subtitle': 'Captura todo lo que llame tu atención. Te ayudaremos a organizarlo después.',
    'inbox.placeholder': '¿Qué tienes en mente?',
    'inbox.needsProcessing': 'Necesita Procesamiento',
    'inbox.processed': 'Procesado',
    'inbox.empty': '¡Tu bandeja de entrada está vacía!',
    'inbox.emptySubtitle': 'Comienza capturando algo que llame tu atención.',
    'inbox.loadingInbox': 'Cargando tu bandeja de entrada...',
    
    // Confirmation Dialog
    'dialog.deleteItem.title': 'Eliminar Elemento',
    'dialog.deleteItem.message': '¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.',
    
    // Language Toggle
    'language.toggle': 'Cambiar idioma',
    'language.english': 'Inglés',
    'language.spanish': 'Español',

    // Authentication
    'auth.signInWithGoogle': 'Continuar con Google',
    'auth.signUpWithGoogle': 'Registrarse con Google',
    'auth.orSignInWith': 'O inicia sesión con email',
    'auth.orSignUpWith': 'O regístrate con email',
    'auth.alreadyHaveAccount': '¿Ya tienes una cuenta?',
    'auth.dontHaveAccount': '¿No tienes una cuenta?',
    'auth.linkGoogleAccount': 'Vincular Cuenta de Google',
    'auth.googleLinked': 'Cuenta de Google vinculada exitosamente',

    // AI Features
    'ai.twoMinuteRule.candidate': 'Candidato de Regla de 2 Minutos',
    'ai.twoMinuteRule.tooltip': 'IA sugiere que esta tarea podría tomar 2 minutos o menos',
    'ai.twoMinuteRule.confidence': 'Confianza',
    'ai.twoMinuteRule.estimatedTime': 'Tiempo estimado',
    'ai.twoMinuteRule.reasoning': 'Razonamiento de IA',
    'ai.analyzing': 'IA analizando...',
    'ai.analysisComplete': 'Análisis completo',
    'ai.settings.title': 'Funciones de IA',
    'ai.settings.enable': 'Habilitar análisis de tareas con IA',
    'ai.settings.description': 'Usar IA para identificar candidatos de la regla de 2 minutos',

    // Weekly Review
    'weeklyReview.title': 'Revisión Semanal',
    'weeklyReview.subtitle': 'Revisa tu productividad y salud del sistema',
    'weeklyReview.button': 'Iniciar Revisión Semanal',
    'weeklyReview.loading': 'Generando tu revisión semanal...',
    'weeklyReview.complete': 'Marcar Revisión Completa',
    'weeklyReview.completed': '¡Revisión semanal completada exitosamente!',

    // Reference Material
    'reference.title': 'Referencia',
    'reference.subtitle': 'Almacena y organiza tus materiales de referencia',
    'reference.description': 'Tu archivo digital',
    'reference.addItem': 'Agregar Referencia',
    'reference.search': 'Buscar materiales de referencia...',
    'reference.noItems': 'No hay materiales de referencia aún',
    'reference.noItemsDesc': 'Comienza agregando documentos, enlaces o notas que quieras referenciar después.',
    'reference.types.file': 'Archivo',
    'reference.types.link': 'Enlace',
    'reference.types.note': 'Nota',
    'reference.types.contact': 'Contacto',
    'reference.types.procedure': 'Procedimiento',
    'reference.uploadFile': 'Subir Archivo',
    'reference.addLink': 'Agregar Enlace',
    'reference.addNote': 'Agregar Nota',
    'reference.addContact': 'Agregar Contacto',
    'reference.categories': 'Categorías',
    'reference.tags': 'Etiquetas',
    'reference.favorites': 'Favoritos',
    'reference.recent': 'Agregados Recientemente',
    'reference.mostAccessed': 'Más Accedidos',
    
    // Settings Page
    'settings.title': 'Configuración',
    'settings.subtitle': 'Personaliza tu experiencia EffectivO y preferencias.',
    'settings.language.title': 'Idioma y Región',
    'settings.language.subtitle': 'Elige tu idioma preferido',
    'settings.notifications.title': 'Notificaciones',
    'settings.notifications.subtitle': 'Gestiona tus preferencias de notificación',
    'settings.notifications.email': 'Notificaciones por Email',
    'settings.notifications.emailDesc': 'Recibe actualizaciones sobre tus tareas',
    'settings.ai.subtitle': 'Análisis inteligente de tareas y automatización',
    'settings.ai.activeStatus': 'Análisis de IA está activo',
    'settings.ai.activeDesc': 'Tus tareas serán analizadas automáticamente para identificar candidatos de la regla de 2 minutos.',

    // Landing Page
    'landing.nav.subtitle': 'Productivo y Efectivo',
    'landing.nav.signIn': 'Iniciar Sesión',
    'landing.nav.getStarted': 'Comenzar Gratis',

    // Hero Section
    'landing.hero.title': 'Domina',
    'landing.hero.subtitle': 'Transforma el caos en claridad con EffectivO. Construido sobre principios de productividad probados, nuestra aplicación te ayuda a capturar, organizar y ejecutar todo lo que llama tu atención.',
    'landing.hero.startFree': 'Comienza Gratis Hoy',
    'landing.hero.watchDemo': 'Ver Demo',
    'landing.hero.noCreditCard': '✨ No se requiere tarjeta de crédito • 🚀 Configuración en 2 minutos',

    // GTD Catchphrases
    'landing.catchphrase.twoMinute': 'la Regla de 2 Minutos',
    'landing.catchphrase.stressFree': 'la Productividad Sin Estrés',
    'landing.catchphrase.mindLikeWater': 'la Mente Como el Agua',
    'landing.catchphrase.captureEverything': 'Capturar Todo',
    'landing.catchphrase.weeklyReviews': 'las Revisiones Semanales',
    'landing.catchphrase.nextAction': 'el Pensamiento de Próxima Acción',
    'landing.catchphrase.trustedSystem': 'el Sistema Confiable',
    'landing.catchphrase.clearMind': 'Liberar Tu Mente',

    // Features Section
    'landing.features.title': 'Todo lo que Necesitas para una Productividad Sin Estrés',
    'landing.features.subtitle': 'EffectivO implementa cada aspecto de metodologías de productividad probadas, dándote un sistema completo para gestionar tu vida y trabajo sin estrés.',
    'landing.features.inbox.title': 'Bandeja Inteligente',
    'landing.features.inbox.description': 'Captura todo lo que llama tu atención en un lugar confiable. Nunca pierdas un pensamiento o tarea nuevamente.',
    'landing.features.nextActions.title': 'Próximas Acciones',
    'landing.features.nextActions.description': 'Transforma ideas en tareas accionables. Programa, prioriza y rastrea tu progreso sin esfuerzo.',
    'landing.features.projects.title': 'Gestión de Proyectos',
    'landing.features.projects.description': 'Divide objetivos complejos en pasos manejables. Rastrea iniciativas de múltiples pasos con facilidad.',
    'landing.features.maybeSomeday.title': 'Tal vez/Algún día',
    'landing.features.maybeSomeday.description': 'Guarda ideas futuras de forma segura. Revísalas y actívalas cuando sea el momento adecuado.',
    'landing.features.calendar.title': 'Integración de Calendario',
    'landing.features.calendar.description': 'Programa acciones y envía invitaciones de calendario automáticamente. Tus tareas, perfectamente programadas.',
    'landing.features.sync.title': 'Sincronización en Tiempo Real',
    'landing.features.sync.description': 'Accede a tus tareas en cualquier lugar, en cualquier momento. Los cambios se sincronizan instantáneamente en todos tus dispositivos.',

    // Benefits Section
    'landing.benefits.title': '¿Por qué Elegir EffectivO?',
    'landing.benefits.subtitle': 'Únete a miles de personas que han transformado su productividad con nuestro sistema probado.',
    'landing.benefits.clearMind.title': 'Libera Tu Mente',
    'landing.benefits.clearMind.description': 'Deja de intentar recordar todo. Permite que EffectivO sea tu cerebro externo.',
    'landing.benefits.focus.title': 'Enfócate en lo que Importa',
    'landing.benefits.focus.description': 'Ve exactamente qué necesita tu atención ahora mismo. No más abrumamiento.',
    'landing.benefits.trusted.title': 'Sistema Confiable',
    'landing.benefits.trusted.description': 'Construido sobre principios de productividad probados. Productividad sin estrés garantizada.',

    // Pricing Section
    'landing.pricing.title': 'Precios Simples y Transparentes',
    'landing.pricing.subtitle': 'Comienza gratis, actualiza cuando estés listo para funciones avanzadas.',
    'landing.pricing.monthly': 'Mensual',
    'landing.pricing.yearly': 'Anual',
    'landing.pricing.savePercent': 'Ahorra 33%',
    'landing.pricing.mostPopular': 'Más Popular',
    'landing.pricing.free.name': 'Gratis',
    'landing.pricing.free.price': '$0',
    'landing.pricing.free.period': 'para siempre',
    'landing.pricing.free.description': 'Perfecto para comenzar con GTD',
    'landing.pricing.premium.name': 'Premium',
    'landing.pricing.premium.price': '$5.99',
    'landing.pricing.premium.period': 'por mes',
    'landing.pricing.premium.yearlyPrice': '$49.99',
    'landing.pricing.premium.yearlyPeriod': 'por año',
    'landing.pricing.premium.description': 'Para entusiastas serios de la productividad',
    'landing.pricing.premium.monthlyWhenBilled': 'por mes cuando se factura anualmente',

    // Pricing Features
    'landing.pricing.feature.unlimitedTasks': 'Tareas ilimitadas en Bandeja de Entrada',
    'landing.pricing.feature.basicActions': 'Próximas Acciones básicas',
    'landing.pricing.feature.projectTracking': 'Seguimiento simple de proyectos',
    'landing.pricing.feature.maybeLists': 'Listas de Tal vez/Algún día',
    'landing.pricing.feature.mobileAccess': 'Acceso móvil',
    'landing.pricing.feature.emailSupport': 'Soporte por email',
    'landing.pricing.feature.everythingFree': 'Todo en Gratis',
    'landing.pricing.feature.calendarIntegration': 'Integración de calendario',
    'landing.pricing.feature.emailInvites': 'Invitaciones automáticas por email',
    'landing.pricing.feature.advancedScheduling': 'Programación avanzada',
    'landing.pricing.feature.prioritySupport': 'Soporte prioritario',
    'landing.pricing.feature.exportBackup': 'Exportar y respaldar',
    'landing.pricing.feature.customContexts': 'Contextos personalizados',
    'landing.pricing.feature.analytics': 'Análisis y estadísticas',

    // Pricing CTAs
    'landing.pricing.free.cta': 'Comenzar Gratis',
    'landing.pricing.premium.cta': 'Iniciar Prueba Premium',

    // CTA Section
    'landing.cta.title': '¿Listo para Organizar las Cosas?',
    'landing.cta.subtitle': 'Únete a miles de personas productivas que confían en EffectivO para gestionar su vida y trabajo. Comienza tu viaje de productividad sin estrés hoy.',
    'landing.cta.button': 'Comienza tu Cuenta Gratuita',
    'landing.cta.guarantee': 'No se requiere tarjeta de crédito • Cancela en cualquier momento • Garantía de reembolso de 30 días',

    // Footer
    'landing.footer.description': 'El sistema completo de productividad para gestión de tareas sin estrés.',
    'landing.footer.product': 'Producto',
    'landing.footer.features': 'Funciones',
    'landing.footer.pricing': 'Precios',
    'landing.footer.security': 'Seguridad',
    'landing.footer.company': 'Empresa',
    'landing.footer.about': 'Acerca de',
    'landing.footer.blog': 'Blog',
    'landing.footer.contact': 'Contacto',
    'landing.footer.support': 'Soporte',
    'landing.footer.helpCenter': 'Centro de Ayuda',
    'landing.footer.privacy': 'Política de Privacidad',
    'landing.footer.terms': 'Términos de Servicio',
    'landing.footer.copyright': '© 2024 EffectivO. Todos los derechos reservados.',

    // Projects
    'projects.title': 'Proyectos',
    'projects.description': 'Gestiona tus iniciativas de múltiples pasos y rastrea el progreso hacia tus objetivos.',
    'projects.quickAdd.placeholder': 'Comenzar un nuevo proyecto...',
    'projects.quickAdd.create': 'Crear Proyecto',
    'projects.quickAdd.creating': 'Creando...',
    'projects.deleteDialog.title': 'Eliminar Proyecto',
    'projects.deleteDialog.message': '¿Estás seguro de que quieres eliminar este proyecto? Esto también eliminará todas las tareas y no se puede deshacer.',
    'projects.deleteDialog.confirm': 'Eliminar',
    'projects.deleteDialog.cancel': 'Cancelar',

    // Inbox to Project conversion
    'inbox.convertToProject': 'Convertir este elemento en un proyecto',
    'inbox.toProject': 'A Proyecto',
    'inbox.converting': 'Convirtiendo...',

    // Issues
    'issues.title': 'Problemas',
    'issues.description': 'Rastrea errores, solicitudes de funciones y mejoras para tus proyectos.',
    'issues.newIssue': 'Nuevo Problema',
    'issues.createIssue': 'Crear Problema',
    'issues.editIssue': 'Editar Problema',
    'issues.updateIssue': 'Actualizar Problema',
    'issues.deleteIssue': 'Eliminar Problema',
    'issues.promoteToNextAction': 'Promover a Próxima Acción',
    'issues.markInProgress': 'Marcar En Progreso',
    'issues.markResolved': 'Marcar Resuelto',
    'issues.noIssues': 'No hay problemas aún',
    'issues.noIssuesSubtitle': 'Crea tu primer problema para comenzar.',
    'issues.noMatchingFilters': 'No hay problemas que coincidan con tus filtros',
    'issues.noMatchingFiltersSubtitle': 'Intenta ajustar tus filtros para ver más resultados.',
    'issues.clearFilters': 'Limpiar Filtros',
    'issues.filters': 'Filtros',
    'issues.search': 'Buscar problemas...',
    'issues.searchLabel': 'Buscar',
    'issues.allTypes': 'Todos los tipos',
    'issues.allPriorities': 'Todas las prioridades',
    'issues.allStatuses': 'Todos los estados',
    'issues.allProjects': 'Todos los proyectos',
    'issues.allAssignees': 'Todos los asignados',
    'issues.sortBy': 'Ordenar por:',
    'issues.sortByDate': 'Fecha',
    'issues.sortByPriority': 'Prioridad',
    'issues.sortByStatus': 'Estado',
    'issues.sortByTitle': 'Título',
    'issues.viewMode.compact': 'Compacto',
    'issues.viewMode.comfortable': 'Cómodo',
    
    // Issue Types
    'issues.type.bug': 'Error',
    'issues.type.feature': 'Función',
    'issues.type.improvement': 'Mejora',
    'issues.type.research': 'Investigación',
    'issues.type.question': 'Pregunta',
    'issues.type.bug.description': 'Algo no está funcionando correctamente',
    'issues.type.feature.description': 'Una nueva función o mejora',
    'issues.type.improvement.description': 'Una mejora a la funcionalidad existente',
    'issues.type.research.description': 'Se necesita investigación o investigación',
    'issues.type.question.description': 'Una pregunta que necesita una respuesta',
    
    // Issue Priorities
    'issues.priority.low': 'Baja',
    'issues.priority.medium': 'Media',
    'issues.priority.high': 'Alta',
    'issues.priority.critical': 'Crítica',
    'issues.priority.low.description': 'Sería bueno tenerlo, no urgente',
    'issues.priority.medium.description': 'Problema de prioridad normal',
    'issues.priority.high.description': 'Problema importante que debería arreglarse pronto',
    'issues.priority.critical.description': 'Bloquea el lanzamiento o causa pérdida de datos',
    
    // Issue Statuses
    'issues.status.open': 'Abierto',
    'issues.status.inProgress': 'En Progreso',
    'issues.status.resolved': 'Resuelto',
    'issues.status.closed': 'Cerrado',
    'issues.status.duplicate': 'Duplicado',
    'issues.status.wontFix': 'No se Arreglará',
    
    // Issue Form
    'issues.form.title': 'Título',
    'issues.form.titleRequired': 'El título es requerido',
    'issues.form.titlePlaceholder': 'Descripción breve del problema',
    'issues.form.description': 'Descripción',
    'issues.form.descriptionPlaceholder': 'Descripción detallada del problema',
    'issues.form.type': 'Tipo de Problema',
    'issues.form.typeRequired': 'El tipo de problema es requerido',
    'issues.form.priority': 'Prioridad',
    'issues.form.priorityRequired': 'La prioridad es requerida',
    'issues.form.project': 'Proyecto',
    'issues.form.noProject': 'Sin proyecto',
    'issues.form.assignee': 'Asignado',
    'issues.form.assigneePlaceholder': '¿Quién debería trabajar en esto?',
    'issues.form.reporter': 'Reportero',
    'issues.form.reporterPlaceholder': '¿Quién reportó este problema?',
    'issues.form.labels': 'Etiquetas',
    'issues.form.labelsPlaceholder': 'Agregar una etiqueta...',
    'issues.form.addLabel': 'Agregar Etiqueta',
    'issues.form.reproductionSteps': 'Pasos de Reproducción',
    'issues.form.reproductionStepsRequired': 'Los pasos de reproducción son requeridos para errores',
    'issues.form.reproductionStepsPlaceholder': '1. Ir a...\\n2. Hacer clic en...\\n3. Comportamiento esperado vs real',
    'issues.form.acceptanceCriteria': 'Criterios de Aceptación',
    'issues.form.acceptanceCriteriaRequired': 'Los criterios de aceptación son requeridos para funciones',
    'issues.form.acceptanceCriteriaPlaceholder': 'Dado... Cuando... Entonces...\\nO lista de requisitos para completar',
    'issues.form.environment': 'Entorno',
    'issues.form.environmentPlaceholder': 'Navegador, SO, dispositivo, etc.',
    'issues.form.notes': 'Notas Adicionales',
    'issues.form.notesPlaceholder': 'Cualquier nota adicional o contexto...',
    'issues.form.cancel': 'Cancelar',
    'issues.form.saving': 'Guardando...',
    
    // Issue Detail
    'issues.detail.backToIssues': 'Volver a Problemas',
    'issues.detail.edit': 'Editar',
    'issues.detail.delete': 'Eliminar',
    'issues.detail.deleteConfirm': '¿Estás seguro de que quieres eliminar este problema? Esta acción no se puede deshacer.',
    'issues.detail.notFound': 'Problema no encontrado',
    'issues.detail.notFoundSubtitle': 'El problema que estás buscando no existe o ha sido eliminado.',
    'issues.detail.loading': 'Cargando problema...',
    'issues.detail.created': 'Creado',
    'issues.detail.updated': 'Actualizado',
    'issues.detail.reproductionSteps': 'Pasos de Reproducción:',
    'issues.detail.acceptanceCriteria': 'Criterios de Aceptación:',
    'issues.detail.notes': 'Notas:',
    
    // AI Analysis
    'issues.ai.analyzing': 'Analizando...',
    'issues.ai.analysis': 'Análisis de IA',
    'issues.ai.confidence': 'confianza',
    'issues.ai.complexity.simple': 'Simple',
    'issues.ai.complexity.moderate': 'Moderado',
    'issues.ai.complexity.complex': 'Complejo',
    'issues.ai.complexity.simple.description': 'Tarea rápida, 1-4 horas',
    'issues.ai.complexity.moderate.description': 'Esfuerzo medio, 1-3 días',
    'issues.ai.complexity.complex.description': 'Gran esfuerzo, 1+ semanas',
    'issues.ai.estimatedTime': 'Tiempo estimado',
    'issues.ai.reasoning': 'Razonamiento:',
    'issues.ai.recommendedApproach': 'Enfoque Recomendado:',
    'issues.ai.suggestedBreakdown': 'Desglose Sugerido:',
    'issues.ai.technicalConsiderations': 'Consideraciones Técnicas:',
    
    // Issue Stats
    'issues.stats.total': 'Problemas Totales',
    'issues.stats.open': 'Abiertos',
    'issues.stats.inProgress': 'En Progreso',
    'issues.stats.resolved': 'Resueltos',
    'issues.stats.filteredFrom': 'Filtrado de {total} problemas totales',
    
    // Issue Trackers
    'issueTrackers.title': 'Rastreadores de Problemas',
    'issueTrackers.description': 'Gestiona tableros de rastreadores de problemas para tus proyectos y productos',
    'issueTrackers.newTracker': 'Nuevo Rastreador de Problemas',
    'issueTrackers.createTracker': 'Crear Rastreador de Problemas',
    'issueTrackers.editTracker': 'Editar Rastreador de Problemas',
    'issueTrackers.updateTracker': 'Actualizar Rastreador',
    'issueTrackers.deleteTracker': 'Eliminar Rastreador',
    'issueTrackers.noTrackers': 'No hay rastreadores de problemas aún',
    'issueTrackers.noTrackersSubtitle': 'Crea tu primer rastreador de problemas para comenzar a organizar los problemas de tu proyecto.',
    'issueTrackers.noMatchingSearch': 'No hay rastreadores que coincidan con tu búsqueda',
    'issueTrackers.noMatchingSearchSubtitle': 'Intenta ajustar tus términos de búsqueda o crear un nuevo rastreador.',
    'issueTrackers.clearSearch': 'Limpiar Búsqueda',
    'issueTrackers.searchPlaceholder': 'Buscar rastreadores...',
    'issueTrackers.backToTrackers': 'Volver a Rastreadores',
    'issueTrackers.openBoard': 'Abrir Tablero',
    'issueTrackers.settings': 'Configuración',
    'issueTrackers.linkedProject': 'Vinculado a',
    
    // Issue Tracker Form
    'issueTrackers.form.trackerName': 'Nombre del Rastreador',
    'issueTrackers.form.trackerNameRequired': 'El nombre del rastreador es requerido',
    'issueTrackers.form.trackerNamePlaceholder': 'ej., Rediseño del Sitio Web, App Móvil v2',
    'issueTrackers.form.title': 'Título',
    'issueTrackers.form.titleRequired': 'El título es requerido',
    'issueTrackers.form.titlePlaceholder': 'Título interno para el rastreador',
    'issueTrackers.form.titleHelp': 'Esto se usa internamente para búsqueda y organización',
    'issueTrackers.form.description': 'Descripción',
    'issueTrackers.form.descriptionPlaceholder': 'Breve descripción de para qué es este rastreador',
    'issueTrackers.form.linkProject': 'Vincular a Proyecto (Opcional)',
    'issueTrackers.form.noProjectLinked': 'Ningún proyecto vinculado',
    'issueTrackers.form.linkProjectHelp': 'Vincular a un proyecto permite una mejor organización e informes',
    'issueTrackers.form.trackerSettings': 'Configuración del Rastreador',
    'issueTrackers.form.allowedIssueTypes': 'Tipos de Problemas Permitidos',
    'issueTrackers.form.allowedIssueTypesRequired': 'Al menos un tipo de problema debe ser seleccionado',
    'issueTrackers.form.defaultPriority': 'Prioridad Predeterminada',
    'issueTrackers.form.autoPromoteToNextActions': 'Auto-promover a Próximas Acciones',
    'issueTrackers.form.autoPromoteToNextActionsHelp': 'Sugerir automáticamente promover problemas resueltos a próximas acciones',
    'issueTrackers.form.enableAIAnalysis': 'Habilitar Análisis de IA',
    'issueTrackers.form.enableAIAnalysisHelp': 'Usar IA para analizar la complejidad de problemas y proporcionar recomendaciones',
    'issueTrackers.form.notes': 'Notas',
    'issueTrackers.form.notesPlaceholder': 'Cualquier nota adicional sobre este rastreador...',
    'issueTrackers.form.cancel': 'Cancelar',
    'issueTrackers.form.saving': 'Guardando...',
    'issueTrackers.form.createTracker': 'Crear Rastreador',
    'issueTrackers.form.updateTracker': 'Actualizar Rastreador',
    
    // Issue Tracker Stats
    'issueTrackers.stats.totalTrackers': 'Rastreadores Totales',
    'issueTrackers.stats.totalIssues': 'Problemas Totales',
    'issueTrackers.stats.linkedProjects': 'Proyectos Vinculados',
    'issueTrackers.stats.recentActivity': 'Actividad Reciente',
    'issueTrackers.stats.issueCount': 'problemas',
    'issueTrackers.stats.lastActivity': 'Última actividad',
    'issueTrackers.stats.created': 'Creado',
    
    // Issue Tracker Board
    'issueTrackers.board.breadcrumb.home': 'Inicio',
    'issueTrackers.board.breadcrumb.trackers': 'Rastreadores de Problemas',
    'issueTrackers.board.backToTrackers': 'Volver a Rastreadores',
    'issueTrackers.board.newIssue': 'Nuevo Problema',
    'issueTrackers.board.issues': 'Problemas',
    'issueTrackers.board.total': 'total',
    'issueTrackers.board.noIssues': 'No hay problemas aún',
    'issueTrackers.board.noIssuesSubtitle': 'Crea tu primer problema para comenzar a rastrear el trabajo para {trackerName}.',
    'issueTrackers.board.createFirstIssue': 'Crear Primer Problema',
    'issueTrackers.board.deleteConfirm': '¿Estás seguro de que quieres eliminar "{trackerName}"? Esto también eliminará todos los problemas asociados y no se puede deshacer.',
    'issueTrackers.board.trackerNotFound': 'Rastreador de Problemas no encontrado',
    'issueTrackers.board.trackerNotFoundSubtitle': 'El rastreador de problemas que buscas no existe o ha sido eliminado.',
    'issueTrackers.board.loading': 'Cargando rastreador de problemas...',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguageState(savedLanguage);
    } else {
      // Detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('es')) {
        setLanguageState('es');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred-language', lang);
    // Update document language attribute
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 