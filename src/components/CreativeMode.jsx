import React, { useState, useRef, useEffect } from 'react';
import {
    Upload, Loader2, Download, X, Sparkles, AlertCircle,
    Bookmark, Check, Pencil, Gift, Tag, Percent, Star,
    Truck, Clock, Zap, ShieldCheck, TrendingUp, DollarSign,
    Award, Flame, Crown, Snowflake, Heart, PartyPopper, Wand2,
    RefreshCcw, Film
} from 'lucide-react';
import { generateCreativeImage, compressImage } from '../utils/aiHelpers';
import { createProject, saveProject } from '../utils/projectManager';
import { addToLibrary } from '../utils/libraryManager';
import { useTranslation } from '../i18n';
import { useCredits } from '../contexts/CreditContext';
import { calculateReelsCost } from '../utils/creditManager';
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
// REELS MODE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const REELS_CONTENT_TYPES = [
    { id: 'product_showcase', label: 'Product Showcase', icon: '📦', hasAvatar: false, description: 'Dynamic product presentation with camera movements' },
    { id: 'hands_demo', label: 'Hands Demo', icon: '👋', hasAvatar: false, description: 'Hands interacting with product, ASMR style' },
    { id: 'avatar_review', label: 'Avatar Review', icon: '👤', hasAvatar: true, description: 'Person presenting and reviewing the product' },
    { id: 'lifestyle', label: 'Lifestyle', icon: '🌅', hasAvatar: true, description: 'Product in natural use context' },
    { id: 'unboxing', label: 'Unboxing', icon: '📦', hasAvatar: false, description: 'Satisfying package opening reveal' },
    { id: 'hook_teaser', label: 'Hook/Teaser', icon: '⚡', hasAvatar: false, description: 'Attention-grabbing scroll stopper' }
];

const REELS_AVATAR_GENDERS = [
    { id: 'female', label: 'Female', icon: '👩' },
    { id: 'male', label: 'Male', icon: '👨' }
];

const REELS_AVATAR_AGES = [
    { id: 'young', label: 'Young (20s)', value: 'young person in their 20s' },
    { id: 'adult', label: 'Adult (30-40s)', value: 'adult person in their 30s' },
    { id: 'mature', label: 'Mature (50+)', value: 'mature person in their 50s' }
];

const REELS_AVATAR_STYLES = [
    { id: 'casual', label: 'Casual', value: 'casual everyday clothes' },
    { id: 'professional', label: 'Professional', value: 'professional business attire' },
    { id: 'trendy', label: 'Trendy', value: 'trendy fashionable outfit' },
    { id: 'minimal', label: 'Minimal', value: 'minimal clean style clothing' }
];

const REELS_AVATAR_MOODS = [
    { id: 'enthusiastic', label: 'Enthusiastic', value: 'enthusiastic excited expression' },
    { id: 'calm', label: 'Calm', value: 'calm relaxed demeanor' },
    { id: 'friendly', label: 'Friendly', value: 'warm friendly smile' },
    { id: 'professional', label: 'Professional', value: 'professional confident manner' }
];

const REELS_PLATFORMS = [
    { id: 'tiktok', label: 'TikTok', icon: '📱' },
    { id: 'instagram', label: 'Instagram Reels', icon: '📸' },
    { id: 'youtube', label: 'YouTube Shorts', icon: '▶️' }
];

const REELS_DURATIONS = [
    { id: 4, label: '4s', description: 'Quick hook' },
    { id: 6, label: '6s', description: 'Short content' },
    { id: 8, label: '8s', description: 'Full content' }
];

const REELS_QUALITY_MODES = [
    { id: 'fast', label: 'Fast', description: 'Quick generation' },
    { id: 'pro', label: 'Pro', description: 'Higher quality' }
];

