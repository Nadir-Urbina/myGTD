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
    'app.name': 'MyGTD',
    'app.description': 'A GTD-inspired productivity app for managing projects, tasks, and next actions',
    
    // Navigation
    'nav.inbox': 'Inbox',
    'nav.inbox.description': 'Capture new tasks and ideas',
    'nav.nextActions': 'Next Actions',
    'nav.nextActions.description': 'Your actionable tasks',
    'nav.calendar': 'Calendar',
    'nav.calendar.description': 'Scheduled actions',
    'nav.projects': 'Projects',
    'nav.projects.description': 'Multi-step initiatives',
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
    
    // Settings Page
    'settings.title': 'Settings',
    'settings.subtitle': 'Customize your MyGTD experience and preferences.',
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
    'landing.nav.subtitle': 'Getting Things Done',
    'landing.nav.signIn': 'Sign In',
    'landing.nav.getStarted': 'Get Started Free',

    // Hero Section
    'landing.hero.title': 'Master the',
    'landing.hero.subtitle': 'Transform chaos into clarity with MyGTD. Built on proven productivity principles, our app helps you capture, organize, and execute everything that has your attention.',
    'landing.hero.startFree': 'Start Free Today',
    'landing.hero.watchDemo': 'Watch Demo',
    'landing.hero.noCreditCard': '✨ No credit card required • 🚀 Set up in 2 minutes',

    // GTD Catchphrases
    'landing.catchphrase.twoMinute': '2-Minute Rule',
    'landing.catchphrase.stressFree': 'Stress-Free Productivity',
    'landing.catchphrase.mindLikeWater': 'Mind Like Water',
    'landing.catchphrase.captureEverything': 'Capture Everything',
    'landing.catchphrase.weeklyReviews': 'Weekly Reviews',
    'landing.catchphrase.nextAction': 'Next Action Thinking',
    'landing.catchphrase.trustedSystem': 'Trusted System',
    'landing.catchphrase.clearMind': 'Clear Your Mind',

    // Features Section
    'landing.features.title': 'Everything You Need for Stress-Free Productivity',
    'landing.features.subtitle': 'MyGTD implements every aspect of the proven productivity methodology, giving you a complete system for managing your life and work stress-free.',
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
    'landing.benefits.title': 'Why Choose MyGTD?',
    'landing.benefits.subtitle': 'Join thousands who\'ve transformed their productivity with our proven system.',
    'landing.benefits.clearMind.title': 'Clear Your Mind',
    'landing.benefits.clearMind.description': 'Stop trying to remember everything. Let MyGTD be your external brain.',
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
    'landing.cta.subtitle': 'Join thousands of productive people who trust MyGTD to manage their life and work. Start your stress-free productivity journey today.',
    'landing.cta.button': 'Start Your Free Account',
    'landing.cta.guarantee': 'No credit card required • Cancel anytime • 30-day money-back guarantee',

    // Footer
    'landing.footer.description': 'The complete Getting Things Done system for stress-free productivity.',
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
    'landing.footer.copyright': '© 2024 MyGTD. All rights reserved.',
  },
  es: {
    // App Name
    'app.name': 'MyGTD',
    'app.description': 'Una aplicación de productividad inspirada en GTD para gestionar proyectos, tareas y próximas acciones',
    
    // Navigation
    'nav.inbox': 'Bandeja de Entrada',
    'nav.inbox.description': 'Captura nuevas tareas e ideas',
    'nav.nextActions': 'Próximas Acciones',
    'nav.nextActions.description': 'Tus tareas accionables',
    'nav.calendar': 'Calendario',
    'nav.calendar.description': 'Acciones programadas',
    'nav.projects': 'Proyectos',
    'nav.projects.description': 'Iniciativas de múltiples pasos',
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
    
    // Settings Page
    'settings.title': 'Configuración',
    'settings.subtitle': 'Personaliza tu experiencia MyGTD y preferencias.',
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
    'landing.nav.subtitle': 'Organización de Tareas',
    'landing.nav.signIn': 'Iniciar Sesión',
    'landing.nav.getStarted': 'Comenzar Gratis',

    // Hero Section
    'landing.hero.title': 'Domina la',
    'landing.hero.subtitle': 'Transforma el caos en claridad con MyGTD. Construido sobre principios de productividad probados, nuestra aplicación te ayuda a capturar, organizar y ejecutar todo lo que llama tu atención.',
    'landing.hero.startFree': 'Comienza Gratis Hoy',
    'landing.hero.watchDemo': 'Ver Demo',
    'landing.hero.noCreditCard': '✨ No se requiere tarjeta de crédito • 🚀 Configuración en 2 minutos',

    // GTD Catchphrases
    'landing.catchphrase.twoMinute': 'Regla de 2 Minutos',
    'landing.catchphrase.stressFree': 'Productividad Sin Estrés',
    'landing.catchphrase.mindLikeWater': 'Mente Como el Agua',
    'landing.catchphrase.captureEverything': 'Captura Todo',
    'landing.catchphrase.weeklyReviews': 'Revisiones Semanales',
    'landing.catchphrase.nextAction': 'Pensamiento de Próxima Acción',
    'landing.catchphrase.trustedSystem': 'Sistema Confiable',
    'landing.catchphrase.clearMind': 'Libera Tu Mente',

    // Features Section
    'landing.features.title': 'Todo lo que Necesitas para una Productividad Sin Estrés',
    'landing.features.subtitle': 'MyGTD implementa cada aspecto de la metodología de productividad probada, dándote un sistema completo para gestionar tu vida y trabajo sin estrés.',
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
    'landing.benefits.title': '¿Por qué Elegir MyGTD?',
    'landing.benefits.subtitle': 'Únete a miles de personas que han transformado su productividad con nuestro sistema probado.',
    'landing.benefits.clearMind.title': 'Libera Tu Mente',
    'landing.benefits.clearMind.description': 'Deja de intentar recordar todo. Permite que MyGTD sea tu cerebro externo.',
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
    'landing.cta.subtitle': 'Únete a miles de personas productivas que confían en MyGTD para gestionar su vida y trabajo. Comienza tu viaje de productividad sin estrés hoy.',
    'landing.cta.button': 'Comienza tu Cuenta Gratuita',
    'landing.cta.guarantee': 'No se requiere tarjeta de crédito • Cancela en cualquier momento • Garantía de reembolso de 30 días',

    // Footer
    'landing.footer.description': 'El sistema completo de Organización de Tareas para productividad sin estrés.',
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
    'landing.footer.copyright': '© 2024 MyGTD. Todos los derechos reservados.',
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