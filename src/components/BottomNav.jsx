import { useState } from 'react';
import { ScanSearch, Clock, Settings } from 'lucide-react';

const navItems = [
    { id: 'home', icon: ScanSearch, label: 'Scan' },
    { id: 'history', icon: Clock, label: 'History' },
    { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav({ activeTab, onTabChange }) {
    return (
        <nav className="sticky bottom-0 z-50 bg-[#FAF9F6]/80 backdrop-blur-lg border-t border-white">
            <div className="flex items-center justify-around px-6 py-3">
                {navItems.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className="flex flex-col items-center gap-1 min-w-[4rem] group"
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
                  w-6 h-6 transition-colors duration-300
                  ${activeTab === id
                                        ? 'text-white'
                                        : 'text-[#5C5C5C] group-hover:text-white'
                                    }
                `}
                            />
                        </div>
                        <span className={`
              text-xs font-medium transition-colors duration-300
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
