'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  aiAnalysisEnabled: boolean;
  setAiAnalysisEnabled: (enabled: boolean) => void;
  // Future settings can be added here
  notifications: boolean;
  setNotifications: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [aiAnalysisEnabled, setAiAnalysisEnabledState] = useState(true);
  const [notifications, setNotificationsState] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('mygtd-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (typeof settings.aiAnalysisEnabled === 'boolean') {
          setAiAnalysisEnabledState(settings.aiAnalysisEnabled);
        }
        if (typeof settings.notifications === 'boolean') {
          setNotificationsState(settings.notifications);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = (newSettings: Partial<{ aiAnalysisEnabled: boolean; notifications: boolean }>) => {
    const currentSettings = {
      aiAnalysisEnabled,
      notifications,
      ...newSettings
    };
    localStorage.setItem('mygtd-settings', JSON.stringify(currentSettings));
  };

  const setAiAnalysisEnabled = (enabled: boolean) => {
    setAiAnalysisEnabledState(enabled);
    saveSettings({ aiAnalysisEnabled: enabled });
  };

  const setNotifications = (enabled: boolean) => {
    setNotificationsState(enabled);
    saveSettings({ notifications: enabled });
  };

  const value: SettingsContextType = {
    aiAnalysisEnabled,
    setAiAnalysisEnabled,
    notifications,
    setNotifications,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 