// =====================================================
// USER PROFILE PANEL
// Compact dropdown panel for Sidebar showing user info,
// credits, subscription, and logout
// =====================================================

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Crown, ChevronDown, Zap, Settings, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../contexts/CreditContext';
import { useTranslation } from '../i18n';
import { PLANS } from '../utils/creditManager';

// Marketplace colors
const MARKETPLACE_COLORS = {
    etsy: '#F1641E',
    amazon: '#FF9900',
    shopify: '#96BF48'
};

export default function UserProfilePanel({ marketplace, onNavigate, collapsed = false, onExpandSidebar }) {
    const { t } = useTranslation();
    const { user, signOut, isAuthenticated } = useAuth();
    const { subscription, credits } = useCredits();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const panelRef = useRef(null);

    const primaryColor = MARKETPLACE_COLORS[marketplace] || '#E06847';
    const planInfo = PLANS[subscription?.plan] || PLANS.free;

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            setIsOpen(false);
        } catch (err) {
            console.error('Logout failed:', err);
        } finally {
            setIsLoggingOut(false);
        }
    };

    // If not authenticated, show sign-in prompt
    if (!isAuthenticated) {
        return (
            <div className={collapsed ? 'p-2' : 'p-3'}>
                <button
                    onClick={() => onNavigate('login')}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl text-white font-medium transition-all hover:opacity-90
                        ${collapsed ? 'p-2.5' : 'py-3 px-4'}
                    `}
                    style={{ backgroundColor: primaryColor }}
                    title={collapsed ? t('nav.signIn') || 'Sign In' : undefined}
                >
                    <User className={collapsed ? 'w-5 h-5' : 'w-4 h-4'} />
                    {!collapsed && <span>{t('nav.signIn') || 'Sign In'}</span>}
                </button>
            </div>
        );
    }

    return (
        <div className="relative" ref={panelRef}>
            {/* Trigger Button */}
            <button
                onClick={() => {
                    // When collapsed, expand the sidebar instead of opening dropdown
                    if (collapsed && onExpandSidebar) {
                        onExpandSidebar();
                    } else {
                        setIsOpen(!isOpen);
                    }
                }}
                className={`w-full flex items-center gap-3 rounded-xl transition-all border
                    ${collapsed ? 'p-2 justify-center' : 'p-3'}
                    ${isOpen
                        ? 'bg-white border-[#E8E7E4] shadow-sm'
                        : 'border-transparent hover:bg-white hover:border-[#E8E7E4]'
                    }
                `}
                title={collapsed ? (user.displayName || user.email?.split('@')[0] || 'User') : undefined}
            >
                {/* Avatar */}
                <div className="relative">
                    {user.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt={user.displayName || 'User'}
                            className={`rounded-full object-cover border-2 border-white shadow-sm ${collapsed ? 'w-8 h-8' : 'w-10 h-10'}`}
                        />
                    ) : (
                        <div
                            className={`rounded-full flex items-center justify-center text-white font-bold ${collapsed ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}`}
                            style={{ backgroundColor: primaryColor }}
                        >
                            {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                    )}
                    {/* Plan Badge */}
                    {subscription?.plan !== 'free' && (
                        <div
                            className={`absolute -bottom-1 -right-1 rounded-full flex items-center justify-center border-2 border-white ${collapsed ? 'w-4 h-4' : 'w-5 h-5'}`}
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Crown className={collapsed ? 'w-2 h-2 text-white' : 'w-2.5 h-2.5 text-white'} />
                        </div>
                    )}
                </div>

                {/* User Info - hidden when collapsed */}
                {!collapsed && (
                    <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-[#1A1A1A] truncate">
                            {user.displayName || user.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-[#8C8C8C] truncate">
                            {planInfo.name} • {credits} credits
                        </p>
                    </div>
                )}

                {/* Chevron - hidden when collapsed */}
                {!collapsed && (
                    <ChevronDown
                        className={`w-4 h-4 text-[#8C8C8C] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-[#E8E7E4] shadow-lg overflow-hidden z-50">
                    {/* Credits Section */}
                    <div className="p-4 border-b border-[#E8E7E4]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-[#8C8C8C] uppercase tracking-wider">
                                {t('profile.credits') || 'Credits'}
                            </span>
                            <div
                                className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                            >
                                <Zap className="w-3 h-3" />
                                {credits}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 bg-[#F5F4F1] rounded-full overflow-hidden mb-2">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${Math.min(100, (credits / (planInfo.credits || 20)) * 100)}%`,
                                    backgroundColor: primaryColor
                                }}
                            />
                        </div>

                        {/* Plan Info */}
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[#5C5C5C]">{planInfo.name}</span>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    onNavigate('pricing');
                                }}
                                className="font-medium hover:underline"
                                style={{ color: primaryColor }}
                            >
                                {subscription?.plan === 'free' ? (t('profile.upgrade') || 'Upgrade') : (t('profile.managePlan') || 'Manage')}
                            </button>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onNavigate('settings');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-[#1A1A1A] hover:bg-[#F5F4F1] transition-colors"
                        >
                            <Settings className="w-4 h-4 text-[#8C8C8C]" />
                            <span className="text-sm">{t('nav.settings') || 'Settings'}</span>
                        </button>

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onNavigate('pricing');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-[#1A1A1A] hover:bg-[#F5F4F1] transition-colors"
                        >
                            <CreditCard className="w-4 h-4 text-[#8C8C8C]" />
                            <span className="text-sm">{t('nav.billing') || 'Billing'}</span>
                        </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-[#E8E7E4] py-1">
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">
                                {isLoggingOut ? (t('profile.loggingOut') || 'Logging out...') : (t('profile.logout') || 'Log out')}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
