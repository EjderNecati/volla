// =====================================================
// FIREBASE CONFIGURATION
// Google & Apple Sign-In for Volla
// =====================================================

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

// Firebase config - Volla Production
const firebaseConfig = {
    apiKey: "AIzaSyDRY6k4EY1OsYNn0lwRZHvNVdvSY2xmNJ0",
    authDomain: "volla-63d27.firebaseapp.com",
    projectId: "volla-63d27",
    storageBucket: "volla-63d27.firebasestorage.app",
    messagingSenderId: "1049053365302",
    appId: "1:1049053365302:web:6b87281679c06a10070497",
    measurementId: "G-T2KBEKWBWL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth instance
export const auth = getAuth(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account' // Always show account picker
});

// Apple provider (optional - requires Apple Developer account)
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export default app;
