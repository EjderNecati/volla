// =====================================================
// LOGIN PAGE
// Premium authentication UI with Google, Apple & Email
// =====================================================

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function LoginPage({ onNavigate }) {
    const { t } = useTranslation();
    const {
        signInWithGoogle,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        error,
        clearError
    } = useAuth();

    const [isSigningIn, setIsSigningIn] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    const handleGoogleSignIn = async () => {
        setIsSigningIn(true);
        clearError();
        try {
            await signInWithGoogle();
            // Redirect to home on success
            onNavigate('home');
        } catch (err) {
            console.error('Sign-in failed:', err);
        } finally {
            setIsSigningIn(false);
        }
    };

    const handleAppleSignIn = async () => {
        setIsSigningIn(true);
        clearError();
        try {
            await signInWithApple();
            // Redirect to home on success
            onNavigate('home');
        } catch (err) {
            console.error('Sign-in failed:', err);
        } finally {
            setIsSigningIn(false);
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setIsSigningIn(true);
        clearError();

        try {
            if (isSignUp) {
                await signUpWithEmail(email, password, displayName);
            } else {
                await signInWithEmail(email, password);
            }
            // Redirect to home on success
            onNavigate('home');
        } catch (err) {
            console.error('Email auth failed:', err);
        } finally {
            setIsSigningIn(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsSigningIn(true);
        clearError();

        try {
            await resetPassword(email);
            setResetSent(true);
        } catch (err) {
            console.error('Password reset failed:', err);
        } finally {
            setIsSigningIn(false);
        }
    };

    // Forgot Password View
    if (showForgotPassword) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] via-[#F5F4F1] to-[#EDE9E0] flex items-center justify-center p-4 font-poppins">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E7E4] p-8 md:p-10">
                        <button
                            onClick={() => { setShowForgotPassword(false); setResetSent(false); clearError(); }}
                            className="flex items-center gap-2 text-[#5C5C5C] hover:text-[#1A1A1A] mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Login</span>
                        </button>

                        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Reset Password</h2>
                        <p className="text-sm text-[#8C8C8C] mb-6">
                            Enter your email and we'll send you a reset link
                        </p>

                        {resetSent ? (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                                ✅ Password reset email sent! Check your inbox.
                            </div>
                        ) : (
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8C8C8C]" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email address"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E06847] focus:border-transparent transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSigningIn || !email}
                                    className="w-full py-4 bg-[#E06847] text-white rounded-xl font-medium hover:bg-[#D4572E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSigningIn ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Email Form View
    if (showEmailForm) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] via-[#F5F4F1] to-[#EDE9E0] flex items-center justify-center p-4 font-poppins">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E7E4] p-8 md:p-10">
                        <button
                            onClick={() => { setShowEmailForm(false); clearError(); }}
                            className="flex items-center gap-2 text-[#5C5C5C] hover:text-[#1A1A1A] mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back</span>
                        </button>

                        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                            {isSignUp ? 'Create Account' : 'Sign In'}
                        </h2>
                        <p className="text-sm text-[#8C8C8C] mb-6">
                            {isSignUp ? 'Fill in your details to get started' : 'Welcome back! Enter your credentials'}
                        </p>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            {isSignUp && (
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8C8C8C]" />
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Full Name"
                                        className="w-full pl-12 pr-4 py-4 bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E06847] focus:border-transparent transition-all"
                                    />
                                </div>
                            )}

                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8C8C8C]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E06847] focus:border-transparent transition-all"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8C8C8C]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-12 py-4 bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E06847] focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C8C8C] hover:text-[#1A1A1A]"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {!isSignUp && (
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm text-[#E06847] hover:underline"
                                >
                                    Forgot password?
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={isSigningIn || !email || !password}
                                className="w-full py-4 bg-[#E06847] text-white rounded-xl font-medium hover:bg-[#D4572E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSigningIn ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-[#8C8C8C]">
                                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                                <button
                                    onClick={() => { setIsSignUp(!isSignUp); clearError(); }}
                                    className="ml-1 text-[#E06847] font-medium hover:underline"
                                >
                                    {isSignUp ? 'Sign In' : 'Sign Up'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main Login View
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] via-[#F5F4F1] to-[#EDE9E0] flex items-center justify-center p-4 font-poppins">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E7E4] p-8 md:p-10">
                    {/* Back to Landing */}
                    <button
                        onClick={() => onNavigate('landing')}
                        className="flex items-center gap-2 text-[#5C5C5C] hover:text-[#1A1A1A] mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>

                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#E06847] to-[#D4572E] rounded-2xl mb-4 shadow-lg">
                            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">VOLLA</h1>
                        <p className="text-[#5C5C5C]">
                            {t('login.subtitle') || 'AI-Powered Product Photography'}
                        </p>
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
                            {t('login.welcome') || 'Welcome back'}
                        </h2>
                        <p className="text-sm text-[#8C8C8C]">
                            {t('login.description') || 'Sign in to continue to your account'}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Sign-In Buttons */}
                    <div className="space-y-3">
                        {/* Google Sign-In */}
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isSigningIn}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border-2 border-[#E8E7E4] rounded-xl font-medium text-[#1A1A1A] hover:bg-[#F5F4F1] hover:border-[#D0CFC9] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {/* Google Icon */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>{isSigningIn ? 'Signing in...' : (t('login.continueWithGoogle') || 'Continue with Google')}</span>
                        </button>

                        {/* Apple Sign-In */}
                        <button
                            onClick={handleAppleSignIn}
                            disabled={isSigningIn}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#1A1A1A] border-2 border-[#1A1A1A] rounded-xl font-medium text-white hover:bg-[#2A2A2A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {/* Apple Icon */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                            </svg>
                            <span>{t('login.signInWithApple') || 'Sign in with Apple'}</span>
                        </button>

                        {/* Email Sign-In */}
                        <button
                            onClick={() => setShowEmailForm(true)}
                            disabled={isSigningIn}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border-2 border-[#E8E7E4] rounded-xl font-medium text-[#1A1A1A] hover:bg-[#F5F4F1] hover:border-[#D0CFC9] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Mail className="w-5 h-5 text-[#5C5C5C]" />
                            <span>{t('login.continueWithEmail') || 'Continue with Email'}</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="my-8 flex items-center gap-4">
                        <div className="flex-1 h-px bg-[#E8E7E4]"></div>
                        <span className="text-sm text-[#8C8C8C]">{t('login.or') || 'or'}</span>
                        <div className="flex-1 h-px bg-[#E8E7E4]"></div>
                    </div>

                    {/* Continue as Guest */}
                    <button
                        onClick={() => onNavigate('home')}
                        className="w-full py-3 text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors text-sm font-medium"
                    >
                        {t('login.continueAsGuest') || 'Continue as Guest (Limited Features)'}
                    </button>
                </div>

                {/* Footer Links */}
                <div className="mt-6 text-center text-sm text-[#8C8C8C]">
                    <p className="mb-2">
                        {t('login.termsNotice') || 'By signing in, you agree to our'}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => onNavigate('terms')}
                            className="text-[#E06847] hover:underline"
                        >
                            Terms
                        </button>
                        <span>•</span>
                        <button
                            onClick={() => onNavigate('privacy')}
                            className="text-[#E06847] hover:underline"
                        >
                            Privacy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
