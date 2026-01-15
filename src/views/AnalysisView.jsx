import React, { useState, useEffect } from 'react';
import {
    FileText, Wand2, Search, Tag, DollarSign,
    AlignLeft, Loader2, Copy, Check, Store, ShoppingBag, ShoppingCart
} from 'lucide-react';
import { analyzeText } from '../utils/aiHelpers';
import { saveProject, createProject } from '../utils/projectManager';
import { useTranslation } from '../i18n';

// Marketplace configuration
const MARKETPLACE_COLORS = {
    etsy: { primary: '#F1641E', hover: '#D55419', text: 'white', icon: Store, placeholder: 'https://www.etsy.com/listing/...' },
    amazon: { primary: '#FF9900', hover: '#E68A00', text: 'black', icon: ShoppingBag, placeholder: 'https://www.amazon.com/dp/...' },
    shopify: { primary: '#96BF48', hover: '#7FA03C', text: 'white', icon: ShoppingCart, placeholder: 'https://yourstore.myshopify.com/products/...' }
};

/**
 * AnalysisView - Text-Only SEO Tool
 * 
 * Features:
 * - Marketplace selector with dynamic colors
 * - Dynamic placeholder for reference link
 * - Platform-specific SEO optimization
 * - Auto-saves results to Project Library
 */
