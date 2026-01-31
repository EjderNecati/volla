import { Home, BarChart2, Clock, Settings, Sparkles } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange }) {
    const leftItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'analysis', icon: BarChart2, label: 'Analysis' },
    ];

    const rightItems = [
        { id: 'history', icon: Clock, label: 'History' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <nav className="sticky bottom-0 z-50 bg-[#FAF9F6] border-t border-gray-200">
            <div className="flex items-end justify-around px-2 py-2">
                {/* Left items */}
                {leftItems.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className="flex flex-col items-center gap-0.5 min-w-[50px]"
                    >
                        <Icon
                            className={`w-5 h-5 ${activeTab === id ? 'text-orange-500' : 'text-gray-400'
                                }`}
                        />
                        <span className={`text-[10px] ${activeTab === id ? 'text-orange-500' : 'text-gray-400'
                            }`}>
                            {label}
                        </span>
                    </button>
                ))}

                {/* Center AI Studio button - large orange circle */}
                <button
                    onClick={() => onTabChange('studio')}
                    className="relative -mt-4 flex flex-col items-center"
                >
                    <div className={`
                        w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
                        ${activeTab === 'studio'
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/40'
                            : 'bg-gradient-to-br from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600'
                        }
                    `}>
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                </button>

                {/* Right items */}
                {rightItems.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className="flex flex-col items-center gap-0.5 min-w-[50px]"
                    >
                        <Icon
                            className={`w-5 h-5 ${activeTab === id ? 'text-orange-500' : 'text-gray-400'
                                }`}
                        />
                        <span className={`text-[10px] ${activeTab === id ? 'text-orange-500' : 'text-gray-400'
                            }`}>
                            {label}
                        </span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
