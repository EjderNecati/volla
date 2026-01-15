import React, { useState, useRef } from 'react';
import {
    Camera, Upload, Copy, Check, Sparkles, Loader2, Download,
    RotateCcw, Eye, Move, Focus, Aperture, Image as ImageIcon, AlertCircle, Wand2
} from 'lucide-react';
import { analyzeProductForHandsfree, generateHandsfreeImage } from '../utils/aiHelpers';
import { createProject, saveProject } from '../utils/projectManager';
import { useTranslation } from '../i18n';
import { useCredits } from '../contexts/CreditContext';
import InsufficientCreditsModal from './InsufficientCreditsModal';

/**
 * HandsfreeMode - Professional Prompt Architect
 * Redesigned to match site's light theme
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
    { id: '9:16', label: '9:16' },
    { id: '21:9', label: '21:9' },
    { id: '5:4', label: '5:4' },
    { id: '4:5', label: '4:5' },
    { id: '2.35:1', label: '2.35:1' }
];

const CAMERA_ANGLES = [
    { id: 'eye_level', label: 'Eye Level', en: 'Eye Level' },
    { id: 'shoulder', label: 'Shoulder', en: 'Shoulder Level' },
    { id: 'waist', label: 'Waist', en: 'Waist Level' },
    { id: 'knee', label: 'Knee', en: 'Knee Level' },
    { id: 'ground', label: 'Ground', en: 'Ground Level' },
    { id: 'worm', label: 'Worm Eye', en: 'Worm\'s Eye View' },
    { id: 'low', label: 'Low Angle', en: 'Low Angle' },
    { id: 'high', label: 'High Angle', en: 'High Angle' },
    { id: 'bird', label: 'Bird Eye', en: 'Bird\'s Eye View' },
    { id: 'drone', label: 'Drone', en: 'Drone Shot' },
    { id: 'satellite', label: 'Satellite', en: 'Satellite View' },
    { id: 'dutch', label: 'Dutch', en: 'Dutch Angle' }
];

const SHOT_SCALES = [
    { id: 'extreme_close', label: 'Extreme Close', en: 'Extreme Close-Up' },
    { id: 'close', label: 'Close-Up', en: 'Close-Up' },
    { id: 'medium_close', label: 'Medium Close', en: 'Medium Close-Up' },
    { id: 'medium', label: 'Medium', en: 'Medium Shot' },
    { id: 'medium_full', label: 'Medium Full', en: 'Medium Full Shot' },
    { id: 'full', label: 'Full Shot', en: 'Full Shot' },
    { id: 'wide', label: 'Wide', en: 'Wide Shot' },
    { id: 'extreme_wide', label: 'Extreme Wide', en: 'Extreme Wide Shot' },
    { id: 'cowboy', label: 'Cowboy Shot', en: 'Cowboy Shot - Mid-thigh framing' },
    { id: 'choker', label: 'Choker', en: 'Choker - Tight face framing below chin' }
];

const LENS_OPTIONS = [
    { id: '8mm', label: '8mm Fisheye', en: '8mm Fisheye - Extreme distortion' },
    { id: '14mm', label: '14mm Ultra', en: '14mm Ultra Wide - Dramatic perspective' },
    { id: '24mm', label: '24mm Wide', en: '24mm Wide - Environmental context' },
    { id: '35mm', label: '35mm Classic', en: '35mm Classic - Natural documentary' },
    { id: '50mm', label: '50mm Natural', en: '50mm Natural - Human eye perspective' },
    { id: '85mm', label: '85mm Portrait', en: '85mm Portrait - Subject isolation' },
    { id: '200mm', label: '200mm Tele', en: '200mm Telephoto - Compression effect' },
    { id: 'anamorphic', label: 'Anamorphic', en: 'Anamorphic - Cinematic widescreen' },
    { id: 'iphone17pro', label: 'iPhone 17 Pro', en: 'iPhone 17 Pro - Mobile computational photography' },
    { id: 'retro', label: 'Retro', en: 'Retro - Vintage film aesthetic with grain' },
    { id: 'phaseone', label: 'Phase One IQ4', en: 'Phase One IQ4 - Medium format ultra high resolution' },
    { id: 'arri', label: 'ARRI Alexa 35', en: 'ARRI Alexa 35 - Cinema-grade color science' }
];

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Option Button Group (Light Theme)
// ═══════════════════════════════════════════════════════════════════
const OptionGroup = ({ title, icon: Icon, options, selected, onSelect, columns = 4, className = '' }) => {
    return (
        <div className={`bg-white border border-[#E8E7E4] rounded-xl p-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3 text-[#8C8C8C] text-xs font-medium uppercase tracking-wider">
                {Icon && <Icon size={14} />}
                {title}
            </div>
            <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
                {options.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => onSelect(opt.id)}
                        className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-center border
                            ${selected === opt.id
                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function HandsfreeMode({ marketplace, onBack, onNavigate }) {
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
    const [generatedImage, setGeneratedImage] = useState(null);
    const [productAnalysis, setProductAnalysis] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [generatingStep, setGeneratingStep] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);
    const [showCreditsModal, setShowCreditsModal] = useState(false);

    // Phase 2: Manual prompt for image generation
    const [manualPrompt, setManualPrompt] = useState('');

    const fileInputRef = useRef(null);

    // Handle image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setSourceImage(event.target.result);
        };
        reader.readAsDataURL(file);
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
                aspectInstruction = `OUTPUT IMAGE MUST BE ${aspectRatio} ASPECT RATIO (horizontal/landscape format, width greater than height).`;
            } else if (h > w) {
                aspectInstruction = `OUTPUT IMAGE MUST BE ${aspectRatio} ASPECT RATIO (vertical/portrait format, height greater than width).`;
            } else {
                aspectInstruction = `OUTPUT IMAGE MUST BE ${aspectRatio} ASPECT RATIO (square format, equal width and height).`;
            }
        } else {
            aspectInstruction = 'Maintain the original aspect ratio of the source image.';
        }

        // Camera angle instruction - very specific
        const cameraInstructions = {
            'eye_level': 'Position camera at EYE LEVEL (straight on, parallel to the ground, looking directly at the subject).',
            'shoulder': 'Position camera at SHOULDER HEIGHT (slightly below eye level, about 140cm from ground).',
            'waist': 'Position camera at WAIST HEIGHT (about 100cm from ground, looking slightly up at subject).',
            'knee': 'Position camera at KNEE HEIGHT (about 50cm from ground, low angle looking up).',
            'ground': 'Position camera at GROUND LEVEL (camera on the floor, worm\'s eye perspective looking up).',
            'worm': 'Position camera BELOW GROUND looking UP (extreme low angle, dramatic upward perspective).',
            'low': 'Position camera at LOW ANGLE (below eye level, looking up at the subject, makes subject appear powerful).',
            'high': 'Position camera at HIGH ANGLE (above eye level, looking down at the subject, bird perspective).',
            'bird': 'Position camera DIRECTLY ABOVE looking DOWN (90 degree top-down view, flat lay perspective).',
            'drone': 'Position camera as DRONE SHOT (high aerial view, about 45 degree angle looking down).',
            'satellite': 'Position camera as SATELLITE VIEW (extreme top-down, map-like perspective).',
            'dutch': 'Position camera at DUTCH ANGLE (tilted 15-30 degrees, diagonal horizon line for dramatic effect).'
        };

        // Shot scale instruction - very specific
        const scaleInstructions = {
            'extreme_close': 'Frame as EXTREME CLOSE-UP (only a small detail of the product fills the entire frame, macro shot).',
            'close': 'Frame as CLOSE-UP (product fills 80-90% of the frame, minimal background visible).',
            'medium_close': 'Frame as MEDIUM CLOSE-UP (product fills 60-70% of the frame, some context visible).',
            'medium': 'Frame as MEDIUM SHOT (product fills 40-50% of the frame, significant environment visible).',
            'medium_full': 'Frame as MEDIUM FULL SHOT (full product visible with some breathing room around it).',
            'full': 'Frame as FULL SHOT (entire product visible with comfortable margins, standard product photography).',
            'wide': 'Frame as WIDE SHOT (product appears smaller in frame, environment is prominent).',
            'extreme_wide': 'Frame as EXTREME WIDE SHOT (product is small in the frame, vast environment dominates).',
            'cowboy': 'Frame as COWBOY SHOT (mid-thigh framing, classic Western cinema style, shows product with context).',
            'choker': 'Frame as CHOKER SHOT (very tight framing, just below the chin level, intimate close-up).'
        };

        // Lens instruction - specific optical effects
        const lensInstructions = {
            '8mm': 'Apply 8MM FISHEYE LENS effect (extreme barrel distortion, curved edges, 180 degree field of view).',
            '14mm': 'Apply 14MM ULTRA WIDE LENS effect (dramatic perspective stretching, exaggerated foreground, architectural distortion).',
            '24mm': 'Apply 24MM WIDE ANGLE LENS effect (slight perspective distortion, environmental context, dynamic feel).',
            '35mm': 'Apply 35MM CLASSIC LENS effect (natural perspective, minimal distortion, documentary style).',
            '50mm': 'Apply 50MM NATURAL LENS effect (human eye perspective, no distortion, true-to-life rendering).',
            '85mm': 'Apply 85MM PORTRAIT LENS effect (beautiful background blur, slight compression, subject isolation).',
            '200mm': 'Apply 200MM TELEPHOTO LENS effect (strong background compression, flat perspective, subject pops from background).',
            'anamorphic': 'Apply ANAMORPHIC LENS effect (cinematic widescreen look, horizontal lens flares, oval bokeh).',
            'iphone17pro': 'Apply IPHONE 17 PRO camera style (computational photography, HDR processing, natural smartphone aesthetic, sharp details).',
            'retro': 'Apply RETRO FILM AESTHETIC (vintage color grading, film grain, slightly faded colors, nostalgic warmth).',
            'phaseone': 'Apply PHASE ONE IQ4 MEDIUM FORMAT look (ultra high resolution, exceptional detail, smooth tonal gradations, professional studio quality).',
            'arri': 'Apply ARRI ALEXA 35 CINEMA look (Hollywood-grade color science, filmic skin tones, rich shadows, cinematic depth).'
        };

        // Build custom directive as PRIORITY
        let priorityText = '';
        if (manualDirective && manualDirective.trim()) {
            // Parse common Turkish directives to English
            const directiveMap = {
                'arka açı': 'show back view',
                'arka': 'show back view',
                'yan açı': 'show side view',
                'yan': 'show side view',
                'üst açı': 'show top view',
                'üst': 'show top view',
                'alt açı': 'show bottom view',
                'alt': 'show bottom view',
                'yatay': 'horizontal position',
                'dikey': 'vertical position',
                '45 derece': '45 degree angle',
                'çapraz': 'diagonal angle'
            };

            let enhancedDirective = manualDirective.toLowerCase();
            for (const [turkish, english] of Object.entries(directiveMap)) {
                if (enhancedDirective.includes(turkish)) {
                    enhancedDirective = english;
                    break;
                }
            }
            if (enhancedDirective === manualDirective.toLowerCase()) {
                enhancedDirective = manualDirective;
            }
            priorityText = `PRIORITY: ${enhancedDirective}. `;
        }

        // Build clean prompt string
        const cameraText = cameraInstructions[cameraAngle] || 'Eye level camera';
        const scaleText = scaleInstructions[shotScale] || 'Full shot';
        const lensText = lensInstructions[lens] || '50mm lens';
        const aspectText = aspectRatio === 'original' ? 'original ratio' : aspectRatio;

        const prompt = `${priorityText}Generate photorealistic image of this subject. ${cameraText} ${scaleText} ${lensText} Aspect ratio: ${aspectText}. Keep identical face, body, hair, clothing. DSLR quality.`;

        return { prompt, aspect_ratio_value: aspectRatio };
    };

    // Phase 1: Generate PROMPT only
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

    // Phase 2: Generate IMAGE with manual prompt + source image
    const handleGenerateImage = async () => {
        if (!sourceImage || !manualPrompt.trim()) return;

        // Check credits before generating
        const creditResult = useCreditsHook('handsfree');
        if (!creditResult.success) {
            setShowCreditsModal(true);
            return;
        }

        setIsGeneratingImage(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const promptSchema = {
                final_technical_prompt: manualPrompt,
                aspect_ratio_value: aspectRatio
            };

            const result = await generateHandsfreeImage(promptSchema, sourceImage);

            if (result.success && result.imageUrl) {
                setGeneratedImage(result.imageUrl);

                // Save to history/recent projects
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
                            url: result.imageUrl,
                            createdAt: Date.now()
                        }],
                        null, // no SEO results
                        {
                            cameraAngle,
                            shotScale,
                            lens,
                            aspectRatio,
                            directive: manualDirective,
                            prompt: manualPrompt
                        }
                    );
                    await saveProject(project);
                    console.log('✅ Handsfree project saved to history:', project.id);
                } catch (saveErr) {
                    console.warn('Failed to save handsfree to history:', saveErr);
                }
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

    // Copy prompt to clipboard (full JSON)
    const handleCopyPrompt = () => {
        if (!generatedPrompt) return;
        navigator.clipboard.writeText(JSON.stringify(generatedPrompt, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <div className="flex-1 py-6 px-4 bg-[#FAF9F6]">
                <div className="max-w-6xl mx-auto">
                    {/* Page Title */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-[#1A1A1A]">{t('handsfree.title')}</h2>
                        <p className="text-sm text-[#5C5C5C] mt-1">
                            {t('handsfree.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                        {/* ════════════════════════════════════════════════════════════
                        LEFT COLUMN: Image Upload & Controls
                        ════════════════════════════════════════════════════════════ */}
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            {/* Image Upload Card - with flex-grow to align with other columns */}
                            <div className="flex-grow">
                                <div className="bg-white border border-[#E8E7E4] rounded-2xl p-5 h-full">
                                    <div className="flex items-center gap-2 mb-4 text-[#1A1A1A] text-sm font-semibold">
                                        <Camera size={18} />
                                        {t('handsfree.sourceImage')}
                                    </div>

                                    {sourceImage ? (
                                        <div className="relative">
                                            <img
                                                src={sourceImage}
                                                alt="Source"
                                                className="w-full h-56 object-contain bg-[#F5F4F1] rounded-xl"
                                            />
                                            <button
                                                onClick={() => {
                                                    setSourceImage(null);
                                                    setGeneratedPrompt(null);
                                                    setGeneratedImage(null);
                                                    setManualPrompt('');
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-white hover:bg-red-50 rounded-full shadow-md transition-colors border border-[#E8E7E4]"
                                            >
                                                <RotateCcw size={14} className="text-[#5C5C5C]" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-56 border-2 border-dashed border-[#E8E7E4] rounded-xl hover:border-[#1A1A1A] transition-colors flex flex-col items-center justify-center gap-3 bg-[#F5F4F1]"
                                        >
                                            <Upload size={32} className="text-[#8C8C8C]" />
                                            <span className="text-sm text-[#5C5C5C]">{t('handsfree.uploadImage')}</span>
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
                            </div>

                            {/* Manual Directive */}
                            <div className="bg-white border border-[#E8E7E4] rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-3 text-[#1A1A1A] text-sm font-semibold">
                                    <Move size={16} />
                                    {t('handsfree.customDirective')}
                                </div>
                                <input
                                    type="text"
                                    value={manualDirective}
                                    onChange={(e) => setManualDirective(e.target.value)}
                                    placeholder={t('handsfree.customDirectivePlaceholder')}
                                    className="w-full px-4 py-3 bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl text-[#1A1A1A] placeholder-[#8C8C8C] focus:outline-none focus:border-[#1A1A1A] transition-colors text-sm"
                                />
                            </div>

                            {/* Generate Prompt Button */}
                            <div className="relative">
                                <button
                                    onClick={handleGeneratePrompt}
                                    disabled={!sourceImage || isGenerating}
                                    className="w-full py-4 bg-[#1A1A1A] rounded-xl font-semibold text-white hover:bg-[#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            {generatingStep || t('common.generating')}
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 size={18} />
                                            {t('handsfree.generatePrompt')}
                                        </>
                                    )}
                                </button>
                                {!isGenerating && (
                                    <span className="absolute bottom-1 right-2 text-[10px] text-white/60">
                                        2 {t('credits.creditsUnit')}
                                    </span>
                                )}
                            </div>

                            {/* Error Display */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* ════════════════════════════════════════════════════════════
                        MIDDLE COLUMN: Camera Options
                        ════════════════════════════════════════════════════════════ */}
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            <OptionGroup
                                title={t('camera.title')}
                                icon={Eye}
                                options={CAMERA_ANGLES}
                                selected={cameraAngle}
                                onSelect={setCameraAngle}
                                columns={3}
                            />

                            <div className="flex-grow">
                                <OptionGroup
                                    title={t('shotScale.title')}
                                    icon={Focus}
                                    options={SHOT_SCALES}
                                    selected={shotScale}
                                    onSelect={setShotScale}
                                    columns={2}
                                    className="lg:pb-16"
                                />
                            </div>
                        </div>

                        {/* ════════════════════════════════════════════════════════════
                        RIGHT COLUMN: Lens & Aspect Ratio + Image Generation
                        ════════════════════════════════════════════════════════════ */}
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            <OptionGroup
                                title={t('lens.title')}
                                icon={Aperture}
                                options={LENS_OPTIONS}
                                selected={lens}
                                onSelect={setLens}
                                columns={2}
                            />

                            <div className="flex-grow">
                                <OptionGroup
                                    title={t('aspectRatio.title')}
                                    icon={ImageIcon}
                                    options={ASPECT_RATIOS}
                                    selected={aspectRatio}
                                    onSelect={setAspectRatio}
                                    columns={4}
                                    className="lg:pb-16"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ════════════════════════════════════════════════════════════
                    PHASE 2: Image Generation - 3 Column Layout
                    ════════════════════════════════════════════════════════════ */}
                    {generatedPrompt && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                            {/* LEFT COLUMN: Generated Prompt */}
                            <div className="lg:col-span-1">
                                <div className="bg-white border border-[#E8E7E4] rounded-2xl p-5 h-80">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-semibold text-[#1A1A1A]">{t('handsfree.generatedPrompt')}</span>
                                        <button
                                            onClick={handleCopyPrompt}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F4F1] hover:bg-[#E8E7E4] rounded-lg text-xs font-medium transition-colors"
                                        >
                                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                            {copied ? t('common.copied') : t('handsfree.copyAll')}
                                        </button>
                                    </div>
                                    <div className="space-y-3 h-[calc(100%-40px)] overflow-y-auto">
                                        {Object.entries(generatedPrompt).map(([key, value]) => (
                                            <div key={key} className="bg-[#F5F4F1] rounded-lg p-3">
                                                <div className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider mb-1">
                                                    {key.replace(/_/g, ' ')}
                                                </div>
                                                <p className="text-xs text-[#1A1A1A] leading-relaxed">
                                                    {value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* MIDDLE COLUMN: Prompt Input + Generate Button */}
                            <div className="lg:col-span-1 flex flex-col gap-4">
                                <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 flex-grow flex flex-col">
                                    <div className="flex items-center gap-2 mb-4 text-emerald-600 text-sm font-semibold">
                                        <Sparkles size={18} />
                                        {t('handsfree.generateImage')}
                                    </div>

                                    <div className="flex gap-3 mb-4 flex-grow items-stretch">
                                        <div className="w-24 flex-shrink-0 bg-[#F5F4F1] rounded-lg border border-[#E8E7E4] overflow-hidden flex items-center justify-center">
                                            <img
                                                src={sourceImage}
                                                alt="Source"
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <textarea
                                                value={manualPrompt}
                                                onChange={(e) => setManualPrompt(e.target.value)}
                                                placeholder="Paste or type your prompt here..."
                                                className="w-full h-full px-3 py-2 bg-[#F5F4F1] border border-[#E8E7E4] rounded-lg text-[#1A1A1A] text-sm placeholder-[#8C8C8C] focus:outline-none focus:border-emerald-400 transition-colors resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Generate Image Button - aligned with other columns */}
                                <div className="relative">
                                    <button
                                        onClick={handleGenerateImage}
                                        disabled={!manualPrompt.trim() || isGeneratingImage}
                                        className="w-full py-4 bg-emerald-500 rounded-xl font-semibold text-white hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isGeneratingImage ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                {t('handsfree.generatingImage')}
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon size={18} />
                                                {t('handsfree.generateImageGemini')}
                                            </>
                                        )}
                                    </button>
                                    {!isGeneratingImage && (
                                        <span className="absolute bottom-1 right-2 text-[10px] text-white/60">
                                            8 {t('credits.creditsUnit')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Generated Image */}
                            <div className="lg:col-span-1">
                                <div className="bg-white border border-[#E8E7E4] rounded-2xl p-5 h-80">
                                    <div className="flex items-center gap-2 mb-4 text-[#1A1A1A] text-sm font-semibold">
                                        <ImageIcon size={18} />
                                        {t('handsfree.generatedImage')}
                                    </div>

                                    {generatedImage ? (
                                        <div className="relative h-[calc(100%-40px)]">
                                            <img
                                                src={generatedImage}
                                                alt="Generated"
                                                className="w-full h-full object-contain bg-[#F5F4F1] rounded-xl"
                                            />
                                            <button
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = generatedImage;
                                                    link.download = `volla_handsfree_${Date.now()}.png`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-[#1A1A1A] hover:bg-[#333] rounded-full shadow-md transition-colors"
                                            >
                                                <Download size={14} className="text-white" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full h-[calc(100%-40px)] border-2 border-dashed border-[#E8E7E4] rounded-xl flex flex-col items-center justify-center gap-3 bg-[#F5F4F1]">
                                            <ImageIcon size={32} className="text-[#8C8C8C]" />
                                            <span className="text-sm text-[#5C5C5C]">{t('handsfree.imageWillAppear')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Insufficient Credits Modal */}
            <InsufficientCreditsModal
                isOpen={showCreditsModal}
                onClose={() => setShowCreditsModal(false)}
                feature="handsfree"
                onNavigate={onNavigate}
            />
        </>
    );
}
