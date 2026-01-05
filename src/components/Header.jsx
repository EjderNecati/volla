import { Sparkles } from 'lucide-react';

export default function Header() {
    return (
        <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#FAF9F6]/80 backdrop-blur-lg border-b border-[#E8E7E4]">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-violet-500" />
                <h1 className="text-xl font-bold text-white">Volla</h1>
            </div>

            {/* PRO Badge */}
            <div className="relative">
                <div className="px-3 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/50">
                    PRO
                </div>
            </div>
        </header>
    );
}
