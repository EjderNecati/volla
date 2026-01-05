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
    const [garageKey, setGarageKey] = useState(0); // For re-triggering animation

    // Platform config for colors and logos
    const platformConfig = {
        etsy: { name: 'Etsy', color: 'btn-etsy', garageClass: 'platform-garage-etsy', icon: '🏪' },
        ebay: { name: 'eBay', color: 'btn-ebay', garageClass: 'platform-garage-ebay', icon: '🛒' },
        amazon: { name: 'Amazon', color: 'btn-amazon', garageClass: 'platform-garage-amazon', icon: '📦' },
        shopify: { name: 'Shopify', color: 'btn-shopify', garageClass: 'platform-garage-shopify', icon: '🛍️' },
        redbubble: { name: 'Redbubble', color: 'btn-redbubble', garageClass: 'platform-garage-redbubble', icon: '🎨' },
        depop: { name: 'Depop', color: 'btn-depop', garageClass: 'platform-garage-depop', icon: '👗' }
    };

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

    const handlePlatformChange = (platform) => {
        setActivePlatform(platform);
        setGarageKey(prev => prev + 1); // Trigger animation
    };

    return (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Top Section: Thumbnail + Data Source Badge + New Scan Button */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <img
                        src={scannedImage || "/src/assets/product_placeholder.png"}
                        alt="Scanned product"
                        className="w-14 h-14 rounded-lg object-cover border border-[#E8E7E4]"
                    />
                    {/* Live Data Badge */}
                    {isGrounded ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#BCA879]/30 rounded-md">
                            <Search className="w-3.5 h-3.5 text-[#BCA879]" />
                            <span className="text-xs font-medium text-[#BCA879]">LIVE DATA</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#6F7A6C]/30 rounded-md">
                            <Sparkles className="w-3.5 h-3.5 text-[#6F7A6C]" />
                            <span className="text-xs font-medium text-[#6F7A6C]">AI ANALYSIS</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={onNewScan}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E7E4] text-[#1A1A1A] rounded-md hover:bg-[#F5F4F1] hover:border-[#BCA879] transition-colors"
                >
                    <span className="text-sm font-medium">New Scan</span>
                </button>
            </div>

            {/* Platform Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-[#E8E7E4] pb-3">
                {platforms.map((platform) => {
                    const config = platformConfig[platform];
                    const isActive = activePlatform === platform;
                    return (
                        <button
                            key={platform}
                            onClick={() => handlePlatformChange(platform)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all uppercase text-sm tracking-wide ${isActive
                                ? 'bg-[#E06847] text-white'
                                : 'bg-white text-[#5C5C5C] hover:bg-[#F5F4F1] hover:text-[#1A1A1A] border border-[#E8E7E4]'
                                }`}
                        >
                            {platform}
                        </button>
                    );
                })}
            </div>

            {/* Platform Garage Banner */}
            <div
                key={garageKey}
                className={`platform-garage ${platformConfig[activePlatform]?.garageClass} rounded-xl p-4 flex items-center justify-center gap-3`}
            >
                <span className="text-3xl">{platformConfig[activePlatform]?.icon}</span>
                <span className="text-xl font-bold text-[#1A1A1A] font-bold uppercase tracking-wider">
                    {platformConfig[activePlatform]?.name}
                </span>
            </div>

            {/* Results Area */}
            <div className="space-y-4">

                {/* Title */}
                <div className={`card-luxury p-4 space-y-3 border-2 ${activePlatform === 'amazon' ? 'border-[#FF9900]/30' : activePlatform === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-[#1A1A1A] font-bold">
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
                            className="flex-shrink-0 p-2 rounded-md bg-white hover:bg-[#4B5046] text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors"
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
                <div className={`card-luxury p-4 space-y-3 border-2 ${activePlatform === 'amazon' ? 'border-[#FF9900]/30' : activePlatform === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[#1A1A1A] font-bold">Product Description</h3>
                        <button
                            onClick={() => copyToClipboard(currentData.description, 'description')}
                            className="flex-shrink-0 p-2 rounded-lg bg-[#222228] hover:bg-[#2A2A30] text-[#8B8B8F] hover:text-[#1A1A1A] font-bold transition-colors"
                            title="Copy description"
                        >
                            {copiedStates['description'] ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    <p className="text-sm text-[#1A1A1A] font-bold leading-relaxed whitespace-pre-line">
                        {currentData.description || "Loading..."}
                    </p>
                </div>

                {/* Keywords */}
                <div className={`card-luxury p-4 space-y-3 border-2 ${activePlatform === 'amazon' ? 'border-[#FF9900]/30' : activePlatform === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#1A1A1A] font-bold">Tags / Keywords</h3>
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
                                    className="px-3 py-1.5 bg-white hover:bg-[#F5F4F1] border border-[#E8E7E4] hover:border-[#D4C49A] rounded-lg text-xs font-medium text-[#1A1A1A] font-bold transition-colors"
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
                            <span className="text-[#6F7A6C] text-sm">No keywords generated</span>
                        )}
                    </div>

                    <button
                        onClick={() => copyToClipboard(currentData.keywords?.join(', '), 'all-keywords')}
                        className={`w-full py-3 px-4 ${platformConfig[activePlatform]?.color} text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2`}
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
                <div className={`card-luxury p-4 space-y-3 border-2 ${activePlatform === 'amazon' ? 'border-[#FF9900]/30' : activePlatform === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[#1A1A1A] font-bold">Recommended Price</h3>
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
                    <p className="text-xs text-[#5A5A5F]">
                        {currentData.data_source || `Based on ${activePlatform} market analysis`}
                    </p>
                </div>

            </div>
        </div >
    );
}
