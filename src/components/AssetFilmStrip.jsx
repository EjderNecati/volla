import React from 'react';
import { Camera, Sparkles, Users, RotateCcw } from 'lucide-react';

/**
 * Asset Film Strip Component
 * Horizontal scrollable gallery showing all generated images in the session
 * Part of the Non-Linear Multi-Asset Workflow feature
 */

const AssetFilmStrip = ({ assets, activeAssetId, onAssetClick }) => {
    if (!assets || assets.length === 0) return null;

    // Get icon and color based on asset type
    const getAssetStyle = (type) => {
        switch (type) {
            case 'ORIGINAL':
                return { icon: Camera, color: 'bg-blue-500', label: 'Orig' };
            case 'STUDIO':
                return { icon: Sparkles, color: 'bg-purple-500', label: 'Studio' };
            case 'REALLIFE':
                return { icon: Users, color: 'bg-green-500', label: 'Life' };
            case 'SHOT':
                return { icon: RotateCcw, color: 'bg-amber-500', label: 'Shot' };
            default:
                return { icon: Camera, color: 'bg-slate-500', label: '?' };
        }
    };

    return (
        <div className="w-full bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50 py-3 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Session Gallery
                </span>
                <span className="text-xs text-slate-500">
                    {assets.length} asset{assets.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Film Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
                {assets.map((asset) => {
                    const { icon: Icon, color, label } = getAssetStyle(asset.type);
                    const isActive = asset.id === activeAssetId;

                    return (
                        <button
                            key={asset.id}
                            onClick={() => onAssetClick(asset.id)}
                            className={`
                                relative flex-shrink-0 group
                                w-20 h-20 rounded-lg overflow-hidden
                                border-2 transition-all duration-200
                                ${isActive
                                    ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
                                    : 'border-slate-700 hover:border-slate-500'
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
                                px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                                ${color} text-white shadow-lg
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
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Helper Text */}
            <p className="text-[10px] text-slate-500 mt-1 text-center">
                Click any image to select it, then use the action buttons above
            </p>
        </div>
    );
};

export default AssetFilmStrip;
