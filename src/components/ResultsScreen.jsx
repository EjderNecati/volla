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
                        className="w-16 h-16 rounded-lg object-cover border border-[#E8E7E4]"
                    />
                </div>

                {/* New Scan Button */}
                <button
                    onClick={onNewScan}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E7E4] text-[#1A1A1A] rounded-md hover:bg-[#E8E7E4] hover:border-[#E8E7E4] transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-sm font-medium">New Scan</span>
                </button>
            </div>

            {/* Card 1: Optimized Title */}
            <div className="bg-[#F5F4F1] border border-white rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#1A1A1A]">Title for {selectedPlatform}</h3>
                    <button
                        onClick={() => copyToClipboard(displayResults.title, 'title')}
                        className="flex-shrink-0 p-2 rounded-md bg-white hover:bg-[#E8E7E4] text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors"
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
            <div className="bg-[#F5F4F1] border border-white rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#1A1A1A]">Product Description</h3>
                    <button
                        onClick={() => copyToClipboard(displayResults.description, 'description')}
                        className="flex-shrink-0 p-2 rounded-md bg-white hover:bg-[#E8E7E4] text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors"
                        title="Copy description"
                    >
                        {copiedStates['description'] ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </button>
                </div>
                <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-line">
                    {displayResults.description}
                </p>
            </div>

            {/* Card 3: Keywords */}
            <div className="bg-[#F5F4F1] border border-white rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Hidden Keywords</h3>

                {/* Keyword Tags */}
                <div className="flex flex-wrap gap-2">
                    {displayResults.keywords.map((keyword, index) => (
                        <button
                            key={index}
                            onClick={() => copyToClipboard(keyword, `keyword-${index}`)}
                            className="px-3 py-1.5 bg-white hover:bg-[#E8E7E4] border border-[#E8E7E4] hover:border-[#E8E7E4] rounded-md text-xs font-medium text-[#1A1A1A] hover:text-zinc-100 transition-colors"
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
                    className="w-full py-3 px-4 bg-[#E06847] hover:bg-[#C85A3D] text-white font-semibold rounded-md transition-colors flex items-center justify-center gap-2"
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
            <div className="bg-[#F5F4F1] border border-white rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Estimated Price</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-emerald-400">
                        {displayResults.priceRange}
                    </span>
                </div>
                <p className="text-xs text-[#8C8C8C]">
                    Based on current {selectedPlatform} market trends and competition analysis
                </p>
            </div>
        </div>
    );
}
