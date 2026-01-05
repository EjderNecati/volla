import React from 'react';
import { Sparkles, Users, RotateCcw, RefreshCw, Loader2 } from 'lucide-react';

/**
 * Dynamic Action Bar Component
 * Shows context-aware buttons based on the currently active asset type
 * Part of the Non-Linear Multi-Asset Workflow feature
 */

const DynamicActionBar = ({
    activeAssetType,
    onGenerateStudio,
    onGenerateRealLife,
    onGenerateShots,
    isStudioLoading,
    isRealLifeLoading,
    isShotsLoading,
    studioModeEnabled // For ORIGINAL: Check if studio mode toggle is on
}) => {

    // Define button configurations based on asset type
    const getButtonConfig = () => {
        switch (activeAssetType) {
            case 'ORIGINAL':
                return [
                    {
                        id: 'studio',
                        label: 'Generate AI Studio',
                        shortLabel: 'AI Studio',
                        icon: Sparkles,
                        onClick: onGenerateStudio,
                        loading: isStudioLoading,
                        color: 'bg-[#E06847] hover:bg-[#C85A3D]',
                        visible: true,
                        description: 'Professional studio background'
                    },
                    {
                        id: 'reallife',
                        label: 'Generate Real Life',
                        shortLabel: 'Real Life',
                        icon: Users,
                        onClick: onGenerateRealLife,
                        loading: isRealLifeLoading,
                        color: 'bg-emerald-600 hover:bg-emerald-500',
                        visible: true,
                        description: 'Lifestyle photos with models'
                    }
                ];

            case 'STUDIO':
                return [
                    {
                        id: 'shots',
                        label: 'Get 3 Angles',
                        shortLabel: '3 Shots',
                        icon: RotateCcw,
                        onClick: onGenerateShots,
                        loading: isShotsLoading,
                        color: 'bg-[#E8E7E4] hover:bg-[#8C8C8C]',
                        visible: true,
                        description: 'Multi-angle product shots'
                    },
                    {
                        id: 'reallife',
                        label: 'Generate Real Life',
                        shortLabel: 'Real Life',
                        icon: Users,
                        onClick: onGenerateRealLife,
                        loading: isRealLifeLoading,
                        color: 'from-green-600 to-emerald-700',
                        visible: true,
                        description: 'Lifestyle photos from studio'
                    }
                ];

            case 'REALLIFE':
                return [
                    {
                        id: 'shots',
                        label: 'Get 3 Angles',
                        shortLabel: '3 Shots',
                        icon: RotateCcw,
                        onClick: onGenerateShots,
                        loading: isShotsLoading,
                        color: 'from-amber-600 to-orange-700',
                        visible: true,
                        description: 'Rotate this lifestyle scene'
                    },
                    {
                        id: 'more-reallife',
                        label: 'More Real Life',
                        shortLabel: 'More Scene',
                        icon: RefreshCw,
                        onClick: onGenerateRealLife,
                        loading: isRealLifeLoading,
                        color: 'from-green-600 to-emerald-700',
                        visible: true,
                        description: 'Generate different scenes'
                    }
                ];

            case 'SHOT':
                return [
                    {
                        id: 'reallife',
                        label: 'Move to Real Life',
                        shortLabel: 'Real Life',
                        icon: Users,
                        onClick: onGenerateRealLife,
                        loading: isRealLifeLoading,
                        color: 'from-green-600 to-emerald-700',
                        visible: true,
                        description: 'Add lifestyle context'
                    },
                    {
                        id: 'more-shots',
                        label: 'More Angles',
                        shortLabel: 'More Shots',
                        icon: RotateCcw,
                        onClick: onGenerateShots,
                        loading: isShotsLoading,
                        color: 'from-amber-600 to-orange-700',
                        visible: true,
                        description: 'Generate different angles'
                    }
                ];

            default:
                return [];
        }
    };

    const buttons = getButtonConfig().filter(btn => btn.visible);

    if (buttons.length === 0) return null;

    return (
        <div className="w-full py-4 px-4 bg-[#F5F4F1] border-t border-b border-white">
            {/* Context Label */}
            <div className="text-center mb-3">
                <span className="text-xs text-[#8C8C8C] uppercase tracking-wider">
                    Actions for: <span className="text-[#1A1A1A] font-medium">{activeAssetType || 'None'}</span>
                </span>
            </div>

            {/* Button Grid */}
            <div className="flex gap-3 justify-center flex-wrap">
                {buttons.map((btn) => {
                    const Icon = btn.icon;
                    return (
                        <button
                            key={btn.id}
                            onClick={btn.onClick}
                            disabled={btn.loading}
                            className={`
                                relative group flex items-center gap-2
                                px-5 py-3 rounded-md
                                ${btn.color}
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-colors
                                text-white font-medium
                            `}
                        >
                            {btn.loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Icon size={18} />
                            )}
                            <span className="hidden sm:inline">{btn.label}</span>
                            <span className="sm:hidden">{btn.shortLabel}</span>

                            {/* Tooltip */}
                            <div className="
                                absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                px-2 py-1 rounded text-xs bg-white border border-[#E8E7E4] text-[#1A1A1A]
                                opacity-0 group-hover:opacity-100 transition-opacity
                                pointer-events-none whitespace-nowrap
                            ">
                                {btn.description}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default DynamicActionBar;
