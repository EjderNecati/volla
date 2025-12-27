import React, { useState, useEffect } from 'react';
import { Upload, Copy, Sparkles, Check, X, AlertCircle, Plus, TrendingUp, TrendingDown, Minus, Target, Users, BarChart3, Settings, Key, ShoppingBag, Store, ShoppingCart, Image, FileText, Tag, Search, Type, Camera, Clock, Trash2 } from 'lucide-react';
import { analyzeImage, analyzeText, fileToBase64 } from '../utils/aiHelpers';

const HISTORY_KEY = 'volla_analysis_history';
const MAX_HISTORY = 20;
const SAVED_IMAGE_SIZE = 800; // Max image dimension for localStorage (higher = clearer but larger)

// Helper: Create optimized image from file for localStorage
const createOptimizedImage = (file) => {
    return new Promise((resolve) => {
        const img = document.createElement('img');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            // Calculate dimensions (max 800x800 for good quality)
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > SAVED_IMAGE_SIZE) {
                    height = (height * SAVED_IMAGE_SIZE) / width;
                    width = SAVED_IMAGE_SIZE;
                }
            } else {
                if (height > SAVED_IMAGE_SIZE) {
                    width = (width * SAVED_IMAGE_SIZE) / height;
                    height = SAVED_IMAGE_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Return as JPEG with 0.85 quality for good clarity
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(optimizedDataUrl);
        };

        img.onerror = () => resolve(null);
        img.src = URL.createObjectURL(file);
    });
};

