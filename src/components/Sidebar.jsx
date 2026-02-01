import React from 'react';
import { Home, FileText, Sparkles, Clock, Settings, Zap } from 'lucide-react';
import { useTranslation } from '../i18n';
import CreditDisplay from './CreditDisplay';
import UserProfilePanel from './UserProfilePanel';

// Marketplace color configuration
const MARKETPLACE_COLORS = {
    etsy: { primary: '#F1641E', hover: '#D55419' },
    amazon: { primary: '#FF9900', hover: '#E68A00' },
    shopify: { primary: '#96BF48', hover: '#7FA03C' }
};

/**
 * Desktop Sidebar Navigation (>= 768px)
 * Dynamic colors based on selected marketplace
 */
export default function Sidebar({ activeTab, onNavigate, marketplace }) {
    const { t } = useTranslation();

    // Get marketplace-specific colors (default to Etsy orange-red)
    const color = MARKETPLACE_COLORS[marketplace] || { primary: '#E06847', hover: '#C85A3D' };

    const menuItems = [
        { id: 'home', labelKey: 'nav.home', icon: Home },
        { id: 'analysis', labelKey: 'nav.analysis', icon: FileText },
        { id: 'history', labelKey: 'nav.history', icon: Clock },
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-[#FAF9F6] border-r border-[#E8E7E4] flex flex-col z-50">
            {/* Logo + Credits */}
            <div className="p-5 border-b border-[#E8E7E4]">
                <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight font-poppins mb-2">
                    VOLLA
                </h1>
                <CreditDisplay onClick={() => onNavigate('pricing')} />
            </div>

            {/* Primary Action - Open Studio (dynamic marketplace color) */}
            <div className="p-4">
                <button
                    onClick={() => onNavigate('studio')}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all text-white hover:shadow-md"
                    style={{ backgroundColor: color.primary }}
                >
                    <Sparkles className="w-5 h-5" />
                    <span>{t('nav.openStudio')}</span>
                </button>
            </div>

            {/* Menu Links - dynamic active color */}
            <nav className="flex-1 px-3 py-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all ${isActive
                                ? 'bg-white border border-[#E8E7E4] font-medium shadow-sm'
                                : 'text-[#5C5C5C] hover:bg-white hover:border hover:border-[#E8E7E4] hover:text-[#1A1A1A]'
                                }`}
                            style={{ color: isActive ? color.primary : undefined }}
                        >
                            <Icon className="w-5 h-5" style={{ color: isActive ? color.primary : undefined }} />
                            <span>{t(item.labelKey)}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom - User Profile Panel */}
            <div className="border-t border-[#E8E7E4]">
                <UserProfilePanel marketplace={marketplace} onNavigate={onNavigate} />
            </div>
        </aside>
    );
}
