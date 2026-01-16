// =====================================================
// AUTH CONTEXT
// Global authentication state management
// =====================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut as firebaseSignOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    signInAnonymously
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../config/firebase';

const AuthContext = createContext(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in
                const userData = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    provider: firebaseUser.providerData[0]?.providerId || 'unknown'
                };
                setUser(userData);
                // Save to localStorage for credit context admin check
                localStorage.setItem('volla_user', JSON.stringify(userData));
            } else {
                // User is signed out
                setUser(null);
                localStorage.removeItem('volla_user');
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Sign in with Google
    const signInWithGoogle = async () => {
        setError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            console.log('✅ Google sign-in successful:', result.user.email);
            return result.user;
        } catch (err) {
            console.error('❌ Google sign-in error:', err);
            setError(getErrorMessage(err.code));
            throw err;
        }
    };

    // Sign in with Apple
    const signInWithApple = async () => {
        setError(null);
        try {
            const result = await signInWithPopup(auth, appleProvider);
            console.log('✅ Apple sign-in successful:', result.user.email);
            return result.user;
        } catch (err) {
            console.error('❌ Apple sign-in error:', err);
            setError(getErrorMessage(err.code));
            throw err;
        }
    };

    // Sign in with Email/Password
    const signInWithEmail = async (email, password) => {
        setError(null);
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Email sign-in successful:', result.user.email);
            return result.user;
        } catch (err) {
            console.error('❌ Email sign-in error:', err);
            setError(getErrorMessage(err.code));
            throw err;
        }
    };

    // Sign up with Email/Password
    const signUpWithEmail = async (email, password, displayName) => {
        setError(null);
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            // Update display name
            if (displayName) {
                await updateProfile(result.user, { displayName });
            }
            console.log('✅ Email sign-up successful:', result.user.email);
            return result.user;
        } catch (err) {
            console.error('❌ Email sign-up error:', err);
            setError(getErrorMessage(err.code));
            throw err;
        }
    };

    // Reset password
    const resetPassword = async (email) => {
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
            console.log('✅ Password reset email sent');
            return true;
        } catch (err) {
            console.error('❌ Password reset error:', err);
            setError(getErrorMessage(err.code));
            throw err;
        }
    };

    // Sign out
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            console.log('✅ Signed out successfully');
        } catch (err) {
            console.error('❌ Sign-out error:', err);
            throw err;
        }
    };

    // Sign in as Guest (anonymous)
    const signInAsGuest = async () => {
        setError(null);
        try {
            const result = await signInAnonymously(auth);
            console.log('✅ Guest sign-in successful');
            return result.user;
        } catch (err) {
            console.error('❌ Guest sign-in error:', err);
            setError(getErrorMessage(err.code));
            throw err;
        }
    };

    // Error message helper
    const getErrorMessage = (code) => {
        switch (code) {
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/user-disabled':
                return 'This account has been disabled';
            case 'auth/user-not-found':
                return 'No account found with this email';
            case 'auth/wrong-password':
                return 'Incorrect password';
            case 'auth/email-already-in-use':
                return 'Email already in use';
            case 'auth/weak-password':
                return 'Password is too weak (min 6 characters)';
            case 'auth/popup-closed-by-user':
                return 'Sign-in popup was closed';
            case 'auth/network-request-failed':
                return 'Network error - check your connection';
            default:
                return 'Authentication error. Please try again.';
        }
    };

    const value = {
        user,
        isLoading,
        error,
        isAuthenticated: !!user,
        isGuest: user?.isAnonymous || false,
        signInWithGoogle,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        resetPassword,
        signOut,
        clearError: () => setError(null)
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
