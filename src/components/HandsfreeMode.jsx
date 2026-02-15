import React, { useState, useRef, useEffect } from 'react';
import {
    Camera, Upload, Copy, Check, Sparkles, Loader2, Download,
    RotateCcw, Eye, Move, Focus, Aperture, Image as ImageIcon, AlertCircle, Wand2, X, Edit3, Bookmark
} from 'lucide-react';
import { analyzeProductForHandsfree, generateHandsfreeImage } from '../utils/aiHelpers';
import { createProject, saveProject } from '../utils/projectManager';
import { addToLibrary } from '../utils/libraryManager';
import { useTranslation } from '../i18n';
import { useCredits } from '../contexts/CreditContext';
import InsufficientCreditsModal from './InsufficientCreditsModal';
import SourceSelectionModal from './SourceSelectionModal';

/**
 * HandsfreeMode - Professional Prompt Architect
 * Redesigned: 40% left panel (prompt generation) + 60% right canvas (image generation/edit)
 */

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION: All option sets - ENGLISH LABELS
// ═══════════════════════════════════════════════════════════════════

const ASPECT_RATIOS = [
    { id: 'original', label: 'Original' },
    { id: '1:1', label: '1:1' },
    { id: '4:3', label: '4:3' },
    { id: '3:2', label: '3:2' },
    { id: '16:9', label: '16:9' },
    { id: '3:4', label: '3:4' },
    { id: '2:3', label: '2:3' },
    { id: '9:16', label: '9:16' }
];

const CAMERA_ANGLES = [
    { id: 'eye_level', label: 'Eye Level', en: 'Eye Level' },
    { id: 'shoulder', label: 'Shoulder', en: 'Shoulder Level' },
    { id: 'waist', label: 'Waist', en: 'Waist Level' },
    { id: 'knee', label: 'Knee', en: 'Knee Level' },
    { id: 'ground', label: 'Ground', en: 'Ground Level' },
    { id: 'low', label: 'Low Angle', en: 'Low Angle' },
    { id: 'high', label: 'High Angle', en: 'High Angle' },
    { id: 'bird', label: 'Bird Eye', en: 'Bird\'s Eye View' },
    { id: 'drone', label: 'Drone', en: 'Drone Shot' },
    { id: 'dutch', label: 'Dutch', en: 'Dutch Angle' }
];

const SHOT_SCALES = [
    { id: 'extreme_close', label: 'Extreme Close', en: 'Extreme Close-Up' },
    { id: 'close', label: 'Close-Up', en: 'Close-Up' },
    { id: 'medium_close', label: 'Medium Close', en: 'Medium Close-Up' },
    { id: 'medium', label: 'Medium', en: 'Medium Shot' },
    { id: 'full', label: 'Full Shot', en: 'Full Shot' },
    { id: 'wide', label: 'Wide', en: 'Wide Shot' }
];

