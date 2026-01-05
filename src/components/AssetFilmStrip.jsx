import React from 'react';
import { Camera, Sparkles, Users, RotateCcw } from 'lucide-react';

/**
 * Asset Film Strip Component
 * Horizontal scrollable gallery showing all generated images in the session
 * Part of the Non-Linear Multi-Asset Workflow feature
 */

const AssetFilmStrip = ({ assets, activeAssetId, onAssetClick }) => {
    if (!assets || assets.length === 0) return null;

    // Get icon and style based on asset type - matte colors
    const getAssetStyle = (type) => {
        switch (type) {
            case 'ORIGINAL':
                return { icon: Camera, color: 'bg-[#E8E7E4]', label: 'Orig' };
            case 'STUDIO':
                return { icon: Sparkles, color: 'bg-[#E06847]', label: 'Studio' };
            case 'REALLIFE':
                return { icon: Users, color: 'bg-emerald-600', label: 'Life' };
            case 'SHOT':
                return { icon: RotateCcw, color: 'bg-[#8C8C8C]', label: 'Shot' };
            default:
                return { icon: Camera, color: 'bg-[#E8E7E4]', label: '?' };
        }
    };

    return (
        <div className="w-full bg-[#F5F4F1] border-t border-[#E8E7E4] py-3 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#8C8C8C] uppercase tracking-wider">
                    Session Gallery
                </span>
                <span className="text-xs text-[#E8E7E4]">
                    {assets.length} asset{assets.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Film Strip */}
            <div className="flex gap-3 overflow-x-auto pb-2">
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
                                src={asset.imageData}
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
            <p className="text-[10px] text-[#E8E7E4] mt-1 text-center">
                Click any image to select it, then use the action buttons above
            </p>
        </div>
    );
};

export default AssetFilmStrip;
