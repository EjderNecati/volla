import { Home, BarChart2, Clock, Settings, Sparkles, Zap, Video, Palette } from 'lucide-react';
import { useTranslation } from '../i18n';

// Marketplace color configuration
const MARKETPLACE_COLORS = {
    etsy: { primary: '#F1641E', gradient: 'from-[#F1641E] to-[#D55419]' },
    amazon: { primary: '#FF9900', gradient: 'from-[#FF9900] to-[#E68A00]' },
    shopify: { primary: '#96BF48', gradient: 'from-[#96BF48] to-[#7FA03C]' }
};

// Mode gradients for studio button
const MODE_GRADIENTS = {
    standard: 'from-[#E06847] to-[#C85A3D]',
    handsfree: 'from-cyan-500 to-blue-500',
    motion: 'from-violet-500 to-purple-500',
    creative: 'from-pink-500 to-rose-500'
};

// Mode icons
const MODE_ICONS = {
    standard: Sparkles,
    handsfree: Zap,
    motion: Video,
    creative: Palette
};

export default function BottomNav({
    activeTab,
    onTabChange,
    marketplace = 'etsy',
    studioMode = 'standard',
    onModeChange
}) {
    const { t } = useTranslation();

    // Get marketplace color
    const marketplaceColor = MARKETPLACE_COLORS[marketplace] || MARKETPLACE_COLORS.etsy;

    // Get mode gradient and icon
    const modeGradient = MODE_GRADIENTS[studioMode] || MODE_GRADIENTS.standard;
    const ModeIcon = MODE_ICONS[studioMode] || Sparkles;

    const leftItems = [
        { id: 'home', icon: Home, labelKey: 'nav.home' },
        { id: 'analysis', icon: BarChart2, labelKey: 'nav.analysis' },
    ];

    const rightItems = [
        { id: 'history', icon: Clock, labelKey: 'nav.history' },
        { id: 'settings', icon: Settings, labelKey: 'nav.settings' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#FAF9F6] border-t border-[#E8E7E4]">
            <div className="flex items-end justify-around px-2 py-2">
                {/* Left items */}
                {leftItems.map(({ id, icon: Icon, labelKey }) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onTabChange(id)}
                            className="flex flex-col items-center gap-0.5 min-w-[50px]"
                        >
                            <Icon
                                className="w-5 h-5 transition-colors"
                                style={{ color: isActive ? marketplaceColor.primary : '#9CA3AF' }}
                            />
                            <span
                                className="text-[10px] transition-colors"
                                style={{ color: isActive ? marketplaceColor.primary : '#9CA3AF' }}
                            >
                                {t(labelKey) || id}
                            </span>
                        </button>
                    );
                })}

                {/* Center AI Studio button - mode-aware gradient */}
                <button
                    onClick={() => onTabChange('studio')}
                    className="relative -mt-4 flex flex-col items-center"
                >
                    <div className={`
                        w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
                        bg-gradient-to-br ${modeGradient}
                        ${activeTab === 'studio' ? 'shadow-lg scale-105' : 'hover:scale-105'}
                    `}>
                        <ModeIcon className="w-6 h-6 text-white" />
                    </div>
                    {/* Mode indicator dot */}
                    {studioMode !== 'standard' && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-medium text-[#5C5C5C] bg-white px-1.5 py-0.5 rounded shadow-sm">
                            {t(`modes.${studioMode}`) || studioMode}
                        </div>
                    )}
                </button>

                {/* Right items */}
                {rightItems.map(({ id, icon: Icon, labelKey }) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onTabChange(id)}
                            className="flex flex-col items-center gap-0.5 min-w-[50px]"
                        >
                            <Icon
                                className="w-5 h-5 transition-colors"
                                style={{ color: isActive ? marketplaceColor.primary : '#9CA3AF' }}
                            />
                            <span
                                className="text-[10px] transition-colors"
                                style={{ color: isActive ? marketplaceColor.primary : '#9CA3AF' }}
                            >
                                {t(labelKey) || id}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
