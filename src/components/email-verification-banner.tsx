'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Mail, X, RefreshCw } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function EmailVerificationBanner() {
  const { user, refreshUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (rateLimited && cooldownSeconds === 0) {
      // Cooldown finished, clear rate limit
      setRateLimited(false);
      setError('');
    }
  }, [cooldownSeconds, rateLimited]);

  // Don't show if user doesn't exist, email is verified, or banner is dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;

    setResending(true);
    setError('');
    setRateLimited(false);
    
    try {
      await sendEmailVerification(auth.currentUser);
      setResent(true);
      setTimeout(() => setResent(false), 5000); // Hide success message after 5 seconds
    } catch (error: any) {
      // Log user-friendly message instead of raw Firebase error
      if (error.code === 'auth/too-many-requests') {
        // Don't log rate limiting as an error - it's expected behavior
        console.log('Email verification rate limit reached - user will see countdown timer');
        setRateLimited(true);
        setCooldownSeconds(120); // 2 minutes countdown
        setError('Too many verification emails sent. Please wait before trying again.');
      } else {
        // Only log unexpected errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Unexpected error sending verification email:', error);
        } else {
          console.log('Email verification failed:', error.code || 'Unknown error');
        }
        setError('Failed to send verification email. Please try again later.');
        setTimeout(() => setError(''), 5000);
      }
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      await refreshUser();
    } catch (error: any) {
      // Log user-friendly message for status check errors
      if (process.env.NODE_ENV === 'development') {
        console.error('Error refreshing user status:', error);
      } else {
        console.log('Failed to refresh user verification status');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Mail className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Please verify your email address
              </p>
              <p className="mt-1 text-sm text-yellow-700">
                We sent a verification email to <strong>{user.email}</strong>. 
                Verifying your email helps keep your account secure.
              </p>
              {error && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  {error}
                  {rateLimited && cooldownSeconds > 0 && (
                    <span className="ml-1">
                      (Wait {Math.floor(cooldownSeconds / 60)}:
                      {String(cooldownSeconds % 60).padStart(2, '0')})
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              {resent ? (
                <span className="text-sm text-green-600 font-medium">
                  ✓ Sent!
                </span>
              ) : (
                <>
                  <Button
                    onClick={handleCheckStatus}
                    disabled={checking}
                    size="sm"
                    variant="outline"
                    className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                  >
                    {checking ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Check Status
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleResendVerification}
                    disabled={resending || rateLimited}
                    size="sm"
                    variant="outline"
                    className={`${rateLimited 
                      ? 'text-gray-500 border-gray-300 cursor-not-allowed' 
                      : 'text-yellow-800 border-yellow-300 hover:bg-yellow-100'
                    }`}
                    title={rateLimited ? 'Please wait before sending another email' : 'Send another verification email'}
                  >
                    {resending ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Sending...
                      </>
                    ) : rateLimited ? (
                      <>
                        <Mail className="h-3 w-3 mr-1" />
                        {cooldownSeconds > 0 
                          ? `Wait ${Math.floor(cooldownSeconds / 60)}:${String(cooldownSeconds % 60).padStart(2, '0')}`
                          : 'Rate Limited'
                        }
                      </>
                    ) : (
                      <>
                        <Mail className="h-3 w-3 mr-1" />
                        Resend
                      </>
                    )}
                  </Button>
                </>
              )}
              <button
                onClick={() => setDismissed(true)}
                className="p-1 rounded-md text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 