// Music Library for Reels (same as Motion)
const REELS_MUSIC = [
    { id: 'none', label: 'No Music', icon: '🔇' },
    { id: 'trending_beat', label: 'Trending Beat', icon: '🔥', url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946b0939c8.mp3' },
    { id: 'chill_lofi', label: 'Chill Lo-Fi', icon: '🎧', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
    { id: 'upbeat_pop', label: 'Upbeat Pop', icon: '🎵', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749d484.mp3' },
    { id: 'cinematic', label: 'Cinematic', icon: '🎬', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bab.mp3' },
    { id: 'energetic', label: 'Energetic', icon: '⚡', url: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3' }
];

// Caption/Subtitle Styles
const REELS_CAPTION_STYLES = [
    { id: 'none', label: 'No Captions', icon: '🚫' },
    { id: 'minimal', label: 'Minimal', icon: '✨', style: 'white text, clean, bottom center' },
    { id: 'bold', label: 'Bold', icon: '💪', style: 'large bold text, high contrast, animated' },
    { id: 'karaoke', label: 'Karaoke', icon: '🎤', style: 'word-by-word highlight, TikTok style' },
    { id: 'subtitle', label: 'Subtitle', icon: '📝', style: 'classic subtitle bar, readable' },
    { id: 'aesthetic', label: 'Aesthetic', icon: '🌸', style: 'stylized font, soft colors, trendy' }
];

// Voice Options for Avatar
const REELS_VOICES = [
    { id: 'auto', label: 'Auto (Match Avatar)', icon: '🤖' },
    { id: 'female_young', label: 'Young Female', icon: '👩' },
    { id: 'female_mature', label: 'Mature Female', icon: '👩‍💼' },
    { id: 'male_young', label: 'Young Male', icon: '👨' },
    { id: 'male_mature', label: 'Mature Male', icon: '👨‍💼' },
    { id: 'energetic', label: 'Energetic', icon: '⚡' },
    { id: 'calm', label: 'Calm & Soothing', icon: '😌' }
];

// Language Options
const REELS_LANGUAGES = [
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { id: 'fr', label: 'Français', flag: '🇫🇷' },
    { id: 'es', label: 'Español', flag: '🇪🇸' },
    { id: 'it', label: 'Italiano', flag: '🇮🇹' },
    { id: 'pt', label: 'Português', flag: '🇧🇷' },
    { id: 'nl', label: 'Nederlands', flag: '🇳🇱' }
];

// Trending Templates (viral formats)
const REELS_TEMPLATES = [
    { id: 'custom', label: 'Custom', icon: '✏️', description: 'Create your own style' },
    { id: 'product_reveal', label: 'Product Reveal', icon: '🎁', description: '"Wait for it..." style reveal', script: 'Wait for it... This [product] is about to change everything.' },
    { id: 'pov_customer', label: 'POV: Customer', icon: '👀', description: 'POV style relatable content', script: 'POV: You finally found the perfect [product].' },
    { id: 'before_after', label: 'Before/After', icon: '🔄', description: 'Transformation content', script: 'Before vs After using this [product]. The difference is insane.' },
    { id: 'honest_review', label: 'Honest Review', icon: '💯', description: 'Authentic review style', script: 'Okay, let me be real with you about this [product]...' },
    { id: 'asmr_unbox', label: 'ASMR Unboxing', icon: '📦', description: 'Satisfying unbox content', script: 'The most satisfying unboxing you will see today.' },
    { id: 'day_in_life', label: 'Day in My Life', icon: '☀️', description: 'Lifestyle integration', script: 'A day in my life featuring this amazing [product].' },
    { id: 'get_ready', label: 'Get Ready With Me', icon: '💄', description: 'GRWM format', script: 'Get ready with me while I show you my new [product].' }
];

// Extended durations with multi-clip
const REELS_DURATIONS_EXTENDED = [
    { id: 4, label: '4s', description: 'Quick hook', clips: 1 },
    { id: 6, label: '6s', description: 'Short content', clips: 1 },
    { id: 8, label: '8s', description: 'Standard', clips: 1 },
    { id: 15, label: '15s', description: 'TikTok sweet spot', clips: 2 },
    { id: 30, label: '30s', description: 'Full story', clips: 4 },
    { id: 60, label: '60s', description: 'Complete video', clips: 8 }
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
// IMAGE COMPRESSION FOR REELS (Vercel Payload Limit Fix)
// ═══════════════════════════════════════════════════════════════════════════════

const compressImageForReels = (base64Image) => {
    // EXTREME - 80KB, Veo only needs reference
    const TARGET_SIZE_KB = 80;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const originalSizeKB = Math.round(base64Image.length / 1024);
            console.log(`📦 Reels: ${originalSizeKB}KB → <${TARGET_SIZE_KB}KB`);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Tiny - Veo upscales anyway
            const attempts = [
                { maxDim: 256, quality: 0.40 },
                { maxDim: 200, quality: 0.35 },
                { maxDim: 160, quality: 0.30 },
                { maxDim: 128, quality: 0.30 },
                { maxDim: 128, quality: 0.20 },
            ];

            for (const { maxDim, quality } of attempts) {
                let { width, height } = img;
                const scale = Math.min(1, maxDim / Math.max(width, height));
                width = Math.round(width * scale);
                height = Math.round(height * scale);

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const compressed = canvas.toDataURL('image/jpeg', quality);
                const sizeKB = Math.round(compressed.length / 1024);

                if (sizeKB <= TARGET_SIZE_KB) {
                    console.log(`✅ Reels compressed: ${originalSizeKB}KB → ${sizeKB}KB (${width}x${height}, q=${quality})`);
                    resolve(compressed);
                    return;
                }
            }

            // ABSOLUTE MINIMUM - 320px at 20% quality - this MUST fit
            console.log(`⚠️ Using absolute minimum compression...`);
            const ratio = 320 / Math.max(img.width, img.height);
            canvas.width = Math.round(img.width * ratio);
            canvas.height = Math.round(img.height * ratio);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressed = canvas.toDataURL('image/jpeg', 0.20);
            const finalSizeKB = Math.round(compressed.length / 1024);
            console.log(`⚠️ Absolute minimum: ${finalSizeKB}KB (${canvas.width}x${canvas.height})`);

            if (finalSizeKB > TARGET_SIZE_KB) {
                console.error(`❌ STILL too big at ${finalSizeKB}KB! This shouldn't happen.`);
            }
            resolve(compressed);
        };
        img.onerror = (e) => {
            console.error('❌ Image failed to load for compression:', e);
            reject(new Error('Failed to load image for compression'));
        };
        img.src = base64Image;
    });
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

    // Mode state: 'auto', 'manual', or 'reels'
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

    // Reels mode settings
    const [reelsContentType, setReelsContentType] = useState('product_showcase');
    const [reelsAvatarEnabled, setReelsAvatarEnabled] = useState(false);
    const [reelsAvatarGender, setReelsAvatarGender] = useState('female');
    const [reelsAvatarAge, setReelsAvatarAge] = useState('young');
    const [reelsAvatarStyle, setReelsAvatarStyle] = useState('casual');
    const [reelsAvatarMood, setReelsAvatarMood] = useState('enthusiastic');
    const [reelsPlatform, setReelsPlatform] = useState('tiktok');
    const [reelsDuration, setReelsDuration] = useState(6);
    const [reelsQuality, setReelsQuality] = useState('fast');
    const [reelsVideo, setReelsVideo] = useState(null);
    const [reelsIsGenerating, setReelsIsGenerating] = useState(false);
    const [reelsProgress, setReelsProgress] = useState(0);
    const [reelsPollingStatus, setReelsPollingStatus] = useState('');

    // Reels v2.0 - Enhanced features
    const [reelsMusic, setReelsMusic] = useState('none');
    const [reelsCaptionStyle, setReelsCaptionStyle] = useState('none');
    const [reelsVoice, setReelsVoice] = useState('auto');
    const [reelsLanguage, setReelsLanguage] = useState('en');
    const [reelsTemplate, setReelsTemplate] = useState('custom');
    const [reelsScript, setReelsScript] = useState('');
    const [reelsScriptEdited, setReelsScriptEdited] = useState(false);
    const [showScriptPreview, setShowScriptPreview] = useState(false);

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

    // ═══════════════════════════════════════════════════════════════════════════════
    // REELS VIDEO GENERATION
    // ═══════════════════════════════════════════════════════════════════════════════

    const handleGenerateReels = async () => {
        if (!sourceImage) return;

        // Calculate credits using extended calculator
        const creditKey = `reels_${reelsQuality}_${reelsDuration}s`;
        const creditResult = useCreditsHook(creditKey);
        if (!creditResult.success) {
            setShowCreditsModal(true);
            return;
        }

        setReelsIsGenerating(true);
        setReelsVideo(null);
        setReelsProgress(0);
        setError(null);

        try {
            const script = reelsScriptEdited && reelsScript ? reelsScript : '';

            console.log('🎬 Generating Reels:', {
                contentType: reelsContentType,
                duration: reelsDuration,
                music: reelsMusic,
                captions: reelsCaptionStyle,
                template: reelsTemplate
            });

            // Use EXACT same compression as Motion (1500KB, 0.8 quality)
            console.log('📦 Using Motion compression (1500KB, 0.8)...');
            setReelsProgress(5);
            const compressedImage = await compressImage(sourceImage, 1500, 0.8);
            const imageKB = Math.round(compressedImage.length / 1024);
            console.log(`📦 Compressed: ${imageKB}KB`);
            setReelsProgress(10);

            // Simplified request - only essential fields
            const requestBody = JSON.stringify({
                action: 'start',
                image: compressedImage,
                contentType: reelsContentType,
                duration: reelsDuration,
                qualityMode: reelsQuality,
                avatarConfig: reelsAvatarEnabled ? {
                    gender: reelsAvatarGender,
                    age: reelsAvatarAge,
                    style: reelsAvatarStyle,
                    mood: reelsAvatarMood
                } : null
            });
            const totalKB = Math.round(requestBody.length / 1024);
            console.log(`📡 Payload: ${totalKB}KB (img: ${imageKB}KB)`);

            // Same limit as Motion (4MB safe limit for Vercel)
            if (totalKB > 4000) {
                console.error(`⚠️ Too large: ${totalKB}KB`);
                throw new Error('Görsel çok büyük. Lütfen daha küçük bir görsel kullanın.');
            }

            const response = await fetch('/api/generate-reels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: requestBody
            });

            // Handle HTTP errors - check BEFORE trying to parse
            const responseText = await response.text();
            console.log(`📡 Response status: ${response.status}, length: ${responseText.length}`);

            if (!response.ok || responseText.startsWith('Request') || responseText.startsWith('<!')) {
                console.error(`HTTP ${response.status}:`, responseText.substring(0, 300));

                if (response.status === 413 || responseText.includes('Request Entity') || responseText.includes('too large')) {
                    throw new Error('Görsel çok büyük. Lütfen daha küçük bir görsel deneyin.');
                }
                if (responseText.startsWith('<!')) {
                    throw new Error('Sunucu hatası. Lütfen tekrar deneyin.');
                }
                throw new Error(`Sunucu hatası (${response.status}). Lütfen tekrar deneyin.`);
            }

            // Safely parse JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError, 'Response:', responseText.substring(0, 200));
                throw new Error('Geçersiz sunucu yanıtı. Görsel çok büyük olabilir.');
            }

            if (result.success) {
                if (result.operations && result.operations.length > 1) {
                    // Multi-clip generation: poll all operations then finalize
                    pollMultiClipGeneration(result.operations, result);
                } else if (result.operation_name) {
                    // Single clip generation
                    pollReelsGeneration(result.operation_name, result.model_id, result);
                } else {
                    throw new Error('No operation started');
                }
            } else {
                throw new Error(result.error || 'Failed to start video generation');
            }
        } catch (err) {
            console.error('Reels generation error:', err);
            setError(err.message || 'Failed to generate Reels');
            setReelsIsGenerating(false);
        }
    };

    const buildReelsPrompt = () => {
        const contentType = REELS_CONTENT_TYPES.find(t => t.id === reelsContentType);
        const hasAvatar = contentType?.hasAvatar && reelsAvatarEnabled !== false;

        // Get avatar description if needed
        let avatarDesc = '';
        if (hasAvatar) {
            const gender = REELS_AVATAR_GENDERS.find(g => g.id === reelsAvatarGender);
            const age = REELS_AVATAR_AGES.find(a => a.id === reelsAvatarAge);
            const style = REELS_AVATAR_STYLES.find(s => s.id === reelsAvatarStyle);
            const mood = REELS_AVATAR_MOODS.find(m => m.id === reelsAvatarMood);
            avatarDesc = `${age?.value || 'young person'} ${gender?.id === 'female' ? 'woman' : 'man'} wearing ${style?.value || 'casual clothes'}, ${mood?.value || 'enthusiastic expression'}`;
        }

        // Get language instruction
        const langInfo = REELS_LANGUAGES.find(l => l.id === reelsLanguage);
        const langInstruction = reelsLanguage !== 'en' ? ` Speaking in ${langInfo?.label || 'English'}.` : '';

        // Get voice instruction
        const voiceInfo = REELS_VOICES.find(v => v.id === reelsVoice);
        const voiceInstruction = reelsVoice !== 'auto' ? ` Voice style: ${voiceInfo?.label || 'natural'}.` : '';

        // Get platform-specific style
        const platformStyles = {
            tiktok: 'TikTok viral style, fast-paced, engaging hooks',
            instagram: 'Instagram Reels aesthetic, polished, branded feel',
            youtube: 'YouTube Shorts style, informative, clear presentation'
        };
        const platformStyle = platformStyles[reelsPlatform] || platformStyles.tiktok;

        // If user has custom script, use it
        if (reelsScriptEdited && reelsScript) {
            return `Vertical 9:16 video. ${platformStyle}. ${hasAvatar ? `A ${avatarDesc} presents the product.${langInstruction}${voiceInstruction}` : 'Product showcase.'} The narrative: "${reelsScript}" Professional lighting. ${reelsDuration} seconds.`;
        }

        // If template has a script, incorporate it
        const template = REELS_TEMPLATES.find(t => t.id === reelsTemplate);
        const templateScript = template?.script ? ` The hook: "${template.script}"` : '';

        // Build prompt based on content type
        const prompts = {
            product_showcase: `Vertical 9:16 cinematic product video. ${platformStyle}. Product displayed elegantly with dynamic camera movement: slow push in, then gentle orbit.${templateScript} Professional product photography lighting, soft shadows. Product sharp and centered. ${reelsDuration} seconds.`,

            hands_demo: `Vertical 9:16 video. ${platformStyle}. Elegant hands pick up and examine the product. Hands slowly rotate product, touch the material, show details.${templateScript} ASMR style, deliberate slow movements. Soft natural window lighting. Close-up focus. Satisfying product demonstration. ${reelsDuration} seconds.`,

            avatar_review: `Vertical 9:16 video. ${platformStyle}. A ${avatarDesc} holds the product, looking directly at camera, speaking with genuine enthusiasm.${langInstruction}${voiceInstruction}${templateScript} Shows product features, turns it around to display details. Natural daylight, modern room background. Authentic feel, relatable content. ${reelsDuration} seconds.`,

            lifestyle: `Vertical 9:16 lifestyle video. ${platformStyle}. A ${avatarDesc} naturally using the product in everyday setting.${langInstruction}${templateScript} Candid moment, aesthetic influencer content style. Soft natural lighting, cinematic color grade, warm tones. ${reelsDuration} seconds.`,

            unboxing: `Vertical 9:16 unboxing video. ${platformStyle}. Hands carefully open a package to reveal the product inside.${templateScript} Slow reveal, satisfying movements. ASMR unboxing style. Clean minimal background, soft lighting. Focus on anticipation and reveal moment. ${reelsDuration} seconds.`,

            hook_teaser: `Vertical 9:16 attention-grabbing hook video. ${platformStyle}.${templateScript} Product in dramatic presentation with fast dynamic movement, eye-catching angles, scroll-stopping energy. Bold lighting, maximum visual impact. ${reelsDuration} seconds.`
        };

        return prompts[reelsContentType] || prompts.product_showcase;
    };

    const pollReelsGeneration = async (operationName, modelId, initialResult) => {
        setReelsPollingStatus('Processing video...');

        let simulatedProgress = 5;
        const progressInterval = setInterval(() => {
            simulatedProgress = Math.min(85, simulatedProgress + Math.random() * 5);
            setReelsProgress(Math.round(simulatedProgress));
        }, 2000);

        const maxAttempts = 60;
        let attempts = 0;

        const poll = async () => {
            try {
                const response = await fetch('/api/generate-reels', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'poll',
                        operationName,
                        modelId
                    })
                });

                const result = await response.json();

                if (result.done || result.status === 'COMPLETE') {
                    clearInterval(progressInterval);

                    if (result.video_url) {
                        // Finalize: add music and captions
                        await finalizeReels([result.video_url], initialResult);
                    } else if (result.error) {
                        throw new Error(result.error);
                    }
                } else if (result.error || result.status === 'FAILED') {
                    clearInterval(progressInterval);
                    throw new Error(result.error || 'Generation failed');
                } else {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(poll, 3000);
                    } else {
                        clearInterval(progressInterval);
                        throw new Error('Video generation timed out');
                    }
                }
            } catch (err) {
                clearInterval(progressInterval);
                setError(err.message || 'Failed to generate video');
                setReelsIsGenerating(false);
            }
        };

        poll();
    };

    // Multi-clip polling for extended durations (15s, 30s, 60s)
    const pollMultiClipGeneration = async (operations, initialResult) => {
        setReelsPollingStatus(`Generating ${operations.length} clips...`);
        setReelsProgress(5);

        const totalClips = operations.length;
        const completedVideos = [];

        // Poll all operations in parallel
        const pollAllOperations = async () => {
            let allComplete = false;
            let attempts = 0;
            const maxAttempts = 120; // Longer timeout for multi-clip

            while (!allComplete && attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 3000));
                attempts++;

                let completedCount = 0;

                for (const op of operations) {
                    if (op.completed) {
                        completedCount++;
                        continue;
                    }

                    try {
                        const response = await fetch('/api/generate-reels', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'poll',
                                operationName: op.operation_name,
                                modelId: op.model_id
                            })
                        });

                        const result = await response.json();

                        if (result.done || result.status === 'COMPLETE') {
                            if (result.video_url) {
                                op.completed = true;
                                op.video_url = result.video_url;
                                completedCount++;
                            }
                        } else if (result.error || result.status === 'FAILED') {
                            console.error(`Clip ${op.clip_index + 1} failed:`, result.error);
                            op.completed = true;
                            op.failed = true;
                            completedCount++;
                        }
                    } catch (err) {
                        console.error(`Error polling clip ${op.clip_index + 1}:`, err);
                    }
                }

                const progress = Math.round((completedCount / totalClips) * 75);
                setReelsProgress(progress);
                setReelsPollingStatus(`Generated ${completedCount}/${totalClips} clips...`);

                allComplete = operations.every(op => op.completed);
            }

            if (!allComplete) {
                throw new Error('Multi-clip generation timed out');
            }

            // Collect successful video URLs
            const videoUrls = operations
                .filter(op => op.video_url && !op.failed)
                .sort((a, b) => a.clip_index - b.clip_index)
                .map(op => op.video_url);

            if (videoUrls.length === 0) {
                throw new Error('All clips failed to generate');
            }

            // Finalize: stitch + music + captions
            await finalizeReels(videoUrls, initialResult);
        };

        try {
            await pollAllOperations();
        } catch (err) {
            setError(err.message || 'Failed to generate multi-clip video');
            setReelsIsGenerating(false);
        }
    };

    // Finalize reels: stitch clips, add music, burn captions
    const finalizeReels = async (videoUrls, initialResult) => {
        setReelsPollingStatus('Finalizing video...');
        setReelsProgress(85);

        try {
            const response = await fetch('/api/generate-reels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'finalize',
                    videoUrls,
                    musicId: initialResult.music_id || reelsMusic,
                    captionStyle: initialResult.caption_style || reelsCaptionStyle,
                    script: initialResult.script || reelsScript,
                    targetDuration: initialResult.target_duration || reelsDuration,
                    contentType: reelsContentType  // For dynamic transitions
                })
            });

            const result = await response.json();

            if (result.success && result.video_url) {
                setReelsProgress(100);
                setReelsVideo(result.video_url);
                setReelsPollingStatus('');
            } else {
                throw new Error(result.error || 'Finalization failed');
            }
        } catch (err) {
            setError(err.message || 'Failed to finalize video');
        }

        setReelsIsGenerating(false);
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
                            <div className="grid grid-cols-3 gap-1.5">
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
                                <button
                                    onClick={() => setMode('reels')}
                                    className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                                        mode === 'reels'
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500'
                                            : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                    }`}
                                >
                                    🎬 {t('creative.modeToggle.reels') || 'Reels'}
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

                        {/* Aspect Ratio - Only for Auto/Manual modes */}
                        {mode !== 'reels' && (
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
                        )}

                        {/* Output Count - Only for Auto/Manual modes */}
                        {mode !== 'reels' && (
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
                        )}

                        {/* REELS MODE OPTIONS - TOP TIER v2.0 */}
                        {mode === 'reels' && (
                            <div className="space-y-3">
                                {/* Trending Templates */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                        🔥 {t('creative.reels.template') || 'Viral Template'}
                                    </div>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {REELS_TEMPLATES.map((tmpl) => (
                                            <button
                                                key={tmpl.id}
                                                onClick={() => {
                                                    setReelsTemplate(tmpl.id);
                                                    if (tmpl.script) {
                                                        setReelsScript(tmpl.script);
                                                        setReelsScriptEdited(false);
                                                    }
                                                }}
                                                className={`px-2 py-2 rounded-lg text-[9px] font-medium transition-all border text-center ${
                                                    reelsTemplate === tmpl.id
                                                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500'
                                                        : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                                }`}
                                                title={tmpl.description}
                                            >
                                                <div className="text-sm mb-0.5">{tmpl.icon}</div>
                                                <div className="truncate">{tmpl.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Content Type Selection */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                        🎬 {t('creative.reels.contentType') || 'Content Type'}
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {REELS_CONTENT_TYPES.map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => {
                                                    setReelsContentType(type.id);
                                                    setReelsAvatarEnabled(type.hasAvatar);
                                                }}
                                                className={`px-2 py-2 rounded-lg text-[10px] font-medium transition-all border text-center ${
                                                    reelsContentType === type.id
                                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500'
                                                        : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                                }`}
                                                title={type.description}
                                            >
                                                <div className="text-base mb-0.5">{type.icon}</div>
                                                <div>{t(`creative.reels.contentTypes.${type.id}`) || type.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Script Preview & Edit */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                            📝 {t('creative.reels.script') || 'Script / Narrative'}
                                        </div>
                                        <button
                                            onClick={() => setShowScriptPreview(!showScriptPreview)}
                                            className="text-[9px] text-purple-500 hover:text-purple-700"
                                        >
                                            {showScriptPreview ? 'Hide' : 'Edit'}
                                        </button>
                                    </div>
                                    {showScriptPreview && (
                                        <textarea
                                            value={reelsScript}
                                            onChange={(e) => {
                                                setReelsScript(e.target.value);
                                                setReelsScriptEdited(true);
                                            }}
                                            placeholder="AI will generate a script based on your product, or write your own..."
                                            className="w-full h-20 p-2 text-[11px] bg-[#F5F4F1] border border-[#E8E7E4] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    )}
                                    {!showScriptPreview && reelsScript && (
                                        <div className="text-[10px] text-[#8C8C8C] bg-[#F5F4F1] p-2 rounded-lg truncate">
                                            {reelsScript.substring(0, 50)}...
                                        </div>
                                    )}
                                </div>

                                {/* Avatar Options - Only show if content type requires avatar */}
                                {REELS_CONTENT_TYPES.find(t => t.id === reelsContentType)?.hasAvatar && (
                                    <div className="space-y-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-600">
                                            👤 Avatar & Voice
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <span className="text-[9px] text-[#8C8C8C]">Gender</span>
                                                <div className="flex gap-1">
                                                    {REELS_AVATAR_GENDERS.map((g) => (
                                                        <button
                                                            key={g.id}
                                                            onClick={() => setReelsAvatarGender(g.id)}
                                                            className={`flex-1 px-2 py-1 rounded text-[9px] ${
                                                                reelsAvatarGender === g.id
                                                                    ? 'bg-purple-500 text-white'
                                                                    : 'bg-white border border-[#E8E7E4]'
                                                            }`}
                                                        >
                                                            {g.icon}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] text-[#8C8C8C]">Age</span>
                                                <select
                                                    value={reelsAvatarAge}
                                                    onChange={(e) => setReelsAvatarAge(e.target.value)}
                                                    className="w-full px-2 py-1 text-[9px] bg-white border border-[#E8E7E4] rounded"
                                                >
                                                    {REELS_AVATAR_AGES.map((a) => (
                                                        <option key={a.id} value={a.id}>{a.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] text-[#8C8C8C]">Style</span>
                                                <select
                                                    value={reelsAvatarStyle}
                                                    onChange={(e) => setReelsAvatarStyle(e.target.value)}
                                                    className="w-full px-2 py-1 text-[9px] bg-white border border-[#E8E7E4] rounded"
                                                >
                                                    {REELS_AVATAR_STYLES.map((s) => (
                                                        <option key={s.id} value={s.id}>{s.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] text-[#8C8C8C]">Mood</span>
                                                <select
                                                    value={reelsAvatarMood}
                                                    onChange={(e) => setReelsAvatarMood(e.target.value)}
                                                    className="w-full px-2 py-1 text-[9px] bg-white border border-[#E8E7E4] rounded"
                                                >
                                                    {REELS_AVATAR_MOODS.map((m) => (
                                                        <option key={m.id} value={m.id}>{m.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        {/* Voice & Language */}
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-200">
                                            <div className="space-y-1">
                                                <span className="text-[9px] text-[#8C8C8C]">🎤 Voice</span>
                                                <select
                                                    value={reelsVoice}
                                                    onChange={(e) => setReelsVoice(e.target.value)}
                                                    className="w-full px-2 py-1 text-[9px] bg-white border border-[#E8E7E4] rounded"
                                                >
                                                    {REELS_VOICES.map((v) => (
                                                        <option key={v.id} value={v.id}>{v.icon} {v.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] text-[#8C8C8C]">🌍 Language</span>
                                                <select
                                                    value={reelsLanguage}
                                                    onChange={(e) => setReelsLanguage(e.target.value)}
                                                    className="w-full px-2 py-1 text-[9px] bg-white border border-[#E8E7E4] rounded"
                                                >
                                                    {REELS_LANGUAGES.map((l) => (
                                                        <option key={l.id} value={l.id}>{l.flag} {l.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Duration Only */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1 text-[#8C8C8C] text-[9px] font-semibold uppercase">
                                        ⏱️ Duration
                                    </div>
                                    <div className="flex gap-1">
                                        {REELS_DURATIONS_EXTENDED.slice(0, 4).map((d) => (
                                            <button
                                                key={d.id}
                                                onClick={() => setReelsDuration(d.id)}
                                                className={`flex-1 px-2 py-2 rounded text-[10px] font-medium border ${
                                                    reelsDuration === d.id
                                                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                        : 'bg-[#F5F4F1] border-[#E8E7E4]'
                                                }`}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Background Music */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1 text-[#8C8C8C] text-[9px] font-semibold uppercase">
                                        🎵 Background Music
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        {REELS_MUSIC.map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => setReelsMusic(m.id)}
                                                className={`px-2 py-1.5 rounded text-[9px] font-medium border transition-all ${
                                                    reelsMusic === m.id
                                                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                        : 'bg-[#F5F4F1] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                                }`}
                                            >
                                                {m.icon} {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quality Mode */}
                                <div className="flex gap-1.5">
                                    {REELS_QUALITY_MODES.map((q) => (
                                        <button
                                            key={q.id}
                                            onClick={() => setReelsQuality(q.id)}
                                            className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-medium transition-all border ${
                                                reelsQuality === q.id
                                                    ? q.id === 'pro'
                                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500'
                                                        : 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                    : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                            }`}
                                        >
                                            {q.id === 'pro' ? '💎 Pro' : '⚡ Fast'}
                                        </button>
                                    ))}
                                </div>

                                {/* Reels Generate Button */}
                                <button
                                    onClick={handleGenerateReels}
                                    disabled={!sourceImage || reelsIsGenerating}
                                    className={`w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative shadow-lg
                                        ${sourceImage && !reelsIsGenerating ? 'animate-pulse hover:scale-[1.02]' : ''}`}
                                >
                                    {reelsIsGenerating ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>{reelsPollingStatus || `Generating Reels... ${reelsProgress}%`}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} />
                                            <span>🎬 Generate Viral Reels</span>
                                            <span className="absolute right-4 text-xs text-white/70">
                                                {calculateReelsCost(reelsDuration, reelsQuality)} credits
                                            </span>
                                        </>
                                    )}
                                </button>

                            </div>
                        )}

                        {/* Generate Button - Only for Auto and Manual modes */}
                        {mode !== 'reels' && (
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
                        )}

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

                        {/* Generated Reels Video - Below Canvas */}
                        {mode === 'reels' && reelsVideo && (
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-semibold text-[#8C8C8C] uppercase tracking-wider flex items-center gap-2">
                                        <Film size={14} />
                                        {t('creative.reels.yourVideo') || 'Your Viral Reels'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-[#8C8C8C] bg-gradient-to-r from-pink-100 to-purple-100 px-2 py-1 rounded-full">
                                            {reelsDuration}s • {reelsQuality === 'pro' ? 'Pro' : 'Fast'}
                                        </span>
                                    </div>
                                </div>

                                {/* Video Player */}
                                <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#E8E7E4]">
                                    <div className="aspect-[9/16] max-h-[500px] mx-auto">
                                        <video
                                            src={reelsVideo}
                                            controls
                                            className="w-full h-full object-contain"
                                            autoPlay
                                            loop
                                            playsInline
                                        />
                                    </div>

                                    {/* Duration badge */}
                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                                        🎬 {reelsDuration}s Reels
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = reelsVideo;
                                            a.download = `reels-${reelsDuration}s-${Date.now()}.mp4`;
                                            a.click();
                                        }}
                                        className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                                    >
                                        <Download size={18} />
                                        {t('common.download') || 'Download'}
                                    </button>
                                    <button
                                        onClick={() => setReelsVideo(null)}
                                        className="px-6 py-3 bg-[#F5F4F1] hover:bg-[#E8E7E4] text-[#1A1A1A] rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <RefreshCcw size={16} />
                                        {t('creative.reels.newVideo') || 'New'}
                                    </button>
                                </div>
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
