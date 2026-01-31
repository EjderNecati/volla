import React from 'react';
import { Camera, Sparkles, Users, RotateCcw } from 'lucide-react';
import { useTranslation } from '../i18n';

/**
 * Asset Film Strip Component
 * Grid gallery showing all generated images in the session
 * Wraps to new row after 8 images for better visibility
 * Part of the Non-Linear Multi-Asset Workflow feature
 */

const AssetFilmStrip = ({ assets, activeAssetId, onAssetClick }) => {
    const { t } = useTranslation();

    if (!assets || assets.length === 0) return null;

    // Get icon and style based on asset type - matte colors
    const getAssetStyle = (type) => {
        switch (type) {
            case 'ORIGINAL':
                return { icon: Camera, color: 'bg-[#E8E7E4]', label: t('filmStrip.original') || 'Orig' };
            case 'STUDIO':
                return { icon: Sparkles, color: 'bg-[#E06847]', label: t('filmStrip.studio') || 'Studio' };
            case 'REALLIFE':
                return { icon: Users, color: 'bg-emerald-600', label: t('filmStrip.realLife') || 'Life' };
            case 'SHOT':
                return { icon: RotateCcw, color: 'bg-[#8C8C8C]', label: t('filmStrip.shot') || 'Shot' };
            default:
                return { icon: Camera, color: 'bg-[#E8E7E4]', label: '?' };
        }
    };

    return (
        <div className="w-full bg-[#F5F4F1] border-t border-[#E8E7E4] py-3 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#8C8C8C] uppercase tracking-wider">
                    {t('filmStrip.sessionGallery') || 'Session Gallery'}
                </span>
                <span className="text-xs text-[#8C8C8C]">
                    {assets.length} {t('filmStrip.assets') || 'assets'}
                </span>
            </div>

            {/* Film Strip - Grid with max 8 per row */}
            <div className="grid grid-cols-8 gap-2">
                {assets.map((asset) => {
                    const { icon: Icon, color, label } = getAssetStyle(asset.type);
                    const isActive = asset.id === activeAssetId;

                    return (
                        <button
                            key={asset.id}
                            onClick={() => onAssetClick(asset.id)}
                            className={`
                                relative flex-shrink-0 group
                                w-20 h-20 rounded-md overflow-hidden
                                border transition-all duration-150
                                ${isActive
                                    ? 'border-white ring-1 ring-white/20'
                                    : 'border-zinc-700 hover:border-[#8C8C8C]'
                                }
                            `}
                        >
                            {/* Thumbnail Image */}
                            <img
                                src={asset.url || asset.imageData}
                                alt={asset.label}
                                className="w-full h-full object-cover"
                            />

                            {/* Type Badge */}
                            <div className={`
                                absolute top-1 left-1 
                                px-1.5 py-0.5 rounded text-[9px] font-medium uppercase
                                ${color} text-white
                            `}>
                                {label}
                            </div>

                            {/* Hover Overlay */}
                            <div className={`
                                absolute inset-0 bg-black/40 
                                flex items-center justify-center
                                transition-opacity
                                ${isActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}
                            `}>
                                <Icon size={20} className="text-white" />
                            </div>

                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Helper Text */}
            <p className="text-[10px] text-[#8C8C8C] mt-2 text-center">
                {t('filmStrip.helperText') || 'Click any image to select it'}
            </p>
        </div>
    );
};

export default AssetFilmStrip;
