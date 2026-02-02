import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Video,
    Upload,
    Play,
    Pause,
    Download,
    Loader2,
    AlertCircle,
    Trash2,
    ImageIcon,
    Zap,
    Crown,
    Pencil
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useCredits } from '../contexts/CreditContext';
import { startMotionGeneration, pollMotionGeneration } from '../utils/aiHelpers';
import { createProject, saveProject } from '../utils/projectManager';
import InsufficientCreditsModal from './InsufficientCreditsModal';

// ═══════════════════════════════════════════════════════════════════════════════
// MOTION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CAMERA_MOVEMENTS = [
    { id: 'static', label: 'Static', en: 'No movement' },
    { id: 'pan_left', label: 'Pan Left', en: 'Pan Left' },
    { id: 'pan_right', label: 'Pan Right', en: 'Pan Right' },
    { id: 'tilt_up', label: 'Tilt Up', en: 'Tilt Up' },
    { id: 'tilt_down', label: 'Tilt Down', en: 'Tilt Down' },
    { id: 'zoom_in', label: 'Zoom In', en: 'Zoom In' },
    { id: 'zoom_out', label: 'Zoom Out', en: 'Zoom Out' },
    { id: 'dolly_in', label: 'Dolly In', en: 'Dolly In' },
    { id: 'dolly_out', label: 'Dolly Out', en: 'Dolly Out' },
    { id: 'orbit_cw', label: 'Orbit CW', en: 'Clockwise Orbit' },
    { id: 'orbit_ccw', label: 'Orbit CCW', en: 'Counter-Clockwise' }
];

const SPEED_OPTIONS = [
    { id: 'slow', label: 'Slow', en: 'Slow motion' },
    { id: 'normal', label: 'Normal', en: 'Normal speed' },
    { id: 'fast', label: 'Fast', en: 'Fast motion' }
];

const DURATION_OPTIONS = [
    { id: '4', label: '4s', value: 4 },
    { id: '6', label: '6s', value: 6 },
    { id: '8', label: '8s', value: 8 }
];

const QUALITY_MODES = [
    { id: 'fast', label: 'Fast', icon: Zap },
    { id: 'pro', label: 'Pro', icon: Crown }
];

const EDIT_CREDIT_COST = 12;

// Credit costs based on duration and quality
const getCreditCost = (duration, qualityMode) => {
    const costs = {
        '4': { fast: 6, pro: 9 },
        '6': { fast: 8, pro: 12 },
        '8': { fast: 10, pro: 15 }
    };
    return costs[duration]?.[qualityMode] || 8;
};

