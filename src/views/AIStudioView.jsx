import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Camera, Sparkles, Users, RotateCcw, Upload, ArrowLeft,
    Store, ShoppingBag, ShoppingCart, Type, Image as ImageIcon,
    Wand2, Eye, ImagePlus, Loader2, Copy, Check, Search, Tag, DollarSign, AlignLeft, Save, Download, Zap
} from 'lucide-react';
import {
    callGeminiAPI,
    fileToBase64,
    generateStudioImage,
    generateProductAngles,
    generateRealLifePhotos
} from '../utils/aiHelpers';
import {
    saveProject,
    getProject,
    createProject,
    canAddProject,
    canAddAssets,
    getStorageUsage
} from '../utils/projectManager';
import AssetFilmStrip from '../components/AssetFilmStrip';
import WelcomeOverlay from '../components/WelcomeOverlay';
import MascotAnimation from '../components/MascotAnimation';
import HandsfreeMode from '../components/HandsfreeMode';
import { useTranslation } from '../i18n';

// Marketplace color configuration
const MARKETPLACE_COLORS = {
    etsy: { primary: '#F1641E', hover: '#D55419', text: 'white', icon: Store },
    amazon: { primary: '#FF9900', hover: '#E68A00', text: 'black', icon: ShoppingBag },
    shopify: { primary: '#96BF48', hover: '#7FA03C', text: 'white', icon: ShoppingCart }
};

/**
 * AIStudioView - The Core Application
 * 
 * Features:
 * - Dragon Animation on mount (only if marketplace not pre-selected)
 * - Marketplace colors throughout UI
 * - Session-based asset management
 * - SEO Results display (Title, Tags, Description, Price)
 * - Generate Shots, Real Life from any active asset
 */
