'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService, AuthUser } from '@/services/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendSignInLink: (email: string) => Promise<void>;
  signInWithLink: (url: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await AuthService.signIn(email, password);
      // User state will be updated by the onAuthStateChanged listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      await AuthService.signUp(email, password, displayName);
      // User state will be updated by the onAuthStateChanged listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
      // User state will be updated by the onAuthStateChanged listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const sendSignInLink = async (email: string) => {
    await AuthService.sendSignInLink(email);
  };

  const signInWithLink = async (url: string) => {
    setLoading(true);
    try {
      await AuthService.signInWithLink(url);
      // User state will be updated by the onAuthStateChanged listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  const refreshUser = async () => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      // Reload user to get fresh data from Firebase
      await currentUser.reload();
      
      // Update local state with fresh user data
      setUser({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        emailVerified: currentUser.emailVerified
      });
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    sendSignInLink,
    signInWithLink,
    resetPassword,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 