import React, { useState, useRef, useEffect } from 'react';
import {
    Upload, Loader2, Download, X, Sparkles, AlertCircle,
    Bookmark, Check, Pencil, Gift, Tag, Percent, Star,
    Truck, Clock, Zap, ShieldCheck, TrendingUp, DollarSign,
    Award, Flame, Crown, Snowflake, Heart, PartyPopper, Wand2
} from 'lucide-react';
import { generateCreativeImage } from '../utils/aiHelpers';
import { createProject, saveProject } from '../utils/projectManager';
import { addToLibrary } from '../utils/libraryManager';
import { useTranslation } from '../i18n';
import { useCredits } from '../contexts/CreditContext';
import InsufficientCreditsModal from './InsufficientCreditsModal';
import SourceSelectionModal from './SourceSelectionModal';

// ═══════════════════════════════════════════════════════════════════════════════
// CREATIVE STUDIO v4.0 - ULTIMATE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const THEMES = [
    { id: 'black_friday', label: 'Black Friday', icon: '🛒' },
    { id: 'valentines', label: "Valentine's", icon: '💝' },
    { id: 'christmas', label: 'Christmas', icon: '🎄' },
    { id: 'summer_sale', label: 'Summer Sale', icon: '☀️' },
    { id: 'new_year', label: 'New Year', icon: '🎆' },
    { id: 'flash_sale', label: 'Flash Sale', icon: '⚡' },
    { id: 'mothers_day', label: "Mother's Day", icon: '💐' },
    { id: 'easter', label: 'Easter', icon: '🐣' },
    { id: 'halloween', label: 'Halloween', icon: '🎃' },
    { id: 'cyber_monday', label: 'Cyber Monday', icon: '💻' },
    { id: 'spring_sale', label: 'Spring Sale', icon: '🌸' },
    { id: 'back_to_school', label: 'Back to School', icon: '📚' }
];

const DISCOUNTS = [
    { id: 'none', label: 'No Discount', value: null },
    { id: '10', label: '10%', value: 10 },
    { id: '20', label: '20%', value: 20 },
    { id: '30', label: '30%', value: 30 },
    { id: '40', label: '40%', value: 40 },
    { id: '50', label: '50%', value: 50 },
    { id: '60', label: '60%', value: 60 },
    { id: '70', label: '70%', value: 70 }
];

const SOCIAL_PROOF_TYPES = [
    { id: 'best_seller', label: 'Best Seller', icon: '🏆' },
    { id: 'top_rated', label: 'Top Rated', icon: '⭐' },
    { id: 'limited_edition', label: 'Limited Edition', icon: '💎' },
    { id: 'trending', label: 'Trending', icon: '🔥' },
    { id: 'new_arrival', label: 'New Arrival', icon: '✨' },
    { id: 'editor_choice', label: "Editor's Choice", icon: '👑' }
];

const OUTPUT_COUNTS = [1, 2, 3, 4];
const CREDIT_COST_PER_IMAGE = 2;

