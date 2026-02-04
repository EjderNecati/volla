import React, { useState, useRef } from 'react';
import {
    Upload, Loader2, Download, X, Sparkles, AlertCircle,
    Bookmark, Check, Pencil, Gift, Tag, Percent
} from 'lucide-react';
import { generateCreativeImage } from '../utils/aiHelpers';
import { createProject, saveProject } from '../utils/projectManager';
import { addToLibrary } from '../utils/libraryManager';
import { useTranslation } from '../i18n';
import { useCredits } from '../contexts/CreditContext';
import InsufficientCreditsModal from './InsufficientCreditsModal';
import SourceSelectionModal from './SourceSelectionModal';

// ═══════════════════════════════════════════════════════════════════════════════
// CREATIVE STUDIO CONFIGURATION
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

const OUTPUT_COUNTS = [1, 2, 3, 4];
const CREDIT_COST_PER_IMAGE = 2;

// ═══════════════════════════════════════════════════════════════════════════════
// REUSABLE OPTION GROUP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const OptionGroup = ({ title, icon: Icon, options, selected, onSelect, columns = 4, showIcons = false, translationKeyPrefix, t }) => {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                {Icon && <Icon size={12} />}
                {title}
            </div>
            <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
                {options.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => onSelect(opt.id)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all text-center border
                            ${selected === opt.id
                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                            }`}
                    >
                        {showIcons && opt.icon && <span className="mr-1">{opt.icon}</span>}
                        {translationKeyPrefix && t ? t(`${translationKeyPrefix}.${opt.id}`) : opt.label}
                    </button>
                ))}
            </div>
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

    // Manual mode settings
    const [manualPrompt, setManualPrompt] = useState('');

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [showCreditsModal, setShowCreditsModal] = useState(false);

    // Generated images
    const [generatedImages, setGeneratedImages] = useState([]);
    const [activeImageIndex, setActiveImageIndex] = useState(-1); // -1 = source

    // Edit mode state
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Library/Source selection state
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [addedToLibrary, setAddedToLibrary] = useState(false);

    const fileInputRef = useRef(null);

    // Calculate credit cost
    const creditCost = outputCount * CREDIT_COST_PER_IMAGE;

    // Get active image (source or generated)
    const getActiveImage = () => {
        if (activeImageIndex >= 0 && activeImageIndex < generatedImages.length) {
            return generatedImages[activeImageIndex];
        }
        return sourceImage;
    };

    // Handle image upload from device
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

            // Auto-add device uploads to library
            addToLibrary({
                url: imageData,
                type: 'image',
                name: file.name || `Upload ${new Date().toLocaleDateString()}`,
                source: 'upload'
            }).catch(err => console.warn('Auto-add to library failed:', err));
        };
        reader.readAsDataURL(file);
    };

    // Handle selection from library
    const handleSelectFromLibrary = (asset) => {
        setSourceImage(asset.url);
        setGeneratedImages([]);
        setActiveImageIndex(-1);
        setError(null);
    };

    // Add current image to library
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

    // Save to history
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
                    type: 'CREATIVE_STUDIO',
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
            await saveProject(project);
            console.log('Creative project saved to history');
        } catch (err) {
            console.warn('Failed to save creative to history:', err);
        }
    };

    // Generate creative images
    const handleGenerate = async () => {
        if (!sourceImage) return;

        // Validate manual mode has prompt
        if (mode === 'manual' && !manualPrompt.trim()) {
            setError(t('creative.errors.noPrompt') || 'Please enter a prompt');
            return;
        }

        // Check credits - need to check for each image
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
                outputCount
            });

            if (result.success && result.images && result.images.length > 0) {
                setGeneratedImages(result.images);
                setActiveImageIndex(0); // Select first generated image

                // Save to history
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

    // Handle edit
    const handleEdit = async () => {
        if (!editPrompt.trim() || activeImageIndex < 0) return;

        // Check credits for edit
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
                // Add edited image to the array
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

    // Clear everything
    const handleClear = () => {
        setSourceImage(null);
        setGeneratedImages([]);
        setActiveImageIndex(-1);
        setCustomNote('');
        setManualPrompt('');
        setEditPrompt('');
        setError(null);
    };

    // Download active image
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
            <div className="flex-1 flex min-h-0 bg-[#FAF9F6]">
                {/* ════════════════════════════════════════════════════════════
                    LEFT PANEL - 40% - Controls
                ════════════════════════════════════════════════════════════ */}
                <aside className="w-[40%] min-w-[360px] max-w-[480px] bg-white border-r border-[#E8E7E4] overflow-y-auto">
                    <div className="p-5 space-y-4">
                        {/* Header */}
                        <div className="flex items-center gap-2 pb-3 border-b border-[#E8E7E4]">
                            <Sparkles size={20} className="text-pink-500" />
                            <h2 className="text-lg font-bold text-[#1A1A1A]">
                                {t('creative.title') || 'Creative Studio'}
                            </h2>
                        </div>

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
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setMode('auto')}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                                        mode === 'auto'
                                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                            : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                    }`}
                                >
                                    {t('creative.modeToggle.auto') || 'Auto'}
                                </button>
                                <button
                                    onClick={() => setMode('manual')}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
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
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {THEMES.map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setSelectedTheme(theme.id)}
                                                className={`px-2 py-2 rounded-lg text-[10px] font-medium transition-all text-center border flex flex-col items-center gap-1
                                                    ${selectedTheme === theme.id
                                                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                        : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                                    }`}
                                            >
                                                <span className="text-base">{theme.icon}</span>
                                                <span className="leading-tight">{t(`creative.autoMode.themes.${theme.id}`) || theme.label}</span>
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
                                                className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all text-center border
                                                    ${selectedDiscount === discount.id
                                                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                        : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
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
                                        {t('creative.autoMode.customNote') || 'Custom Note'} ({t('common.optional') || 'Optional'})
                                    </div>
                                    <input
                                        type="text"
                                        value={customNote}
                                        onChange={(e) => setCustomNote(e.target.value)}
                                        placeholder={t('creative.autoMode.customNotePlaceholder') || "E.g., '25% discount', 'Free shipping'..."}
                                        className="w-full px-3 py-2 bg-[#F5F4F1] border border-[#E8E7E4] rounded-lg text-sm text-[#1A1A1A] placeholder-[#8C8C8C] focus:outline-none focus:border-pink-400"
                                    />
                                </div>
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

                        {/* Output Count */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                {t('creative.outputCount') || 'Output Count'}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {OUTPUT_COUNTS.map((count) => (
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

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={!sourceImage || isGenerating || (mode === 'manual' && !manualPrompt.trim())}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative"
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
                    RIGHT PANEL - 60% - Canvas
                ════════════════════════════════════════════════════════════ */}
                <section className="flex-1 flex flex-col p-5 overflow-hidden min-w-0">
                    {/* Canvas Area */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 flex items-center justify-center min-h-0">
                            <div
                                className="relative rounded-2xl overflow-hidden bg-[#1A1A1A] w-full"
                                style={{ maxHeight: 'calc(100vh - 280px)', aspectRatio: '16/9' }}
                            >
                                {sourceImage ? (
                                    <>
                                        {/* Frosted Glass Background */}
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                backgroundImage: `url(${getActiveImage()})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                filter: 'blur(30px) brightness(0.5)'
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/30" />

                                        {/* Main Content */}
                                        <div className="absolute inset-0 flex items-center justify-center p-4">
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
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-center text-[#8C8C8C]">
                                            <Sparkles size={48} className="mx-auto mb-4 opacity-30" />
                                            <p className="text-sm">
                                                {t('creative.uploadFirst') || 'Upload a product image to get started'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Film Strip - Generated Images */}
                        {sourceImage && generatedImages.length > 0 && (
                            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                                {/* Original Source */}
                                <button
                                    onClick={() => setActiveImageIndex(-1)}
                                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                        activeImageIndex === -1
                                            ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                                            : 'border-[#E8E7E4] hover:border-[#1A1A1A]'
                                    }`}
                                >
                                    <img src={sourceImage} alt="Original" className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5">
                                        {t('creative.canvas.original') || 'Original'}
                                    </div>
                                </button>

                                {/* Generated Images */}
                                {generatedImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                            activeImageIndex === idx
                                                ? 'border-pink-500 ring-2 ring-pink-500/30'
                                                : 'border-[#E8E7E4] hover:border-[#1A1A1A]'
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
