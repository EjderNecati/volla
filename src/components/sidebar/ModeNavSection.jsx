import React, { useState } from 'react';
import { Sparkles, Zap, Video, Palette } from 'lucide-react';
import { useTranslation } from '../../i18n';

/**
 * ModeNavSection - Sidebar'da mod seçimi için ikonlar
 * 4 mod: Studio (standard), Handsfree, Motion, Creative
 */

const MODES = [
    {
        id: 'standard',
        icon: Sparkles,
        gradient: 'from-[#E06847] to-[#C85A3D]',
        hoverBg: 'linear-gradient(135deg, #E06847, #C85A3D)',
        hoverGlow: '0 0 20px rgba(224,104,71,0.3)'
    },
    {
        id: 'handsfree',
        icon: Zap,
        gradient: 'from-cyan-500 to-blue-500',
        hoverBg: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
        hoverGlow: '0 0 20px rgba(6,182,212,0.3)'
    },
    {
        id: 'motion',
        icon: Video,
        gradient: 'from-violet-500 to-purple-500',
        hoverBg: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
        hoverGlow: '0 0 20px rgba(139,92,246,0.3)'
    },
    {
        id: 'creative',
        icon: Palette,
        gradient: 'from-pink-500 to-rose-500',
        hoverBg: 'linear-gradient(135deg, #ec4899, #f43f5e)',
        hoverGlow: '0 0 20px rgba(236,72,153,0.3)'
    }
];

export default function ModeNavSection({
    selectedMode,
    onModeSelect,
    onNavigate,
    collapsed = false
}) {
    const { t } = useTranslation();
    const [hoveredMode, setHoveredMode] = useState(null);

    const handleModeClick = (modeId) => {
        if (onModeSelect) {
            onModeSelect(modeId);
        }
        if (onNavigate) {
            onNavigate('studio');
        }
    };

    return (
        <div className={`${collapsed ? 'px-2' : 'px-4'} py-3 border-b border-[#E8E7E4]`}>
            {!collapsed && (
                <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider mb-3">
                    {t('sidebar.modes') || 'Studio Modes'}
                </p>
            )}

            <div className={collapsed ? 'flex flex-col items-center space-y-2' : 'grid grid-cols-2 gap-2'}>
                {MODES.map((mode) => {
                    const Icon = mode.icon;
                    const isActive = selectedMode === mode.id;
                    const isHovered = hoveredMode === mode.id;

                    return (
                        <button
                            key={mode.id}
                            onClick={() => handleModeClick(mode.id)}
                            onMouseEnter={() => setHoveredMode(mode.id)}
                            onMouseLeave={() => setHoveredMode(null)}
                            className={`
                                relative group flex items-center gap-2 rounded-xl transition-all duration-300
                                ${collapsed ? 'w-10 h-10 justify-center' : 'p-3'}
                                ${isActive ? 'shadow-lg' : ''}
                            `}
                            style={{
                                background: isActive
                                    ? mode.hoverBg
                                    : isHovered
                                        ? mode.hoverBg
                                        : '#F5F4F1',
                                color: isActive || isHovered ? 'white' : '#5C5C5C',
                                boxShadow: isHovered && !isActive ? mode.hoverGlow : undefined
                            }}
                            title={collapsed ? t(`modes.${mode.id}`) || mode.id : undefined}
                        >
                            <Icon className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />

                            {!collapsed && (
                                <span className="text-xs font-medium truncate">
                                    {t(`modes.${mode.id}`) || mode.id}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
