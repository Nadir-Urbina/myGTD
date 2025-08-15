'use client';

import { AppLayout } from '@/components/app-layout';
import { useSettings } from '@/contexts/settings-context';
import { useLanguage } from '@/contexts/language-context';
import { Brain, Check, Zap, Globe, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { aiAnalysisEnabled, setAiAnalysisEnabled, notifications, setNotifications } = useSettings();
  const { t, language, setLanguage } = useLanguage();

  const handleToggleAI = () => {
    setAiAnalysisEnabled(!aiAnalysisEnabled);
  };

  const handleToggleNotifications = () => {
    setNotifications(!notifications);
  };

  const handleLanguageChange = (newLanguage: 'en' | 'es') => {
    setLanguage(newLanguage);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('settings.title')}</h1>
          <p className="text-gray-600">
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="space-y-8">
          {/* AI Features Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                                 <div>
                   <h2 className="text-xl font-semibold text-gray-900">{t('ai.settings.title')}</h2>
                   <p className="text-gray-600">{t('settings.ai.subtitle')}</p>
                 </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* AI Analysis Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{t('ai.settings.enable')}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {t('ai.settings.description')}
                  </p>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">2-Minute Rule Detection</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Tasks that might take 2 minutes or less will be highlighted with an animated border and special badge.
                    </p>
                  </div>
                </div>
                <div className="ml-6">
                  <button
                    onClick={handleToggleAI}
                    className={cn(
                      "relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2",
                      aiAnalysisEnabled ? "bg-blue-600" : "bg-gray-300"
                    )}
                    role="switch"
                    aria-checked={aiAnalysisEnabled}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        aiAnalysisEnabled ? "translate-x-6" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Status Indicator */}
              {aiAnalysisEnabled && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <Check className="h-5 w-5 text-green-600" />
                                     <div>
                     <p className="font-medium text-green-900">{t('settings.ai.activeStatus')}</p>
                     <p className="text-sm text-green-700">
                       {t('settings.ai.activeDesc')}
                     </p>
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Language & Localization */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                                 <div>
                   <h2 className="text-xl font-semibold text-gray-900">{t('settings.language.title')}</h2>
                   <p className="text-gray-600">{t('settings.language.subtitle')}</p>
                 </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {[
                  { code: 'en', label: 'English', flag: '🇺🇸' },
                  { code: 'es', label: 'Español', flag: '🇪🇸' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code as 'en' | 'es')}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors",
                      language === lang.code
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="flex-1 text-left">
                      <div className={cn(
                        "font-medium",
                        language === lang.code ? "text-blue-900" : "text-gray-900"
                      )}>
                        {lang.label}
                      </div>
                    </div>
                    {language === lang.code && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Future Settings Sections */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                                 <div>
                   <h2 className="text-xl font-semibold text-gray-900">{t('settings.notifications.title')}</h2>
                   <p className="text-gray-600">{t('settings.notifications.subtitle')}</p>
                 </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                 <div>
                   <h3 className="font-semibold text-gray-900">{t('settings.notifications.email')}</h3>
                   <p className="text-gray-600">{t('settings.notifications.emailDesc')}</p>
                 </div>
                <button
                  onClick={handleToggleNotifications}
                  className={cn(
                    "relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2",
                    notifications ? "bg-green-600" : "bg-gray-300"
                  )}
                  role="switch"
                  aria-checked={notifications}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      notifications ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <div className="text-center text-gray-600">
            <p className="mb-2">EffectivO - Personal Productivity Management</p>
            <p className="text-sm">Built with ❤️ for productivity enthusiasts</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 