const VIDEO_ASPECT_RATIOS = [
    { id: '16:9', label: '16:9' },
    { id: '9:16', label: '9:16' },
    { id: '1:1', label: '1:1' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// REUSABLE OPTION GROUP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

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
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all text-center border
                            ${selected === opt.id
                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                            }`}
                    >
                        {translationKeyPrefix && t ? t(`${translationKeyPrefix}.${opt.id}`) : opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MOTION MODE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function MotionMode({ marketplace, onNavigate }) {
    const { t } = useTranslation();
    const { useCredits: useCreditsHook } = useCredits();

    // Source image state
    const [sourceImage, setSourceImage] = useState(null);
    const [customDirective, setCustomDirective] = useState('');

    // Motion settings
    const [cameraMovement, setCameraMovement] = useState('zoom_in');
    const [speed, setSpeed] = useState('normal');
    const [duration, setDuration] = useState('6');
    const [qualityMode, setQualityMode] = useState('fast');
    const [aspectRatio, setAspectRatio] = useState('16:9');

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [pollingStatus, setPollingStatus] = useState('');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [showCreditsModal, setShowCreditsModal] = useState(false);

    // Generated videos
    const [generatedVideos, setGeneratedVideos] = useState([]);
    const [activeVideoIndex, setActiveVideoIndex] = useState(-1); // -1 = source image

    // Polling refs
    const [operationName, setOperationName] = useState(null);
    const [modelId, setModelId] = useState(null);
    const pollingIntervalRef = useRef(null);

    // Video player ref
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Edit mode state
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const fileInputRef = useRef(null);

    // Get active media (source image or generated video)
    const getActiveMedia = () => {
        if (activeVideoIndex >= 0 && activeVideoIndex < generatedVideos.length) {
            return { type: 'video', url: generatedVideos[activeVideoIndex] };
        }
        return { type: 'image', url: sourceImage };
    };

    // Handle image upload
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setSourceImage(event.target.result);
            setGeneratedVideos([]);
            setActiveVideoIndex(-1);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    // Auto-pause video when switching selection
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [activeVideoIndex]);

    // Start polling for video completion
    const startPolling = useCallback((opName, modId) => {
        setPollingStatus('Processing video...');
        setProgress(0);

        pollingIntervalRef.current = setInterval(async () => {
            try {
                const result = await pollMotionGeneration(opName, modId);

                if (result.status === 'COMPLETE') {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;

                    setPollingStatus('Video ready!');
                    setProgress(100);
                    setIsGenerating(false);

                    // Add video to collection (check for duplicates)
                    if (result.video_url) {
                        setGeneratedVideos(prev => {
                            // Prevent duplicate videos
                            if (prev.includes(result.video_url)) {
                                return prev;
                            }
                            const newVideos = [...prev, result.video_url];
                            // Set active index to the new video
                            setActiveVideoIndex(newVideos.length - 1);
                            return newVideos;
                        });

                        // Save to history
                        saveVideoToHistory(result.video_url);
                    }

                } else if (result.status === 'FAILED' || result.status === 'ERROR') {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;

                    setError(result.error || 'Video generation failed');
                    setIsGenerating(false);
                    setPollingStatus('');

                } else {
                    // Still processing
                    const prog = result.progress || 0;
                    setProgress(prog);
                    setPollingStatus(`Processing... ${prog}%`);
                }
            } catch (err) {
                console.error('Polling error:', err);
                // Continue polling on transient errors
            }
        }, 5000); // Poll every 5 seconds
    }, [generatedVideos.length]);

    // Save video to history
    const saveVideoToHistory = async (videoUrl) => {
        try {
            const movement = CAMERA_MOVEMENTS.find(m => m.id === cameraMovement);
            const motionName = customDirective
                ? `Motion: ${customDirective.substring(0, 30)}...`
                : `Motion: ${movement?.label || cameraMovement}`;

            const project = createProject(
                motionName,
                marketplace || 'motion',
                sourceImage,
                [{
                    id: `motion_${Date.now()}`,
                    type: 'MOTION_VIDEO',
                    url: videoUrl,
                    createdAt: Date.now(),
                    metadata: {
                        cameraMovement,
                        speed,
                        duration,
                        qualityMode,
                        aspectRatio
                    }
                }],
                null,
                {
                    featureType: 'motion',
                    cameraMovement,
                    speed,
                    duration,
                    qualityMode,
                    aspectRatio,
                    customDirective
                }
            );
            await saveProject(project);
        } catch (err) {
            console.warn('Failed to save motion to history:', err);
        }
    };

    // Generate video
    const handleGenerateVideo = async () => {
        if (!sourceImage) return;

        // Check credits
        const creditFeature = qualityMode === 'pro' ? 'motion_pro' : 'motion_fast';
        const creditResult = useCreditsHook(creditFeature);
        if (!creditResult.success) {
            setShowCreditsModal(true);
            return;
        }

        setIsGenerating(true);
        setError(null);
        setPollingStatus('Starting video generation...');
        setProgress(0);

        try {
            const result = await startMotionGeneration(sourceImage, {
                cameraMovement,
                speed,
                duration: parseInt(duration),
                qualityMode,
                aspectRatio,
                customDirective
            });

            if (result.success && result.operation_name) {
                setOperationName(result.operation_name);
                setModelId(result.model_id);
                startPolling(result.operation_name, result.model_id);
            } else {
                throw new Error(result.error || 'Failed to start generation');
            }
        } catch (err) {
            setError(err.message);
            setIsGenerating(false);
            setPollingStatus('');
        }
    };

    // Clear everything
    const handleClear = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        setSourceImage(null);
        setGeneratedVideos([]);
        setActiveVideoIndex(-1);
        setCustomDirective('');
        setError(null);
        setIsGenerating(false);
        setPollingStatus('');
        setProgress(0);
    };

    // Toggle video playback
    const togglePlayback = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Download video
    const handleDownload = () => {
        const activeMedia = getActiveMedia();
        if (activeMedia.type === 'video' && activeMedia.url) {
            const link = document.createElement('a');
            link.href = activeMedia.url;
            link.download = `volla_motion_${Date.now()}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const activeMedia = getActiveMedia();
    const creditCost = getCreditCost(duration, qualityMode);

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
                            <Video size={20} className="text-violet-500" />
                            <h2 className="text-lg font-bold text-[#1A1A1A]">
                                {t('motion.title') || 'Motion'}
                            </h2>
                        </div>

                        {/* Source Image Upload */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                <ImageIcon size={12} />
                                {t('motion.sourceImage') || 'Source Image'}
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
                                        className="w-full h-48 object-contain rounded-xl border border-[#E8E7E4] bg-[#F5F4F1]"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-medium"
                                    >
                                        {t('motion.changeImage') || 'Change Image'}
                                    </button>
                                    <button
                                        onClick={handleClear}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-48 border-2 border-dashed border-[#E8E7E4] rounded-xl flex flex-col items-center justify-center text-[#8C8C8C] hover:border-violet-400 hover:text-violet-500 transition-colors"
                                >
                                    <Upload size={24} className="mb-2" />
                                    <span className="text-xs font-medium">
                                        {t('motion.uploadImage') || 'Upload Image'}
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* Custom Directive */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                {t('motion.customDirective') || 'Custom Directive'}
                            </div>
                            <input
                                type="text"
                                value={customDirective}
                                onChange={(e) => setCustomDirective(e.target.value)}
                                placeholder={t('motion.customDirectivePlaceholder') || 'E.g.: Focus on product details, cinematic feel...'}
                                className="w-full px-3 py-2 bg-[#F5F4F1] border border-[#E8E7E4] rounded-lg text-sm text-[#1A1A1A] placeholder-[#8C8C8C] focus:outline-none focus:border-violet-400"
                            />
                        </div>

                        {/* Camera Movement */}
                        <OptionGroup
                            title={t('motion.cameraMovement') || 'Camera Movement'}
                            options={CAMERA_MOVEMENTS}
                            selected={cameraMovement}
                            onSelect={setCameraMovement}
                            columns={4}
                            translationKeyPrefix="motion.cameraMovements"
                            t={t}
                        />

                        {/* Speed */}
                        <OptionGroup
                            title={t('motion.speed') || 'Speed'}
                            options={SPEED_OPTIONS}
                            selected={speed}
                            onSelect={setSpeed}
                            columns={3}
                            translationKeyPrefix="motion.speeds"
                            t={t}
                        />

                        {/* Duration */}
                        <OptionGroup
                            title={t('motion.duration') || 'Duration'}
                            options={DURATION_OPTIONS}
                            selected={duration}
                            onSelect={setDuration}
                            columns={3}
                        />

                        {/* Quality Mode */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                {t('motion.qualityMode') || 'Quality Mode'}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {QUALITY_MODES.map((mode) => {
                                    const ModeIcon = mode.icon;
                                    const modeCreditCost = getCreditCost(duration, mode.id);
                                    return (
                                        <button
                                            key={mode.id}
                                            onClick={() => setQualityMode(mode.id)}
                                            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border flex items-center justify-center gap-2
                                                ${qualityMode === mode.id
                                                    ? mode.id === 'pro'
                                                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-violet-500'
                                                        : 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                    : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                                }`}
                                        >
                                            <ModeIcon size={14} />
                                            {mode.label}
                                            <span className="text-[10px] opacity-70">
                                                {modeCreditCost} cr
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Aspect Ratio */}
                        <OptionGroup
                            title={t('motion.aspectRatio') || 'Aspect Ratio'}
                            options={VIDEO_ASPECT_RATIOS}
                            selected={aspectRatio}
                            onSelect={setAspectRatio}
                            columns={3}
                        />

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerateVideo}
                            disabled={!sourceImage || isGenerating}
                            className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>{pollingStatus || 'Processing...'}</span>
                                </>
                            ) : (
                                <>
                                    <Video size={18} />
                                    <span>{t('motion.generateVideo') || 'Generate Video'}</span>
                                    <span className="absolute right-4 text-xs text-white/70">
                                        {creditCost} {t('credits.creditsUnit') || 'credits'}
                                    </span>
                                </>
                            )}
                        </button>

                        {/* Progress Bar */}
                        {isGenerating && (
                            <div className="w-full bg-[#E8E7E4] rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500 ${progress === 0 ? 'animate-pulse' : ''}`}
                                    style={{ width: progress > 0 ? `${progress}%` : '10%' }}
                                />
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
                    RIGHT PANEL - 60% - Video Canvas
                ════════════════════════════════════════════════════════════ */}
                <section className="flex-1 flex flex-col p-5 overflow-y-auto">
                    {/* Video Canvas Area */}
                    <div className="flex flex-col">
                        <div
                            className="relative rounded-2xl overflow-hidden bg-[#1A1A1A]"
                            style={{ height: '420px' }}
                        >
                            {sourceImage ? (
                                <>
                                    {/* Frosted Glass Background */}
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: `url(${activeMedia.url})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            filter: 'blur(30px) brightness(0.5)'
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/30" />

                                    {/* Main Content */}
                                    <div className="relative h-full w-full flex items-center justify-center p-4">
                                        {activeMedia.type === 'video' ? (
                                            <video
                                                ref={videoRef}
                                                src={activeMedia.url}
                                                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                                                loop
                                                playsInline
                                                onPlay={() => setIsPlaying(true)}
                                                onPause={() => setIsPlaying(false)}
                                            />
                                        ) : (
                                            <div
                                                className="relative rounded-xl shadow-2xl overflow-hidden bg-black"
                                                style={{
                                                    aspectRatio: aspectRatio.replace(':', '/'),
                                                    maxHeight: '100%',
                                                    maxWidth: '100%'
                                                }}
                                            >
                                                <img
                                                    src={activeMedia.url}
                                                    alt="Source"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Label */}
                                    <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                                        {activeVideoIndex === -1
                                            ? (t('motion.original') || 'Original')
                                            : `${t('motion.video') || 'Video'} ${activeVideoIndex + 1}`
                                        }
                                    </div>

                                    {/* Video Controls (only for video) */}
                                    {activeMedia.type === 'video' && (
                                        <div className="absolute bottom-4 right-4 flex gap-2">
                                            <button
                                                onClick={togglePlayback}
                                                className="p-2 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-black/80 transition-colors"
                                            >
                                                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
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
                                            <Loader2 size={48} className="animate-spin text-violet-400 mb-4" />
                                            <p className="text-white font-medium">{pollingStatus}</p>
                                            {progress > 0 && (
                                                <p className="text-white/70 text-sm mt-1">{progress}% complete</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center text-[#8C8C8C]">
                                        <Video size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-sm">
                                            {t('motion.uploadFirst') || 'Upload an image to get started'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Film Strip - Generated Videos */}
                        {sourceImage && generatedVideos.length > 0 && (
                            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                                {/* Original Source - Always first */}
                                <button
                                    onClick={() => setActiveVideoIndex(-1)}
                                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                        activeVideoIndex === -1
                                            ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                                            : 'border-[#E8E7E4] hover:border-[#1A1A1A]'
                                    }`}
                                >
                                    <img src={sourceImage} alt="Original" className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5">
                                        {t('motion.original') || 'Original'}
                                    </div>
                                </button>

                                {/* Generated Videos */}
                                {generatedVideos.map((videoUrl, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveVideoIndex(idx)}
                                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                            activeVideoIndex === idx
                                                ? 'border-violet-500 ring-2 ring-violet-500/30'
                                                : 'border-[#E8E7E4] hover:border-[#1A1A1A]'
                                        }`}
                                    >
                                        <video
                                            src={videoUrl}
                                            className="w-full h-full object-cover"
                                            muted
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <Play size={16} className="text-white" />
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5">
                                            {t('motion.video') || 'Video'} {idx + 1}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Video Edit Input - Show when videos are generated */}
                        {generatedVideos.length > 0 && (
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#8C8C8C] text-xs font-semibold uppercase tracking-wider">
                                        <Pencil size={12} />
                                        {t('motion.editVideo') || 'Edit Video'}
                                    </div>
                                    <span className="text-[10px] text-[#8C8C8C]">
                                        {EDIT_CREDIT_COST} {t('credits.creditsUnit') || 'credits'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editPrompt}
                                        onChange={(e) => setEditPrompt(e.target.value)}
                                        placeholder={activeVideoIndex >= 0
                                            ? (t('motion.editPlaceholder') || "E.g.: 'remove the woman in background', 'add rain effect'...")
                                            : (t('motion.selectVideoFirst') || "Select a video to edit...")
                                        }
                                        className="flex-1 px-4 py-3 bg-white border border-[#E8E7E4] rounded-xl text-sm text-[#1A1A1A] placeholder-[#8C8C8C] focus:outline-none focus:border-violet-400"
                                        disabled={isEditing || activeVideoIndex < 0}
                                    />
                                    <button
                                        onClick={() => {
                                            // TODO: Implement video editing API call
                                            alert(t('motion.editComingSoon') || 'Video editing feature coming soon!');
                                        }}
                                        disabled={!editPrompt.trim() || isEditing || activeVideoIndex < 0}
                                        className="px-4 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {isEditing ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                {t('motion.editing') || 'Editing...'}
                                            </>
                                        ) : (
                                            <>
                                                <Pencil size={16} />
                                                {t('motion.editButton') || 'Edit'}
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="text-[10px] text-[#8C8C8C]">
                                    {t('motion.editDescription') || 'Describe what you want to change in the video. The scene will stay exactly the same except for your requested change.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Info Panel */}
                    {sourceImage && !isGenerating && generatedVideos.length === 0 && (
                        <div className="mt-6 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                            <h4 className="text-sm font-semibold text-violet-800 mb-2">
                                {t('motion.howItWorks') || 'How It Works'}
                            </h4>
                            <ol className="text-xs text-violet-700 space-y-1 list-decimal list-inside">
                                <li>{t('motion.step1') || 'Select camera movement (pan, zoom, orbit, etc.)'}</li>
                                <li>{t('motion.step2') || 'Choose speed and duration'}</li>
                                <li>{t('motion.step3') || 'Pick quality mode (Fast for quick results, Pro for higher quality)'}</li>
                                <li>{t('motion.step4') || 'Click Generate Video and wait for the magic!'}</li>
                            </ol>
                        </div>
                    )}
                </section>
            </div>

            {/* Credits Modal */}
            <InsufficientCreditsModal
                isOpen={showCreditsModal}
                onClose={() => setShowCreditsModal(false)}
                feature={qualityMode === 'pro' ? 'motion_pro' : 'motion_fast'}
                onNavigate={onNavigate}
            />
        </>
    );
}
