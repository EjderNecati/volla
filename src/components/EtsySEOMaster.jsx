import React, { useState, useEffect } from 'react';
import { Upload, Copy, Sparkles, Check, X, AlertCircle, Plus, TrendingUp, TrendingDown, Minus, Target, Users, BarChart3, Settings, Key } from 'lucide-react';
import { analyzeImage, fileToBase64 } from '../utils/aiHelpers';

const EtsySEOMaster = () => {
    const [image, setImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [copiedField, setCopiedField] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [hasApiKey, setHasApiKey] = useState(false);

    // Check for API key on mount
    useEffect(() => {
        const savedKey = localStorage.getItem('volla_api_key');
        if (savedKey) {
            setApiKey(savedKey);
            setHasApiKey(true);
        }
    }, []);

    const saveApiKey = () => {
        if (apiKey.trim()) {
            localStorage.setItem('volla_api_key', apiKey.trim());
            setHasApiKey(true);
            setShowSettings(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const savedKey = localStorage.getItem('volla_api_key');
        if (!savedKey) {
            setShowSettings(true);
            return;
        }

        setImage(URL.createObjectURL(file));
        setImageFile(file);
        setLoading(true);
        setError(null);
        setResults(null);

        try {
            setLoadingStep('Preparing image...');
            const base64Image = await fileToBase64(file);

            setLoadingStep('AI analyzing product...');
            const apiResults = await analyzeImage(base64Image, 'etsy', savedKey);

            const etsyData = apiResults.etsy;
            setResults({
                title: etsyData.title || 'Title generation failed',
                description: etsyData.description || 'Description generation failed',
                tags: etsyData.keywords || [],
                price: etsyData.price || '$0.00',
                competitorAnalysis: etsyData.competitorAnalysis || null,
                marketInsights: etsyData.marketInsights || null,
                _grounded: apiResults._grounded
            });

        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingStep('');
        }
    };

    const handleNewAnalysis = () => {
        setImage(null);
        setImageFile(null);
        setResults(null);
        setError(null);
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

    return (
        <div className="min-h-screen bg-slate-950 text-white font-poppins selection:bg-indigo-500 selection:text-white">

            {/* SETTINGS MODAL */}
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
                            Enter your Gemini API key to use Volla. Get your free key at{' '}
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

                        {hasApiKey && (
                            <p className="text-xs text-emerald-400 mt-3 text-center">✓ API key saved</p>
                        )}
                    </div>
                </div>
            )}

            {/* HEADER */}
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
                    <button
                        onClick={() => setShowSettings(true)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition ${hasApiKey ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' : 'bg-amber-500/20 border border-amber-500/50 text-amber-400'}`}
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 pt-24 pb-32 max-w-md md:max-w-2xl">

                {/* STATE 1: NO PHOTO YET */}
                {!image && (
                    <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
                        <div className="relative group cursor-pointer">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                            <label className="relative flex flex-col items-center justify-center w-48 h-48 rounded-3xl bg-slate-900 border-2 border-slate-800 hover:border-indigo-500 transition-all cursor-pointer shadow-2xl">
                                <Upload className="w-12 h-12 text-slate-400 group-hover:text-indigo-400 mb-2 transition-colors" />
                                <span className="text-sm text-slate-400 font-medium">Upload Photo</span>
                                <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
                            </label>
                        </div>
                        <p className="text-slate-500 text-sm max-w-xs">
                            Upload your product photo and let AI generate optimized Etsy title, tags, and description in seconds.
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

                {/* STATE 2: LOADING */}
                {loading && (
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                        {image && (
                            <div className="w-32 h-32 rounded-2xl overflow-hidden mb-6 border-2 border-slate-700 relative">
                                {/* Blurred Background Layer */}
                                <img src={image} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60" alt="" />
                                {/* Sharp Foreground Layer */}
                                <img src={image} className="relative z-10 w-full h-full object-contain" alt="Analyzing" />
                            </div>
                        )}
                        <div className="relative w-16 h-16">
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-800 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
                            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-400 w-6 h-6 animate-pulse" />
                        </div>
                        <p className="mt-6 text-indigo-300 font-medium animate-pulse">{loadingStep || 'Analyzing...'}</p>
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

                        {/* Preview Image with Blurred Background */}
                        <div className="relative w-full h-72 rounded-2xl overflow-hidden shadow-lg border border-slate-800">
                            {/* Layer 1: Blurred Background */}
                            <img
                                src={image}
                                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
                                alt=""
                            />
                            {/* Layer 2: Sharp Foreground */}
                            <img
                                src={image}
                                className="relative z-10 w-full h-full object-contain"
                                alt="Preview"
                            />
                            {/* Close Button */}
                            <button
                                onClick={handleNewAnalysis}
                                className="absolute top-3 right-3 z-20 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-red-500/80 transition"
                            >
                                <X size={16} />
                            </button>
                            {/* Price Badge */}
                            {results.price && (
                                <div className="absolute bottom-3 left-3 z-20 px-3 py-1.5 bg-emerald-500/80 backdrop-blur-md rounded-full text-white text-sm font-medium">
                                    {results.price}
                                </div>
                            )}
                        </div>

                        {/* Title Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">SEO Title</span>
                                    <span className="text-xs text-slate-500">({results.title.length}/140)</span>
                                </div>
                                <button onClick={() => copyToClipboard(results.title, 'title')} className="text-slate-400 hover:text-white transition">
                                    {copiedField === 'title' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <p className="text-lg font-medium leading-relaxed text-slate-100">{results.title}</p>
                        </div>

                        {/* Tags Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Tags</span>
                                    <span className="text-xs text-slate-500">({results.tags.length}/13)</span>
                                </div>
                                <button onClick={() => copyToClipboard(results.tags, 'tags')} className="text-slate-400 hover:text-white transition">
                                    {copiedField === 'tags' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {results.tags.map((tag, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-sm rounded-full border border-slate-700 hover:border-indigo-500 transition">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Description Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Description</span>
                                <button onClick={() => copyToClipboard(results.description, 'description')} className="text-slate-400 hover:text-white transition">
                                    {copiedField === 'description' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <p className="text-sm text-slate-400 leading-loose whitespace-pre-wrap">{results.description}</p>
                        </div>

                        {/* Competitor Analysis */}
                        {results.competitorAnalysis && (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Competitor Analysis</span>
                                <p className="mt-2 text-sm text-slate-400">{results.competitorAnalysis}</p>
                            </div>
                        )}

                        {/* MARKET INSIGHTS SECTION */}
                        {results.marketInsights && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <BarChart3 className="w-4 h-4 text-purple-400" />
                                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Market Insights</span>
                                    {results._grounded && (
                                        <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">Live Data</span>
                                    )}
                                </div>

                                {/* 3 Metric Cards - Fixed Alignment */}
                                <div className="grid grid-cols-3 gap-3 mb-4">

                                    {/* Competition Level */}
                                    <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-between h-24">
                                        <Users className="w-4 h-4 text-slate-400" />
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getCompetitionColor(results.marketInsights.competitionLevel)}`}>
                                            {results.marketInsights.competitionLevel || 'N/A'}
                                        </span>
                                        <p className="text-xs text-slate-500">Competition</p>
                                    </div>

                                    {/* 12-Month Trend */}
                                    <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-between h-24">
                                        <TrendIcon direction={results.marketInsights.trendDirection} />
                                        <span className={`text-sm font-bold ${getTrendColor(results.marketInsights.trendDirection)}`}>
                                            {results.marketInsights.trendDirection || 'N/A'}
                                        </span>
                                        <p className="text-xs text-slate-500">12-Mo Trend</p>
                                    </div>

                                    {/* Opportunity Score */}
                                    <div className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-between h-24">
                                        <Target className="w-4 h-4 text-slate-400" />
                                        <span className={`text-xl font-bold ${getScoreColor(results.marketInsights.opportunityScore)}`}>
                                            {results.marketInsights.opportunityScore || 0}
                                        </span>
                                        <p className="text-xs text-slate-500">Opp. Score</p>
                                    </div>
                                </div>

                                {/* Insights Text */}
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

                        {/* New Product Analysis Button */}
                        <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-40">
                            <button onClick={handleNewAnalysis} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-8 rounded-full shadow-lg shadow-indigo-900/50 transition-all flex items-center space-x-2 w-full max-w-sm justify-center active:scale-95">
                                <Plus size={20} />
                                <span>New Product Analysis</span>
                            </button>
                        </div>

                        <div className="h-20"></div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default EtsySEOMaster;
