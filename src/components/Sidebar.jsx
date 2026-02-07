import React from 'react';
import { Home, FileText, Clock, FolderOpen, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useTranslation } from '../i18n';
import CreditDisplay from './CreditDisplay';
import UserProfilePanel from './UserProfilePanel';
import ModeNavSection from './sidebar/ModeNavSection';

// Marketplace color configuration
const MARKETPLACE_COLORS = {
    etsy: { primary: '#F1641E', hover: '#D55419' },
    amazon: { primary: '#FF9900', hover: '#E68A00' },
    shopify: { primary: '#96BF48', hover: '#7FA03C' }
};

/**
 * Desktop Sidebar Navigation (>= 768px)
 * Dynamic colors based on selected marketplace
 * Collapsible with mode selection icons
 */
export default function Sidebar({
    activeTab,
    onNavigate,
    marketplace,
    studioMode = 'standard',
    onModeChange,
    collapsed = false,
    onCollapsedChange
}) {
    const { t } = useTranslation();

    // Get marketplace-specific colors (default to Volla orange-red)
    const color = MARKETPLACE_COLORS[marketplace] || { primary: '#E06847', hover: '#C85A3D' };

    const menuItems = [
        { id: 'home', labelKey: 'nav.home', icon: Home },
        { id: 'analysis', labelKey: 'nav.analysis', icon: FileText },
        { id: 'history', labelKey: 'nav.history', icon: Clock },
        { id: 'library', labelKey: 'nav.library', icon: FolderOpen },
    ];

    return (
        <aside
            className={`
                fixed left-0 top-0 h-full bg-[#FAF9F6] border-r border-[#E8E7E4]
                flex flex-col z-50 transition-all duration-300
                ${collapsed ? 'w-16' : 'w-64'}
            `}
        >
            {/* Logo + Credits */}
            <div className={`border-b border-[#E8E7E4] ${collapsed ? 'px-2 py-3' : 'p-5'}`}>
                {collapsed ? (
                    <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center mx-auto">
                        <span className="text-white font-bold text-lg">V</span>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight font-poppins mb-2">
                            VOLLA
                        </h1>
                        <CreditDisplay onClick={() => onNavigate('pricing')} />
                    </>
                )}
            </div>

            {/* Mode Navigation Section */}
            <ModeNavSection
                selectedMode={studioMode}
                onModeSelect={onModeChange}
                onNavigate={onNavigate}
                collapsed={collapsed}
            />

            {/* Menu Links - dynamic active color */}
            <nav className={`flex-1 py-2 ${collapsed ? 'px-2' : 'px-3'}`}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`
                                w-full flex items-center gap-3 mb-1 rounded-xl transition-all
                                ${collapsed ? 'p-2.5 justify-center' : 'px-4 py-3'}
                                ${isActive
                                    ? 'bg-white border border-[#E8E7E4] font-medium shadow-sm'
                                    : 'text-[#5C5C5C] hover:bg-white hover:border hover:border-[#E8E7E4] hover:text-[#1A1A1A]'
                                }
                            `}
                            style={{ color: isActive ? color.primary : undefined }}
                            title={collapsed ? t(item.labelKey) : undefined}
                        >
                            <Icon
                                className={collapsed ? 'w-5 h-5' : 'w-5 h-5'}
                                style={{ color: isActive ? color.primary : undefined }}
                            />
                            {!collapsed && <span>{t(item.labelKey)}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Collapse Toggle Button */}
            {onCollapsedChange && (
                <div className={`border-t border-[#E8E7E4] ${collapsed ? 'p-2' : 'px-3 py-2'}`}>
                    <button
                        onClick={() => onCollapsedChange(!collapsed)}
                        className={`
                            w-full flex items-center gap-2 rounded-xl py-2.5 text-[#8C8C8C]
                            hover:bg-[#F5F4F1] hover:text-[#5C5C5C] transition-all
                            ${collapsed ? 'justify-center px-2.5' : 'px-4'}
                        `}
                        title={collapsed ? t('sidebar.expand') || 'Expand' : t('sidebar.collapse') || 'Collapse'}
                    >
                        {collapsed ? (
                            <PanelLeft className="w-5 h-5" />
                        ) : (
                            <>
                                <PanelLeftClose className="w-5 h-5" />
                                <span className="text-sm">{t('sidebar.collapse') || 'Collapse'}</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Bottom - User Profile Panel */}
            <div className="border-t border-[#E8E7E4]">
                <UserProfilePanel
                    marketplace={marketplace}
                    onNavigate={onNavigate}
                    collapsed={collapsed}
                    onExpandSidebar={collapsed && onCollapsedChange ? () => onCollapsedChange(false) : undefined}
                />
            </div>
        </aside>
    );
}