const LENS_OPTIONS = [
    { id: '14mm', label: '14mm Ultra', en: '14mm Ultra Wide' },
    { id: '24mm', label: '24mm Wide', en: '24mm Wide' },
    { id: '35mm', label: '35mm Classic', en: '35mm Classic' },
    { id: '50mm', label: '50mm Natural', en: '50mm Natural' },
    { id: '85mm', label: '85mm Portrait', en: '85mm Portrait' },
    { id: '200mm', label: '200mm Tele', en: '200mm Telephoto' },
    { id: 'iphone17pro', label: 'iPhone 17 Pro', en: 'iPhone 17 Pro' },
    { id: 'arri', label: 'ARRI Alexa', en: 'ARRI Alexa 35' }
];

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Option Button Group (Compact)
// ═══════════════════════════════════════════════════════════════════
const OptionGroup = ({ title, icon: Icon, options, selected, onSelect, columns = 4, translationKeyPrefix, t }) => {
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
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all text-center border hover:scale-[1.02] active:scale-[0.98]
                            ${selected === opt.id
                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md'
                                : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4] hover:shadow-sm'
                            }`}
                    >
                        {translationKeyPrefix && t ? t(`${translationKeyPrefix}.${opt.id}`) : opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function HandsfreeMode({ marketplace, onBack, onNavigate, initialProject }) {
    const { t } = useTranslation();
    const { useCredits: useCreditsHook } = useCredits();

    // State
    const [sourceImage, setSourceImage] = useState(null);
    const [manualDirective, setManualDirective] = useState('');
    const [aspectRatio, setAspectRatio] = useState('original');
    const [cameraAngle, setCameraAngle] = useState('eye_level');
    const [shotScale, setShotScale] = useState('full');
    const [lens, setLens] = useState('50mm');

    const [generatedPrompt, setGeneratedPrompt] = useState(null);
    const [productAnalysis, setProductAnalysis] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [generatingStep, setGeneratingStep] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);
    const [showCreditsModal, setShowCreditsModal] = useState(false);

    // Canvas state - generated images
    const [generatedImages, setGeneratedImages] = useState([]);
    const [activeImageIndex, setActiveImageIndex] = useState(-1); // -1 = original, 0+ = generated

    // Prompt input for image generation/edit
    const [imagePrompt, setImagePrompt] = useState('');

    // Library/Source selection state
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [addedToLibrary, setAddedToLibrary] = useState(false);

    const fileInputRef = useRef(null);

    // Load project data when resuming from history
    useEffect(() => {
        if (initialProject && initialProject.productInfo?.featureType === 'handsfree') {
            console.log('⚡ Loading Handsfree project:', initialProject.id);

            // Load source image
            const sourceImg = initialProject.originalImage ||
                initialProject.assets?.find(a => a.type === 'ORIGINAL')?.url;
            if (sourceImg) {
                setSourceImage(sourceImg);
            }

            // Load handsfree settings from productInfo
            const info = initialProject.productInfo;
            if (info.cameraAngle) setCameraAngle(info.cameraAngle);
            if (info.shotScale) setShotScale(info.shotScale);
            if (info.lens) setLens(info.lens);
            if (info.aspectRatio) setAspectRatio(info.aspectRatio);
            if (info.directive) setManualDirective(info.directive);

            // Load generated images from assets
            const handsfreeAssets = initialProject.assets?.filter(a => a.type === 'HANDSFREE') || [];
            if (handsfreeAssets.length > 0) {
                const imageUrls = handsfreeAssets.map(a => a.url);
                setGeneratedImages(imageUrls);
                setActiveImageIndex(imageUrls.length - 1);
                console.log('⚡ Loaded', imageUrls.length, 'handsfree images');
            }
        }
    }, [initialProject]);

    // Get active image (source or generated)
    // activeImageIndex: -1 = original source, 0+ = generated images
    const getActiveImage = () => {
        if (activeImageIndex >= 0 && activeImageIndex < generatedImages.length) {
            return generatedImages[activeImageIndex];
        }
        return sourceImage;
    };

    // Check if we're in edit mode (only when a GENERATED image is selected, not original)
    const isEditMode = activeImageIndex >= 0 && generatedImages.length > 0;

    // Get label for active image
    const getActiveImageLabel = () => {
        if (activeImageIndex === -1 || generatedImages.length === 0) {
            return t('aspectRatio.ratios.original');
        }
        return `${t('handsfree.generated')} ${activeImageIndex + 1}`;
    };

    // Handle image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            setSourceImage(imageData);
            setGeneratedImages([]);
            setActiveImageIndex(-1); // Start with original selected

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

    // Add current image to library
    const handleAddToLibrary = async () => {
        const activeImage = getActiveImage();
        if (activeImage) {
            try {
                await addToLibrary({
                    url: activeImage,
                    type: 'image',
                    name: `Handsfree ${new Date().toLocaleDateString()}`,
                    source: activeImageIndex >= 0 ? 'generated' : 'upload',
                    metadata: { cameraAngle, shotScale, lens, aspectRatio }
                });
                setAddedToLibrary(true);
                setTimeout(() => setAddedToLibrary(false), 2000);
            } catch (err) {
                console.error('Failed to add to library:', err);
            }
        }
    };

    // Handle selection from library
    const handleSelectFromLibrary = (asset) => {
        setSourceImage(asset.url);
        setGeneratedImages([]);
        setActiveImageIndex(-1);
    };

    // Build professional prompt with CLEAR, ACTIONABLE directives
    const buildPrompt = () => {
        const angleConfig = CAMERA_ANGLES.find(a => a.id === cameraAngle);
        const scaleConfig = SHOT_SCALES.find(s => s.id === shotScale);
        const lensConfig = LENS_OPTIONS.find(l => l.id === lens);

        // Aspect ratio instruction
        let aspectInstruction = '';
        if (aspectRatio !== 'original') {
            const [w, h] = aspectRatio.split(':').map(Number);
            if (w > h) {
                aspectInstruction = `OUTPUT IMAGE MUST BE ${aspectRatio} ASPECT RATIO (horizontal/landscape format).`;
            } else if (h > w) {
                aspectInstruction = `OUTPUT IMAGE MUST BE ${aspectRatio} ASPECT RATIO (vertical/portrait format).`;
            } else {
                aspectInstruction = `OUTPUT IMAGE MUST BE ${aspectRatio} ASPECT RATIO (square format).`;
            }
        } else {
            aspectInstruction = 'Maintain the original aspect ratio of the source image.';
        }

        // Camera angle instruction
        const cameraInstructions = {
            'eye_level': 'Position camera at EYE LEVEL (straight on, parallel to the ground).',
            'shoulder': 'Position camera at SHOULDER HEIGHT (slightly below eye level).',
            'waist': 'Position camera at WAIST HEIGHT (looking slightly up at subject).',
            'knee': 'Position camera at KNEE HEIGHT (low angle looking up).',
            'ground': 'Position camera at GROUND LEVEL (worm\'s eye perspective).',
            'low': 'Position camera at LOW ANGLE (below eye level, looking up).',
            'high': 'Position camera at HIGH ANGLE (above eye level, looking down).',
            'bird': 'Position camera DIRECTLY ABOVE looking DOWN (top-down view).',
            'drone': 'Position camera as DRONE SHOT (high aerial view, 45 degree angle).',
            'dutch': 'Position camera at DUTCH ANGLE (tilted 15-30 degrees).'
        };

        // Shot scale instruction
        const scaleInstructions = {
            'extreme_close': 'Frame as EXTREME CLOSE-UP (detail fills the entire frame).',
            'close': 'Frame as CLOSE-UP (product fills 80-90% of the frame).',
            'medium_close': 'Frame as MEDIUM CLOSE-UP (product fills 60-70% of the frame).',
            'medium': 'Frame as MEDIUM SHOT (product fills 40-50% of the frame).',
            'full': 'Frame as FULL SHOT (entire product visible with comfortable margins).',
            'wide': 'Frame as WIDE SHOT (product appears smaller, environment prominent).'
        };

        // Lens instruction
        const lensInstructions = {
            '14mm': 'Apply 14MM ULTRA WIDE LENS effect (dramatic perspective).',
            '24mm': 'Apply 24MM WIDE ANGLE LENS effect (environmental context).',
            '35mm': 'Apply 35MM CLASSIC LENS effect (natural perspective).',
            '50mm': 'Apply 50MM NATURAL LENS effect (human eye perspective).',
            '85mm': 'Apply 85MM PORTRAIT LENS effect (beautiful background blur).',
            '200mm': 'Apply 200MM TELEPHOTO LENS effect (background compression).',
            'iphone17pro': 'Apply IPHONE 17 PRO camera style (computational photography, HDR).',
            'arri': 'Apply ARRI ALEXA 35 CINEMA look (Hollywood-grade color science).'
        };

        // Build custom directive as PRIORITY
        let priorityText = '';
        if (manualDirective && manualDirective.trim()) {
            priorityText = `PRIORITY: ${manualDirective}. `;
        }

        const cameraText = cameraInstructions[cameraAngle] || 'Eye level camera';
        const scaleText = scaleInstructions[shotScale] || 'Full shot';
        const lensText = lensInstructions[lens] || '50mm lens';
        const aspectText = aspectRatio === 'original' ? 'original ratio' : aspectRatio;

        const prompt = `${priorityText}Generate photorealistic image of this subject. ${cameraText} ${scaleText} ${lensText} Aspect ratio: ${aspectText}. Keep identical face, body, hair, clothing. DSLR quality.`;

        return { prompt, aspect_ratio_value: aspectRatio };
    };

    // Phase 1: Generate PROMPT only (2 credits)
    const handleGeneratePrompt = async () => {
        if (!sourceImage) return;

        setIsGenerating(true);
        setError(null);

        try {
            setGeneratingStep('Analyzing product...');
            const analysis = await analyzeProductForHandsfree(sourceImage);
            setProductAnalysis(analysis);

            setGeneratingStep('Building professional prompt...');
            const basePrompt = buildPrompt();

            // Enhance prompt with product analysis
            const productInfo = `Product: ${analysis.shape_description || 'item'}. Colors: ${analysis.primary_colors?.join(', ') || 'various'}. Pattern: ${analysis.patterns || 'none'}.`;

            const enhancedPrompt = {
                prompt: `${basePrompt.prompt} ${productInfo}`,
                aspect_ratio_value: basePrompt.aspect_ratio_value
            };

            setGeneratedPrompt(enhancedPrompt);
            setGeneratingStep('Prompt ready!');

        } catch (err) {
            console.error('Prompt generation failed:', err);
            setError(err.message || 'Prompt generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    // Generate/Edit IMAGE with Gemini (6 credits)
    const handleGenerateOrEditImage = async () => {
        if (!sourceImage || !imagePrompt.trim()) return;

        // Check credits before generating
        const creditResult = useCreditsHook('handsfree');
        if (!creditResult.success) {
            setShowCreditsModal(true);
            return;
        }

        setIsGeneratingImage(true);
        setError(null);

        try {
            // Determine which image to use as source
            const activeImg = getActiveImage();

            // Send clean request to backend - backend handles preservation rules
            const promptSchema = {
                prompt: imagePrompt,
                isEditMode: isEditMode,
                aspect_ratio_value: aspectRatio
            };

            console.log('🎨 Handsfree request:', { isEditMode, prompt: imagePrompt.substring(0, 100) });

            const result = await generateHandsfreeImage(activeImg, promptSchema);

            // Log full response for debugging
            console.log('📦 Handsfree response:', result);
            if (!result.success && result.model_errors) {
                console.error('🔴 Model errors:', result.model_errors);
            }
            const imageUrl = result.imageUrl || result.image_url || result.generated_image;

            if (result.success && imageUrl) {
                // Add to generated images array
                setGeneratedImages(prev => [...prev, imageUrl]);
                setActiveImageIndex(generatedImages.length); // Select the new image

                // Save to history
                try {
                    const handsfreeName = manualDirective
                        ? `Handsfree: ${manualDirective.substring(0, 30)}${manualDirective.length > 30 ? '...' : ''}`
                        : `Handsfree: ${shotScale} ${cameraAngle}`;

                    const project = createProject(
                        handsfreeName,
                        marketplace || 'handsfree',
                        sourceImage,
                        [{
                            id: `handsfree_${Date.now()}`,
                            type: 'HANDSFREE',
                            url: imageUrl,
                            createdAt: Date.now()
                        }],
                        null,
                        {
                            featureType: 'handsfree',
                            cameraAngle,
                            shotScale,
                            lens,
                            aspectRatio,
                            directive: manualDirective,
                            prompt: imagePrompt
                        }
                    );
                    await saveProject(project);
                } catch (saveErr) {
                    console.warn('Failed to save handsfree to history:', saveErr);
                }

                // Clear prompt after success
                setImagePrompt('');
            } else {
                throw new Error('Image generation failed');
            }

        } catch (err) {
            console.error('Image generation failed:', err);
            setError(err.message || 'Image generation failed');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    // Copy prompt to clipboard
    const handleCopyPrompt = () => {
        if (!generatedPrompt) return;
        navigator.clipboard.writeText(generatedPrompt.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Use generated prompt in image prompt area
    const handleUseGeneratedPrompt = () => {
        if (generatedPrompt?.prompt) {
            setImagePrompt(generatedPrompt.prompt);
        }
    };

    // Clear everything
    const handleClear = () => {
        setSourceImage(null);
        setGeneratedPrompt(null);
        setGeneratedImages([]);
        setActiveImageIndex(-1);
        setImagePrompt('');
        setManualDirective('');
        setError(null);
    };

    return (
        <>
            <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#FAF9F6]">
                {/* ════════════════════════════════════════════════════════════
                LEFT PANEL - Full width on mobile, 40% on desktop
                ════════════════════════════════════════════════════════════ */}
                <aside className="w-full md:w-[40%] md:min-w-[360px] md:max-w-[480px] glass-panel md:border-r border-b md:border-b-0 border-[#E8E7E4]/60 overflow-y-auto max-h-[50vh] md:max-h-none">
                    <div className="p-5 space-y-4">
                        {/* Source Image Upload */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                <Camera size={12} />
                                {t('handsfree.sourceImage')}
                            </div>
                            {sourceImage ? (
                                <div className="relative">
                                    <img
                                        src={sourceImage}
                                        alt="Source"
                                        className="w-full h-32 object-contain bg-[#F5F4F1] rounded-xl border border-[#E8E7E4]"
                                    />
                                    <button
                                        onClick={handleClear}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full shadow-md transition-colors"
                                    >
                                        <X size={12} className="text-white" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowSourceModal(true)}
                                    className="w-full h-32 border-2 border-dashed border-[#E8E7E4] rounded-xl hover:border-[#1A1A1A] transition-colors flex flex-col items-center justify-center gap-2 bg-[#F5F4F1]"
                                >
                                    <Upload size={24} className="text-[#8C8C8C]" />
                                    <span className="text-xs text-[#5C5C5C]">{t('handsfree.uploadImage')}</span>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        {/* Custom Directive */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                <Move size={12} />
                                {t('handsfree.customDirective')}
                            </div>
                            <input
                                type="text"
                                value={manualDirective}
                                onChange={(e) => setManualDirective(e.target.value)}
                                placeholder={t('handsfree.customDirectivePlaceholder')}
                                className="w-full px-3 py-2 bg-[#F5F4F1] border border-[#E8E7E4] rounded-lg text-[#1A1A1A] placeholder-[#8C8C8C] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 text-sm"
                            />
                        </div>

                        {/* Camera Angle */}
                        <OptionGroup
                            title={t('camera.title')}
                            icon={Eye}
                            options={CAMERA_ANGLES}
                            selected={cameraAngle}
                            onSelect={setCameraAngle}
                            columns={5}
                            translationKeyPrefix="camera.angles"
                            t={t}
                        />

                        {/* Shot Scale */}
                        <OptionGroup
                            title={t('shotScale.title')}
                            icon={Focus}
                            options={SHOT_SCALES}
                            selected={shotScale}
                            onSelect={setShotScale}
                            columns={3}
                            translationKeyPrefix="shotScale.scales"
                            t={t}
                        />

                        {/* Lens */}
                        <OptionGroup
                            title={t('lens.title')}
                            icon={Aperture}
                            options={LENS_OPTIONS}
                            selected={lens}
                            onSelect={setLens}
                            columns={4}
                        />

                        {/* Aspect Ratio */}
                        <OptionGroup
                            title={t('aspectRatio.title')}
                            icon={ImageIcon}
                            options={ASPECT_RATIOS}
                            selected={aspectRatio}
                            onSelect={setAspectRatio}
                            columns={4}
                            translationKeyPrefix="aspectRatio.ratios"
                            t={t}
                        />

                        {/* Generate Prompt Button */}
                        <button
                            onClick={handleGeneratePrompt}
                            disabled={!sourceImage || isGenerating}
                            className="w-full py-3 bg-[#1A1A1A] rounded-xl font-semibold text-white hover:bg-[#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-sm">{generatingStep || t('common.generating')}</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 size={16} />
                                    <span className="text-sm">{t('handsfree.generatePrompt')}</span>
                                    <span className="absolute right-3 text-[10px] text-white/60">2 {t('credits.creditsUnit')}</span>
                                </>
                            )}
                        </button>

                        {/* Generated Prompt Display */}
                        {generatedPrompt && (
                            <div className="bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-[#1A1A1A]">{t('handsfree.generatedPrompt')}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleUseGeneratedPrompt}
                                            className="flex items-center gap-1 px-2 py-1 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-[10px] font-medium text-white transition-colors"
                                        >
                                            <Sparkles size={10} />
                                            Use
                                        </button>
                                        <button
                                            onClick={handleCopyPrompt}
                                            className="flex items-center gap-1 px-2 py-1 bg-[#E8E7E4] hover:bg-[#D4D3D0] rounded-lg text-[10px] font-medium transition-colors"
                                        >
                                            {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-[#5C5C5C] leading-relaxed max-h-24 overflow-y-auto">
                                    {generatedPrompt.prompt}
                                </p>
                            </div>
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
                RIGHT PANEL - Full width on mobile, 60% on desktop
                ════════════════════════════════════════════════════════════ */}
                <section className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
                    {/* Canvas Area - Responsive height */}
                    <div className="flex flex-col">
                        {/* Main Canvas - Responsive height based on screen */}
                        <div
                            className="relative rounded-2xl overflow-hidden h-[300px] md:h-[450px]"
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
                                            filter: 'blur(30px) brightness(0.7)',
                                            transform: 'scale(1.2)'
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/20" />

                                    {/* Main Image */}
                                    <div className="relative h-full w-full flex items-center justify-center p-4">
                                        <img
                                            src={getActiveImage()}
                                            alt={getActiveImageLabel()}
                                            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                                        />
                                        {/* Image Label */}
                                        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                                            {getActiveImageLabel()}
                                        </div>
                                    </div>

                                    {/* Canvas Control Buttons */}
                                    <div className="absolute top-4 right-4 flex gap-2">
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
                                                <Bookmark size={18} className="text-[#1A1A1A]" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = getActiveImage();
                                                link.download = `volla_handsfree_${Date.now()}.png`;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                            className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-105"
                                            title="Download Image"
                                        >
                                            <Download size={18} className="text-[#1A1A1A]" />
                                        </button>
                                    </div>

                                    {/* Loading Overlay */}
                                    {isGeneratingImage && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                            <div className="text-center text-white">
                                                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                                                <span className="text-sm">{t('handsfree.generatingImage')}</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center bg-[#F5F4F1] rounded-2xl border-2 border-dashed border-[#E8E7E4]">
                                    <div className="text-center text-[#8C8C8C]">
                                        <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-sm">{t('studio.uploadFirst') || 'Upload an image to get started'}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Film Strip - Always show when there are generated images */}
                        {sourceImage && generatedImages.length > 0 && (
                            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                                {/* Original Source - Always first */}
                                <button
                                    onClick={() => setActiveImageIndex(-1)}
                                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                                        activeImageIndex === -1 ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg' : 'border-[#E8E7E4] hover:border-[#1A1A1A] hover:shadow-md'
                                    }`}
                                >
                                    <img src={sourceImage} alt={t('aspectRatio.ratios.original')} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5">
                                        {t('aspectRatio.ratios.original')}
                                    </div>
                                </button>

                                {/* Generated Images */}
                                {generatedImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                                            activeImageIndex === idx ? 'border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg' : 'border-[#E8E7E4] hover:border-[#1A1A1A] hover:shadow-md'
                                        }`}
                                    >
                                        <img src={img} alt={`${t('handsfree.generated')} ${idx + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5">
                                            #{idx + 1}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Prompt Input + Generate Button */}
                    {sourceImage && (
                        <div className="mt-4 space-y-3">
                            {/* Prompt Textarea */}
                            <div className="relative">
                                <textarea
                                    value={imagePrompt}
                                    onChange={(e) => setImagePrompt(e.target.value)}
                                    placeholder={isEditMode
                                        ? t('handsfree.editPromptPlaceholder')
                                        : t('handsfree.promptPlaceholder')
                                    }
                                    className={`w-full h-24 px-4 py-3 bg-white border-2 rounded-xl text-[#1A1A1A] text-sm placeholder-[#8C8C8C] focus:outline-none transition-colors resize-none ${
                                        isEditMode ? 'border-amber-300 focus:border-amber-500' : 'border-[#E8E7E4] focus:border-cyan-500'
                                    }`}
                                />
                                {isEditMode && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-medium">
                                        <Edit3 size={10} />
                                        Edit Mode
                                    </div>
                                )}
                            </div>

                            {/* Generate/Edit Button with Pulse Glow */}
                            <button
                                onClick={handleGenerateOrEditImage}
                                disabled={!imagePrompt.trim() || isGeneratingImage}
                                className={`w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative btn-shine
                                    ${imagePrompt.trim() && !isGeneratingImage ? 'animate-pulse-glow-cyan hover:scale-[1.02]' : ''}
                                    ${isEditMode
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                                    }`}
                            >
                                {isGeneratingImage ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>{isEditMode ? t('handsfree.editing') : t('handsfree.generating')}</span>
                                    </>
                                ) : (
                                    <>
                                        {isEditMode ? (
                                            <>
                                                <Edit3 size={18} />
                                                <span>{t('handsfree.editSelectedImage')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                <span>{t('handsfree.generateNewImage')}</span>
                                            </>
                                        )}
                                        <span className="absolute right-4 text-xs text-white/70">6 {t('credits.creditsUnit')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </section>
            </div>

            {/* Insufficient Credits Modal */}
            <InsufficientCreditsModal
                isOpen={showCreditsModal}
                onClose={() => setShowCreditsModal(false)}
                feature="handsfree"
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
