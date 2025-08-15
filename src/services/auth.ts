import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updateProfile,
  User,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export class AuthService {
  // Initialize Google Auth Provider
  private static googleProvider = new GoogleAuthProvider();

  // Sign in with Google
  static async signInWithGoogle(): Promise<AuthUser> {
    try {
      // Configure Google provider to always show account selection
      this.googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      const userCredential = await signInWithPopup(auth, this.googleProvider);
      const user = userCredential.user;
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      };
    } catch (error: unknown) {
      const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown';
      throw new Error(this.getGoogleErrorMessage(errorCode));
    }
  }

  // Link Google account to existing email/password account
  static async linkWithGoogle(): Promise<AuthUser> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      const userCredential = await linkWithPopup(currentUser, this.googleProvider);
      const user = userCredential.user;
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      };
    } catch (error: unknown) {
      const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown';
      throw new Error(this.getGoogleErrorMessage(errorCode));
    }
  }

  // Sign up with email and password
  static async signUp(email: string, password: string, displayName?: string): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name if provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Sign out the user so they must verify email and sign in manually
      // This creates a clearer flow: Register → Verify Email → Sign In → Access App
      await signOut(auth);
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      };
    } catch (error: unknown) {
      const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown';
      throw new Error(this.getErrorMessage(errorCode));
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      };
    } catch (error: unknown) {
      const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown';
      throw new Error(this.getErrorMessage(errorCode));
    }
  }

  // Send sign-in link to email
  static async sendSignInLink(email: string): Promise<void> {
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/verify-email`,
        handleCodeInApp: true,
      };
      
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      // Save email locally to complete sign-in later
      localStorage.setItem('emailForSignIn', email);
    } catch (error: unknown) {
      const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown';
      throw new Error(this.getErrorMessage(errorCode));
    }
  }

  // Complete sign-in with email link
  static async signInWithLink(url: string): Promise<AuthUser> {
    try {
      if (!isSignInWithEmailLink(auth, url)) {
        throw new Error('Invalid sign-in link');
      }
      
      let email = localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
        if (!email) {
          throw new Error('Email is required');
        }
      }
      
      const userCredential = await signInWithEmailLink(auth, email, url);
      const user = userCredential.user;
      
      // Clear the email from storage
      localStorage.removeItem('emailForSignIn');
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      };
    } catch (error: unknown) {
      const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown';
      throw new Error(this.getErrorMessage(errorCode));
    }
  }

  // Send password reset email
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown';
      throw new Error(this.getErrorMessage(errorCode));
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: unknown) {
      const errorCode = error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown';
      throw new Error(this.getErrorMessage(errorCode));
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Get current auth user data
  static getCurrentAuthUser(): AuthUser | null {
    const user = auth.currentUser;
    if (!user) return null;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified
    };
  }

  // Subscribe to auth state changes
  static onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        });
      } else {
        callback(null);
      }
    });
  }

  // Convert Firebase error codes to user-friendly messages
  private static getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/invalid-action-code':
        return 'Invalid or expired action code.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  // Convert Google-specific error codes to user-friendly messages
  private static getGoogleErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/popup-closed-by-user':
        return 'Sign-in cancelled. Please try again.';
      case 'auth/popup-blocked':
        return 'Pop-up blocked by browser. Please allow pop-ups and try again.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in cancelled. Please try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address but different sign-in credentials.';
      case 'auth/credential-already-in-use':
        return 'This Google account is already linked to another user.';
      case 'auth/provider-already-linked':
        return 'Google account is already linked to this user.';
      case 'auth/requires-recent-login':
        return 'Please sign out and sign in again before linking accounts.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later.';
      default:
        return this.getErrorMessage(errorCode);
    }
  }
}

export default AuthService; 