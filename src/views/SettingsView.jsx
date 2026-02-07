import React, { useState, useEffect } from 'react';
import { Settings, Trash2, Check, Globe, Database, Coins, Crown, Zap, LogOut } from 'lucide-react';
import { deleteAllProjects, getStorageUsage } from '../utils/projectManager';
import { useTranslation } from '../i18n';
import { useCredits } from '../contexts/CreditContext';
import { useAuth } from '../contexts/AuthContext';
import { PLANS } from '../utils/creditManager';

// Marketplace color configuration
const MARKETPLACE_COLORS = {
    etsy: { primary: '#F1641E', hover: '#D55419' },
    amazon: { primary: '#FF9900', hover: '#E68A00' },
    shopify: { primary: '#96BF48', hover: '#7FA03C' }
};

/**
 * SettingsView - User configuration
 * Clean version: Language selector and Project management only
 */
export default function SettingsView({ marketplace, onNavigate }) {
    const { t, currentLanguage, setLanguage, availableLanguages } = useTranslation();
    const { credits, subscription } = useCredits();
    const { user, signOut, isAuthenticated } = useAuth();

    const [storageUsage, setStorageUsage] = useState(null);
    const [cleared, setCleared] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Get marketplace-specific colors (default to Volla primary)
    const color = MARKETPLACE_COLORS[marketplace] || { primary: '#E06847', hover: '#C85A3D' };
    const planInfo = PLANS[subscription?.plan] || PLANS.free;

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
        } catch (err) {
            console.error('Logout failed:', err);
        } finally {
            setIsLoggingOut(false);
        }
    };

    useEffect(() => {
        // Load storage usage
        try {
            setStorageUsage(getStorageUsage());
        } catch (err) {
            console.error('Failed to get storage usage:', err);
        }
    }, []);

    // Clear all projects
    const handleClearProjects = () => {
        if (window.confirm('⚠️ Are you sure you want to delete all projects?\n\nThis action cannot be undone!')) {
            try {
                deleteAllProjects();
                localStorage.removeItem('volla_history'); // Also clear old format
                setStorageUsage(getStorageUsage());
                setCleared(true);
                setTimeout(() => setCleared(false), 2000);
            } catch (err) {
                console.error('Failed to clear projects:', err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] p-6 md:p-10 font-poppins">
            <div className="max-w-xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Settings className="w-8 h-8" style={{ color: color.primary }} />
                        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                            {t('settings.title')}
                        </h1>
                    </div>
                    <p className="text-[#5C5C5C]">
                        {t('settings.subtitle')}
                    </p>
                </div>

                {/* Language Selector Section */}
                <div className="bg-white border border-[#E8E7E4] rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5" style={{ color: color.primary }} />
                        <h3 className="font-semibold text-[#1A1A1A]">{t('settings.language')}</h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {availableLanguages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => setLanguage(lang.code)}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all border-2
                                    ${currentLanguage === lang.code
                                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                        : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:border-[#1A1A1A]'
                                    }`}
                            >
                                <span className="text-lg">{lang.flag}</span>
                                <span className="text-sm">{lang.code.toUpperCase()}</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-[#8C8C8C] mt-3 text-center">
                        {t('settings.selectLanguage')}
                    </p>
                </div>

                {/* Credits & Account Section - Visible on Mobile for easy access */}
                {isAuthenticated && (
                    <div className="bg-white border border-[#E8E7E4] rounded-2xl p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Coins className="w-5 h-5" style={{ color: color.primary }} />
                            <h3 className="font-semibold text-[#1A1A1A]">{t('settings.creditsAccount') || 'Credits & Account'}</h3>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-3 mb-4 p-3 bg-[#F5F4F1] rounded-xl">
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName || 'User'}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                            ) : (
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                    style={{ backgroundColor: color.primary }}
                                >
                                    {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="font-medium text-[#1A1A1A]">
                                    {user?.displayName || user?.email?.split('@')[0] || 'User'}
                                </p>
                                <p className="text-xs text-[#8C8C8C]">{user?.email}</p>
                            </div>
                            {subscription?.plan !== 'free' && (
                                <div
                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: `${color.primary}15`, color: color.primary }}
                                >
                                    <Crown className="w-3 h-3" />
                                    {planInfo.name}
                                </div>
                            )}
                        </div>

                        {/* Credits Display */}
                        <div className="bg-[#F5F4F1] rounded-xl p-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#5C5C5C]">{t('profile.credits') || 'Credits'}</span>
                                <div
                                    className="flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: `${color.primary}15`, color: color.primary }}
                                >
                                    <Zap className="w-3 h-3" />
                                    {credits}
                                </div>
                            </div>
                            <div className="h-2 bg-[#E8E7E4] rounded-full overflow-hidden mb-2">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(100, (credits / (planInfo.credits || 20)) * 100)}%`,
                                        backgroundColor: color.primary
                                    }}
                                />
                            </div>
                            <p className="text-xs text-[#8C8C8C]">
                                {planInfo.name} • {credits} / {planInfo.credits || 20} {t('credits.creditsUnit') || 'credits'}
                            </p>
                        </div>

                        {/* Upgrade / Manage Plan Button */}
                        <button
                            onClick={() => onNavigate && onNavigate('pricing')}
                            className="w-full py-3 rounded-xl font-medium text-white transition-all mb-3"
                            style={{ backgroundColor: color.primary }}
                        >
                            {subscription?.plan === 'free'
                                ? (t('profile.upgrade') || 'Upgrade Plan')
                                : (t('profile.managePlan') || 'Manage Plan')
                            }
                        </button>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border-2 border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50"
                        >
                            <LogOut className="w-4 h-4" />
                            {isLoggingOut ? (t('profile.loggingOut') || 'Logging out...') : (t('profile.logout') || 'Log Out')}
                        </button>
                    </div>
                )}

                {/* Storage Management Section */}
                <div className="bg-white border border-[#E8E7E4] rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Database className="w-5 h-5" style={{ color: color.primary }} />
                        <h3 className="font-semibold text-[#1A1A1A]">{t('settings.storageManagement')}</h3>
                    </div>

                    {/* Storage Usage Display */}
                    {storageUsage && (
                        <div className="bg-[#F5F4F1] rounded-xl p-4 mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-[#5C5C5C]">{t('settings.projects')}</span>
                                <span className="font-medium">{storageUsage.projects}/{storageUsage.maxProjects}</span>
                            </div>
                            <div className="h-2 bg-[#E8E7E4] rounded-full overflow-hidden mb-3">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${storageUsage.projectsPercent}%`,
                                        backgroundColor: storageUsage.projectsPercent > 80 ? '#EF4444' : color.primary
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-[#5C5C5C]">{t('settings.photos')}</span>
                                <span className="font-medium">{storageUsage.assets}/{storageUsage.maxAssets}</span>
                            </div>
                            <div className="h-2 bg-[#E8E7E4] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${storageUsage.assetsPercent}%`,
                                        backgroundColor: storageUsage.assetsPercent > 80 ? '#EF4444' : '#059669'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Clear Projects Button */}
                    <button
                        onClick={handleClearProjects}
                        className="w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border-2 border-amber-500 text-amber-600 hover:bg-amber-50"
                    >
                        {cleared ? (
                            <>
                                <Check className="w-5 h-5" />
                                <span>{t('settings.cleared')}</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-5 h-5" />
                                <span>{t('settings.clearAllProjects')}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
