import { useState } from 'react';

const platforms = ['Etsy', 'eBay', 'Redbubble', 'Depop'];

export default function PlatformSwitcher({ selectedPlatform, onPlatformChange }) {
    return (
        <div className="px-6 py-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {platforms.map((platform) => (
                    <button
                        key={platform}
                        onClick={() => onPlatformChange(platform)}
                        className={`
              px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
              transition-all duration-300 ease-out
              ${selectedPlatform === platform
                                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/50 scale-105'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                            }
            `}
                    >
                        {platform}
                    </button>
                ))}
            </div>
        </div>
    );
}