const ASPECT_RATIOS = [
    { id: '1:1', label: '1:1', cssValue: '1/1', icon: '⬜' },
    { id: '4:5', label: '4:5', cssValue: '4/5', icon: '📱' },
    { id: '9:16', label: '9:16', cssValue: '9/16', icon: '📲' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// TOGGLE SWITCH COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const ToggleSwitch = ({ enabled, onChange, color = 'emerald' }) => {
    const colors = {
        emerald: 'bg-emerald-500',
        rose: 'bg-rose-500',
        amber: 'bg-amber-500',
        purple: 'bg-purple-500',
        cyan: 'bg-cyan-500'
    };

    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`w-10 h-5 rounded-full transition-colors ${enabled ? colors[color] : 'bg-[#E8E7E4]'}`}
        >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLLAPSIBLE SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, badge = null }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-t border-[#E8E7E4] pt-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-1 text-[#8C8C8C] hover:text-[#1A1A1A] transition-colors"
            >
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                    {Icon && <Icon size={12} />}
                    {title}
                    {badge && (
                        <span className="px-1.5 py-0.5 bg-pink-100 text-pink-600 rounded text-[8px] font-bold">
                            {badge}
                        </span>
                    )}
                </div>
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>
            {isOpen && <div className="mt-2 space-y-2">{children}</div>}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CREATIVE MODE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function CreativeMode({ marketplace, onNavigate, initialProject }) {
    const { t } = useTranslation();
    const { useCredits: useCreditsHook } = useCredits();

    // Source image state
    const [sourceImage, setSourceImage] = useState(null);

    // Mode state: 'auto' or 'manual'
    const [mode, setMode] = useState('auto');

    // Auto mode settings
    const [selectedTheme, setSelectedTheme] = useState('black_friday');
    const [selectedDiscount, setSelectedDiscount] = useState('none');
    const [customNote, setCustomNote] = useState('');
    const [outputCount, setOutputCount] = useState(2);
    const [aspectRatio, setAspectRatio] = useState('1:1');

    // v4.0 Trust Badge settings
    const [showTrustBadges, setShowTrustBadges] = useState(true);
    const [showRating, setShowRating] = useState(true);
    const [showShipping, setShowShipping] = useState(true);
    const [showSoldCount, setShowSoldCount] = useState(false);
    const [rating, setRating] = useState(4.9);
    const [soldCount, setSoldCount] = useState('1000+');

    // v4.0 Urgency settings
    const [showUrgency, setShowUrgency] = useState(true);
    const [timerHours, setTimerHours] = useState(6);
    const [timerMinutes, setTimerMinutes] = useState(30);
    const [stockLeft, setStockLeft] = useState(5);

    // v4.0 Effect settings
    const [showProductGlow, setShowProductGlow] = useState(true);
    const [showSparkles, setShowSparkles] = useState(true);
    const [showReflection, setShowReflection] = useState(false);
    const [showDecorations, setShowDecorations] = useState(true);

    // v4.0 Social Proof settings
    const [showSocialProof, setShowSocialProof] = useState(false);
    const [socialProofType, setSocialProofType] = useState('best_seller');

    // v4.0 Price Tag settings
    const [showPriceTag, setShowPriceTag] = useState(false);
    const [originalPrice, setOriginalPrice] = useState('');
    const [salePrice, setSalePrice] = useState('');

    // v4.0 Custom CTA
    const [customCta, setCustomCta] = useState('');

    // v4.0 AI Auto-detect
    const [autoDetect, setAutoDetect] = useState(false);

    // Manual mode settings
    const [manualPrompt, setManualPrompt] = useState('');

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [showCreditsModal, setShowCreditsModal] = useState(false);

    // Generated images
    const [generatedImages, setGeneratedImages] = useState([]);
    const [activeImageIndex, setActiveImageIndex] = useState(-1);

    // Edit mode state
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Library/Source selection state
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [addedToLibrary, setAddedToLibrary] = useState(false);

    const fileInputRef = useRef(null);
    const [currentProjectId, setCurrentProjectId] = useState(null);

    // Load project data when resuming from history
    useEffect(() => {
        if (initialProject && initialProject.productInfo?.featureType === 'creative') {
            console.log('🎨 Loading Creative project:', initialProject.id);
            setCurrentProjectId(initialProject.id);

            const sourceImg = initialProject.originalImage ||
                initialProject.assets?.find(a => a.type === 'ORIGINAL')?.url;
            if (sourceImg) {
                setSourceImage(sourceImg);
            }

            const info = initialProject.productInfo;
            if (info.mode) setMode(info.mode);
            if (info.theme) setSelectedTheme(info.theme);
            if (info.discount) setSelectedDiscount(info.discount);
            if (info.customNote) setCustomNote(info.customNote);
            if (info.manualPrompt) setManualPrompt(info.manualPrompt);

            const creativeAssets = initialProject.assets?.filter(a => a.type === 'CREATIVE') || [];
            if (creativeAssets.length > 0) {
                const imageUrls = creativeAssets.map(a => a.url);
                setGeneratedImages(imageUrls);
                setActiveImageIndex(imageUrls.length - 1);
            }
        }
    }, [initialProject]);

    const creditCost = outputCount * CREDIT_COST_PER_IMAGE;

    const getActiveImage = () => {
        if (activeImageIndex >= 0 && activeImageIndex < generatedImages.length) {
            return generatedImages[activeImageIndex];
        }
        return sourceImage;
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            setSourceImage(imageData);
            setGeneratedImages([]);
            setActiveImageIndex(-1);
            setError(null);

            addToLibrary({
                url: imageData,
                type: 'image',
                name: file.name || `Upload ${new Date().toLocaleDateString()}`,
                source: 'upload'
            }).catch(err => console.warn('Auto-add to library failed:', err));
        };
        reader.readAsDataURL(file);
    };

    const handleSelectFromLibrary = (asset) => {
        setSourceImage(asset.url);
        setGeneratedImages([]);
        setActiveImageIndex(-1);
        setError(null);
    };

    const handleAddToLibrary = async () => {
        const activeImage = getActiveImage();
        if (activeImage) {
            try {
                const themeInfo = THEMES.find(t => t.id === selectedTheme);
                await addToLibrary({
                    url: activeImage,
                    type: 'image',
                    name: `Creative ${themeInfo?.label || 'Studio'} ${new Date().toLocaleDateString()}`,
                    source: activeImageIndex >= 0 ? 'generated' : 'upload',
                    metadata: { mode, theme: selectedTheme, discount: selectedDiscount }
                });
                setAddedToLibrary(true);
                setTimeout(() => setAddedToLibrary(false), 2000);
            } catch (err) {
                console.error('Failed to add to library:', err);
            }
        }
    };

    const saveCreativeToHistory = async (images) => {
        try {
            const themeInfo = THEMES.find(t => t.id === selectedTheme);
            const discountInfo = DISCOUNTS.find(d => d.id === selectedDiscount);

            const creativeName = mode === 'manual'
                ? `Creative: ${manualPrompt.substring(0, 30)}${manualPrompt.length > 30 ? '...' : ''}`
                : `Creative: ${themeInfo?.label || selectedTheme}${discountInfo?.value ? ` ${discountInfo.value}%` : ''}`;

            const project = createProject(
                creativeName,
                marketplace || 'creative',
                sourceImage,
                images.map((img, idx) => ({
                    id: `creative_${Date.now()}_${idx}`,
                    type: 'CREATIVE',
                    url: img,
                    createdAt: Date.now(),
                    metadata: {
                        theme: selectedTheme,
                        discount: selectedDiscount,
                        customNote,
                        mode
                    }
                })),
                null,
                {
                    featureType: 'creative',
                    mode,
                    theme: selectedTheme,
                    discount: selectedDiscount,
                    customNote,
                    manualPrompt: mode === 'manual' ? manualPrompt : null
                }
            );

            if (currentProjectId) {
                project.id = currentProjectId;
            } else {
                setCurrentProjectId(project.id);
            }

            await saveProject(project);
        } catch (err) {
            console.warn('Failed to save creative to history:', err);
        }
    };

    const handleGenerate = async () => {
        if (!sourceImage) return;

        if (mode === 'manual' && !manualPrompt.trim()) {
            setError(t('creative.errors.noPrompt') || 'Please enter a prompt');
            return;
        }

        for (let i = 0; i < outputCount; i++) {
            const creditResult = useCreditsHook('creative_studio');
            if (!creditResult.success) {
                setShowCreditsModal(true);
                return;
            }
        }

        setIsGenerating(true);
        setError(null);

        try {
            const discountInfo = DISCOUNTS.find(d => d.id === selectedDiscount);

            const result = await generateCreativeImage(sourceImage, {
                mode,
                theme: selectedTheme,
                discount: discountInfo?.value || null,
                customNote,
                manualPrompt: mode === 'manual' ? manualPrompt : '',
                outputCount,
                aspectRatio,
                // v4.0 Trust Badges
                showTrustBadges,
                showRating,
                showShipping,
                showSoldCount,
                soldCount,
                rating,
                // v4.0 Urgency
                showUrgency,
                timerHours,
                timerMinutes,
                stockLeft,
                // v4.0 Effects
                showProductGlow,
                showSparkles,
                showReflection,
                showDecorations,
                // v4.0 Social Proof
                showSocialProof,
                socialProofType,
                // v4.0 Price Tag
                showPriceTag,
                originalPrice,
                salePrice,
                // v4.0 Custom CTA
                ctaText: customCta,
                // v4.0 AI Auto-detect
                autoDetect
            });

            if (result.success && result.images && result.images.length > 0) {
                // Append new images to existing ones (don't replace!)
                setGeneratedImages(prev => [...prev, ...result.images]);
                // Set active to first newly generated image
                setActiveImageIndex(generatedImages.length);
                saveCreativeToHistory(result.images);
            } else {
                throw new Error(result.error || 'Generation failed');
            }

        } catch (err) {
            console.error('Creative generation failed:', err);
            setError(err.message || t('creative.errors.generationFailed') || 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEdit = async () => {
        if (!editPrompt.trim() || activeImageIndex < 0) return;

        const creditResult = useCreditsHook('creative_studio');
        if (!creditResult.success) {
            setShowCreditsModal(true);
            return;
        }

        setIsEditing(true);
        setError(null);

        try {
            const activeImage = getActiveImage();
            const result = await generateCreativeImage(activeImage, {
                mode: 'manual',
                manualPrompt: editPrompt,
                outputCount: 1,
                isEdit: true
            });

            if (result.success && result.images && result.images.length > 0) {
                setGeneratedImages(prev => [...prev, result.images[0]]);
                setActiveImageIndex(generatedImages.length);
                setEditPrompt('');
            } else {
                throw new Error(result.error || 'Edit failed');
            }
        } catch (err) {
            console.error('Edit failed:', err);
            setError(err.message || 'Edit failed');
        } finally {
            setIsEditing(false);
        }
    };

    const handleClear = () => {
        setSourceImage(null);
        setGeneratedImages([]);
        setActiveImageIndex(-1);
        setCustomNote('');
        setManualPrompt('');
        setEditPrompt('');
        setError(null);
        setCurrentProjectId(null);
    };

    const handleDownload = () => {
        const activeImage = getActiveImage();
        if (activeImage) {
            const link = document.createElement('a');
            link.href = activeImage;
            link.download = `volla_creative_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <>
            <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#FAF9F6]">
                {/* ════════════════════════════════════════════════════════════
                    LEFT PANEL - Settings
                ════════════════════════════════════════════════════════════ */}
                <aside className="w-full md:w-[40%] md:min-w-[360px] md:max-w-[480px] glass-panel md:border-r border-b md:border-b-0 border-[#E8E7E4]/60 overflow-y-auto max-h-[50vh] md:max-h-none">
                    <div className="p-5 space-y-4">
                        {/* Source Image Upload */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                <Upload size={12} />
                                {t('creative.sourceImage') || 'Source Image'}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            {sourceImage ? (
                                <div className="relative group">
                                    <img
                                        src={sourceImage}
                                        alt="Source"
                                        className="w-full h-32 object-contain rounded-xl border border-[#E8E7E4] bg-[#F5F4F1]"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-medium"
                                    >
                                        {t('creative.changeImage') || 'Change Image'}
                                    </button>
                                    <button
                                        onClick={handleClear}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowSourceModal(true)}
                                    className="w-full h-32 border-2 border-dashed border-[#E8E7E4] rounded-xl flex flex-col items-center justify-center text-[#8C8C8C] hover:border-pink-400 hover:text-pink-500 transition-colors"
                                >
                                    <Upload size={24} className="mb-2" />
                                    <span className="text-xs font-medium">
                                        {t('creative.uploadImage') || 'Upload Image'}
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* Mode Toggle */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                {t('creative.modeToggle.title') || 'Mode'}
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    onClick={() => setMode('auto')}
                                    className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                                        mode === 'auto'
                                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                            : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                    }`}
                                >
                                    {t('creative.modeToggle.auto') || 'Auto'}
                                </button>
                                <button
                                    onClick={() => setMode('manual')}
                                    className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                                        mode === 'manual'
                                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                            : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                    }`}
                                >
                                    {t('creative.modeToggle.manual') || 'Manual'}
                                </button>
                            </div>
                        </div>

                        {/* AUTO MODE OPTIONS */}
                        {mode === 'auto' && (
                            <>
                                {/* Theme Selection */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                        <Gift size={12} />
                                        {t('creative.autoMode.theme') || 'Theme'}
                                    </div>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {THEMES.map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setSelectedTheme(theme.id)}
                                                className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all text-center border hover:scale-[1.02] active:scale-[0.98]
                                                    ${selectedTheme === theme.id
                                                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md'
                                                        : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4] hover:shadow-sm'
                                                    }`}
                                            >
                                                {t(`creative.autoMode.themes.${theme.id}`) || theme.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Discount Selection */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                        <Percent size={12} />
                                        {t('creative.autoMode.discount') || 'Discount'}
                                    </div>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {DISCOUNTS.map((discount) => (
                                            <button
                                                key={discount.id}
                                                onClick={() => setSelectedDiscount(discount.id)}
                                                className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all text-center border hover:scale-[1.02] active:scale-[0.98]
                                                    ${selectedDiscount === discount.id
                                                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md'
                                                        : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4] hover:shadow-sm'
                                                    }`}
                                            >
                                                {discount.id === 'none'
                                                    ? (t('creative.autoMode.noDiscount') || 'None')
                                                    : discount.label
                                                }
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Note */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                        <Tag size={12} />
                                        {t('creative.autoMode.customNote') || 'Custom Note'}
                                    </div>
                                    <input
                                        type="text"
                                        value={customNote}
                                        onChange={(e) => setCustomNote(e.target.value)}
                                        placeholder={t('creative.autoMode.customNotePlaceholder') || "E.g., 'Free shipping'..."}
                                        className="w-full px-3 py-2 bg-[#F5F4F1] border border-[#E8E7E4] rounded-lg text-sm text-[#1A1A1A] placeholder-[#8C8C8C] focus:outline-none focus:border-pink-400"
                                    />
                                </div>

                                {/* ═══════════════════════════════════════════════════════════
                                    v4.0 TRUST BADGES
                                ═══════════════════════════════════════════════════════════ */}
                                <CollapsibleSection title="Trust Badges" icon={ShieldCheck} defaultOpen={true}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] text-[#8C8C8C]">Enable Trust Badges</span>
                                        <ToggleSwitch enabled={showTrustBadges} onChange={setShowTrustBadges} color="emerald" />
                                    </div>
                                    {showTrustBadges && (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-3 gap-1.5">
                                                <button
                                                    onClick={() => setShowRating(!showRating)}
                                                    className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border flex items-center justify-center gap-1 ${
                                                        showRating
                                                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                            : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4]'
                                                    }`}
                                                >
                                                    <Star size={10} /> Rating
                                                </button>
                                                <button
                                                    onClick={() => setShowShipping(!showShipping)}
                                                    className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border flex items-center justify-center gap-1 ${
                                                        showShipping
                                                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                            : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4]'
                                                    }`}
                                                >
                                                    <Truck size={10} /> Shipping
                                                </button>
                                                <button
                                                    onClick={() => setShowSoldCount(!showSoldCount)}
                                                    className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border flex items-center justify-center gap-1 ${
                                                        showSoldCount
                                                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                            : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4]'
                                                    }`}
                                                >
                                                    <TrendingUp size={10} /> Sold
                                                </button>
                                            </div>
                                            {showRating && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-[#8C8C8C] w-14">Rating:</span>
                                                    <input
                                                        type="range"
                                                        min="3.0"
                                                        max="5.0"
                                                        step="0.1"
                                                        value={rating}
                                                        onChange={(e) => setRating(parseFloat(e.target.value))}
                                                        className="flex-1 h-1 bg-[#E8E7E4] rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                    />
                                                    <span className="text-[10px] font-bold text-amber-600 w-8">{rating}</span>
                                                </div>
                                            )}
                                            {showSoldCount && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-[#8C8C8C] w-14">Sold:</span>
                                                    <input
                                                        type="text"
                                                        value={soldCount}
                                                        onChange={(e) => setSoldCount(e.target.value)}
                                                        placeholder="1000+"
                                                        className="flex-1 px-2 py-1 bg-[#F5F4F1] border border-[#E8E7E4] rounded text-[10px]"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CollapsibleSection>

                                {/* ═══════════════════════════════════════════════════════════
                                    v4.0 URGENCY
                                ═══════════════════════════════════════════════════════════ */}
                                <CollapsibleSection title="Urgency Timer" icon={Clock}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] text-[#8C8C8C]">Enable Urgency</span>
                                        <ToggleSwitch enabled={showUrgency} onChange={setShowUrgency} color="rose" />
                                    </div>
                                    {showUrgency && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-[#8C8C8C] w-14">Timer:</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="23"
                                                    value={timerHours}
                                                    onChange={(e) => setTimerHours(parseInt(e.target.value) || 0)}
                                                    className="w-12 px-2 py-1 bg-[#F5F4F1] border border-[#E8E7E4] rounded text-[10px] text-center"
                                                />
                                                <span className="text-[10px] text-[#8C8C8C]">h</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="59"
                                                    value={timerMinutes}
                                                    onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 0)}
                                                    className="w-12 px-2 py-1 bg-[#F5F4F1] border border-[#E8E7E4] rounded text-[10px] text-center"
                                                />
                                                <span className="text-[10px] text-[#8C8C8C]">m</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-[#8C8C8C] w-14">Stock left:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="99"
                                                    value={stockLeft}
                                                    onChange={(e) => setStockLeft(parseInt(e.target.value) || 5)}
                                                    className="w-16 px-2 py-1 bg-[#F5F4F1] border border-[#E8E7E4] rounded text-[10px] text-center"
                                                />
                                            </div>
                                            <p className="text-[9px] text-[#8C8C8C]">
                                                Timer style depends on theme (Flash Sale, Black Friday, etc.)
                                            </p>
                                        </div>
                                    )}
                                </CollapsibleSection>

                                {/* ═══════════════════════════════════════════════════════════
                                    v4.0 SOCIAL PROOF
                                ═══════════════════════════════════════════════════════════ */}
                                <CollapsibleSection title="Social Proof" icon={Award} badge="NEW">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] text-[#8C8C8C]">Show Badge</span>
                                        <ToggleSwitch enabled={showSocialProof} onChange={setShowSocialProof} color="amber" />
                                    </div>
                                    {showSocialProof && (
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {SOCIAL_PROOF_TYPES.map((sp) => (
                                                <button
                                                    key={sp.id}
                                                    onClick={() => setSocialProofType(sp.id)}
                                                    className={`px-2 py-1.5 rounded-lg text-[9px] font-medium transition-all border flex flex-col items-center justify-center gap-0.5 ${
                                                        socialProofType === sp.id
                                                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                            : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4]'
                                                    }`}
                                                >
                                                    <span>{sp.icon}</span>
                                                    <span className="truncate w-full text-center">{sp.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </CollapsibleSection>

                                {/* ═══════════════════════════════════════════════════════════
                                    v4.0 PRICE TAG
                                ═══════════════════════════════════════════════════════════ */}
                                <CollapsibleSection title="Price Tag" icon={DollarSign} badge="NEW">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] text-[#8C8C8C]">Show Price</span>
                                        <ToggleSwitch enabled={showPriceTag} onChange={setShowPriceTag} color="emerald" />
                                    </div>
                                    {showPriceTag && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-[#8C8C8C] w-16">Original:</span>
                                                <input
                                                    type="text"
                                                    value={originalPrice}
                                                    onChange={(e) => setOriginalPrice(e.target.value)}
                                                    placeholder="99.99"
                                                    className="flex-1 px-2 py-1 bg-[#F5F4F1] border border-[#E8E7E4] rounded text-[10px]"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-[#8C8C8C] w-16">Sale:</span>
                                                <input
                                                    type="text"
                                                    value={salePrice}
                                                    onChange={(e) => setSalePrice(e.target.value)}
                                                    placeholder="49.99"
                                                    className="flex-1 px-2 py-1 bg-[#F5F4F1] border border-[#E8E7E4] rounded text-[10px]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CollapsibleSection>

                                {/* ═══════════════════════════════════════════════════════════
                                    v4.0 VISUAL EFFECTS
                                ═══════════════════════════════════════════════════════════ */}
                                <CollapsibleSection title="Visual Effects" icon={Zap}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-[#8C8C8C] flex items-center gap-1">
                                                <Sparkles size={10} /> Glow
                                            </span>
                                            <ToggleSwitch enabled={showProductGlow} onChange={setShowProductGlow} color="cyan" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-[#8C8C8C] flex items-center gap-1">
                                                ✨ Sparkles
                                            </span>
                                            <ToggleSwitch enabled={showSparkles} onChange={setShowSparkles} color="amber" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-[#8C8C8C] flex items-center gap-1">
                                                🪞 Reflection
                                            </span>
                                            <ToggleSwitch enabled={showReflection} onChange={setShowReflection} color="purple" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-[#8C8C8C] flex items-center gap-1">
                                                🎊 Decorations
                                            </span>
                                            <ToggleSwitch enabled={showDecorations} onChange={setShowDecorations} color="rose" />
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                {/* ═══════════════════════════════════════════════════════════
                                    v4.0 ADVANCED
                                ═══════════════════════════════════════════════════════════ */}
                                <CollapsibleSection title="Advanced" icon={Wand2}>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] text-[#8C8C8C] flex items-center gap-1">
                                                    🤖 AI Auto-Detect
                                                </span>
                                                <p className="text-[8px] text-[#AAAAAA]">Auto-detect product category</p>
                                            </div>
                                            <ToggleSwitch enabled={autoDetect} onChange={setAutoDetect} color="purple" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-[#8C8C8C]">Custom CTA Text</span>
                                            <input
                                                type="text"
                                                value={customCta}
                                                onChange={(e) => setCustomCta(e.target.value)}
                                                placeholder="Leave empty for theme default"
                                                className="w-full px-2 py-1 bg-[#F5F4F1] border border-[#E8E7E4] rounded text-[10px]"
                                            />
                                        </div>
                                    </div>
                                </CollapsibleSection>
                            </>
                        )}

                        {/* MANUAL MODE OPTIONS */}
                        {mode === 'manual' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                    <Pencil size={12} />
                                    {t('creative.manualMode.prompt') || 'Creative Prompt'}
                                </div>
                                <textarea
                                    value={manualPrompt}
                                    onChange={(e) => setManualPrompt(e.target.value)}
                                    placeholder={t('creative.manualMode.promptPlaceholder') || 'Describe the promotional image you want to create...'}
                                    className="w-full h-32 px-3 py-2 bg-[#F5F4F1] border border-[#E8E7E4] rounded-lg text-sm text-[#1A1A1A] placeholder-[#8C8C8C] focus:outline-none focus:border-pink-400 resize-none"
                                />
                            </div>
                        )}

                        {/* Aspect Ratio */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                {t('creative.aspectRatio') || 'Aspect Ratio'}
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                                {ASPECT_RATIOS.map((ratio) => (
                                    <button
                                        key={ratio.id}
                                        onClick={() => setAspectRatio(ratio.id)}
                                        className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                                            aspectRatio === ratio.id
                                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                        }`}
                                    >
                                        {ratio.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Output Count */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                {t('creative.outputCount') || 'Output Count'}
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                                {OUTPUT_COUNTS.map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => setOutputCount(count)}
                                        className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                                            outputCount === count
                                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                        }`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={!sourceImage || isGenerating || (mode === 'manual' && !manualPrompt.trim())}
                            className={`w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative btn-shine
                                ${sourceImage && !isGenerating ? 'animate-pulse-glow-pink hover:scale-[1.02]' : ''}`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>{t('creative.generating') || 'Generating...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    <span>{t('creative.generate') || 'Generate'}</span>
                                    <span className="absolute right-4 text-xs text-white/70">
                                        {creditCost} {t('credits.creditsUnit') || 'credits'}
                                    </span>
                                </>
                            )}
                        </button>

                        {/* Error Display */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
                    </div>
                </aside>

                {/* ════════════════════════════════════════════════════════════
                    RIGHT PANEL - Canvas
                ════════════════════════════════════════════════════════════ */}
                <section className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
                    <div className="flex flex-col">
                        <div className="relative rounded-2xl overflow-hidden h-[300px] md:h-[450px]">
                            {sourceImage ? (
                                <>
                                    {/* Frosted Glass Background */}
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: `url(${getActiveImage()})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            filter: 'blur(30px) brightness(0.7)',
                                            transform: 'scale(1.2)'
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/20" />

                                    {/* Main Content */}
                                    <div className="relative h-full w-full flex items-center justify-center p-4">
                                        <img
                                            src={getActiveImage()}
                                            alt="Creative"
                                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                                        />
                                    </div>

                                    {/* Label */}
                                    <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                                        {activeImageIndex === -1
                                            ? (t('creative.canvas.original') || 'Original')
                                            : `${t('creative.canvas.generated') || 'Generated'} ${activeImageIndex + 1}`
                                        }
                                    </div>

                                    {/* Control Buttons */}
                                    {activeImageIndex >= 0 && (
                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <button
                                                onClick={handleAddToLibrary}
                                                className={`p-2 backdrop-blur-sm rounded-lg text-white transition-colors ${
                                                    addedToLibrary
                                                        ? 'bg-emerald-500'
                                                        : 'bg-black/60 hover:bg-black/80'
                                                }`}
                                                title={t('library.addToLibrary') || 'Add to Library'}
                                            >
                                                {addedToLibrary ? <Check size={18} /> : <Bookmark size={18} />}
                                            </button>
                                            <button
                                                onClick={handleDownload}
                                                className="p-2 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-black/80 transition-colors"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Loading Overlay */}
                                    {isGenerating && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                            <Loader2 size={48} className="animate-spin text-pink-400 mb-4" />
                                            <p className="text-white font-medium">{t('creative.generating') || 'Generating...'}</p>
                                            <p className="text-white/60 text-sm mt-2">Creating ULTIMATE creative...</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center bg-[#F5F4F1] rounded-2xl border-2 border-dashed border-[#E8E7E4]">
                                    <div className="text-center text-[#8C8C8C]">
                                        <Sparkles size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-sm">
                                            {t('creative.uploadFirst') || 'Upload a product image to get started'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Film Strip - Generated Images */}
                        {sourceImage && generatedImages.length > 0 && (
                            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setActiveImageIndex(-1)}
                                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                                        activeImageIndex === -1
                                            ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                                            : 'border-[#E8E7E4] hover:border-[#1A1A1A] hover:shadow-md'
                                    }`}
                                >
                                    <img src={sourceImage} alt="Original" className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5">
                                        {t('creative.canvas.original') || 'Original'}
                                    </div>
                                </button>

                                {generatedImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                                            activeImageIndex === idx
                                                ? 'border-pink-500 ring-2 ring-pink-500/30 shadow-lg'
                                                : 'border-[#E8E7E4] hover:border-[#1A1A1A] hover:shadow-md'
                                        }`}
                                    >
                                        <img src={img} alt={`Generated ${idx + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5">
                                            #{idx + 1}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Edit Section */}
                        {generatedImages.length > 0 && (
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#8C8C8C] text-xs font-semibold uppercase tracking-wider">
                                        <Pencil size={12} />
                                        {t('creative.edit.title') || 'Edit Result'}
                                    </div>
                                    <span className="text-[10px] text-[#8C8C8C]">
                                        {CREDIT_COST_PER_IMAGE} {t('credits.creditsUnit') || 'credits'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editPrompt}
                                        onChange={(e) => setEditPrompt(e.target.value)}
                                        placeholder={activeImageIndex >= 0
                                            ? (t('creative.edit.placeholder') || "Describe changes to make...")
                                            : (t('creative.edit.selectFirst') || "Select a generated image to edit...")
                                        }
                                        className="flex-1 px-4 py-3 bg-white border border-[#E8E7E4] rounded-xl text-sm text-[#1A1A1A] placeholder-[#8C8C8C] focus:outline-none focus:border-pink-400"
                                        disabled={isEditing || activeImageIndex < 0}
                                    />
                                    <button
                                        onClick={handleEdit}
                                        disabled={!editPrompt.trim() || isEditing || activeImageIndex < 0}
                                        className="px-4 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {isEditing ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                {t('common.editing') || 'Editing...'}
                                            </>
                                        ) : (
                                            <>
                                                <Pencil size={16} />
                                                {t('creative.edit.button') || 'Edit'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Credits Modal */}
            <InsufficientCreditsModal
                isOpen={showCreditsModal}
                onClose={() => setShowCreditsModal(false)}
                feature="creative_studio"
                onNavigate={onNavigate}
            />

            {/* Source Selection Modal */}
            <SourceSelectionModal
                isOpen={showSourceModal}
                onClose={() => setShowSourceModal(false)}
                onSelectFromLibrary={handleSelectFromLibrary}
                onSelectFromDevice={() => fileInputRef.current?.click()}
                acceptVideo={false}
            />
        </>
    );
}