export default function AIStudioView({ initialAsset = null, initialProject = null, marketplace: propMarketplace, onMarketplaceSelect, onBack, onNavigate }) {
    // ═══════════════════════════════════════════════════════════════════
    // LOCAL MARKETPLACE STATE (falls back to prop)
    // ═══════════════════════════════════════════════════════════════════
    const [localMarketplace, setLocalMarketplace] = useState(propMarketplace);
    const marketplace = localMarketplace || propMarketplace;

    // Get marketplace colors
    const getColor = () => MARKETPLACE_COLORS[marketplace] || MARKETPLACE_COLORS.etsy;

    // i18n hook
    const { t } = useTranslation();

    // ═══════════════════════════════════════════════════════════════════
    // DRAGON ANIMATION STATE - Only show if no marketplace pre-selected
    // ═══════════════════════════════════════════════════════════════════
    const [showWelcome, setShowWelcome] = useState(() => {
        // Skip welcome if marketplace already selected from HomeView
        if (propMarketplace) return false;
        return !sessionStorage.getItem('volla_studio_welcomed');
    });
    const [showMascot, setShowMascot] = useState(false);
    const [selectedPlatformForAnimation, setSelectedPlatformForAnimation] = useState(null);

    // ═══════════════════════════════════════════════════════════════════
    // HANDSFREE MODE STATE
    // ═══════════════════════════════════════════════════════════════════
    const [isHandsfreeMode, setIsHandsfreeMode] = useState(false);

    // ═══════════════════════════════════════════════════════════════════
    // SESSION-BASED ASSETS STATE
    // ═══════════════════════════════════════════════════════════════════
    const [sessionAssets, setSessionAssets] = useState([]);
    const [activeAssetId, setActiveAssetId] = useState(null);

    // ═══════════════════════════════════════════════════════════════════
    // ANALYSIS & GENERATION STATE
    // ═══════════════════════════════════════════════════════════════════
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState(null);
    const [productInfo, setProductInfo] = useState(null);
    const [copiedField, setCopiedField] = useState(null);

    // Generation-specific loading states
    const [studioLoading, setStudioLoading] = useState(false);
    const [anglesLoading, setAnglesLoading] = useState(false);
    const [realLifeLoading, setRealLifeLoading] = useState(false);

    // API Keys
    const [apiKey, setApiKey] = useState('');
    const [vertexApiKey, setVertexApiKey] = useState('');

    // ═══════════════════════════════════════════════════════════════════
    // PROJECT STATE (for History/Library persistence)
    // ═══════════════════════════════════════════════════════════════════
    const [currentProjectId, setCurrentProjectId] = useState(null);
    const [projectSaved, setProjectSaved] = useState(false);
    const saveTimeoutRef = useRef(null);

    // ═══════════════════════════════════════════════════════════════════
    // SAVE CURRENT PROJECT (auto-save helper)
    // ═══════════════════════════════════════════════════════════════════
    const saveCurrentProject = useCallback(async (assets, seoResults, pInfo, mp) => {
        console.log('📦 saveCurrentProject called with:', {
            assetsCount: assets?.length,
            hasResults: !!seoResults,
            marketplace: mp
        });

        if (!assets || assets.length === 0) {
            console.log('⚠️ No assets to save');
            return;
        }

        const originalAsset = assets.find(a => a.type === 'ORIGINAL');
        if (!originalAsset) {
            console.log('⚠️ No ORIGINAL asset found');
            return;
        }

        try {
            const project = createProject(
                seoResults?.title || 'Untitled Project',
                mp || 'etsy',
                originalAsset.url,
                assets,
                seoResults,
                pInfo
            );

            // Use existing project ID if resuming
            if (currentProjectId) {
                project.id = currentProjectId;
            }

            await saveProject(project);
            setCurrentProjectId(project.id);
            setProjectSaved(true);
            console.log('✅ Project saved successfully:', project.id, 'Assets:', assets.length);

            // Reset saved indicator after 2 seconds
            setTimeout(() => setProjectSaved(false), 2000);
        } catch (err) {
            console.error('❌ Failed to save project:', err);
        }
    }, [currentProjectId]);

    // ═══════════════════════════════════════════════════════════════════
    // AUTO-SAVE: Trigger when sessionAssets changes (after generation)
    // ═══════════════════════════════════════════════════════════════════
    useEffect(() => {
        // Only auto-save if we have assets and at least one is ORIGINAL
        if (sessionAssets.length === 0) return;

        const hasOriginal = sessionAssets.some(a => a.type === 'ORIGINAL');
        if (!hasOriginal) return;

        // Debounce save to avoid too frequent saves
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Auto-save triggered by sessionAssets change');
            saveCurrentProject(sessionAssets, results, productInfo, marketplace);
        }, 1500); // Wait 1.5 seconds after last change

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [sessionAssets, results, productInfo, marketplace, saveCurrentProject]);

    // ═══════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════
    useEffect(() => {
        // Load API keys
        const savedApiKey = localStorage.getItem('volla_api_key') || '';
        const savedVertexKey = localStorage.getItem('volla_vertex_key') || '';
        setApiKey(savedApiKey);
        setVertexApiKey(savedVertexKey);

        // PRIORITY 1: Resume from initialProject (full project from history)
        if (initialProject && initialProject.id) {
            console.log('📂 Resuming project from history:', initialProject.id);
            setCurrentProjectId(initialProject.id);

            // Load all assets
            if (initialProject.assets && initialProject.assets.length > 0) {
                setSessionAssets(initialProject.assets);
                setActiveAssetId(initialProject.assets[0].id);
            }

            // Load SEO results
            if (initialProject.seoResults) {
                setResults(initialProject.seoResults);
            }

            // Load product info
            if (initialProject.productInfo) {
                setProductInfo(initialProject.productInfo);
            }

            // Update marketplace from project
            if (initialProject.marketplace && onMarketplaceSelect) {
                setLocalMarketplace(initialProject.marketplace);
                onMarketplaceSelect(initialProject.marketplace);
            }

            return; // Don't process initialAsset if project is loaded
        }

        // PRIORITY 2: If there's an initial asset from HomeView
        if (initialAsset?.url) {
            const asset = {
                id: `imported_${Date.now()}`,
                url: initialAsset.url,
                type: 'ORIGINAL',
                label: 'Upload'
            };
            setSessionAssets([asset]);
            setActiveAssetId(asset.id);

            // Auto-analyze if API key exists
            if (savedApiKey && marketplace) {
                autoAnalyze(initialAsset.url, marketplace, savedApiKey);
            }
        }
    }, [initialAsset, initialProject, marketplace]);

    // ═══════════════════════════════════════════════════════════════════
    // AUTO-ANALYZE on image load
    // ═══════════════════════════════════════════════════════════════════
    const autoAnalyze = async (imageUrl, mp, key) => {
        setLoading(true);
        setLoadingStep('Analyzing product...');
        try {
            const result = await callGeminiAPI(imageUrl, mp, key);
            setResults(result);
            setProductInfo(result._productInfo);
            console.log('✅ Auto-analysis complete:', result);
        } catch (err) {
            setError(err.message);
            console.error('❌ Analysis failed:', err);
        } finally {
            setLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════
    const getActiveAsset = useCallback(() => {
        return sessionAssets.find(a => a.id === activeAssetId) || null;
    }, [sessionAssets, activeAssetId]);

    const addAssetToSession = useCallback((url, type, parentId = null, label = '') => {
        const newAsset = {
            id: `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url,
            type,
            parentId,
            label: label || type
        };
        setSessionAssets(prev => [...prev, newAsset]);
        setActiveAssetId(newAsset.id);
        return newAsset;
    }, []);

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // ═══════════════════════════════════════════════════════════════════
    // PLATFORM SELECTION HANDLER (with Dragon Animation)
    // ═══════════════════════════════════════════════════════════════════
    const handlePlatformSelect = (platform) => {
        if (showWelcome) {
            setSelectedPlatformForAnimation(platform);
            setShowMascot(true);

            setTimeout(() => {
                setLocalMarketplace(platform);
                if (onMarketplaceSelect) onMarketplaceSelect(platform);
                setShowWelcome(false);
                setShowMascot(false);
                sessionStorage.setItem('volla_studio_welcomed', 'true');
            }, 2500);
        } else {
            setLocalMarketplace(platform);
            if (onMarketplaceSelect) onMarketplaceSelect(platform);
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // IMAGE UPLOAD HANDLER
    // ═══════════════════════════════════════════════════════════════════
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const base64 = await fileToBase64(file);
            addAssetToSession(base64, 'ORIGINAL', null, 'Upload');

            // Auto-analyze if API key exists
            if (apiKey && marketplace) {
                await autoAnalyze(base64, marketplace, apiKey);
            }
        } catch (err) {
            setError('Failed to upload image');
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // GENERATE STUDIO IMAGE
    // ═══════════════════════════════════════════════════════════════════
    const handleGenerateStudio = async () => {
        const activeAsset = getActiveAsset();
        if (!activeAsset) return;

        setStudioLoading(true);
        setError(null);
        try {
            const category = results?.category || 'Other';
            const result = await generateStudioImage(category, activeAsset.url, productInfo || {});

            if (result?.image) {
                addAssetToSession(result.image, 'STUDIO', activeAsset.id, 'AI Studio');
                // Auto-save handled by useEffect on sessionAssets change
            }
        } catch (err) {
            setError(`Studio generation failed: ${err.message}`);
        } finally {
            setStudioLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // GENERATE SHOTS (Multi-Angle)
    // ═══════════════════════════════════════════════════════════════════
    const handleGenerateShots = async () => {
        const activeAsset = getActiveAsset();
        if (!activeAsset) return;

        setAnglesLoading(true);
        setError(null);
        try {
            const sourceContext = activeAsset.type === 'REALLIFE' ? 'LIFE' : 'STUDIO';
            console.log('📸 Generating angles from:', activeAsset.label);

            const result = await generateProductAngles(activeAsset.url, sourceContext);

            if (result.success) {
                const shotLabels = result.labels || { shot1: 'Rotation', shot2: 'Context', shot3: 'Detail' };
                if (result.shot1) addAssetToSession(result.shot1, 'SHOT', activeAsset.id, shotLabels.shot1);
                if (result.shot2) addAssetToSession(result.shot2, 'SHOT', activeAsset.id, shotLabels.shot2);
                if (result.shot3) addAssetToSession(result.shot3, 'SHOT', activeAsset.id, shotLabels.shot3);
                console.log('✅ Shots added to session');
                // Auto-save handled by useEffect on sessionAssets change
            }
        } catch (err) {
            setError(`Shots generation failed: ${err.message}`);
        } finally {
            setAnglesLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // GENERATE REAL LIFE PHOTOS
    // ═══════════════════════════════════════════════════════════════════
    const handleGenerateRealLife = async () => {
        const activeAsset = getActiveAsset();
        if (!activeAsset) return;

        setRealLifeLoading(true);
        setError(null);
        try {
            console.log('🌟 Generating Real Life from:', activeAsset.label);

            const pInfo = productInfo || results?._productInfo || {};
            const result = await generateRealLifePhotos(activeAsset.url, pInfo);

            if (result.success) {
                const lifeLabels = result.labels || { shot1: 'Lifestyle 1', shot2: 'Lifestyle 2', shot3: 'Lifestyle 3' };
                if (result.shot1) addAssetToSession(result.shot1, 'REALLIFE', activeAsset.id, lifeLabels.shot1);
                if (result.shot2) addAssetToSession(result.shot2, 'REALLIFE', activeAsset.id, lifeLabels.shot2);
                if (result.shot3) addAssetToSession(result.shot3, 'REALLIFE', activeAsset.id, lifeLabels.shot3);
                console.log('✅ Real Life photos added to session');
                // Auto-save handled by useEffect on sessionAssets change
            }
        } catch (err) {
            setError(`Real Life generation failed: ${err.message}`);
        } finally {
            setRealLifeLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: Dragon Animation
    // ═══════════════════════════════════════════════════════════════════
    const renderDragonAnimation = () => (
        <>
            <WelcomeOverlay isActive={showWelcome && !showMascot} />
            <MascotAnimation
                platform={selectedPlatformForAnimation}
                isAnimating={showMascot}
                onAnimationEnd={() => { }}
            />
        </>
    );

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: Platform Selector (compact, for changes only)
    // ═══════════════════════════════════════════════════════════════════
    const renderPlatformSelector = () => {
        // If marketplace already selected, show compact version
        if (marketplace && !showWelcome) {
            return (
                <div className="flex justify-center mb-4">
                    <div className="inline-flex bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl p-1 gap-1">
                        {Object.entries(MARKETPLACE_COLORS).map(([key, colors]) => {
                            const Icon = colors.icon;
                            const isActive = marketplace === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handlePlatformSelect(key)}
                                    className="px-3 py-2 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5"
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
            );
        }

        // Full welcome selector with glow
        return (
            <div className={`flex justify-center mb-6 ${showWelcome ? 'relative z-50' : ''}`}>
                <div className={`inline-flex bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl p-1 gap-1 shadow-sm ${showWelcome ? 'platform-glow' : ''}`}>
                    {Object.entries(MARKETPLACE_COLORS).map(([key, colors]) => {
                        const Icon = colors.icon;
                        const isActive = marketplace === key;
                        return (
                            <button
                                key={key}
                                onClick={() => handlePlatformSelect(key)}
                                className="px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
                                style={{
                                    backgroundColor: isActive ? colors.primary : 'transparent',
                                    color: isActive ? colors.text : '#5C5C5C'
                                }}
                            >
                                <Icon size={16} />
                                <span>{key.toUpperCase()}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: Upload Zone
    // ═══════════════════════════════════════════════════════════════════
    const renderUploadZone = () => {
        if (!marketplace || sessionAssets.length > 0) return null;

        return (
            <div className="flex flex-col items-center justify-center py-12">
                <label
                    className="w-64 h-48 flex flex-col items-center justify-center cursor-pointer bg-white border-2 border-dashed border-[#D4D3D0] rounded-2xl p-8 text-center transition-all hover:shadow-lg"
                    style={{ borderColor: 'hover:' + getColor().primary }}
                >
                    <Upload className="w-12 h-12 text-[#8C8C8C] mb-3" />
                    <span className="text-[#1A1A1A] font-medium">{t('studio.uploadPhoto')}</span>
                    <span className="text-[#5C5C5C] text-sm mt-1">{t('common.dragOrClick')}</span>
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleImageUpload}
                        accept="image/*"
                    />
                </label>
                <p className="text-[#8C8C8C] text-sm mt-4 max-w-xs text-center">
                    {t('studio.uploadDescription', { marketplace: marketplace?.toUpperCase() })}
                </p>
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: SEO Results Section (Platform-Specific)
    // ═══════════════════════════════════════════════════════════════════
    const renderSEOResults = () => {
        if (!results) return null;

        // Debug: Log results to see what fields are populated
        console.log('🔍 SEO Results object:', results);
        console.log('📋 Keywords:', results.keywords);
        console.log('📋 Tags:', results.tags);
        console.log('📋 Description:', results.description);

        const color = getColor();

        // Get tags based on marketplace
        const getTags = () => {
            if (marketplace === 'shopify' && results.tags) return results.tags;
            if (marketplace === 'amazon' && results.search_terms) {
                return results.search_terms.split(' ').filter(t => t.length > 2).slice(0, 15);
            }
            return results.keywords || [];
        };

        // Get description based on marketplace
        const getDescription = () => {
            if (marketplace === 'shopify' && results.html_description) {
                // Strip HTML tags for display
                return results.html_description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            }
            return results.description || '';
        };

        const tags = getTags();
        const description = getDescription();

        return (
            <div className="bg-white border border-[#E8E7E4] rounded-2xl overflow-hidden">
                {/* Header */}
                <div
                    className="px-4 py-3 flex items-center gap-2"
                    style={{ backgroundColor: color.primary + '10', borderBottom: `2px solid ${color.primary}` }}
                >
                    <Search className="w-4 h-4" style={{ color: color.primary }} />
                    <span className="font-semibold text-[#1A1A1A]">
                        {marketplace?.toUpperCase()} Listing Optimization
                    </span>
                </div>

                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* SEO Title */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#8C8C8C] uppercase">SEO Title</span>
                            <button
                                onClick={() => copyToClipboard(results.title, 'title')}
                                className="text-xs text-[#5C5C5C] hover:text-[#1A1A1A] flex items-center gap-1"
                            >
                                {copiedField === 'title' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                {copiedField === 'title' ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <p className="text-sm text-[#1A1A1A] bg-[#F5F4F1] rounded-lg p-3">
                            {results.title || 'No title generated'}
                        </p>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════
                        AMAZON-SPECIFIC: Bullet Points
                        ═══════════════════════════════════════════════════════════ */}
                    {marketplace === 'amazon' && results.bullets && results.bullets.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[#8C8C8C] uppercase flex items-center gap-1">
                                    <AlignLeft size={12} /> Bullet Points
                                    <span className="ml-1 px-1.5 py-0.5 bg-[#FF9900]/20 text-[#FF9900] rounded text-[10px]">
                                        {results.bullets.length}/5
                                    </span>
                                </span>
                                <button
                                    onClick={() => copyToClipboard(results.bullets.join('\n'), 'bullets')}
                                    className="text-xs text-[#5C5C5C] hover:text-[#1A1A1A] flex items-center gap-1"
                                >
                                    {copiedField === 'bullets' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    Copy All
                                </button>
                            </div>
                            <div className="space-y-2">
                                {results.bullets.map((bullet, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-2 bg-[#F5F4F1] rounded-lg p-3 cursor-pointer hover:bg-[#EDE9E0] transition-colors"
                                        onClick={() => copyToClipboard(bullet, `bullet-${i}`)}
                                    >
                                        <span className="text-[#FF9900] font-bold text-xs mt-0.5">•</span>
                                        <p className="text-xs text-[#1A1A1A] flex-1">{bullet}</p>
                                        {copiedField === `bullet-${i}` && (
                                            <Check size={12} className="text-emerald-500 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        AMAZON-SPECIFIC: Backend Search Terms
                        ═══════════════════════════════════════════════════════════ */}
                    {marketplace === 'amazon' && results.search_terms && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[#8C8C8C] uppercase flex items-center gap-1">
                                    <Tag size={12} /> Backend Search Terms
                                    <span className="ml-1 px-1.5 py-0.5 bg-[#FF9900]/20 text-[#FF9900] rounded text-[10px]">
                                        {results.search_terms.length} bytes
                                    </span>
                                </span>
                                <button
                                    onClick={() => copyToClipboard(results.search_terms, 'search_terms')}
                                    className="text-xs text-[#5C5C5C] hover:text-[#1A1A1A] flex items-center gap-1"
                                >
                                    {copiedField === 'search_terms' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    Copy
                                </button>
                            </div>
                            <p className="text-xs text-[#1A1A1A] bg-[#F5F4F1] rounded-lg p-3 break-all">
                                {results.search_terms}
                            </p>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        SHOPIFY-SPECIFIC: Meta Title
                        ═══════════════════════════════════════════════════════════ */}
                    {marketplace === 'shopify' && results.meta_title && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[#8C8C8C] uppercase flex items-center gap-1">
                                    <Search size={12} /> Meta Title (Google)
                                    <span className="ml-1 px-1.5 py-0.5 bg-[#96BF48]/20 text-[#96BF48] rounded text-[10px]">
                                        {results.meta_title.length}/60
                                    </span>
                                </span>
                                <button
                                    onClick={() => copyToClipboard(results.meta_title, 'meta_title')}
                                    className="text-xs text-[#5C5C5C] hover:text-[#1A1A1A] flex items-center gap-1"
                                >
                                    {copiedField === 'meta_title' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    Copy
                                </button>
                            </div>
                            <p className="text-sm text-[#1A1A1A] bg-[#F5F4F1] rounded-lg p-3">
                                {results.meta_title}
                            </p>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        SHOPIFY-SPECIFIC: Meta Description
                        ═══════════════════════════════════════════════════════════ */}
                    {marketplace === 'shopify' && results.meta_description && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[#8C8C8C] uppercase flex items-center gap-1">
                                    <AlignLeft size={12} /> Meta Description
                                    <span className="ml-1 px-1.5 py-0.5 bg-[#96BF48]/20 text-[#96BF48] rounded text-[10px]">
                                        {results.meta_description.length}/160
                                    </span>
                                </span>
                                <button
                                    onClick={() => copyToClipboard(results.meta_description, 'meta_description')}
                                    className="text-xs text-[#5C5C5C] hover:text-[#1A1A1A] flex items-center gap-1"
                                >
                                    {copiedField === 'meta_description' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    Copy
                                </button>
                            </div>
                            <p className="text-xs text-[#1A1A1A] bg-[#F5F4F1] rounded-lg p-3">
                                {results.meta_description}
                            </p>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        SHOPIFY-SPECIFIC: HTML Description
                        ═══════════════════════════════════════════════════════════ */}
                    {marketplace === 'shopify' && results.html_description && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[#8C8C8C] uppercase">HTML Description</span>
                                <button
                                    onClick={() => copyToClipboard(results.html_description, 'html_description')}
                                    className="text-xs text-[#5C5C5C] hover:text-[#1A1A1A] flex items-center gap-1"
                                >
                                    {copiedField === 'html_description' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    Copy HTML
                                </button>
                            </div>
                            <div
                                className="text-xs text-[#1A1A1A] bg-[#F5F4F1] rounded-lg p-3 max-h-32 overflow-y-auto prose prose-sm"
                                dangerouslySetInnerHTML={{ __html: results.html_description }}
                            />
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        ETSY & GENERAL: Tags/Keywords
                        ═══════════════════════════════════════════════════════════ */}
                    {(marketplace === 'etsy' || (marketplace !== 'amazon' && marketplace !== 'shopify')) && tags.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[#8C8C8C] uppercase flex items-center gap-1">
                                    <Tag size={12} /> Tags
                                    <span className="ml-1 px-1.5 py-0.5 bg-[#E8E7E4] rounded text-[10px]">
                                        {tags.length} tags
                                    </span>
                                </span>
                                <button
                                    onClick={() => copyToClipboard(tags.join(', '), 'keywords')}
                                    className="text-xs text-[#5C5C5C] hover:text-[#1A1A1A] flex items-center gap-1"
                                >
                                    {copiedField === 'keywords' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    Copy All
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, i) => (
                                    <button
                                        key={i}
                                        onClick={() => copyToClipboard(tag, `tag-${i}`)}
                                        className="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                                        style={{
                                            borderColor: copiedField === `tag-${i}` ? color.primary : '#E8E7E4',
                                            backgroundColor: copiedField === `tag-${i}` ? color.primary + '10' : 'white',
                                            color: copiedField === `tag-${i}` ? color.primary : '#1A1A1A'
                                        }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        SHOPIFY-SPECIFIC: Tags
                        ═══════════════════════════════════════════════════════════ */}
                    {marketplace === 'shopify' && results.tags && results.tags.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[#8C8C8C] uppercase flex items-center gap-1">
                                    <Tag size={12} /> Product Tags
                                    <span className="ml-1 px-1.5 py-0.5 bg-[#96BF48]/20 text-[#96BF48] rounded text-[10px]">
                                        {results.tags.length} tags
                                    </span>
                                </span>
                                <button
                                    onClick={() => copyToClipboard(results.tags.join(', '), 'shopify_tags')}
                                    className="text-xs text-[#5C5C5C] hover:text-[#1A1A1A] flex items-center gap-1"
                                >
                                    {copiedField === 'shopify_tags' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    Copy All
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {results.tags.map((tag, i) => (
                                    <button
                                        key={i}
                                        onClick={() => copyToClipboard(tag, `stag-${i}`)}
                                        className="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                                        style={{
                                            borderColor: copiedField === `stag-${i}` ? '#96BF48' : '#E8E7E4',
                                            backgroundColor: copiedField === `stag-${i}` ? '#96BF4810' : 'white',
                                            color: copiedField === `stag-${i}` ? '#96BF48' : '#1A1A1A'
                                        }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        ETSY: Description
                        ═══════════════════════════════════════════════════════════ */}
                    {marketplace === 'etsy' && description && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[#8C8C8C] uppercase flex items-center gap-1">
                                    <AlignLeft size={12} /> Description
                                </span>
                                <button
                                    onClick={() => copyToClipboard(description, 'description')}
                                    className="text-xs text-[#5C5C5C] hover:text-[#1A1A1A] flex items-center gap-1"
                                >
                                    {copiedField === 'description' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    Copy
                                </button>
                            </div>
                            <p className="text-xs text-[#1A1A1A] bg-[#F5F4F1] rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-wrap">
                                {description || 'No description generated'}
                            </p>
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between bg-[#F5F4F1] rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-emerald-600" />
                            <span className="text-xs font-medium text-[#8C8C8C] uppercase">Suggested Price</span>
                        </div>
                        <span className="text-lg font-bold text-emerald-600">
                            {results.price || '$0.00'}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: Main Stage (Active Asset Display)
    // ═══════════════════════════════════════════════════════════════════
    const renderMainStage = () => {
        const activeAsset = getActiveAsset();
        if (!activeAsset) return null;

        const color = getColor();
        const anyLoading = studioLoading || anglesLoading || realLifeLoading;

        return (
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Image Display */}
                <div className="flex-1 flex flex-col">
                    {/* Main Image Container - Fixed height matching SEO panel, frosted glass effect */}
                    <div
                        className="relative rounded-2xl overflow-hidden"
                        style={{ height: '60vh', maxHeight: '600px', minHeight: '400px' }}
                    >
                        {/* Frosted Glass Background - Blurred version of the same image */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `url(${activeAsset.url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'blur(30px) brightness(0.7)',
                                transform: 'scale(1.2)'
                            }}
                        />

                        {/* Overlay for better contrast */}
                        <div className="absolute inset-0 bg-black/20" />

                        {/* Main Image - Centered and contained */}
                        <div className="relative h-full w-full flex items-center justify-center p-4">
                            <img
                                src={activeAsset.url}
                                alt={activeAsset.label}
                                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                                style={{ maxHeight: 'calc(60vh - 32px)' }}
                            />
                        </div>

                        {/* Asset Type Badge */}
                        <div
                            className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium shadow-lg"
                            style={{
                                backgroundColor: activeAsset.type === 'REALLIFE' ? '#059669' :
                                    activeAsset.type === 'SHOT' ? '#6B7280' : color.primary,
                                color: 'white'
                            }}
                        >
                            {activeAsset.label}
                        </div>

                        {/* Download Button - Top Right */}
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = activeAsset.url;
                                link.download = `volla_${activeAsset.type.toLowerCase()}_${Date.now()}.png`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-105"
                            title="Download Image"
                        >
                            <Download size={18} className="text-[#1A1A1A]" />
                        </button>

                        {/* Loading Overlay */}
                        {anyLoading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                <div className="text-center text-white">
                                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                                    <span className="text-sm">
                                        {studioLoading ? t('studio.generatingStudio') :
                                            anglesLoading ? t('studio.generatingShots') : t('studio.generatingRealLife')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
                        <button
                            onClick={handleGenerateStudio}
                            disabled={anyLoading}
                            className="flex flex-col items-center justify-center gap-1 px-8 py-4 rounded-2xl font-medium transition-colors disabled:opacity-50 min-w-[120px]"
                            style={{ backgroundColor: color.primary, color: color.text }}
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} />
                                <span className="text-base">{t('studio.title')}</span>
                            </div>
                            <span className="text-[10px] opacity-60">5 {t('credits.creditsUnit')}</span>
                        </button>
                        <button
                            onClick={handleGenerateShots}
                            disabled={anyLoading}
                            className="flex flex-col items-center justify-center gap-1 px-8 py-4 bg-[#1A1A1A] text-white rounded-2xl font-medium hover:bg-[#333] transition-colors disabled:opacity-50 min-w-[120px]"
                        >
                            <div className="flex items-center gap-2">
                                <RotateCcw size={18} />
                                <span className="text-base">{t('nav.shots')}</span>
                            </div>
                            <span className="text-[10px] text-white/50">5 {t('credits.creditsUnit')}</span>
                        </button>
                        <button
                            onClick={handleGenerateRealLife}
                            disabled={anyLoading}
                            className="flex flex-col items-center justify-center gap-1 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 min-w-[120px]"
                        >
                            <div className="flex items-center gap-2">
                                <Users size={18} />
                                <span className="text-base">{t('nav.realLife')}</span>
                            </div>
                            <span className="text-[10px] text-white/50">5 {t('credits.creditsUnit')}</span>
                        </button>
                    </div>

                    {/* Film Strip */}
                    {sessionAssets.length > 1 && (
                        <div className="mt-4">
                            <AssetFilmStrip
                                assets={sessionAssets.map(a => ({
                                    id: a.id,
                                    type: a.type,
                                    imageData: a.url,
                                    label: a.label
                                }))}
                                activeAssetId={activeAssetId}
                                onAssetClick={setActiveAssetId}
                            />
                        </div>
                    )}
                </div>

                {/* Right: SEO Results */}
                <div className="lg:w-96">
                    {loading ? (
                        <div className="bg-white border border-[#E8E7E4] rounded-2xl p-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: color.primary }} />
                            <p className="text-[#5C5C5C] text-sm">{loadingStep || t('studio.analyzing')}</p>
                        </div>
                    ) : results ? (
                        renderSEOResults()
                    ) : (
                        <div className="bg-white border border-[#E8E7E4] rounded-2xl p-8 text-center">
                            <Search className="w-8 h-8 text-[#8C8C8C] mx-auto mb-3" />
                            <p className="text-[#5C5C5C] text-sm">
                                {t('studio.uploadForAnalysis')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-poppins">
            {/* Dragon Animation */}
            {renderDragonAnimation()}

            {/* Header */}
            <header className="px-6 py-4 border-b border-[#E8E7E4] bg-white">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2 hover:bg-[#F5F4F1] rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} className="text-[#5C5C5C]" />
                            </button>
                        )}
                        <h1 className="text-xl font-bold text-[#1A1A1A]">{t('studio.title')}</h1>

                        {/* Mode Switch */}
                        <div className="ml-4 inline-flex bg-[#F5F4F1] border border-[#E8E7E4] rounded-lg p-0.5">
                            <button
                                onClick={() => setIsHandsfreeMode(false)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!isHandsfreeMode
                                    ? 'bg-white shadow text-[#1A1A1A]'
                                    : 'text-[#5C5C5C] hover:text-[#1A1A1A]'
                                    }`}
                            >
                                {t('studio.normal')}
                            </button>
                            <button
                                onClick={() => setIsHandsfreeMode(true)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${isHandsfreeMode
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow'
                                    : 'text-[#5C5C5C] hover:text-[#1A1A1A]'
                                    }`}
                            >
                                <Zap size={12} />
                                {t('studio.handsfree')}
                            </button>
                        </div>
                    </div>

                    {/* Session Asset Count */}
                    {!isHandsfreeMode && sessionAssets.length > 0 && (
                        <span className="text-sm text-[#5C5C5C]">
                            {sessionAssets.length} {t('studio.assets')}
                        </span>
                    )}
                </div>
            </header>

            {/* Main Content */}
            {isHandsfreeMode ? (
                <HandsfreeMode
                    marketplace={marketplace}
                    onBack={() => setIsHandsfreeMode(false)}
                    onNavigate={onNavigate}
                />
            ) : (
                <main className="flex-1 py-6 px-4">
                    <div className="max-w-6xl mx-auto">
                        {/* Platform Selector */}
                        {renderPlatformSelector()}

                        {/* Error Display */}
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                {error}
                                <button onClick={() => setError(null)} className="float-right font-bold">×</button>
                            </div>
                        )}

                        {/* Upload Zone or Main Stage */}
                        {sessionAssets.length === 0 ? renderUploadZone() : renderMainStage()}
                    </div>
                </main>
            )}
        </div>
    );
}
