import { useState, useEffect, useCallback } from 'react';
import { auth, onAuthChanged, signInWithGoogle } from './firebase';
import type { User } from 'firebase/auth';

export interface AuthenticatedUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  authMethod: 'google_oauth' | 'registration_code' | 'verified_session';
  isTrialActive?: boolean;
}

/**
 * Returns the currently authenticated user if fully logged in via Google Auth
 * or via completed email/code registration.
 */
export function getAuthenticatedUser(): AuthenticatedUserProfile | null {
  // 1. Check Firebase Auth currentUser (Google OAuth)
  if (auth?.currentUser && auth.currentUser.email) {
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
      photoURL: auth.currentUser.photoURL || undefined,
      emailVerified: auth.currentUser.emailVerified,
      authMethod: 'google_oauth',
      isTrialActive: true,
    };
  }

  // 2. Check completed registration / verified trial user in localStorage
  try {
    const raw = localStorage.getItem('whyor_trial_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email && (parsed.emailVerified || parsed.isTrialActive)) {
        return {
          uid: parsed.uid || `user_${parsed.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email: parsed.email,
          displayName: parsed.displayName || parsed.email.split('@')[0],
          photoURL: parsed.photoURL,
          emailVerified: Boolean(parsed.emailVerified),
          authMethod: parsed.authMethod === 'google' ? 'google_oauth' : 'registration_code',
          isTrialActive: Boolean(parsed.isTrialActive),
        };
      }
    }
  } catch (e) {
    // Ignore JSON parsing errors
  }

  return null;
}

/**
 * Synchronous boolean check for full authentication
 */
export function isUserFullyAuthenticated(): boolean {
  return getAuthenticatedUser() !== null;
}

/**
 * Dispatches a custom event to notify all components of auth changes
 */
export function notifyAuthChange(): void {
  window.dispatchEvent(new Event('whyor_auth_change'));
}

/**
 * React hook to access real-time authentication status
 */
export function useAuth() {
  const [user, setUser] = useState<AuthenticatedUserProfile | null>(() => getAuthenticatedUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAuth = useCallback(() => {
    setUser(getAuthenticatedUser());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshAuth();

    // Listen to Firebase Auth state changes
    const unsubscribeFirebase = onAuthChanged((fbUser: User | null) => {
      refreshAuth();
    });

    // Listen to localStorage changes and custom auth events
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'whyor_trial_user') {
        refreshAuth();
      }
    };

    const handleCustomEvent = () => {
      refreshAuth();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('whyor_auth_change', handleCustomEvent);

    return () => {
      unsubscribeFirebase();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('whyor_auth_change', handleCustomEvent);
    };
  }, [refreshAuth]);

  const handleGoogleSignIn = async (): Promise<AuthenticatedUserProfile> => {
    const { user: fbUser } = await signInWithGoogle();
    const profile: AuthenticatedUserProfile = {
      uid: fbUser.uid,
      email: fbUser.email || 'user@example.com',
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
      photoURL: fbUser.photoURL || undefined,
      emailVerified: fbUser.emailVerified,
      authMethod: 'google_oauth',
      isTrialActive: true,
    };

    localStorage.setItem('whyor_trial_user', JSON.stringify(profile));
    notifyAuthChange();
    setUser(profile);
    return profile;
  };

  return {
    user,
    isAuthenticated: Boolean(user),
    isGoogleAuth: user?.authMethod === 'google_oauth',
    isRegistered: user?.authMethod === 'registration_code',
    isLoading,
    refreshAuth,
    signInWithGoogle: handleGoogleSignIn,
  };
}