export default function AnalysisView({ marketplace: propMarketplace, onMarketplaceSelect }) {
    // Form State
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [referenceLink, setReferenceLink] = useState('');
    const [localMarketplace, setLocalMarketplace] = useState(propMarketplace || 'etsy');

    // Use prop marketplace if available
    const marketplace = propMarketplace || localMarketplace;
    const getColor = () => MARKETPLACE_COLORS[marketplace] || MARKETPLACE_COLORS.etsy;

    // API & Results State
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);
    const [copiedField, setCopiedField] = useState(null);
    const [saved, setSaved] = useState(false);
    const { t } = useTranslation();

    // Load API key
    useEffect(() => {
        const saved = localStorage.getItem('volla_api_key') || '';
        setApiKey(saved);
    }, []);

    // Handle marketplace change
    const handleMarketplaceChange = (mp) => {
        setLocalMarketplace(mp);
        if (onMarketplaceSelect) onMarketplaceSelect(mp);
    };

    // Save text analysis as project
    const saveTextProject = async (analysisResult) => {
        try {
            // Create a text-based project (no image, just SEO results)
            const project = createProject(
                analysisResult?.title || productName || 'Text Analysis',
                marketplace,
                null, // No original image for text analysis
                [
                    {
                        id: `text_${Date.now()}`,
                        type: 'TEXT',
                        url: null,
                        label: 'Text Analysis',
                        inputText: `${productName}\n${productDescription}`
                    }
                ],
                analysisResult,
                { source: 'text', productName, productDescription }
            );

            await saveProject(project);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            console.log('✅ Text analysis saved to project library');
        } catch (err) {
            console.error('Failed to save text project:', err);
        }
    };

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!productName.trim()) {
            setError('Please enter a product name');
            return;
        }

        // API key is now handled by backend via environment variables

        setError(null);
        setLoading(true);

        try {
            const inputText = `
Product Name: ${productName}
${productDescription ? `Description: ${productDescription}` : ''}
${referenceLink ? `Reference Link: ${referenceLink}` : ''}
            `.trim();

            const result = await analyzeText(inputText, marketplace, apiKey);
            setResults(result);

            // Auto-save to project library
            await saveTextProject(result);
        } catch (err) {
            setError(err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    // Copy to clipboard
    const handleCopy = (text, fieldName) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Reset form
    const handleReset = () => {
        setProductName('');
        setProductDescription('');
        setReferenceLink('');
        setResults(null);
        setError(null);
    };

    const color = getColor();

    return (
        <div className="min-h-screen bg-[#FAF9F6] p-6 md:p-10 font-poppins">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-8 h-8" style={{ color: color.primary }} />
                        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                            {t('analysis.title')}
                        </h1>
                    </div>
                    <p className="text-[#5C5C5C]">
                        {t('analysis.subtitle')}
                    </p>
                </div>

                {/* Results View */}
                {results ? (
                    <div className="space-y-6">
                        {/* Success Header */}
                        <div
                            className="rounded-xl p-4 flex items-center gap-3"
                            style={{ backgroundColor: color.primary + '15', border: `1px solid ${color.primary}40` }}
                        >
                            <Check className="w-5 h-5" style={{ color: color.primary }} />
                            <span className="font-medium" style={{ color: color.primary }}>
                                {t('analysis.analysisCompleteFor', { marketplace: marketplace.toUpperCase() })}
                            </span>
                        </div>

                        {/* Result Cards */}
                        <div className="grid gap-4">
                            {/* SEO Title */}
                            <ResultCard
                                icon={<Search className="w-5 h-5" />}
                                title="SEO Title"
                                content={results.title}
                                onCopy={() => handleCopy(results.title, 'title')}
                                copied={copiedField === 'title'}
                                accent={color.primary}
                            />

                            {/* Keywords */}
                            <ResultCard
                                icon={<Tag className="w-5 h-5" />}
                                title="Keywords"
                                content={
                                    Array.isArray(results.keywords)
                                        ? results.keywords.join(', ')
                                        : results.keywords || results.search_terms
                                }
                                onCopy={() => handleCopy(
                                    Array.isArray(results.keywords)
                                        ? results.keywords.join(', ')
                                        : results.keywords || results.search_terms,
                                    'keywords'
                                )}
                                copied={copiedField === 'keywords'}
                                accent="#5C5C5C"
                            />

                            {/* Pricing Strategy */}
                            <ResultCard
                                icon={<DollarSign className="w-5 h-5" />}
                                title="Pricing Strategy"
                                content={results.price || 'No pricing data available'}
                                onCopy={() => handleCopy(results.price, 'price')}
                                copied={copiedField === 'price'}
                                accent="#059669"
                            />

                            {/* Description */}
                            <ResultCard
                                icon={<AlignLeft className="w-5 h-5" />}
                                title="Optimized Description"
                                content={results.description || results.html_description}
                                onCopy={() => handleCopy(results.description || results.html_description, 'description')}
                                copied={copiedField === 'description'}
                                accent="#8C8C8C"
                                large
                            />

                            {/* Amazon-specific: Bullets */}
                            {marketplace === 'amazon' && results.bullets && (
                                <ResultCard
                                    icon={<AlignLeft className="w-5 h-5" />}
                                    title="Bullet Points"
                                    content={results.bullets.join('\n\n')}
                                    onCopy={() => handleCopy(results.bullets.join('\n'), 'bullets')}
                                    copied={copiedField === 'bullets'}
                                    accent="#FF9900"
                                    large
                                />
                            )}

                            {/* Shopify-specific: Meta */}
                            {marketplace === 'shopify' && results.meta_title && (
                                <>
                                    <ResultCard
                                        icon={<Search className="w-5 h-5" />}
                                        title="Meta Title"
                                        content={results.meta_title}
                                        onCopy={() => handleCopy(results.meta_title, 'meta_title')}
                                        copied={copiedField === 'meta_title'}
                                        accent="#96BF48"
                                    />
                                    <ResultCard
                                        icon={<AlignLeft className="w-5 h-5" />}
                                        title="Meta Description"
                                        content={results.meta_description}
                                        onCopy={() => handleCopy(results.meta_description, 'meta_description')}
                                        copied={copiedField === 'meta_description'}
                                        accent="#96BF48"
                                    />
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={handleReset}
                                className="px-6 py-3 bg-[#F5F4F1] text-[#5C5C5C] rounded-xl font-medium hover:bg-[#E8E7E4] transition-colors"
                            >
                                ← {t('analysis.analyzeAnother')}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Input Form */
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Marketplace Selector */}
                        <div>
                            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                                {t('analysis.marketplace')}
                            </label>
                            <div className="inline-flex bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl p-1 gap-1">
                                {Object.entries(MARKETPLACE_COLORS).map(([key, colors]) => {
                                    const Icon = colors.icon;
                                    const isActive = marketplace === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => handleMarketplaceChange(key)}
                                            className="px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
                                            style={{
                                                backgroundColor: isActive ? colors.primary : 'transparent',
                                                color: isActive ? colors.text : '#5C5C5C'
                                            }}
                                        >
                                            <Icon size={14} />
                                            <span>{key.toUpperCase()}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Product Name */}
                        <div>
                            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                                {t('analysis.productName')} <span style={{ color: color.primary }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                placeholder="e.g., Handmade Ceramic Coffee Mug"
                                className="w-full px-4 py-3 bg-white border border-[#E8E7E4] rounded-xl text-[#1A1A1A] placeholder-[#8C8C8C] focus:outline-none transition"
                                style={{ '--focus-color': color.primary }}
                            />
                        </div>

                        {/* Product Description */}
                        <div>
                            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                                {t('analysis.productDescription')}
                                <span className="text-[#8C8C8C] font-normal ml-2">({t('common.optional')})</span>
                            </label>
                            <textarea
                                value={productDescription}
                                onChange={(e) => setProductDescription(e.target.value)}
                                placeholder="Describe your product features, materials, dimensions..."
                                rows={4}
                                className="w-full px-4 py-3 bg-white border border-[#E8E7E4] rounded-xl text-[#1A1A1A] placeholder-[#8C8C8C] focus:outline-none transition resize-none"
                            />
                        </div>

                        {/* Reference Link - DYNAMIC PLACEHOLDER */}
                        <div>
                            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                                {t('analysis.referenceLink')}
                                <span className="text-[#8C8C8C] font-normal ml-2">({t('common.optional')})</span>
                            </label>
                            <input
                                type="url"
                                value={referenceLink}
                                onChange={(e) => setReferenceLink(e.target.value)}
                                placeholder={color.placeholder}
                                className="w-full px-4 py-3 bg-white border border-[#E8E7E4] rounded-xl text-[#1A1A1A] placeholder-[#8C8C8C] focus:outline-none transition"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="relative">
                            <button
                                type="submit"
                                disabled={loading || !productName.trim()}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: color.primary,
                                    color: color.text
                                }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{t('common.analyzing')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        <span>{t('analysis.generateSEO')}</span>
                                    </>
                                )}
                            </button>
                            {!loading && (
                                <span className="absolute bottom-1 right-3 text-[10px] opacity-60" style={{ color: color.text }}>
                                    2 {t('credits.creditsUnit')}
                                </span>
                            )}
                        </div>

                        {/* API Key is handled by backend */}
                    </form>
                )}
            </div>
        </div>
    );
}

/**
 * Result Card Component
 */
function ResultCard({ icon, title, content, onCopy, copied, accent, large = false }) {
    return (
        <div className="bg-white border border-[#E8E7E4] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E7E4] bg-[#F5F4F1]">
                <div className="flex items-center gap-2" style={{ color: accent }}>
                    {icon}
                    <span className="font-medium text-sm text-[#1A1A1A]">{title}</span>
                </div>
                <button
                    onClick={onCopy}
                    className="flex items-center gap-1 text-xs text-[#8C8C8C] hover:text-[#1A1A1A] transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className={`px-4 py-3 ${large ? 'max-h-48 overflow-y-auto' : ''}`}>
                <p className="text-[#1A1A1A] text-sm whitespace-pre-wrap">
                    {content || 'No content available'}
                </p>
            </div>
        </div>
    );
}
