import { useState } from 'react';
import { Copy, Check, Search, Sparkles } from 'lucide-react';

// Multi-platform listing results with tab switching and LIVE DATA indicator
export default function ListingResults({ data, scannedImage, onNewScan }) {
    const [activePlatform, setActivePlatform] = useState('etsy');
    const [copiedStates, setCopiedStates] = useState({});

    if (!data) return null;

    const platforms = ['etsy', 'ebay', 'redbubble', 'depop'];
    const currentData = data[activePlatform] || {};
    const isGrounded = data._grounded === true;

    const copyToClipboard = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedStates(prev => ({ ...prev, [id]: true }));
            setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, [id]: false }));
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Top Section: Thumbnail + Data Source Badge + New Scan Button */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <img
                        src={scannedImage || "/src/assets/product_placeholder.png"}
                        alt="Scanned product"
                        className="w-14 h-14 rounded-lg object-cover border-2 border-violet-500/50 shadow-lg"
                    />
                    {/* Live Data Badge */}
                    {isGrounded ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded-full">
                            <Search className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400">LIVE DATA</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 border border-violet-500/50 rounded-full">
                            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-xs font-bold text-violet-400">AI ANALYSIS</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={onNewScan}
                    className="flex items-center gap-2 px-4 py-2 bg-transparent border border-zinc-700 text-zinc-300 rounded-lg hover:border-violet-500 hover:text-violet-400 transition-all duration-300 hover:bg-zinc-800/50"
                >
                    <span className="text-sm font-medium">New Scan</span>
                </button>
            </div>

            {/* Platform Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
                {platforms.map((platform) => (
                    <button
                        key={platform}
                        onClick={() => setActivePlatform(platform)}
                        className={`px-4 py-2 rounded-lg font-bold transition-all uppercase text-sm tracking-wide ${activePlatform === platform
                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                    >
                        {platform}
                    </button>
                ))}
            </div>

            {/* Results Area */}
            <div className="space-y-4">

                {/* Title */}
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-violet-400">
                                Optimized Title
                            </h3>
                            {/* Character count with limit */}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${(currentData.title?.length || 0) <= (currentData._rules?.titleLimit || 140)
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                                }`}>
                                {currentData.title?.length || 0}/{currentData._rules?.titleLimit ||
                                    (activePlatform === 'ebay' ? 80 : activePlatform === 'redbubble' ? 80 : activePlatform === 'depop' ? 100 : 140)
                                } chars
                            </span>
                        </div>
                        <button
                            onClick={() => copyToClipboard(currentData.title, 'title')}
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
                        {currentData.title || "Loading..."}
                    </p>
                </div>

                {/* Description */}
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-violet-400">Product Description</h3>
                        <button
                            onClick={() => copyToClipboard(currentData.description, 'description')}
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
                        {currentData.description || "Loading..."}
                    </p>
                </div>

                {/* Keywords */}
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-violet-400">Tags / Keywords</h3>
                        {/* Keyword count with limit */}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${(currentData.keywords?.length || 0) === (currentData._rules?.keywordLimit ||
                                (activePlatform === 'etsy' ? 13 : activePlatform === 'redbubble' ? 15 : activePlatform === 'depop' ? 7 : 15))
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}>
                            {currentData.keywords?.length || 0}/{
                                currentData._rules?.keywordLimit ||
                                (activePlatform === 'etsy' ? 13 : activePlatform === 'redbubble' ? 15 : activePlatform === 'depop' ? 7 : 15)
                            } tags
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {currentData.keywords && Array.isArray(currentData.keywords) ? (
                            currentData.keywords.map((keyword, index) => (
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
                            ))
                        ) : (
                            <span className="text-zinc-500 text-sm">No keywords generated</span>
                        )}
                    </div>

                    <button
                        onClick={() => copyToClipboard(currentData.keywords?.join(', '), 'all-keywords')}
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

                {/* Price */}
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-violet-400">Recommended Price</h3>
                        {isGrounded && (
                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                                <Search className="w-3 h-3" />
                                From live listings
                            </span>
                        )}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-emerald-400">
                            {currentData.price || "$0.00 - $0.00"}
                        </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                        {currentData.data_source || `Based on ${activePlatform} market analysis`}
                    </p>
                </div>

            </div>
        </div>
    );
}
