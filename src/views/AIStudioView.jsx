import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Camera, Sparkles, Users, RotateCcw, Upload, ArrowLeft,
    Store, ShoppingBag, ShoppingCart, Type, Image as ImageIcon,
    Wand2, Eye, ImagePlus, Loader2, Copy, Check, Search, Tag, DollarSign, AlignLeft, Save, Download, Zap, RefreshCw, X, Video, FolderOpen
} from 'lucide-react';
import { useCredits } from '../contexts/CreditContext';
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
import { addToLibrary } from '../utils/libraryManager';
import { calculateGenerationCost } from '../utils/creditManager';
import AssetFilmStrip from '../components/AssetFilmStrip';
import WelcomeOverlay from '../components/WelcomeOverlay';
import MascotAnimation from '../components/MascotAnimation';
import HandsfreeMode from '../components/HandsfreeMode';
import MotionMode from '../components/MotionMode';
import SourceSelectionModal from '../components/SourceSelectionModal';
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
export default function AIStudioView({ initialAsset = null, initialProject = null, marketplace: propMarketplace, onMarketplaceSelect, onClearLoaded, onBack, onNavigate }) {
    // ═══════════════════════════════════════════════════════════════════
    // LOCAL MARKETPLACE STATE (falls back to prop)
    // ═══════════════════════════════════════════════════════════════════
    const [localMarketplace, setLocalMarketplace] = useState(propMarketplace);
    const marketplace = localMarketplace || propMarketplace;

    // Get marketplace colors
    const getColor = () => MARKETPLACE_COLORS[marketplace] || MARKETPLACE_COLORS.etsy;

    // i18n hook
    const { t } = useTranslation();

    // Credits hook
    const { credits, isAdmin } = useCredits();

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
    // STUDIO MODE STATE: 'standard' | 'handsfree' | 'motion'
    // ═══════════════════════════════════════════════════════════════════
    const [studioMode, setStudioMode] = useState('standard');

    // ═══════════════════════════════════════════════════════════════════
    // NEW: GENERATION CONFIGURATION STATE (for 3-panel layout)
    // ═══════════════════════════════════════════════════════════════════
    const [photoType, setPhotoType] = useState('reallife'); // 'reallife' | 'shots' | 'studio'
    const [outputCount, setOutputCount] = useState(2); // 1-4
    const [aspectRatio, setAspectRatio] = useState('1:1'); // Default 1:1
    const [customPrompt, setCustomPrompt] = useState('');

    // Aspect ratio options
    const ASPECT_RATIOS = [
        { value: '1:1', label: '1:1' },
        { value: '16:9', label: '16:9' },
        { value: '9:16', label: '9:16' },
        { value: '4:3', label: '4:3' },
        { value: '3:4', label: '3:4' },
        { value: '3:2', label: '3:2' },
        { value: '2:3', label: '2:3' },
        { value: '4:5', label: '4:5' }
    ];

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

    // SEO analysis state - track if already analyzed for this session
    const [seoAnalyzedForMarketplace, setSeoAnalyzedForMarketplace] = useState(null); // 'etsy' | 'amazon' | 'shopify' | null

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
    // LIBRARY STATE
    // ═══════════════════════════════════════════════════════════════════
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [addedToLibrary, setAddedToLibrary] = useState(false);

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

            // Check if this is a Motion project and switch to motion mode
            if (initialProject.productInfo?.featureType === 'motion') {
                console.log('🎬 Motion project detected, switching to Motion mode');
                setStudioMode('motion');
            }

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
            // Note: SEO analysis now only runs on Generate button click
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
            // Note: SEO analysis now only runs on Generate button click
        } catch (err) {
            setError('Failed to upload image');
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // LIBRARY HANDLERS
    // ═══════════════════════════════════════════════════════════════════
    const handleAddToLibrary = async () => {
        const activeAsset = getActiveAsset();
        if (activeAsset?.url) {
            try {
                await addToLibrary({
                    url: activeAsset.url,
                    type: 'image',
                    name: `Studio ${new Date().toLocaleDateString()}`,
                    source: activeAsset.type === 'ORIGINAL' ? 'upload' : 'generated',
                    metadata: { type: activeAsset.type, marketplace }
                });
                setAddedToLibrary(true);
                setTimeout(() => setAddedToLibrary(false), 2000);
            } catch (err) {
                console.error('Failed to add to library:', err);
            }
        }
    };

    const handleSelectFromLibrary = (asset) => {
        addAssetToSession(asset.url, 'ORIGINAL', null, 'Library');
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
    // UNIFIED GENERATE HANDLER (NEW 3-PANEL LAYOUT)
    // ═══════════════════════════════════════════════════════════════════
    const handleUnifiedGenerate = async () => {
        const activeAsset = sessionAssets.find(a => a.id === activeAssetId) || sessionAssets[0];
        if (!activeAsset) return;

        try {
            if (photoType === 'reallife') {
                setRealLifeLoading(true);
                console.log(`🌟 Generating Real Life from: ${activeAsset.type}`);

                const realLifeResult = await generateRealLifePhotos(
                    activeAsset.url,
                    productInfo || {},
                    outputCount,
                    aspectRatio,
                    customPrompt
                );

                if (realLifeResult.success) {
                    // Add generated shots to session
                    for (let i = 1; i <= 4; i++) {
                        if (realLifeResult[`shot${i}`]) {
                            addAssetToSession(
                                realLifeResult[`shot${i}`],
                                'REALLIFE',
                                activeAsset.id,
                                realLifeResult.labels?.[`shot${i}`] || `Lifestyle ${i}`
                            );
                        }
                    }
                }
            } else if (photoType === 'shots') {
                setAnglesLoading(true);
                console.log(`📷 Generating ${outputCount} Shots from: ${activeAsset.type}`);

                // Use 'AUTO' for original uploads to let backend auto-detect environment
                // REALLIFE assets always use LIFE context, STUDIO assets use STUDIO
                const sourceContext = activeAsset.type === 'REALLIFE' ? 'LIFE'
                    : activeAsset.type === 'STUDIO' ? 'STUDIO'
                    : 'AUTO'; // Let backend detect for ORIGINAL or other types
                const anglesResult = await generateProductAngles(activeAsset.url, sourceContext, aspectRatio, outputCount);

                if (anglesResult.success) {
                    // Add generated shots based on outputCount
                    for (let i = 1; i <= 4; i++) {
                        if (anglesResult[`shot${i}`]) {
                            addAssetToSession(
                                anglesResult[`shot${i}`],
                                'SHOT',
                                activeAsset.id,
                                anglesResult.labels?.[`shot${i}`] || `Angle ${i}`
                            );
                        }
                    }
                }
            } else if (photoType === 'studio') {
                setStudioLoading(true);
                console.log(`🎨 Generating Studio from: ${activeAsset.type}`);

                const studioResult = await generateStudioImage(
                    results?.category || 'Other',
                    activeAsset.url,
                    productInfo || {},
                    outputCount,
                    aspectRatio,
                    customPrompt
                );

                if (studioResult.image) {
                    addAssetToSession(studioResult.image, 'STUDIO', activeAsset.id, 'Studio');
                }
                // Handle multiple images
                if (studioResult.images && studioResult.images.length > 1) {
                    studioResult.images.slice(1).forEach((img, idx) => {
                        addAssetToSession(img, 'STUDIO', activeAsset.id, `Studio ${idx + 2}`);
                    });
                }
            }

            // Run SEO analysis ONLY if marketplace is selected AND not already analyzed for this marketplace
            if (marketplace && activeAsset && seoAnalyzedForMarketplace !== marketplace) {
                try {
                    console.log('🔍 Running SEO analysis for:', marketplace, '(first time)');
                    setLoading(true);
                    const seoResult = await callGeminiAPI(activeAsset.url, marketplace, '');
                    setResults(seoResult);
                    setProductInfo(seoResult._productInfo);
                    setSeoAnalyzedForMarketplace(marketplace); // Mark as analyzed
                    console.log('✅ SEO analysis complete');
                } catch (seoErr) {
                    console.warn('⚠️ SEO analysis failed:', seoErr.message);
                }
            } else if (marketplace && seoAnalyzedForMarketplace === marketplace) {
                console.log('ℹ️ Skipping SEO - already analyzed for', marketplace);
            }
        } catch (err) {
            console.error('Generation failed:', err);
            setError(err.message || 'Generation failed');
        } finally {
            setStudioLoading(false);
            setAnglesLoading(false);
            setRealLifeLoading(false);
            setLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // REFRESH SEO ANALYSIS (costs 1 credit)
    // ═══════════════════════════════════════════════════════════════════
    const handleRefreshSEO = async () => {
        const activeAsset = sessionAssets.find(a => a.id === activeAssetId) || sessionAssets[0];
        if (!activeAsset || !marketplace) return;

        try {
            console.log('🔄 Refreshing SEO analysis for:', marketplace);
            setLoading(true);
            setResults(null); // Clear current results
            setSeoAnalyzedForMarketplace(null); // Reset analyzed state

            const seoResult = await callGeminiAPI(activeAsset.url, marketplace, '');
            setResults(seoResult);
            setProductInfo(seoResult._productInfo);
            setSeoAnalyzedForMarketplace(marketplace);
            console.log('✅ SEO refresh complete');
        } catch (seoErr) {
            console.warn('⚠️ SEO refresh failed:', seoErr.message);
            setError('SEO analysis failed: ' + seoErr.message);
        } finally {
            setLoading(false);
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
    // RENDER: Platform Selector (grid layout matching other selectors)
    // ═══════════════════════════════════════════════════════════════════
    const renderPlatformSelector = () => {
        // Lock marketplace selection after SEO is analyzed
        const isLocked = seoAnalyzedForMarketplace !== null;

        const marketplaces = [
            { id: null, label: t('marketplace.none') || 'None', icon: null, colors: { primary: '#E8E7E4', text: '#5C5C5C' } },
            ...Object.entries(MARKETPLACE_COLORS).map(([key, colors]) => ({
                id: key,
                label: key.toUpperCase(),
                icon: colors.icon,
                colors
            }))
        ];

        return (
            <div className="grid grid-cols-4 gap-2">
                {marketplaces.map(mp => {
                    const isActive = marketplace === mp.id;
                    const Icon = mp.icon;
                    // Disable if locked and not the active marketplace
                    const isDisabled = isLocked && !isActive;
                    return (
                        <button
                            key={mp.id || 'none'}
                            onClick={() => {
                                if (isDisabled) return;
                                setLocalMarketplace(mp.id);
                                if (onMarketplaceSelect) onMarketplaceSelect(mp.id);
                            }}
                            disabled={isDisabled}
                            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 transition-all aspect-square ${
                                isActive
                                    ? mp.id ? '' : 'bg-[#5C5C5C] text-white border-[#5C5C5C]'
                                    : isDisabled
                                        ? 'bg-[#F5F4F1] text-[#C0C0C0] border-[#E8E7E4] cursor-not-allowed opacity-50'
                                        : 'bg-white text-[#5C5C5C] border-[#E8E7E4] hover:border-[#5C5C5C]'
                            }`}
                            style={isActive && mp.id ? {
                                backgroundColor: mp.colors.primary,
                                borderColor: mp.colors.primary,
                                color: mp.colors.text
                            } : {}}
                        >
                            <div className="flex items-center justify-center h-5">
                                {Icon ? <Icon size={18} /> : <span className="text-base font-medium">—</span>}
                            </div>
                            <span className="text-[10px] font-medium leading-tight">{mp.label}</span>
                        </button>
                    );
                })}
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: Upload Zone
    // ═══════════════════════════════════════════════════════════════════
    const fileInputRef = useRef(null);

    const renderUploadZone = () => {
        // Show upload zone when no assets uploaded yet
        if (sessionAssets.length > 0) return null;

        return (
            <div className="flex flex-col items-center justify-center py-8">
                <button
                    onClick={() => setShowSourceModal(true)}
                    className="w-full h-40 flex flex-col items-center justify-center cursor-pointer bg-[#FAF9F6] border-2 border-dashed border-[#D4D3D0] rounded-2xl p-6 text-center transition-all hover:border-[#E06847] hover:bg-[#FFF9F7]"
                >
                    <Upload className="w-10 h-10 text-[#8C8C8C] mb-2" />
                    <span className="text-[#1A1A1A] font-medium text-sm">{t('studio.uploadPhoto')}</span>
                    <span className="text-[#8C8C8C] text-xs mt-1">{t('library.selectSource') || 'Library or Device'}</span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageUpload}
                    accept="image/*"
                />
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
            <div className="bg-white border border-[#E8E7E4] rounded-2xl overflow-hidden flex-1 flex flex-col">
                {/* Header */}
                <div
                    className="px-4 py-3 flex items-center gap-2 flex-shrink-0"
                    style={{ backgroundColor: color.primary + '10', borderBottom: `2px solid ${color.primary}` }}
                >
                    <Search className="w-4 h-4" style={{ color: color.primary }} />
                    <span className="font-semibold text-[#1A1A1A]">
                        {marketplace?.toUpperCase()} Listing Optimization
                    </span>
                </div>

                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
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

                        {/* Clear Button - Top Left */}
                        <button
                            onClick={() => {
                                // Clear all assets and results
                                setSessionAssets([]);
                                setActiveAssetId(null);
                                setResults(null);
                                setProductInfo(null);
                                setError(null);
                                setCurrentProjectId(null);
                                // Reset SEO state to allow new analysis
                                setSeoAnalyzedForMarketplace(null);
                                // Reset marketplace selection
                                setLocalMarketplace(null);
                                if (onMarketplaceSelect) onMarketplaceSelect(null);
                                // Clear cached project/asset in parent (App.jsx)
                                if (onClearLoaded) onClearLoaded();
                            }}
                            className="absolute top-4 left-4 p-2 bg-red-500 hover:bg-red-600 rounded-full shadow-lg transition-all hover:scale-105"
                            title=""
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        {/* Canvas Control Buttons - Top Right */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = activeAsset.url;
                                    link.download = `volla_${activeAsset.type.toLowerCase()}_${Date.now()}.png`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-105"
                                title="Download Image"
                            >
                                <Download size={18} className="text-[#1A1A1A]" />
                            </button>
                            <button
                                onClick={handleAddToLibrary}
                                className={`p-2 rounded-full shadow-lg transition-all hover:scale-105 ${
                                    addedToLibrary
                                        ? 'bg-emerald-500'
                                        : 'bg-white/90 hover:bg-white'
                                }`}
                                title={t('library.addToLibrary') || 'Add to Library'}
                            >
                                {addedToLibrary ? (
                                    <Check size={18} className="text-white" />
                                ) : (
                                    <FolderOpen size={18} className="text-[#1A1A1A]" />
                                )}
                            </button>
                        </div>

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
            <header className="px-6 py-3 border-b border-[#E8E7E4] bg-white">
                <div className="flex items-center justify-between">
                    {/* Left: Back + Mode Switch */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onNavigate?.('home')}
                            className="p-2 hover:bg-[#F5F4F1] rounded-lg transition-colors"
                            title={t('common.back') || 'Back'}
                        >
                            <ArrowLeft size={18} className="text-[#5C5C5C]" />
                        </button>

                        {/* Mode Switch */}
                        <div className="inline-flex bg-[#F5F4F1] border border-[#E8E7E4] rounded-lg p-0.5">
                            <button
                                onClick={() => setStudioMode('standard')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${studioMode === 'standard'
                                    ? 'bg-white shadow text-[#1A1A1A]'
                                    : 'text-[#5C5C5C] hover:text-[#1A1A1A]'
                                    }`}
                            >
                                {t('studio.normal')}
                            </button>
                            <button
                                onClick={() => setStudioMode('handsfree')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${studioMode === 'handsfree'
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow'
                                    : 'text-[#5C5C5C] hover:text-[#1A1A1A]'
                                    }`}
                            >
                                <Zap size={12} />
                                {t('studio.handsfree')}
                            </button>
                            <button
                                onClick={() => setStudioMode('motion')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${studioMode === 'motion'
                                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow'
                                    : 'text-[#5C5C5C] hover:text-[#1A1A1A]'
                                    }`}
                            >
                                <Video size={12} />
                                {t('studio.motion') || 'Motion'}
                            </button>
                        </div>
                    </div>

                    {/* Right: Volla Studio Logo + Credit Display */}
                    <div className="flex items-center gap-4">
                        {/* Credit Balance */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                            credits < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${credits < 10 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                            <span className="font-bold">{isAdmin ? '∞' : credits}</span>
                            <span className="opacity-60 text-xs">{t('credits.creditsUnit') || 'credits'}</span>
                        </div>

                        {/* Volla Studio Logo */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xl font-bold text-[#E06847]">Volla</span>
                            <span className="px-2 py-0.5 bg-[#1A1A1A] text-white text-sm font-semibold rounded-md">
                                {t('studio.studioLabel') || 'Studio'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            {studioMode === 'handsfree' ? (
                <HandsfreeMode
                    marketplace={marketplace}
                    onBack={() => setStudioMode('standard')}
                    onNavigate={onNavigate}
                />
            ) : studioMode === 'motion' ? (
                <MotionMode
                    marketplace={marketplace}
                    onNavigate={onNavigate}
                    initialProject={initialProject?.productInfo?.featureType === 'motion' ? initialProject : null}
                />
            ) : (
                <main className="flex-1 flex min-h-0">
                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    {/* LEFT PANEL - 30% - Upload & Configuration */}
                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    <aside className="w-[30%] min-w-[320px] max-w-[400px] bg-white border-r border-[#E8E7E4] overflow-y-auto">
                        <div className="p-5 space-y-5">
                            {/* Upload Zone */}
                            {renderUploadZone()}

                            {/* Marketplace Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-[#5C5C5C] uppercase tracking-wide">
                                    {t('marketplace.title') || 'Marketplace'}
                                </label>
                                {renderPlatformSelector()}
                            </div>

                            {/* Photo Type Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-[#5C5C5C] uppercase tracking-wide">
                                    {t('studioRedesign.photoType.title') || 'Photo Type'}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'reallife', label: t('studioRedesign.photoType.realLife') || 'Real Life', icon: Users },
                                        { id: 'shots', label: t('studioRedesign.photoType.shots') || 'Shots', icon: Camera },
                                        { id: 'studio', label: t('studioRedesign.photoType.studio') || 'Studio', icon: ImageIcon }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setPhotoType(type.id)}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                                                photoType === type.id
                                                    ? 'bg-[#5C5C5C] text-white border-[#5C5C5C]'
                                                    : 'bg-white text-[#5C5C5C] border-[#E8E7E4] hover:border-[#5C5C5C]'
                                            }`}
                                        >
                                            <type.icon size={18} />
                                            <span className="text-xs font-medium">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Output Count Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-[#5C5C5C] uppercase tracking-wide">
                                    {t('studioRedesign.outputCount.title') || 'Output Count'}
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4].map(count => (
                                        <button
                                            key={count}
                                            onClick={() => setOutputCount(count)}
                                            className={`aspect-square rounded-xl font-bold text-lg border-2 transition-all ${
                                                outputCount === count
                                                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                    : 'bg-white text-[#5C5C5C] border-[#E8E7E4] hover:border-[#1A1A1A]'
                                            }`}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Aspect Ratio Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-[#5C5C5C] uppercase tracking-wide">
                                    {t('studioRedesign.aspectRatio.title') || 'Aspect Ratio'}
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {ASPECT_RATIOS.map(ratio => (
                                        <button
                                            key={ratio.value}
                                            onClick={() => setAspectRatio(ratio.value)}
                                            className={`py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                                aspectRatio === ratio.value
                                                    ? 'bg-[#5C5C5C] text-white border-[#5C5C5C]'
                                                    : 'bg-white text-[#5C5C5C] border-[#E8E7E4] hover:border-[#5C5C5C]'
                                            }`}
                                        >
                                            {ratio.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Prompt - Optional */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-[#5C5C5C] uppercase tracking-wide flex items-center gap-2">
                                    {t('studioRedesign.customPrompt.title') || 'Custom Prompt'}
                                    <span className="text-[10px] font-normal text-[#8C8C8C] normal-case">({t('common.optional') || 'Optional'})</span>
                                </label>
                                <textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder={t('studioRedesign.customPrompt.placeholder') || 'Add extra instructions for AI...'}
                                    className="w-full p-3 rounded-xl border-2 border-[#E8E7E4] focus:border-[#E06847] focus:outline-none text-sm resize-none"
                                    rows={3}
                                />
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleUnifiedGenerate}
                                disabled={sessionAssets.length === 0 || studioLoading || anglesLoading || realLifeLoading}
                                className={`w-full py-4 rounded-2xl font-bold text-lg flex flex-col items-center gap-1 transition-all ${
                                    sessionAssets.length === 0 || studioLoading || anglesLoading || realLifeLoading
                                        ? 'bg-[#E8E7E4] text-[#8C8C8C] cursor-not-allowed'
                                        : 'bg-[#E06847] hover:bg-[#D05737] text-white'
                                }`}
                            >
                                {studioLoading || anglesLoading || realLifeLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span className="text-sm">{t('common.generating') || 'Generating...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{t('studioRedesign.generate.button') || 'Generate'}</span>
                                        <span className="text-xs opacity-70">
                                            {calculateGenerationCost(outputCount, !!(marketplace && seoAnalyzedForMarketplace !== marketplace), false)} {t('credits.creditsUnit') || 'credits'}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </aside>

                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    {/* CENTER CANVAS - 50% - Main Display */}
                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    <section className="flex-1 bg-[#FAF9F6] p-6 flex flex-col overflow-y-auto">
                        {/* Error Display */}
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                {error}
                                <button onClick={() => setError(null)} className="float-right font-bold">×</button>
                            </div>
                        )}

                        {/* Main Stage */}
                        {sessionAssets.length > 0 ? (
                            renderMainStage()
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-[#8C8C8C]">
                                    <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-sm">{t('studio.uploadFirst') || 'Upload an image to get started'}</p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    {/* RIGHT PANEL - 30% - SEO Results (same width as left panel for alignment) */}
                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    <aside className="w-[30%] min-w-[320px] max-w-[400px] bg-white border-l border-[#E8E7E4] flex flex-col">
                        <div className="p-5 flex-1 flex flex-col overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                                    <Search size={16} />
                                    {t('results.seoResults') || 'SEO Results'}
                                </h3>
                                {/* SEO Action Buttons */}
                                {results && marketplace && (
                                    <div className="flex items-center gap-1">
                                        {/* Refresh SEO Button with Custom Tooltip */}
                                        <div className="relative group">
                                            <button
                                                onClick={handleRefreshSEO}
                                                disabled={loading}
                                                className="p-1.5 hover:bg-[#F5F4F1] rounded-lg transition-colors text-[#5C5C5C] hover:text-[#E06847] disabled:opacity-50"
                                            >
                                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                            </button>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1A1A1A] text-white text-[10px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                1 {t('credits.creditsUnit') || 'credit'}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1A1A]"></div>
                                            </div>
                                        </div>
                                        {/* Clear SEO Button - No Tooltip */}
                                        <button
                                            onClick={() => {
                                                setResults(null);
                                                setProductInfo(null);
                                                setSeoAnalyzedForMarketplace(null);
                                                console.log('🗑️ SEO cleared - platform can be re-selected');
                                            }}
                                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-[#5C5C5C] hover:text-red-500"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Content area - fills remaining space */}
                            <div className="flex-1 flex flex-col">
                                {marketplace ? (
                                    results ? (
                                        renderSEOResults()
                                    ) : loading ? (
                                        <div className="flex-1 flex items-center justify-center">
                                            <Loader2 className="animate-spin text-[#E06847]" size={24} />
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center">
                                            <p className="text-sm text-[#8C8C8C] text-center">
                                                {t('studio.generateToSeeSEO') || 'Generate images to see SEO recommendations'}
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center">
                                        <Store size={32} className="mb-3 text-[#E8E7E4]" />
                                        <p className="text-sm text-[#8C8C8C] text-center">
                                            {t('studioRedesign.seoPanel.noMarketplace') || 'Select a marketplace to get SEO recommendations'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </main>
            )}

            {/* Source Selection Modal */}
            <SourceSelectionModal
                isOpen={showSourceModal}
                onClose={() => setShowSourceModal(false)}
                onSelectFromLibrary={handleSelectFromLibrary}
                onSelectFromDevice={() => fileInputRef.current?.click()}
                acceptVideo={false}
            />
        </div>
    );
}
