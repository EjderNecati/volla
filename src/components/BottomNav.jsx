import { useState } from 'react';
import { ScanSearch, Clock, Settings, Sparkles } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange }) {
    const leftItems = [
        { id: 'home', icon: ScanSearch, label: 'Scan' },
        { id: 'history', icon: Clock, label: 'History' },
    ];

    const rightItems = [
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <nav className="sticky bottom-0 z-50 bg-[#FAF9F6]/80 backdrop-blur-lg border-t border-white">
            <div className="flex items-center justify-around px-4 py-2">
                {/* Left items */}
                {leftItems.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className="flex flex-col items-center gap-1 min-w-[3.5rem] group"
                    >
                        <div className={`
                            p-2 rounded-xl transition-all duration-300
                            ${activeTab === id
                                ? 'bg-violet-500 shadow-lg shadow-violet-500/50'
                                : 'bg-transparent group-hover:bg-white'
                            }
                        `}>
                            <Icon
                                className={`
                                    w-5 h-5 transition-colors duration-300
                                    ${activeTab === id
                                        ? 'text-white'
                                        : 'text-[#5C5C5C] group-hover:text-violet-500'
                                    }
                                `}
                            />
                        </div>
                        <span className={`
                            text-[10px] font-medium transition-colors duration-300
                            ${activeTab === id
                                ? 'text-violet-400'
                                : 'text-[#8C8C8C] group-hover:text-[#5C5C5C]'
                            }
                        `}>
                            {label}
                        </span>
                    </button>
                ))}

                {/* Center AI Studio button - raised and circular */}
                <button
                    onClick={() => onTabChange('studio')}
                    className="relative -mt-6 flex flex-col items-center"
                >
                    <div className={`
                        w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
                        ${activeTab === 'studio'
                            ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/50'
                            : 'bg-gradient-to-br from-violet-400 to-purple-500 hover:from-violet-500 hover:to-purple-600'
                        }
                    `}>
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className={`
                        text-[10px] font-medium mt-1 transition-colors duration-300
                        ${activeTab === 'studio'
                            ? 'text-violet-500'
                            : 'text-[#8C8C8C]'
                        }
                    `}>
                        AI Studio
                    </span>
                </button>

                {/* Right items */}
                {rightItems.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className="flex flex-col items-center gap-1 min-w-[3.5rem] group"
                    >
                        <div className={`
                            p-2 rounded-xl transition-all duration-300
                            ${activeTab === id
                                ? 'bg-violet-500 shadow-lg shadow-violet-500/50'
                                : 'bg-transparent group-hover:bg-white'
                            }
                        `}>
                            <Icon
                                className={`
                                    w-5 h-5 transition-colors duration-300
                                    ${activeTab === id
                                        ? 'text-white'
                                        : 'text-[#5C5C5C] group-hover:text-violet-500'
                                    }
                                `}
                            />
                        </div>
                        <span className={`
                            text-[10px] font-medium transition-colors duration-300
                            ${activeTab === id
                                ? 'text-violet-400'
                                : 'text-[#8C8C8C] group-hover:text-[#5C5C5C]'
                            }
                        `}>
                            {label}
                        </span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