const EtsySEOMaster = () => {
    const [image, setImage] = useState(null);
    const [imageBase64, setImageBase64] = useState(null); // For localStorage persistence
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [copiedField, setCopiedField] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [hasApiKey, setHasApiKey] = useState(false);
    const [marketplace, setMarketplace] = useState('etsy');
    const [inputMode, setInputMode] = useState('image');
    const [textInput, setTextInput] = useState('');

    // History State
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    // Load API key and history on mount
    useEffect(() => {
        const savedKey = localStorage.getItem('volla_api_key');
        if (savedKey) {
            setApiKey(savedKey);
            setHasApiKey(true);
        }

        // Load history from localStorage
        try {
            const savedHistory = localStorage.getItem(HISTORY_KEY);
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    }, []);

    // Save history to localStorage whenever it changes
    const saveHistory = (newHistory) => {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
            setHistory(newHistory);
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    };

    // Add to history (FIFO, max 20)
    const addToHistory = (analysisData, base64ForHistory = null) => {
        // For text mode, NEVER use an image - this prevents showing the previous photo
        const isTextMode = (analysisData.inputMode || inputMode) === 'text';

        const newEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            marketplace: analysisData.marketplace,
            inputMode: analysisData.inputMode || inputMode,
            title: analysisData.title,
            image: isTextMode ? null : (base64ForHistory || imageBase64), // Text mode = no image
            textInput: isTextMode ? textInput : null,
            results: analysisData
        };

        const newHistory = [newEntry, ...history].slice(0, MAX_HISTORY);
        saveHistory(newHistory);
    };

    // Restore from history
    const restoreFromHistory = (entry) => {
        setMarketplace(entry.marketplace);
        setInputMode(entry.inputMode || 'image');

        if (entry.inputMode === 'text' || !entry.image) {
            setImage(null);
            setImageBase64(null);
            setTextInput(entry.textInput || '');
        } else {
            setImage(entry.image); // Set image to base64 data URL
            setImageBase64(entry.image);
            setTextInput('');
        }

        setResults(entry.results);
        setError(null);
        setShowHistory(false);
    };

    // Clear all history
    const clearHistory = () => {
        if (confirm('Tüm geçmişi silmek istediğinize emin misiniz?')) {
            saveHistory([]);
        }
    };

    const saveApiKey = () => {
        if (apiKey.trim()) {
            localStorage.setItem('volla_api_key', apiKey.trim());
            setHasApiKey(true);
            setShowSettings(false);
        }
    };

    // IMAGE MODE - Handle upload
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const savedKey = localStorage.getItem('volla_api_key');
        // -------------------------------------------------------------------
        // 1️⃣ Guard against missing, empty, or placeholder keys (e.g. "dummy-key")
        // -------------------------------------------------------------------
        if (!savedKey || savedKey.trim() === '' || savedKey.toLowerCase().startsWith('dummy')) {
            // Prompt user to enter a real key via Settings modal
            setShowSettings(true);
            setError('Please provide a valid Gemini API key in Settings (gear icon).');
            return;
        }

        // -------------------------------------------------------------------
        // 2️⃣ Continue with the upload / analysis flow
        // -------------------------------------------------------------------
        const imageUrl = URL.createObjectURL(file);
        setImage(imageUrl);
        setImageFile(file);
        setLoading(true);
        setError(null);
        setResults(null);

        try {
            setLoadingStep('Preparing image...');

            // fileToBase64 returns full data URL (data:image/...;base64,...)
            const fullDataUrl = await fileToBase64(file);
            setImageBase64(fullDataUrl);

            // Create optimized image for localStorage (800x800 max, 85% quality)
            const optimizedImageUrl = await createOptimizedImage(file);

            // Extract just the base64 part for API (remove data:...;base64, prefix)
            const base64ForApi = fullDataUrl.split(',')[1];

            setLoadingStep(`AI analyzing for ${marketplace.toUpperCase()}...`);
            const apiResults = await analyzeImage(base64ForApi, marketplace, savedKey);

            const processedResults = processResults(apiResults);

            // Add to history after successful analysis with optimized image
            addToHistory(processedResults, optimizedImageUrl || fullDataUrl);

        } catch (err) {
            console.error('Analysis error:', err);
            // Provide a user‑friendly message for common 400 errors
            const friendly = err.message.includes('400')
                ? 'Invalid API key – open Settings (gear icon) and enter a valid Gemini key.'
                : err.message;
            setError(friendly);
        } finally {
            setLoading(false);
            setLoadingStep('');
        }
    };

    // TEXT MODE - Handle submit
    const handleTextSubmit = async () => {
        const savedKey = localStorage.getItem('volla_api_key');
        if (!savedKey) {
            setShowSettings(true);
            return;
        }

        if (!textInput.trim() || textInput.trim().length < 10) {
            setError('Please enter at least 10 characters of product description');
            return;
        }

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            setLoadingStep(`Processing text for ${marketplace.toUpperCase()}...`);
            const apiResults = await analyzeText(textInput, marketplace, savedKey);

            const processedResults = processResults(apiResults);

            // Add to history after successful analysis
            addToHistory(processedResults);

        } catch (err) {
            console.error('Text analysis error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingStep('');
        }
    };

    // Process results from both modes
    const processResults = (apiResults) => {
        const processed = {
            marketplace: marketplace,
            inputMode: inputMode,
            title: apiResults.title || 'Title generation failed',
            description: apiResults.description || null,
            tags: apiResults.keywords || apiResults.tags || [],
            bullets: apiResults.bullets || [],
            search_terms: apiResults.search_terms || '',
            meta_title: apiResults.meta_title || null,
            meta_description: apiResults.meta_description || null,
            html_description: apiResults.html_description || null,
            alt_text: apiResults.alt_text || null,
            price: apiResults.price || '$0.00',
            competitorAnalysis: apiResults.competitorAnalysis || null,
            marketInsights: apiResults.marketInsights || null,
            _grounded: apiResults._grounded
        };

        setResults(processed);
        return processed;
    };

    const handleNewAnalysis = () => {
        setImage(null);
        setImageFile(null);
        setResults(null);
        setError(null);
        setTextInput('');
    };

    const copyToClipboard = async (text, field) => {
        try {
            const textToCopy = Array.isArray(text) ? text.join(', ') : text;
            await navigator.clipboard.writeText(textToCopy);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const getCompetitionColor = (level) => {
        switch (level?.toUpperCase()) {
            case 'LOW': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
            case 'MEDIUM': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
            case 'HIGH': return 'text-red-400 bg-red-500/20 border-red-500/30';
            default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
        }
    };

    // Quiet Luxury label styling based on marketplace
    const getLuxuryLabelClass = (marketplace) => {
        const baseClass = 'font-sans text-[11px] tracking-[0.25em] uppercase font-bold border-b border-white/5 pb-2 mb-3 inline-block';
        switch (marketplace) {
            case 'etsy': return `${baseClass} text-orange-200/60`;
            case 'amazon': return `${baseClass} text-amber-200/60`;
            case 'shopify': return `${baseClass} text-emerald-200/60`;
            default: return `${baseClass} text-slate-200/60`;
        }
    };

    const TrendIcon = ({ direction }) => {
        switch (direction?.toUpperCase()) {
            case 'INCREASING': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
            case 'DECREASING': return <TrendingDown className="w-5 h-5 text-red-400" />;
            default: return <Minus className="w-5 h-5 text-amber-400" />;
        }
    };

    const getTrendColor = (direction) => {
        switch (direction?.toUpperCase()) {
            case 'INCREASING': return 'text-emerald-400';
            case 'DECREASING': return 'text-red-400';
            default: return 'text-amber-400';
        }
    };

    const getScoreColor = (score) => {
        if (score >= 70) return 'text-emerald-400';
        if (score >= 40) return 'text-amber-400';
        return 'text-red-400';
    };

    const getMarketplaceColor = (mp) => {
        switch (mp) {
            case 'etsy': return 'from-orange-500 to-orange-600';
            case 'amazon': return 'from-amber-500 to-yellow-500';
            case 'shopify': return 'from-green-500 to-emerald-500';
            default: return 'from-indigo-500 to-purple-500';
        }
    };

    const getMarketplaceBadge = (mp) => {
        switch (mp) {
            case 'etsy': return { icon: '🏪', text: 'ETSY', color: 'bg-orange-500', dotColor: 'bg-orange-500' };
            case 'amazon': return { icon: '📦', text: 'AMAZON', color: 'bg-amber-500', dotColor: 'bg-amber-500' };
            case 'shopify': return { icon: '🛒', text: 'SHOPIFY', color: 'bg-green-500', dotColor: 'bg-green-500' };
            default: return { icon: '📊', text: 'SEO', color: 'bg-slate-500', dotColor: 'bg-slate-500' };
        }
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'JUST NOW';
        if (diffMins < 60) return `${diffMins}M AGO`;
        if (diffHours < 24) return `${diffHours}H AGO`;
        return `${diffDays}D AGO`;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-poppins selection:bg-indigo-500 selection:text-white">

            {/* ═══════════════════════════════════════════════════════ */}
            {/* HISTORY SLIDE-OVER PANEL */}
            {/* ═══════════════════════════════════════════════════════ */}
            {showHistory && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity"
                        onClick={() => setShowHistory(false)}
                    />

                    {/* Panel */}
                    <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-slate-900 border-l border-slate-800 z-[95] shadow-2xl animate-slide-in-right overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock size={20} className="text-indigo-400" />
                                <h2 className="text-lg font-semibold">Recent Analyses</h2>
                                <span className="text-xs px-2 py-0.5 bg-slate-800 rounded-full text-slate-400">
                                    {history.length}/{MAX_HISTORY}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {history.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                                        title="Clear All"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="p-2 hover:bg-slate-800 rounded-lg transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* History List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <Clock size={48} className="text-slate-700 mb-4" />
                                    <p className="text-slate-500 text-sm">No analysis history yet</p>
                                    <p className="text-slate-600 text-xs mt-1">Your analyses will appear here</p>
                                </div>
                            ) : (
                                history.map((entry) => {
                                    const badge = getMarketplaceBadge(entry.marketplace);
                                    return (
                                        <button
                                            key={entry.id}
                                            onClick={() => restoreFromHistory(entry)}
                                            className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Thumbnail */}
                                                <div className="w-12 h-12 rounded-lg bg-slate-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                    {entry.image ? (
                                                        <img
                                                            src={entry.image}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Type size={20} className="text-slate-500" />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition">
                                                        {entry.title?.substring(0, 40) || 'Untitled'}
                                                        {entry.title?.length > 40 && '...'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-slate-400/60">
                                                            {formatTimeAgo(entry.timestamp)}
                                                        </span>
                                                        <span className="text-slate-700">•</span>
                                                        <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-slate-400/60 flex items-center gap-1">
                                                            {entry.inputMode === 'text' ? (
                                                                <><Type size={10} className="inline-block" /> TEXT</>
                                                            ) : (
                                                                <><Camera size={10} className="inline-block" /> PHOTO</>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Marketplace Badge */}
                                                <div className={`w-3 h-3 rounded-full ${badge.dotColor} flex-shrink-0`} title={badge.text} />
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* SETTINGS MODAL */}
            {/* ═══════════════════════════════════════════════════════ */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Key className="w-5 h-5 text-indigo-400" />
                                <h2 className="text-lg font-semibold">API Key Settings</h2>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-800 rounded-full transition">
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-sm text-slate-400 mb-4">
                            Enter your Gemini API key. Get free at{' '}
                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                                Google AI Studio
                            </a>
                        </p>

                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your Gemini API key..."
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition mb-4"
                        />

                        <button
                            onClick={saveApiKey}
                            disabled={!apiKey.trim()}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-medium transition"
                        >
                            Save API Key
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* HEADER */}
            {/* ═══════════════════════════════════════════════════════ */}
            <header className="fixed top-0 w-full p-6 flex justify-between items-center z-50 bg-slate-950/80 backdrop-blur-md">
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    VOLLA
                </h1>
                <div className="flex items-center gap-3">
                    {results?._grounded && (
                        <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                            🔍 LIVE DATA
                        </span>
                    )}

                    {/* History Button */}
                    <button
                        onClick={() => setShowHistory(true)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 hover:bg-slate-700 transition relative"
                    >
                        <Clock size={16} />
                        {history.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-[10px] font-bold rounded-full flex items-center justify-center">
                                {history.length}
                            </span>
                        )}
                    </button>

                    {/* Settings Button */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition ${hasApiKey ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' : 'bg-amber-500/20 border border-amber-500/50 text-amber-400'}`}
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 pt-24 pb-32 max-w-md md:max-w-2xl">

                {/* SELECTION TOGGLES */}
                {!results && !loading && (
                    <>
                        {/* PLATFORM SELECTOR */}
                        <div className="flex justify-center mb-4">
                            <div className="bg-slate-900 border border-slate-800 rounded-full p-1 flex">
                                <button
                                    onClick={() => setMarketplace('etsy')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${marketplace === 'etsy'
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <Store size={16} />
                                    <span>Etsy</span>
                                </button>
                                <button
                                    onClick={() => setMarketplace('amazon')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${marketplace === 'amazon'
                                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <ShoppingBag size={16} />
                                    <span>Amazon</span>
                                </button>
                                <button
                                    onClick={() => setMarketplace('shopify')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${marketplace === 'shopify'
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <ShoppingCart size={16} />
                                    <span>Shopify</span>
                                </button>
                            </div>
                        </div>

                        {/* INPUT MODE SELECTOR */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-slate-800/50 border border-slate-700 rounded-full p-1 flex">
                                <button
                                    onClick={() => setInputMode('image')}
                                    className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all ${inputMode === 'image'
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <Camera size={16} />
                                    <span>Photo</span>
                                </button>
                                <button
                                    onClick={() => setInputMode('text')}
                                    className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all ${inputMode === 'text'
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <Type size={16} />
                                    <span>Text</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* STATE 1A: IMAGE MODE */}
                {!image && !results && !loading && inputMode === 'image' && (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
                        <div className="relative group cursor-pointer">
                            <div className={`absolute -inset-1 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 bg-gradient-to-r ${getMarketplaceColor(marketplace)}`}></div>
                            <label className="relative flex flex-col items-center justify-center w-48 h-48 rounded-3xl bg-slate-900 border-2 border-slate-800 hover:border-indigo-500 transition-all cursor-pointer shadow-2xl">
                                <Upload className="w-12 h-12 text-slate-400 group-hover:text-indigo-400 mb-2 transition-colors" />
                                <span className="text-sm text-slate-400 font-medium">Upload Photo</span>
                                <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
                            </label>
                        </div>
                        <p className="text-slate-500 text-sm max-w-xs">
                            Upload your product photo for AI-optimized {marketplace.toUpperCase()} listing.
                        </p>

                        {!hasApiKey && (
                            <button
                                onClick={() => setShowSettings(true)}
                                className="mt-4 px-6 py-3 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-full text-sm font-medium hover:bg-amber-500/30 transition flex items-center gap-2"
                            >
                                <Key size={16} />
                                Add API Key to Start
                            </button>
                        )}
                    </div>
                )}

                {/* STATE 1B: TEXT MODE */}
                {!results && !loading && inputMode === 'text' && (
                    <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="w-full max-w-lg">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <Type size={18} className="text-indigo-400" />
                                    <span className="text-sm font-medium text-slate-300">Product Description</span>
                                </div>
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Enter your product title, description, or any text you want to optimize for SEO..."
                                    className="w-full h-48 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                                />
                                <div className="flex justify-between items-center mt-3">
                                    <span className="text-xs text-slate-500">{textInput.length} characters</span>
                                    <button
                                        onClick={handleTextSubmit}
                                        disabled={!hasApiKey || textInput.trim().length < 10}
                                        className={`px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${hasApiKey && textInput.trim().length >= 10
                                            ? `bg-gradient-to-r ${getMarketplaceColor(marketplace)} text-white shadow-lg hover:opacity-90`
                                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <Sparkles size={16} />
                                        <span>Generate SEO</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm max-w-xs text-center">
                            AI will rewrite your text and generate optimized {marketplace.toUpperCase()} listing content.
                        </p>

                        {!hasApiKey && (
                            <button
                                onClick={() => setShowSettings(true)}
                                className="px-6 py-3 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-full text-sm font-medium hover:bg-amber-500/30 transition flex items-center gap-2"
                            >
                                <Key size={16} />
                                Add API Key to Start
                            </button>
                        )}
                    </div>
                )}

                {/* STATE 2: LOADING */}
                {loading && (
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                        {image && inputMode === 'image' && (
                            <div className="w-32 h-32 rounded-2xl overflow-hidden mb-6 border-2 border-slate-700 relative">
                                <img src={image} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60" alt="" />
                                <img src={image} className="relative z-10 w-full h-full object-contain" alt="Analyzing" />
                            </div>
                        )}
                        {inputMode === 'text' && (
                            <div className="w-32 h-32 rounded-2xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center mb-6">
                                <Type size={40} className="text-slate-600" />
                            </div>
                        )}
                        <div className="relative w-16 h-16">
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-800 rounded-full"></div>
                            <div className={`absolute top-0 left-0 w-full h-full border-4 rounded-full animate-spin border-t-transparent ${marketplace === 'amazon' ? 'border-amber-500' :
                                marketplace === 'shopify' ? 'border-green-500' : 'border-orange-500'
                                }`}></div>
                            <Sparkles className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 animate-pulse ${marketplace === 'amazon' ? 'text-amber-400' :
                                marketplace === 'shopify' ? 'text-green-400' : 'text-orange-400'
                                }`} />
                        </div>
                        <p className={`mt-6 font-medium animate-pulse ${marketplace === 'amazon' ? 'text-amber-300' :
                            marketplace === 'shopify' ? 'text-green-300' : 'text-orange-300'
                            }`}>
                            {loadingStep || 'Analyzing...'}
                        </p>
                    </div>
                )}

                {/* STATE 3: ERROR */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-red-400 mb-2">Error Occurred</h2>
                        <p className="text-slate-400 text-sm mb-6 max-w-xs">{error}</p>
                        <button onClick={handleNewAnalysis} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-full transition">
                            Try Again
                        </button>
                    </div>
                )}

                {/* STATE 4: RESULTS */}
                {results && !loading && !error && (
                    <div className="space-y-6 animate-fade-in-up">

                        {/* Marketplace Badge */}
                        <div className="flex justify-center">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold text-white ${getMarketplaceBadge(results.marketplace).color}`}>
                                {getMarketplaceBadge(results.marketplace).icon} {getMarketplaceBadge(results.marketplace).text}
                            </span>
                        </div>

                        {/* Preview Image - Image Mode */}
                        {image && inputMode === 'image' && (
                            <div className="relative w-full h-72 rounded-2xl overflow-hidden shadow-lg border border-slate-800">
                                <img src={image} className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60" alt="" />
                                <img src={image} className="relative z-10 w-full h-full object-contain" alt="Preview" />
                                <button onClick={handleNewAnalysis} className="absolute top-3 right-3 z-20 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-red-500/80 transition">
                                    <X size={16} />
                                </button>
                                {results.price && (
                                    <div className="absolute bottom-3 left-3 z-20 px-3 py-1.5 bg-emerald-500/80 backdrop-blur-md rounded-full text-white text-sm font-medium">
                                        {results.price}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Text Mode Preview */}
                        {inputMode === 'text' && (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-500">Original Input</span>
                                    <button onClick={handleNewAnalysis} className="p-1.5 bg-slate-800 rounded-full text-slate-400 hover:text-red-400 transition">
                                        <X size={14} />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-2">{textInput}</p>
                                {results.price && (
                                    <div className="mt-3 inline-block px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                                        {results.price}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TITLE CARD */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className={getLuxuryLabelClass(results.marketplace)}>
                                        {results.marketplace === 'shopify' ? 'PRODUCT TITLE' :
                                            results.marketplace === 'amazon' ? 'A9 TITLE' : 'SEO TITLE'}
                                    </span>
                                    <span className="text-[10px] text-slate-500/50 ml-2">
                                        {results.title.length}/{results.marketplace === 'amazon' ? 200 : results.marketplace === 'shopify' ? 70 : 140}
                                    </span>
                                </div>
                                <button onClick={() => copyToClipboard(results.title, 'title')} className="text-slate-400 hover:text-white transition">
                                    {copiedField === 'title' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <p className="text-lg font-medium leading-relaxed text-slate-100">{results.title}</p>
                        </div>

                        {/* SHOPIFY CARDS */}
                        {results.marketplace === 'shopify' && results.meta_title && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={getLuxuryLabelClass('shopify')}>META TITLE</span>
                                        <span className="text-[10px] text-slate-500/50 ml-2">{results.meta_title.length}/60</span>
                                    </div>
                                    <button onClick={() => copyToClipboard(results.meta_title, 'meta_title')} className="text-slate-400 hover:text-white transition">
                                        {copiedField === 'meta_title' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-300">{results.meta_title}</p>
                            </div>
                        )}

                        {results.marketplace === 'shopify' && results.meta_description && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={getLuxuryLabelClass('shopify')}>META DESCRIPTION</span>
                                        <span className="text-[10px] text-slate-500/50 ml-2">{results.meta_description.length}/160</span>
                                    </div>
                                    <button onClick={() => copyToClipboard(results.meta_description, 'meta_description')} className="text-slate-400 hover:text-white transition">
                                        {copiedField === 'meta_description' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-300">{results.meta_description}</p>
                            </div>
                        )}

                        {results.marketplace === 'shopify' && results.html_description && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex justify-between items-start">
                                    <span className={getLuxuryLabelClass('shopify')}>HTML DESCRIPTION</span>
                                    <button onClick={() => copyToClipboard(results.html_description, 'html_description')} className="text-slate-400 hover:text-white transition">
                                        {copiedField === 'html_description' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <div className="text-sm text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: results.html_description }} />
                                <div className="mt-4 pt-4 border-t border-slate-700">
                                    <p className="text-xs text-slate-500 mb-2">📋 Raw HTML:</p>
                                    <pre className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded-xl overflow-x-auto">{results.html_description}</pre>
                                </div>
                            </div>
                        )}

                        {results.marketplace === 'shopify' && results.alt_text && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex justify-between items-start">
                                    <span className={getLuxuryLabelClass('shopify')}>IMAGE ALT TEXT</span>
                                    <button onClick={() => copyToClipboard(results.alt_text, 'alt_text')} className="text-slate-400 hover:text-white transition">
                                        {copiedField === 'alt_text' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-300">{results.alt_text}</p>
                            </div>
                        )}

                        {results.marketplace === 'shopify' && results.tags && results.tags.length > 0 && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={getLuxuryLabelClass('shopify')}>TAGS</span>
                                    <button onClick={() => copyToClipboard(results.tags, 'tags')} className="text-slate-400 hover:text-white transition">
                                        {copiedField === 'tags' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {results.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-sm rounded-full border border-slate-700">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ETSY CARDS */}
                        {results.marketplace === 'etsy' && results.tags && results.tags.length > 0 && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={getLuxuryLabelClass('etsy')}>TAGS</span>
                                        <span className="text-[10px] text-slate-500/50 ml-2">{results.tags.length}/13</span>
                                    </div>
                                    <button onClick={() => copyToClipboard(results.tags, 'tags')} className="text-slate-400 hover:text-white transition">
                                        {copiedField === 'tags' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {results.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-sm rounded-full border border-slate-700">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {results.marketplace === 'etsy' && results.description && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex justify-between items-start">
                                    <span className={getLuxuryLabelClass('etsy')}>DESCRIPTION</span>
                                    <button onClick={() => copyToClipboard(results.description, 'description')} className="text-slate-400 hover:text-white transition">
                                        {copiedField === 'description' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-400 leading-loose whitespace-pre-wrap">{results.description}</p>
                            </div>
                        )}

                        {/* AMAZON CARDS */}
                        {results.marketplace === 'amazon' && results.bullets && results.bullets.length > 0 && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={getLuxuryLabelClass('amazon')}>BULLET POINTS</span>
                                        <span className="text-[10px] text-slate-500/50 ml-2">{results.bullets.length}/5</span>
                                    </div>
                                    <button onClick={() => copyToClipboard(results.bullets.join('\n'), 'bullets')} className="text-slate-400 hover:text-white transition">
                                        {copiedField === 'bullets' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <ul className="space-y-3">
                                    {results.bullets.map((bullet, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                            <span className="text-amber-400 font-bold">•</span>
                                            <span>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {results.marketplace === 'amazon' && results.search_terms && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={getLuxuryLabelClass('amazon')}>BACKEND KEYWORDS</span>
                                        <span className="text-[10px] text-slate-500/50 ml-2">{new Blob([results.search_terms]).size}/249 bytes</span>
                                    </div>
                                    <button onClick={() => copyToClipboard(results.search_terms, 'search_terms')} className="text-slate-400 hover:text-white transition">
                                        {copiedField === 'search_terms' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed bg-slate-800/50 p-3 rounded-xl font-mono">{results.search_terms}</p>
                            </div>
                        )}

                        {/* COMMON: Competitor Analysis */}
                        {results.competitorAnalysis && (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                                <span className={getLuxuryLabelClass(results.marketplace)}>COMPETITOR ANALYSIS</span>
                                <p className="text-sm text-slate-400">{results.competitorAnalysis}</p>
                            </div>
                        )}

                        {/* COMMON: Market Insights */}
                        {results.marketInsights && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={getLuxuryLabelClass(results.marketplace)}>MARKET INSIGHTS</span>
                                    {results._grounded && (
                                        <span className="text-[9px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400/70 rounded-full">LIVE</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-between h-24">
                                        <Users className="w-4 h-4 text-slate-400" />
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getCompetitionColor(results.marketInsights.competitionLevel)}`}>
                                            {results.marketInsights.competitionLevel || 'N/A'}
                                        </span>
                                        <p className="text-xs text-slate-500">Competition</p>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-between h-24">
                                        <TrendIcon direction={results.marketInsights.trendDirection} />
                                        <span className={`text-sm font-bold ${getTrendColor(results.marketInsights.trendDirection)}`}>
                                            {results.marketInsights.trendDirection || 'N/A'}
                                        </span>
                                        <p className="text-xs text-slate-500">12-Mo Trend</p>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-between h-24">
                                        <Target className="w-4 h-4 text-slate-400" />
                                        <span className={`text-xl font-bold ${getScoreColor(results.marketInsights.opportunityScore)}`}>
                                            {results.marketInsights.opportunityScore || 0}
                                        </span>
                                        <p className="text-xs text-slate-500">Opp. Score</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-xs">
                                    {results.marketInsights.competitionReason && (
                                        <p className="text-slate-400"><span className="text-purple-400 font-medium">Competition:</span> {results.marketInsights.competitionReason}</p>
                                    )}
                                    {results.marketInsights.trendReason && (
                                        <p className="text-slate-400"><span className="text-purple-400 font-medium">Trend:</span> {results.marketInsights.trendReason}</p>
                                    )}
                                    {results.marketInsights.opportunityReason && (
                                        <p className="text-slate-400"><span className="text-purple-400 font-medium">Opportunity:</span> {results.marketInsights.opportunityReason}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* New Analysis Button */}
                        <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-40">
                            <button onClick={handleNewAnalysis} className={`font-semibold py-4 px-8 rounded-full shadow-lg transition-all flex items-center space-x-2 w-full max-w-sm justify-center active:scale-95 ${results.marketplace === 'amazon'
                                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                                : results.marketplace === 'shopify'
                                    ? 'bg-green-500 hover:bg-green-400 text-white'
                                    : 'bg-orange-500 hover:bg-orange-400 text-white'
                                }`}>
                                <Plus size={20} />
                                <span>New Analysis</span>
                            </button>
                        </div>

                        <div className="h-20"></div>
                    </div>
                )}
            </main>

            {/* Animation Styles */}
            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default EtsySEOMaster;
