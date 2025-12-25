import { useState } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';

// NO MORE MOCK DATA - Use props from App.jsx
export default function ResultsScreen({ selectedPlatform, onNewScan, results, scannedImage }) {
    const [copiedStates, setCopiedStates] = useState({});

    // Use results from props (passed from App.jsx after API call)
    const displayResults = results || {
        title: "Loading...",
        description: "Loading...",
        keywords: [],
        priceRange: "$0.00 - $0.00"
    };

    const copyToClipboard = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedStates(prev => ({ ...prev, [id]: true }));

            // Reset after 2 seconds
            setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, [id]: false }));
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const copyAllKeywords = () => {
        const allKeywords = displayResults.keywords.join(', ');
        copyToClipboard(allKeywords, 'all-keywords');
    };

    return (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Top Section: Thumbnail + New Scan Button */}
            <div className="flex items-center justify-between gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                    <img
                        src={scannedImage || "/src/assets/product_placeholder.png"}
                        alt="Scanned product"
                        className="w-16 h-16 rounded-lg object-cover border-2 border-violet-500/50 shadow-lg"
                    />
                </div>

                {/* New Scan Button */}
                <button
                    onClick={onNewScan}
                    className="flex items-center gap-2 px-4 py-2 bg-transparent border border-zinc-700 text-zinc-300 rounded-lg hover:border-violet-500 hover:text-violet-400 transition-all duration-300 hover:bg-zinc-800/50"
                >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-sm font-medium">New Scan</span>
                </button>
            </div>

            {/* Card 1: Optimized Title */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-violet-400">Title for {selectedPlatform}</h3>
                    <button
                        onClick={() => copyToClipboard(displayResults.title, 'title')}
                        className="flex-shrink-0 p-2 rounded-lg bg-zinc-800 hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400 transition-all duration-300"
                        title="Copy title"
                    >
                        {copiedStates['title'] ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </button>
                </div>
                <p className="text-sm text-white leading-relaxed">
                    {displayResults.title}
                </p>
            </div>

            {/* Card 2: Product Description */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-violet-400">Product Description</h3>
                    <button
                        onClick={() => copyToClipboard(displayResults.description, 'description')}
                        className="flex-shrink-0 p-2 rounded-lg bg-zinc-800 hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400 transition-all duration-300"
                        title="Copy description"
                    >
                        {copiedStates['description'] ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </button>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                    {displayResults.description}
                </p>
            </div>

            {/* Card 3: Keywords */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-violet-400">Hidden Keywords</h3>

                {/* Keyword Tags */}
                <div className="flex flex-wrap gap-2">
                    {displayResults.keywords.map((keyword, index) => (
                        <button
                            key={index}
                            onClick={() => copyToClipboard(keyword, `keyword-${index}`)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-violet-500/20 border border-zinc-700 hover:border-violet-500/50 rounded-full text-xs font-medium text-zinc-300 hover:text-violet-300 transition-all duration-300 hover:scale-105"
                        >
                            {copiedStates[`keyword-${index}`] ? (
                                <span className="flex items-center gap-1 text-emerald-400">
                                    <Check className="w-3 h-3" />
                                    {keyword}
                                </span>
                            ) : (
                                keyword
                            )}
                        </button>
                    ))}
                </div>

                {/* Copy All Button */}
                <button
                    onClick={copyAllKeywords}
                    className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg shadow-violet-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-violet-500/50 flex items-center justify-center gap-2"
                >
                    {copiedStates['all-keywords'] ? (
                        <>
                            <Check className="w-5 h-5" />
                            Keywords Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-5 h-5" />
                            COPY ALL KEYWORDS
                        </>
                    )}
                </button>
            </div>

            {/* Card 3: Pricing Strategy */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-violet-400">Estimated Price</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-emerald-400">
                        {displayResults.priceRange}
                    </span>
                </div>
                <p className="text-xs text-zinc-500">
                    Based on current {selectedPlatform} market trends and competition analysis
                </p>
            </div>
        </div>
    );
}
