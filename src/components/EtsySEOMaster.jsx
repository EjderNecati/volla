import React, { useState, useEffect } from 'react';
import { Upload, Copy, Sparkles, Check, X, AlertCircle, Plus, TrendingUp, TrendingDown, Minus, Target, Users, BarChart3, Settings, Key, ShoppingBag, Store, ShoppingCart, Image, FileText, Tag, Search, Type, Camera, Clock, Trash2, Download } from 'lucide-react';
import { analyzeImage, analyzeText, fileToBase64, generateStudioImage, generateProductAngles, generateRealLifePhotos } from '../utils/aiHelpers';

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
    const [vertexApiKey, setVertexApiKey] = useState('');
    const [hasApiKey, setHasApiKey] = useState(false);
    const [marketplace, setMarketplace] = useState('etsy');
    const [inputMode, setInputMode] = useState('image');
    const [textInput, setTextInput] = useState('');

    // Studio Mode State
    const [studioModeEnabled, setStudioModeEnabled] = useState(false);
    const [studioImage, setStudioImage] = useState(null);
    const [studioBackground, setStudioBackground] = useState(null); // Background URL for composite
    const [activeTab, setActiveTab] = useState('original'); // 'original' or 'studio'

    // Multi-Angle Shot Generator State (v3.0 - Dynamic Detection)
    const [angleImages, setAngleImages] = useState({ shot1: null, shot2: null, shot3: null });
    const [angleLabels, setAngleLabels] = useState({ shot1: 'Rotation', shot2: 'Context', shot3: 'Detail' });
    const [detectedAngle, setDetectedAngle] = useState(null);
    const [anglesLoading, setAnglesLoading] = useState(false);
    const [anglesError, setAnglesError] = useState(null);

    // Real Life Photos State (Hyper-Realistic Lifestyle)
    const [realLifeImages, setRealLifeImages] = useState({ shot1: null, shot2: null, shot3: null });
    const [realLifeLabels, setRealLifeLabels] = useState({ shot1: 'Lifestyle 1', shot2: 'Lifestyle 2', shot3: 'Lifestyle 3' });
    const [realLifeLoading, setRealLifeLoading] = useState(false);
    const [realLifeError, setRealLifeError] = useState(null);

    // ═══════════════════════════════════════════════════════════════════
    // SESSION GALLERY STATE - For selecting individual generated images
    // ═══════════════════════════════════════════════════════════════════
    const [galleryImages, setGalleryImages] = useState([]); // [{id, type, imageData, label}]
    const [selectedGalleryImage, setSelectedGalleryImage] = useState(null); // Currently selected for main view

    // Sync marketplace to localStorage for SettingsModal theming
    useEffect(() => {
        localStorage.setItem('volla_marketplace', marketplace);
    }, [marketplace]);

    // Add image to gallery with UNIQUE ID
    const addToGallery = (type, imageData, label) => {
        // Use Date.now() + random to ensure unique IDs even when adding multiple images quickly
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newImage = { id: uniqueId, type, imageData, label };
        setGalleryImages(prev => [...prev, newImage]);
        console.log('📸 Added to gallery:', type, label, uniqueId);
        return newImage.id;
    };

    // Clear gallery for new analysis
    const clearGallery = () => {
        setGalleryImages([]);
        setSelectedGalleryImage(null);
    };

    // Get the image to use for generation (selected gallery image OR studio/original)
    const getSourceImageForGeneration = () => {
        if (selectedGalleryImage) {
            return selectedGalleryImage.imageData;
        }
        // Fallback: use studio image if on studio tab, otherwise original
        return (activeTab === 'studio' && studioImage) ? studioImage : image;
    };

    // History State
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null); // Track active session for updates

    // Load API key and history on mount
    useEffect(() => {
        const savedKey = localStorage.getItem('volla_api_key');
        const savedVertexKey = localStorage.getItem('volla_vertex_api_key');
        if (savedKey) {
            setApiKey(savedKey);
            setHasApiKey(true);
        }
        if (savedVertexKey) {
            setVertexApiKey(savedVertexKey);
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
            console.log('📦 History saved, entries:', newHistory.length);
        } catch (e) {
            console.error('Failed to save history:', e);
            // If localStorage is full, try removing oldest entries
            if (e.name === 'QuotaExceededError') {
                const trimmed = newHistory.slice(0, Math.floor(newHistory.length / 2));
                try {
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
                    setHistory(trimmed);
                    console.warn('⚠️ History trimmed due to storage limit');
                } catch (e2) {
                    console.error('Still failed after trim:', e2);
                }
            }
        }
    };

    // Add to history (FIFO, max 20) - NOW includes AI Studio, Angles, and Real Life
    // CRITICAL: Read from localStorage to avoid stale closure issues
    const addToHistory = (analysisData, base64ForHistory = null, aiStudioImg = null, angleImgs = null) => {
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
            results: analysisData,
            // AI Studio, Multi-Angle, and Real Life persistence
            studioImage: aiStudioImg || null,
            angleImages: angleImgs || null,
            realLifeImages: null // Will be updated later when generated
        };

        // CRITICAL FIX: Read fresh history from localStorage to avoid stale state
        let currentHistory = [];
        try {
            const savedHistory = localStorage.getItem(HISTORY_KEY);
            if (savedHistory) {
                currentHistory = JSON.parse(savedHistory);
            }
        } catch (e) {
            console.error('Failed to read history from localStorage:', e);
            currentHistory = history; // Fallback to state if localStorage fails
        }

        const newHistory = [newEntry, ...currentHistory].slice(0, MAX_HISTORY);
        saveHistory(newHistory);
        setCurrentSessionId(newEntry.id); // Set as current active session
        console.log('📦 Added to history, total entries:', newHistory.length);
        return newEntry.id; // Return ID for later updates
    };

    // Restore from history - NOW includes AI Studio and Angles
    // CRITICAL: Accept entry ID and fetch FRESH data from localStorage
    const restoreFromHistory = (entryOrId) => {
        // If passed an object, use its ID to fetch fresh data
        const entryId = typeof entryOrId === 'object' ? entryOrId.id : entryOrId;

        // Fetch fresh data from localStorage to ensure we have latest updates
        let freshEntry = null;
        try {
            const savedHistory = localStorage.getItem(HISTORY_KEY);
            if (savedHistory) {
                const parsed = JSON.parse(savedHistory);
                freshEntry = parsed.find(e => e.id === entryId);
            }
        } catch (e) {
            console.error('Error fetching fresh entry:', e);
        }

        // Fallback to state if localStorage fetch fails
        const entry = freshEntry || history.find(e => e.id === entryId) || entryOrId;

        console.log('📂 Restoring entry:', entry.id, {
            hasStudioImage: !!entry.studioImage,
            hasAngleImages: !!entry.angleImages,
            angleImagesKeys: entry.angleImages ? Object.keys(entry.angleImages) : []
        });

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

        // CRITICAL: Set this entry as the current active session for updates
        setCurrentSessionId(entry.id);

        // NEW: Restore AI Studio image if exists
        if (entry.studioImage) {
            setStudioImage(entry.studioImage);
            setActiveTab('studio'); // Show AI Studio tab if we have the image
        } else {
            setStudioImage(null);
            setActiveTab('original');
        }

        // NEW: Restore Multi-Angle shots if exists
        if (entry.angleImages) {
            console.log('🖼️ Restoring angles:', {
                shot1: entry.angleImages.shot1 ? 'EXISTS' : 'NULL',
                shot2: entry.angleImages.shot2 ? 'EXISTS' : 'NULL',
                shot3: entry.angleImages.shot3 ? 'EXISTS' : 'NULL'
            });
            setAngleImages(entry.angleImages);
        } else {
            console.log('⚠️ No angleImages in entry');
            setAngleImages({ shot1: null, shot2: null, shot3: null });
        }

        // NEW: Restore Real Life images if exists
        if (entry.realLifeImages) {
            console.log('🏞️ Restoring real life images');
            setRealLifeImages(entry.realLifeImages);
        } else {
            setRealLifeImages({ shot1: null, shot2: null, shot3: null });
        }
        setRealLifeLabels({ shot1: 'Lifestyle 1', shot2: 'Lifestyle 2', shot3: 'Lifestyle 3' });
        setRealLifeError(null);
    };

    // Clear all history
    const clearHistory = () => {
        if (confirm('Tüm geçmişi silmek istediğinize emin misiniz?')) {
            saveHistory([]);
        }
    };

    // Update existing history entry with new data (AI Studio or Angles)
    const updateHistoryEntry = (entryId, updates) => {
        // Use functional setState to ensure we have latest history
        setHistory(prevHistory => {
            const updatedHistory = prevHistory.map(entry => {
                if (entry.id === entryId) {
                    const updated = { ...entry, ...updates };
                    console.log('🔄 Updating entry:', entryId, 'with:', Object.keys(updates));
                    return updated;
                }
                return entry;
            });

            // Save to localStorage immediately
            try {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
                console.log('💾 History entry updated and saved to localStorage');
            } catch (e) {
                console.error('Failed to save updated history:', e);
            }

            return updatedHistory;
        });
    };

    // Get current session ID (the active session being viewed/edited)
    const getActiveSessionId = () => {
        // Return the tracked current session, or fallback to most recent
        return currentSessionId || (history.length > 0 ? history[0].id : null);
    };

    const saveApiKey = () => {
        if (apiKey.trim()) {
            localStorage.setItem('volla_api_key', apiKey.trim());
            setHasApiKey(true);
        }
        if (vertexApiKey.trim()) {
            localStorage.setItem('volla_vertex_api_key', vertexApiKey.trim());
        }
        setShowSettings(false);
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

            // Smart AI Studio Mode: Generate context-aware scene
            let studioResult = null;
            if (studioModeEnabled && apiResults.category) {
                setLoadingStep('✨ Detecting product category...');
                await new Promise(resolve => setTimeout(resolve, 800));

                setLoadingStep('🎬 Setting up AI studio scene...');
                studioResult = await generateStudioImage(apiResults.category, base64ForApi, apiResults);

                // Store both the generated image and background
                if (studioResult.image) {
                    setStudioImage(studioResult.image);
                    // Add studio image to gallery
                    addToGallery('STUDIO', studioResult.image, 'AI Studio');
                }
                if (studioResult.background) {
                    setStudioBackground(studioResult.background);
                }
                // Studio mode activated
                setActiveTab('studio'); // Auto-switch to studio tab
            }

            // Add original image to gallery
            clearGallery(); // Clear old gallery first
            addToGallery('ORIGINAL', fullDataUrl, 'Original');
            if (studioResult?.image) {
                addToGallery('STUDIO', studioResult.image, 'AI Studio');
            }

            // Add to history after successful analysis with optimized image AND studio image
            const studioImg = studioResult?.image || null;
            addToHistory(processedResults, optimizedImageUrl || fullDataUrl, studioImg);

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
        // Reset AI Studio state (PHANTOM IMAGE FIX)
        setStudioImage(null);
        setStudioBackground(null);
        setActiveTab('original');
        // Reset multi-angle state (v3.0)
        setAngleImages({ shot1: null, shot2: null, shot3: null });
        setAngleLabels({ shot1: 'Rotation', shot2: 'Context', shot3: 'Detail' });
        setDetectedAngle(null);
        setAnglesError(null);
        // Reset Real Life state (FIX: Clear old real life photos)
        setRealLifeImages({ shot1: null, shot2: null, shot3: null });
        setRealLifeLabels({ shot1: 'Lifestyle 1', shot2: 'Lifestyle 2', shot3: 'Lifestyle 3' });
        setRealLifeError(null);
        // Reset Gallery state
        clearGallery();
        // Reset session tracker
        setCurrentSessionId(null);
    };

    // Multi-Angle Shot Generator Handler (v3.0 - Dynamic Detection)
    const handleGenerateAngles = async () => {
        setAnglesLoading(true);
        setAnglesError(null);
        setAngleImages({ shot1: null, shot2: null, shot3: null });

        try {
            // SESSION GALLERY: Use selected gallery image if available
            const sourceImage = getSourceImageForGeneration();

            if (!sourceImage) {
                throw new Error('No source image available');
            }

            console.log('📸 Generating angles from:', selectedGalleryImage?.label || 'main image');

            // Determine source context based on selected image type
            // If LIFE image selected → preserve scene environment
            // If STUDIO/ORIGINAL or no selection → use clean studio background
            const sourceContext = selectedGalleryImage?.type === 'LIFE' ? 'LIFE' : 'STUDIO';
            console.log('🎬 Source context:', sourceContext);

            // Pass source context to backend for scene-aware generation
            const result = await generateProductAngles(sourceImage, sourceContext);

            if (result.success) {
                // v3.0: Set dynamic images and labels
                const generatedAngles = {
                    shot1: result.shot1,
                    shot2: result.shot2,
                    shot3: result.shot3
                };
                setAngleImages(generatedAngles);

                // Set dynamic labels based on detected angle
                if (result.labels) {
                    setAngleLabels(result.labels);
                }
                if (result.detectedAngle) {
                    setDetectedAngle(result.detectedAngle);
                }

                // Add generated shots to gallery for individual selection
                const shotLabels = result.labels || { shot1: 'Shot 1', shot2: 'Shot 2', shot3: 'Shot 3' };
                if (result.shot1) addToGallery('SHOT', result.shot1, shotLabels.shot1);
                if (result.shot2) addToGallery('SHOT', result.shot2, shotLabels.shot2);
                if (result.shot3) addToGallery('SHOT', result.shot3, shotLabels.shot3);

                // SAVE TO HISTORY: Update the ACTIVE session with angle images
                const sessionId = getActiveSessionId();
                if (sessionId) {
                    updateHistoryEntry(sessionId, { angleImages: generatedAngles });
                    console.log('✅ Angles saved to session:', sessionId);
                }
            } else {
                throw new Error('Generation failed');
            }
        } catch (err) {
            setAnglesError(err.message || 'Failed to generate angles');
        } finally {
            setAnglesLoading(false);
        }
    };

    // Real Life Photos Generator Handler (Hyper-Realistic Lifestyle)
    const handleGenerateRealLife = async () => {
        setRealLifeLoading(true);
        setRealLifeError(null);
        setRealLifeImages({ shot1: null, shot2: null, shot3: null });

        try {
            // SESSION GALLERY: Use selected gallery image if available
            const sourceImage = getSourceImageForGeneration();

            if (!sourceImage) {
                throw new Error('No source image available');
            }

            // Pass product info for context-aware generation
            const productInfo = results ? {
                product_type: results._productInfo?.product_type || '',
                category: results.category || '',
                camera_angle: results._productInfo?.camera_angle || 'FRONT',
                is_hanging_product: results._productInfo?.is_hanging_product || false
            } : {};

            const result = await generateRealLifePhotos(sourceImage, productInfo);

            if (result.success) {
                const generatedRealLife = {
                    shot1: result.shot1,
                    shot2: result.shot2,
                    shot3: result.shot3
                };
                setRealLifeImages(generatedRealLife);

                // Set dynamic labels from analysis
                if (result.labels) {
                    setRealLifeLabels(result.labels);
                }

                // Add Real Life photos to gallery for individual selection
                console.log('🏞️ Adding Real Life photos to gallery');
                const lifeLabels = result.labels || { shot1: 'Life 1', shot2: 'Life 2', shot3: 'Life 3' };
                if (result.shot1) addToGallery('LIFE', result.shot1, lifeLabels.shot1);
                if (result.shot2) addToGallery('LIFE', result.shot2, lifeLabels.shot2);
                if (result.shot3) addToGallery('LIFE', result.shot3, lifeLabels.shot3);

                // SAVE TO HISTORY
                const sessionId = getActiveSessionId();
                if (sessionId) {
                    updateHistoryEntry(sessionId, { realLifeImages: generatedRealLife });
                    console.log('✅ Real Life saved to session:', sessionId);
                }
            } else {
                throw new Error('Generation failed');
            }
        } catch (err) {
            setRealLifeError(err.message || 'Failed to generate real life photos');
        } finally {
            setRealLifeLoading(false);
        }
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
            default: return 'text-[#5C5C5C] bg-[#6F7A6C]/20 border-[#6F7A6C]/30';
        }
    };

    // Quiet Luxury label styling based on marketplace - MINIMAL VERSION
    const getLuxuryLabelClass = (marketplace) => {
        const baseClass = 'font-sans text-[11px] tracking-[0.2em] uppercase font-bold mb-2';
        switch (marketplace) {
            case 'etsy': return `${baseClass} text-orange-600`;
            case 'amazon': return `${baseClass} text-amber-600`;
            case 'shopify': return `${baseClass} text-emerald-600`;
            default: return `${baseClass} text-[#1A1A1A]`;
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
            default: return 'from-[#D4C49A] to-[#BCA879]';
        }
    };

    const getMarketplaceBadge = (mp) => {
        switch (mp) {
            case 'etsy': return { icon: '🏪', text: 'ETSY', color: 'bg-orange-500', dotColor: 'bg-orange-500' };
            case 'amazon': return { icon: '📦', text: 'AMAZON', color: 'bg-amber-500', dotColor: 'bg-amber-500' };
            case 'shopify': return { icon: '🛒', text: 'SHOPIFY', color: 'bg-green-500', dotColor: 'bg-green-500' };
            default: return { icon: '📊', text: 'SEO', color: 'bg-[#6F7A6C]', dotColor: 'bg-[#6F7A6C]' };
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
        <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-poppins selection:bg-[#E06847] selection:text-[#0D1818]">

            {/* ═══════════════════════════════════════════════════════ */}
            {/* HISTORY SLIDE-OVER PANEL */}
            {/* ═══════════════════════════════════════════════════════ */}
            {showHistory && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-[#FAF9F6]/80 backdrop-blur-sm z-[90] transition-opacity"
                        onClick={() => setShowHistory(false)}
                    />

                    {/* Panel */}
                    <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white border-l border-[#E8E7E4] z-[95] shadow-2xl animate-slide-in-right overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-5 border-b border-[#E8E7E4] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock size={20} className={`${marketplace === 'amazon' ? 'text-[#FF9900]' : marketplace === 'shopify' ? 'text-[#96BF48]' : 'text-[#F1641E]'}`} />
                                <h2 className="text-lg font-semibold text-[#1A1A1A]">Recent Analyses</h2>
                                <span className="text-xs px-2 py-0.5 bg-[#F5F4F1] rounded-full text-[#5C5C5C]">
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
                                    className="p-2 hover:bg-[#F5F4F1] text-[#5C5C5C] hover:text-[#1A1A1A] rounded-lg transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* History List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <Clock size={48} className="text-[#4B5046] mb-4" />
                                    <p className="text-[#8C8C8C] text-sm">No analysis history yet</p>
                                    <p className="text-[#4B5046] text-xs mt-1">Your analyses will appear here</p>
                                </div>
                            ) : (
                                history.map((entry) => {
                                    const badge = getMarketplaceBadge(entry.marketplace);
                                    return (
                                        <button
                                            key={entry.id}
                                            onClick={() => restoreFromHistory(entry)}
                                            className="w-full p-4 bg-[#F5F4F1] hover:bg-white border border-[#E8E7E4] hover:border-[#E06847] rounded-xl transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Thumbnail */}
                                                <div className="w-12 h-12 rounded-lg bg-[#FAF9F6] flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                    {entry.image ? (
                                                        <img
                                                            src={entry.image}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Type size={20} className="text-[#8C8C8C]" />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[#1A1A1A] truncate group-hover:text-[#1A1A1A] transition">
                                                        {entry.title?.substring(0, 40) || 'Untitled'}
                                                        {entry.title?.length > 40 && '...'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#5C5C5C]/60">
                                                            {formatTimeAgo(entry.timestamp)}
                                                        </span>
                                                        <span className="text-[#4B5046]">•</span>
                                                        <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#5C5C5C]/60 flex items-center gap-1">
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
                    <div className="bg-[#F5F4F1] border border-[#E8E7E4] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Key className="w-5 h-5 text-[#E06847]" />
                                <h2 className="text-lg font-semibold">API Key Settings</h2>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white rounded-full transition">
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-sm text-[#5C5C5C] mb-4">
                            Enter your Gemini API key. Get free at{' '}
                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[#E06847] hover:underline">
                                Google AI Studio
                            </a>
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-[#E06847] uppercase tracking-wider mb-2">
                                🔵 Google Gemini API Key
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIza..."
                                className="w-full px-4 py-3 bg-white border border-[#E8E7E4] rounded-xl text-white placeholder-[#6F7A6C] focus:outline-none focus:border-[#D4C49A] transition"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                                🔶 Vertex AI API Key (Imagen 3)
                            </label>
                            <input
                                type="password"
                                value={vertexApiKey}
                                onChange={(e) => setVertexApiKey(e.target.value)}
                                placeholder="AQ.Ab8..."
                                className="w-full px-4 py-3 bg-white border border-[#E8E7E4] rounded-xl text-white placeholder-[#6F7A6C] focus:outline-none focus:border-amber-500 transition"
                            />
                            <p className="text-[10px] text-[#8C8C8C] mt-1">
                                Required for AI Studio & Multi-Angle shots.
                            </p>
                        </div>

                        <button
                            onClick={saveApiKey}
                            disabled={!apiKey.trim()}
                            className="w-full py-3 bg-[#E06847] hover:bg-[#D4C49A] disabled:bg-[#4B5046] disabled:cursor-not-allowed rounded-xl font-medium transition"
                        >
                            Save API Key
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* HEADER */}
            {/* ═══════════════════════════════════════════════════════ */}
            <header className="header-luxury w-full px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold tracking-tight text-gold">
                    VOLLA
                </h1>
                <div className="flex items-center gap-3">
                    {results?._grounded && (
                        <span className="badge-gold">
                            🔍 LIVE DATA
                        </span>
                    )}

                    {/* History Button */}
                    <button
                        onClick={() => setShowHistory(true)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-[#E8E7E4] transition-all relative text-[#5C5C5C] ${marketplace === 'amazon' ? 'hover:border-[#FF9900] hover:text-[#FF9900]' : marketplace === 'shopify' ? 'hover:border-[#96BF48] hover:text-[#96BF48]' : 'hover:border-[#F1641E] hover:text-[#F1641E]'}`}
                    >
                        <Clock size={18} />
                        {history.length > 0 && (
                            <span className={`absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center ${marketplace === 'amazon' ? 'bg-[#FF9900] text-black' : marketplace === 'shopify' ? 'bg-[#96BF48] text-white' : 'bg-[#F1641E] text-white'}`}>
                                {history.length}
                            </span>
                        )}
                    </button>

                    {/* Settings Button */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${hasApiKey ? `bg-white border border-[#E8E7E4] text-[#5C5C5C] ${marketplace === 'amazon' ? 'hover:border-[#FF9900] hover:text-[#FF9900]' : marketplace === 'shopify' ? 'hover:border-[#96BF48] hover:text-[#96BF48]' : 'hover:border-[#F1641E] hover:text-[#F1641E]'}` : 'bg-[#E06847]/20 border border-[#BCA879]/50 text-[#E06847]'}`}
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-md md:max-w-2xl">

                {/* SELECTION TOGGLES */}
                {!results && !loading && (
                    <>
                        {/* PLATFORM SELECTOR */}
                        <div className="flex justify-center mb-6">
                            <div className="inline-flex bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl p-1 gap-1 shadow-sm">
                                <button
                                    onClick={() => setMarketplace('etsy')}
                                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${marketplace === 'etsy'
                                        ? 'bg-[#F1641E] text-white shadow-sm'
                                        : 'text-[#5C5C5C] hover:bg-white hover:text-[#1A1A1A]'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Store size={16} />
                                        <span>ETSY</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setMarketplace('amazon')}
                                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${marketplace === 'amazon'
                                        ? 'bg-[#FF9900] text-black shadow-sm'
                                        : 'text-[#5C5C5C] hover:bg-white hover:text-[#1A1A1A]'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <ShoppingBag size={16} />
                                        <span>AMAZON</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setMarketplace('shopify')}
                                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${marketplace === 'shopify'
                                        ? 'bg-[#96BF48] text-white shadow-sm'
                                        : 'text-[#5C5C5C] hover:bg-white hover:text-[#1A1A1A]'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart size={16} />
                                        <span>SHOPIFY</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* INPUT MODE SELECTOR */}
                        <div className="flex justify-center mb-8">
                            <div className="inline-flex bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl p-1 gap-1 shadow-sm">
                                <button
                                    onClick={() => setInputMode('image')}
                                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${inputMode === 'image'
                                        ? `${marketplace === 'amazon' ? 'bg-[#FF9900] text-black' : marketplace === 'shopify' ? 'bg-[#96BF48] text-white' : 'bg-[#F1641E] text-white'} shadow-sm`
                                        : 'text-[#5C5C5C] hover:bg-white hover:text-[#1A1A1A]'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Camera size={16} />
                                        <span>Photo</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setInputMode('text')}
                                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${inputMode === 'text'
                                        ? `${marketplace === 'amazon' ? 'bg-[#FF9900] text-black' : marketplace === 'shopify' ? 'bg-[#96BF48] text-white' : 'bg-[#F1641E] text-white'} shadow-sm`
                                        : 'text-[#5C5C5C] hover:bg-white hover:text-[#1A1A1A]'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Type size={16} />
                                        <span>Text</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {!image && !results && !loading && inputMode === 'image' && (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
                        {/* Upload Zone */}
                        <label className={`w-64 h-48 flex flex-col items-center justify-center cursor-pointer bg-white border-2 border-dashed border-[#D4D3D0] rounded-2xl p-12 text-center transition-all hover-lift ${marketplace === 'amazon' ? 'hover:border-[#FF9900] hover:bg-[#FF9900]/5' : marketplace === 'shopify' ? 'hover:border-[#96BF48] hover:bg-[#96BF48]/5' : 'hover:border-[#F1641E] hover:bg-[#F1641E]/5'}`}>
                            <Upload className="w-12 h-12 text-[#8C8C8C] mb-3" />
                            <span className="text-[#1A1A1A] font-medium">Upload Photo</span>
                            <span className="text-[#5C5C5C] text-sm mt-1">Click or drag & drop</span>
                            <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
                        </label>
                        <p className="text-[#8C8C8C] text-sm max-w-xs">
                            Upload your product photo for AI-optimized {marketplace.toUpperCase()} listing.
                        </p>

                        {/* Smart AI Studio Mode Toggle */}
                        <div className="mt-6 flex items-center gap-3 px-5 py-3 bg-white border border-[#E8E7E4] rounded-xl">
                            <Sparkles className={`w-4 h-4 ${marketplace === 'amazon' ? 'text-[#FF9900]' : marketplace === 'shopify' ? 'text-[#96BF48]' : 'text-[#F1641E]'}`} />
                            <div className="flex-1">
                                <p className="font-sans text-[11px] tracking-[0.15em] uppercase text-[#1A1A1A] font-bold">AI STUDIO MODE</p>
                                <p className="text-[10px] text-[#8C8C8C]">Context-aware product photography</p>
                            </div>
                            <button
                                onClick={() => setStudioModeEnabled(!studioModeEnabled)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${studioModeEnabled ? (marketplace === 'amazon' ? 'bg-[#FF9900]' : marketplace === 'shopify' ? 'bg-[#96BF48]' : 'bg-[#F1641E]') : 'bg-[#D4D3D0]'}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${studioModeEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

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
                            <div className="bg-[#F5F4F1] border border-[#E8E7E4] rounded-2xl p-5 shadow-xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <Type size={18} className={`${marketplace === 'amazon' ? 'text-[#FF9900]' : marketplace === 'shopify' ? 'text-[#96BF48]' : 'text-[#F1641E]'}`} />
                                    <span className="text-sm font-medium text-[#1A1A1A]">Product Description</span>
                                </div>
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Enter your product title, description, or any text you want to optimize for SEO..."
                                    className={`w-full h-48 px-4 py-3 bg-white border border-[#E8E7E4] rounded-xl text-[#1A1A1A] placeholder-[#8C8C8C] focus:outline-none transition resize-none ${marketplace === 'amazon' ? 'focus:border-[#FF9900]' : marketplace === 'shopify' ? 'focus:border-[#96BF48]' : 'focus:border-[#F1641E]'}`}
                                />
                                <div className="flex justify-between items-center mt-3">
                                    <span className="text-xs text-[#8C8C8C]">{textInput.length} characters</span>
                                    <button
                                        onClick={handleTextSubmit}
                                        disabled={!hasApiKey || textInput.trim().length < 10}
                                        className={`px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${hasApiKey && textInput.trim().length >= 10
                                            ? `bg-gradient-to-r ${getMarketplaceColor(marketplace)} text-white shadow-lg hover:opacity-90`
                                            : 'bg-[#4B5046] text-[#5C5C5C] cursor-not-allowed'
                                            }`}
                                    >
                                        <Sparkles size={16} />
                                        <span>Generate SEO</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="text-[#8C8C8C] text-sm max-w-xs text-center">
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
                            <div className="w-32 h-32 rounded-2xl overflow-hidden mb-6 border-2 border-[#E8E7E4] relative">
                                <img src={image} className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60" alt="" />
                                <img src={image} className="relative z-10 w-full h-full object-contain" alt="Analyzing" />
                            </div>
                        )}
                        {inputMode === 'text' && (
                            <div className="w-32 h-32 rounded-2xl bg-[#F5F4F1] border-2 border-[#E8E7E4] flex items-center justify-center mb-6">
                                <Type size={40} className="text-[#4B5046]" />
                            </div>
                        )}
                        <div className="relative w-16 h-16">
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-[#E8E7E4] rounded-full"></div>
                            <div className={`absolute top-0 left-0 w-full h-full border-4 rounded-full animate-spin border-t-transparent ${marketplace === 'amazon' ? 'border-amber-500' :
                                marketplace === 'shopify' ? 'border-green-500' : 'border-orange-500'
                                }`}></div>
                            <Sparkles className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 animate-pulse ${marketplace === 'amazon' ? 'text-amber-400' :
                                marketplace === 'shopify' ? 'text-green-400' : 'text-orange-400'
                                }`} />
                        </div>
                        <div className={`mt-6 px-6 py-4 rounded-xl border-2 ${marketplace === 'amazon' ? 'border-[#FF9900]/30 bg-[#FF9900]/5' : marketplace === 'shopify' ? 'border-[#96BF48]/30 bg-[#96BF48]/5' : 'border-[#F1641E]/30 bg-[#F1641E]/5'}`}>
                            <p className={`font-bold text-lg drop-shadow-sm ${marketplace === 'amazon' ? 'text-amber-600' :
                                marketplace === 'shopify' ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                {loadingStep || 'Analyzing...'}
                            </p>
                        </div>
                    </div>
                )}

                {/* STATE 3: ERROR */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-red-400 mb-2">Error Occurred</h2>
                        <p className="text-[#5C5C5C] text-sm mb-6 max-w-xs">{error}</p>
                        <button onClick={handleNewAnalysis} className="px-6 py-3 bg-white hover:bg-[#4B5046] rounded-full transition">
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
                            <div className="space-y-4">
                                {/* Tab Header (only show if Studio Mode enabled and studio image exists) */}
                                {studioModeEnabled && studioImage && (
                                    <div className="flex justify-center gap-2 p-1 bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl">
                                        <button
                                            onClick={() => setActiveTab('original')}
                                            className={`flex-1 py-2 px-4 rounded-lg font-sans text-[11px] tracking-[0.15em] uppercase font-bold transition-all ${activeTab === 'original'
                                                ? 'bg-[#1A1A1A] text-white'
                                                : 'text-[#5C5C5C] hover:text-[#1A1A1A]'
                                                }`}
                                        >
                                            ORIGINAL
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('studio')}
                                            className={`flex-1 py-2 px-4 rounded-lg font-sans text-[11px] tracking-[0.15em] uppercase font-bold transition-all ${activeTab === 'studio'
                                                ? `${marketplace === 'amazon' ? 'bg-[#FF9900]' : marketplace === 'shopify' ? 'bg-[#96BF48]' : 'bg-[#F1641E]'} text-white`
                                                : 'text-[#5C5C5C] hover:text-[#1A1A1A]'
                                                }`}
                                        >
                                            ✨ AI STUDIO
                                        </button>
                                    </div>
                                )}

                                {/* Image Display */}
                                <div className="relative w-full h-72 rounded-2xl overflow-hidden shadow-lg border border-[#E8E7E4] group">
                                    {/* PRIORITY 1: Selected Gallery Image */}
                                    {selectedGalleryImage ? (
                                        <>
                                            {/* Blur background */}
                                            <img
                                                src={selectedGalleryImage.imageData}
                                                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
                                                alt=""
                                            />
                                            {/* Main image */}
                                            <img
                                                src={selectedGalleryImage.imageData}
                                                className="relative z-10 w-full h-full object-contain"
                                                alt={selectedGalleryImage.label}
                                            />
                                        </>
                                    ) : activeTab === 'studio' && (studioImage || studioBackground) ? (
                                        <>
                                            {/* AI Studio View */}
                                            {studioImage ? (
                                                // AI Generated Image (full replacement)
                                                <>
                                                    {/* Blur background */}
                                                    <img
                                                        src={studioImage}
                                                        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
                                                        alt=""
                                                    />
                                                    {/* Main image */}
                                                    <img
                                                        src={studioImage}
                                                        className="relative z-10 w-full h-full object-contain"
                                                        alt="AI Generated"
                                                    />
                                                </>
                                            ) : (
                                                // Fallback: Composite view
                                                <>
                                                    <img
                                                        src={studioBackground}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                        alt="Background"
                                                    />
                                                    <img
                                                        src={image}
                                                        className="relative z-10 w-full h-full object-contain"
                                                        alt="Product"
                                                        style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
                                                    />
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {/* Original View */}
                                            <img
                                                src={image}
                                                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
                                                alt=""
                                            />
                                            <img
                                                src={image}
                                                className="relative z-10 w-full h-full object-contain"
                                                alt="Preview"
                                            />
                                        </>
                                    )}

                                    {/* Close button */}
                                    <button
                                        onClick={handleNewAnalysis}
                                        className="absolute top-3 right-3 z-20 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-red-500/80 transition"
                                    >
                                        <X size={16} />
                                    </button>

                                    {/* Price badge */}
                                    {results.price && (
                                        <div className="absolute bottom-3 left-3 z-20 px-3 py-1.5 bg-emerald-500/80 backdrop-blur-md rounded-full text-white text-sm font-medium">
                                            {results.price}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════════════════════════════════════════════ */}
                        {/* FILM STRIP: Clickable thumbnail gallery of all images */}
                        {/* ═══════════════════════════════════════════════════════════ */}
                        {galleryImages.length > 0 && (
                            <div className="mt-4 p-3 bg-[#F5F4F1]/80 border border-[#E8E7E4]/50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-[#5C5C5C] uppercase tracking-wider">
                                        Select Image for Next Generation
                                    </span>
                                    <span className="text-xs text-[#8C8C8C]">
                                        {galleryImages.length} image{galleryImages.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {galleryImages.map((img) => {
                                        const isSelected = selectedGalleryImage?.id === img.id;
                                        const typeColors = {
                                            'ORIGINAL': 'bg-blue-500',
                                            'STUDIO': marketplace === 'amazon' ? 'bg-[#FF9900]' : marketplace === 'shopify' ? 'bg-[#96BF48]' : 'bg-[#F1641E]',
                                            'LIFE': marketplace === 'amazon' ? 'bg-[#FF9900]' : marketplace === 'shopify' ? 'bg-[#96BF48]' : 'bg-[#F1641E]',
                                            'SHOT': marketplace === 'amazon' ? 'bg-[#FF9900]' : marketplace === 'shopify' ? 'bg-[#96BF48]' : 'bg-[#F1641E]'
                                        };
                                        return (
                                            <button
                                                key={img.id}
                                                onClick={() => {
                                                    // Direct selection - click any image to select it
                                                    // Only clear if clicking the SAME already-selected image
                                                    if (isSelected) {
                                                        setSelectedGalleryImage(null);
                                                        console.log('🎯 Cleared selection');
                                                    } else {
                                                        setSelectedGalleryImage(img);
                                                        console.log('🎯 Selected:', img.label);
                                                    }
                                                }}
                                                className={`
                                                    relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden
                                                    border-2 transition-all duration-200
                                                    ${isSelected
                                                        ? 'border-[#D4C49A] ring-2 ring-[#D4C49A]/50 scale-105'
                                                        : 'border-[#E8E7E4] hover:border-[#8A9486]'
                                                    }
                                                `}
                                            >
                                                <img
                                                    src={img.imageData}
                                                    alt={img.label}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className={`absolute top-0.5 left-0.5 px-1 py-0.5 rounded text-[8px] font-bold uppercase ${typeColors[img.type]} text-white`}>
                                                    {img.type === 'LIFE' ? 'LIFE' : img.type.slice(0, 4)}
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-[#D4C49A]/20 flex items-center justify-center">
                                                        <div className="w-5 h-5 bg-[#D4C49A] rounded-full flex items-center justify-center">
                                                            <Check size={12} className="text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {selectedGalleryImage && (
                                    <p className={`text-xs mt-2 text-center ${marketplace === 'amazon' ? 'text-[#FF9900]' : marketplace === 'shopify' ? 'text-[#96BF48]' : 'text-[#F1641E]'}`}>
                                        ✨ "{selectedGalleryImage.label}" selected - Next generation will use this image
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ═══════════════════════════════════════════════════════════ */}
                        {/* ACTION BUTTONS - Always visible when image is ready */}
                        {/* ═══════════════════════════════════════════════════════════ */}
                        {(studioImage || selectedGalleryImage || (activeTab === 'original' && image)) && (
                            <div className="mt-4 space-y-3">
                                {/* Buttons Row - Always visible */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleGenerateAngles}
                                        disabled={anglesLoading}
                                        className="py-3 px-4 bg-gradient-to-r from-[#BCA879] to-[#A69361] hover:from-[#D4C49A] hover:to-[#BCA879] disabled:opacity-50 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg"
                                    >
                                        {anglesLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        ) : (
                                            <Camera size={18} />
                                        )}
                                        {anglesLoading ? 'Generating...' : '3 Shots'}
                                    </button>
                                    <button
                                        onClick={handleGenerateRealLife}
                                        disabled={realLifeLoading}
                                        className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg"
                                    >
                                        {realLifeLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        ) : (
                                            <span>🌟</span>
                                        )}
                                        {realLifeLoading ? 'Generating...' : 'Real Life'}
                                    </button>
                                </div>

                                {/* Error Messages */}
                                {(anglesError || realLifeError) && (
                                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {anglesError || realLifeError}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Text Mode Preview */}
                        {inputMode === 'text' && (
                            <div className="bg-[#F5F4F1]/50 border border-[#E8E7E4] rounded-2xl p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-[#8C8C8C]">Original Input</span>
                                    <button onClick={handleNewAnalysis} className="p-1.5 bg-white rounded-full text-[#5C5C5C] hover:text-red-400 transition">
                                        <X size={14} />
                                    </button>
                                </div>
                                <p className="text-sm text-[#5C5C5C] line-clamp-2">{textInput}</p>
                                {results.price && (
                                    <div className="mt-3 inline-block px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                                        {results.price}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TITLE CARD */}
                        <div className={`bg-[#F5F4F1] border-2 rounded-2xl p-5 shadow-xl ${results.marketplace === 'amazon' ? 'border-[#FF9900]/30' : results.marketplace === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className={getLuxuryLabelClass(results.marketplace)}>
                                        {results.marketplace === 'shopify' ? 'PRODUCT TITLE' :
                                            results.marketplace === 'amazon' ? 'A9 TITLE' : 'SEO TITLE'}
                                    </span>
                                    <span className="text-[10px] text-[#8C8C8C]/50 ml-2">
                                        {results.title.length}/{results.marketplace === 'amazon' ? 200 : results.marketplace === 'shopify' ? 70 : 140}
                                    </span>
                                </div>
                                <button onClick={() => copyToClipboard(results.title, 'title')} className="text-[#5C5C5C] hover:text-[#1A1A1A] transition">
                                    {copiedField === 'title' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <p className="text-lg font-medium leading-relaxed text-[#1A1A1A]">{results.title}</p>
                        </div>

                        {/* SHOPIFY CARDS */}
                        {results.marketplace === 'shopify' && results.meta_title && (
                            <div className={`bg-[#F5F4F1] border-2 rounded-2xl p-5 shadow-xl ${results.marketplace === 'amazon' ? 'border-[#FF9900]/30' : results.marketplace === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={getLuxuryLabelClass('shopify')}>META TITLE</span>
                                        <span className="text-[10px] text-[#8C8C8C]/50 ml-2">{results.meta_title.length}/60</span>
                                    </div>
                                    <button onClick={() => copyToClipboard(results.meta_title, 'meta_title')} className="text-[#5C5C5C] hover:text-[#1A1A1A] transition">
                                        {copiedField === 'meta_title' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-sm text-[#1A1A1A]">{results.meta_title}</p>
                            </div>
                        )}

                        {results.marketplace === 'shopify' && results.meta_description && (
                            <div className={`bg-[#F5F4F1] border-2 rounded-2xl p-5 shadow-xl ${results.marketplace === 'amazon' ? 'border-[#FF9900]/30' : results.marketplace === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={getLuxuryLabelClass('shopify')}>META DESCRIPTION</span>
                                        <span className="text-[10px] text-[#8C8C8C]/50 ml-2">{results.meta_description.length}/160</span>
                                    </div>
                                    <button onClick={() => copyToClipboard(results.meta_description, 'meta_description')} className="text-[#5C5C5C] hover:text-[#1A1A1A] transition">
                                        {copiedField === 'meta_description' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-sm text-[#1A1A1A]">{results.meta_description}</p>
                            </div>
                        )}

                        {results.marketplace === 'shopify' && results.html_description && (
                            <div className={`bg-[#F5F4F1] border-2 rounded-2xl p-5 shadow-xl ${results.marketplace === 'amazon' ? 'border-[#FF9900]/30' : results.marketplace === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                                <div className="flex justify-between items-start">
                                    <span className={getLuxuryLabelClass('shopify')}>HTML DESCRIPTION</span>
                                    <button onClick={() => copyToClipboard(results.html_description, 'html_description')} className="text-[#5C5C5C] hover:text-[#1A1A1A] transition">
                                        {copiedField === 'html_description' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <div className="text-sm text-[#1A1A1A] leading-relaxed prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: results.html_description }} />
                                <div className="mt-4 pt-4 border-t border-[#E8E7E4]">
                                    <p className="text-xs text-[#8C8C8C] mb-2">📋 Raw HTML:</p>
                                    <pre className="text-xs text-[#5C5C5C] bg-white/50 p-3 rounded-xl overflow-x-auto">{results.html_description}</pre>
                                </div>
                            </div>
                        )}

                        {results.marketplace === 'shopify' && results.alt_text && (
                            <div className={`bg-[#F5F4F1] border-2 rounded-2xl p-5 shadow-xl ${results.marketplace === 'amazon' ? 'border-[#FF9900]/30' : results.marketplace === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                                <div className="flex justify-between items-start">
                                    <span className={getLuxuryLabelClass('shopify')}>IMAGE ALT TEXT</span>
                                    <button onClick={() => copyToClipboard(results.alt_text, 'alt_text')} className="text-[#5C5C5C] hover:text-[#1A1A1A] transition">
                                        {copiedField === 'alt_text' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-sm text-[#1A1A1A]">{results.alt_text}</p>
                            </div>
                        )}

                        {results.marketplace === 'shopify' && results.tags && results.tags.length > 0 && (
                            <div className={`bg-[#F5F4F1] border-2 rounded-2xl p-5 shadow-xl ${results.marketplace === 'amazon' ? 'border-[#FF9900]/30' : results.marketplace === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={getLuxuryLabelClass('shopify')}>TAGS</span>
                                    <button onClick={() => copyToClipboard(results.tags, 'tags')} className="text-[#5C5C5C] hover:text-[#1A1A1A] transition">
                                        {copiedField === 'tags' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {results.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-white text-[#1A1A1A] text-sm rounded-full border border-[#E8E7E4]">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ETSY CARDS */}
                        {results.marketplace === 'etsy' && results.tags && results.tags.length > 0 && (
                            <div className={`bg-[#F5F4F1] border-2 rounded-2xl p-5 shadow-xl ${results.marketplace === 'amazon' ? 'border-[#FF9900]/30' : results.marketplace === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={getLuxuryLabelClass('etsy')}>TAGS</span>
                                        <span className="text-[10px] text-[#8C8C8C]/50 ml-2">{results.tags.length}/13</span>
                                    </div>
                                    <button onClick={() => copyToClipboard(results.tags, 'tags')} className="text-[#5C5C5C] hover:text-[#1A1A1A] transition">
                                        {copiedField === 'tags' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {results.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-white text-[#1A1A1A] text-sm rounded-full border border-[#E8E7E4]">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {results.marketplace === 'etsy' && results.description && (
                            <div className={`bg-[#F5F4F1] border-2 rounded-2xl p-5 shadow-xl ${results.marketplace === 'amazon' ? 'border-[#FF9900]/30' : results.marketplace === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                                <div className="flex justify-between items-start">
                                    <span className={getLuxuryLabelClass('etsy')}>DESCRIPTION</span>
                                    <button onClick={() => copyToClipboard(results.description, 'description')} className="text-[#5C5C5C] hover:text-[#1A1A1A] transition">
                                        {copiedField === 'description' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-sm text-[#5C5C5C] leading-loose whitespace-pre-wrap">{results.description}</p>
                            </div>
                        )}

                        {/* AMAZON CARDS */}
                        {results.marketplace === 'amazon' && results.bullets && results.bullets.length > 0 && (
                            <div className={`bg-[#F5F4F1] border-2 rounded-2xl p-5 shadow-xl ${results.marketplace === 'amazon' ? 'border-[#FF9900]/30' : results.marketplace === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={getLuxuryLabelClass('amazon')}>BULLET POINTS</span>
                                        <span className="text-[10px] text-[#8C8C8C]/50 ml-2">{results.bullets.length}/5</span>
                                    </div>
                                    <button onClick={() => copyToClipboard(results.bullets.join('\n'), 'bullets')} className="text-[#5C5C5C] hover:text-[#1A1A1A] transition">
                                        {copiedField === 'bullets' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <ul className="space-y-3">
                                    {results.bullets.map((bullet, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                                            <span className="text-amber-400 font-bold">•</span>
                                            <span>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {results.marketplace === 'amazon' && results.search_terms && (
                            <div className={`bg-[#F5F4F1] border-2 rounded-2xl p-5 shadow-xl ${results.marketplace === 'amazon' ? 'border-[#FF9900]/30' : results.marketplace === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={getLuxuryLabelClass('amazon')}>BACKEND KEYWORDS</span>
                                        <span className="text-[10px] text-[#8C8C8C]/50 ml-2">{new Blob([results.search_terms]).size}/249 bytes</span>
                                    </div>
                                    <button onClick={() => copyToClipboard(results.search_terms, 'search_terms')} className="text-[#5C5C5C] hover:text-[#1A1A1A] transition">
                                        {copiedField === 'search_terms' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-sm text-[#5C5C5C] leading-relaxed bg-white/50 p-3 rounded-xl font-mono">{results.search_terms}</p>
                            </div>
                        )}

                        {/* COMMON: Competitor Analysis */}
                        {results.competitorAnalysis && (
                            <div className={`bg-[#F5F4F1] border-2 rounded-2xl p-5 shadow-xl ${results.marketplace === 'amazon' ? 'border-[#FF9900]/30' : results.marketplace === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                                <span className={getLuxuryLabelClass(results.marketplace)}>COMPETITOR ANALYSIS</span>
                                <p className="text-sm text-[#5C5C5C]">{results.competitorAnalysis}</p>
                            </div>
                        )}

                        {/* COMMON: Market Insights */}
                        {results.marketInsights && (
                            <div className={`bg-[#F5F4F1] border-2 rounded-2xl p-5 shadow-xl ${results.marketplace === 'amazon' ? 'border-[#FF9900]/30' : results.marketplace === 'shopify' ? 'border-[#96BF48]/30' : 'border-[#F1641E]/30'}`}>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={getLuxuryLabelClass(results.marketplace)}>MARKET INSIGHTS</span>
                                    {results._grounded && (
                                        <span className="text-[9px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400/70 rounded-full">LIVE</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-white/50 rounded-xl p-3 flex flex-col items-center justify-between h-24">
                                        <Users className="w-4 h-4 text-[#5C5C5C]" />
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getCompetitionColor(results.marketInsights.competitionLevel)}`}>
                                            {results.marketInsights.competitionLevel || 'N/A'}
                                        </span>
                                        <p className="text-xs text-[#8C8C8C]">Competition</p>
                                    </div>

                                    <div className="bg-white/50 rounded-xl p-3 flex flex-col items-center justify-between h-24">
                                        <TrendIcon direction={results.marketInsights.trendDirection} />
                                        <span className={`text-sm font-bold ${getTrendColor(results.marketInsights.trendDirection)}`}>
                                            {results.marketInsights.trendDirection || 'N/A'}
                                        </span>
                                        <p className="text-xs text-[#8C8C8C]">12-Mo Trend</p>
                                    </div>

                                    <div className="bg-white/50 rounded-xl p-3 flex flex-col items-center justify-between h-24">
                                        <Target className="w-4 h-4 text-[#5C5C5C]" />
                                        <span className={`text-xl font-bold ${getScoreColor(results.marketInsights.opportunityScore)}`}>
                                            {results.marketInsights.opportunityScore || 0}
                                        </span>
                                        <p className="text-xs text-[#8C8C8C]">Opp. Score</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-xs">
                                    {results.marketInsights.competitionReason && (
                                        <p className="text-[#5C5C5C]"><span className="text-purple-400 font-medium">Competition:</span> {results.marketInsights.competitionReason}</p>
                                    )}
                                    {results.marketInsights.trendReason && (
                                        <p className="text-[#5C5C5C]"><span className="text-purple-400 font-medium">Trend:</span> {results.marketInsights.trendReason}</p>
                                    )}
                                    {results.marketInsights.opportunityReason && (
                                        <p className="text-[#5C5C5C]"><span className="text-purple-400 font-medium">Opportunity:</span> {results.marketInsights.opportunityReason}</p>
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
                )
                }
            </main >

            {/* Animation Styles */}
            < style > {`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style >
        </div >
    );
};

export default EtsySEOMaster;
