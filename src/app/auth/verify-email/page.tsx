'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { user, signInWithLink } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        const url = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const actionCode = urlParams.get('oobCode');

        console.log('Verification mode:', mode);
        console.log('Action code:', actionCode);
        console.log('Current user:', user);

        // Handle different email action modes
        if (mode === 'verifyEmail' && actionCode) {
          // This is an email verification link
          await applyActionCode(auth, actionCode);
          setSuccess(true);
          
          // If user is already signed in, just redirect
          if (user) {
            setTimeout(() => {
              router.push('/');
            }, 2000);
          } else {
            // User needs to sign in after verification
            setTimeout(() => {
              router.push('/auth/login?verified=true');
            }, 2000);
          }
        } else if (mode === 'signIn' || !mode) {
          // This might be a sign-in link, try the original flow
          await signInWithLink(url);
          setSuccess(true);
          
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          throw new Error('Invalid verification link');
        }
        
      } catch (error: any) {
        console.error('Verification error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    handleEmailVerification();
  }, [signInWithLink, router, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">MyGTD</h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-6">Verifying email...</h2>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying your email link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">MyGTD</h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-6">Welcome back!</h2>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="rounded-md bg-green-50 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Email verified successfully!
                    </p>
                    <p className="mt-1 text-sm text-green-700">
                      You have been signed in. Redirecting to your dashboard...
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => router.push('/')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MyGTD</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Email verification failed</h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    Verification failed
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    {error || 'The email verification link is invalid or has expired.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                Go to Sign In
              </Button>
              <Button
                onClick={() => router.push('/auth/register')}
                variant="outline"
                className="w-full"
              >
                Create New Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 