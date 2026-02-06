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
    Pencil,
    Bookmark,
    Check
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useCredits } from '../contexts/CreditContext';
import { startMotionGeneration, pollMotionGeneration, startMotionEdit } from '../utils/aiHelpers';
import { createProject, saveProject } from '../utils/projectManager';
import { addToLibrary } from '../utils/libraryManager';
import InsufficientCreditsModal from './InsufficientCreditsModal';
import SourceSelectionModal from './SourceSelectionModal';

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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MOTION MODE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function MotionMode({ marketplace, onNavigate, initialProject }) {
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

    // Library/Source selection state
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [addedToLibrary, setAddedToLibrary] = useState(false);

    // Project tracking for history (prevent duplicate projects)
    const [currentProjectId, setCurrentProjectId] = useState(null);

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
            const imageData = event.target.result;
            setSourceImage(imageData);
            setGeneratedVideos([]);
            setActiveVideoIndex(-1);
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

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    // Load project data when resuming from history
    useEffect(() => {
        if (initialProject && initialProject.productInfo?.featureType === 'motion') {
            console.log('🎬 Loading Motion project:', initialProject.id, initialProject);

            // IMPORTANT: Set project ID for reuse (prevents duplicate projects)
            setCurrentProjectId(initialProject.id);

            // Load source image - try multiple sources
            const sourceImg = initialProject.originalImage ||
                initialProject.assets?.find(a => a.type === 'ORIGINAL')?.url ||
                initialProject.assets?.[0]?.thumbnail;

            if (sourceImg) {
                console.log('🎬 Setting source image from project');
                setSourceImage(sourceImg);
            } else {
                console.warn('🎬 No source image found in project');
            }

            // Load motion settings from productInfo
            const info = initialProject.productInfo;
            if (info.cameraMovement) setCameraMovement(info.cameraMovement);
            if (info.speed) setSpeed(info.speed);
            if (info.duration) setDuration(info.duration);
            if (info.qualityMode) setQualityMode(info.qualityMode);
            if (info.aspectRatio) setAspectRatio(info.aspectRatio);
            if (info.customDirective) setCustomDirective(info.customDirective);

            // Load generated videos from assets
            const videoAssets = initialProject.assets?.filter(a => a.type === 'MOTION_VIDEO') || [];
            if (videoAssets.length > 0) {
                const videoUrls = videoAssets.map(a => a.url);
                setGeneratedVideos(videoUrls);
                setActiveVideoIndex(videoUrls.length - 1); // Show last video
                console.log('🎬 Loaded', videoUrls.length, 'videos');
            }
        }
    }, [initialProject]);

    // Auto-pause video when switching selection
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [activeVideoIndex]);

    // Save video to history - MUST be defined before startPolling
    const saveVideoToHistory = useCallback(async (videoUrl, currentVideos) => {
        try {
            const movement = CAMERA_MOVEMENTS.find(m => m.id === cameraMovement);
            const motionName = customDirective
                ? `Motion: ${customDirective.substring(0, 30)}...`
                : `Motion: ${movement?.label || cameraMovement}`;

            // Build assets array - include all previously generated videos + the new one
            const assets = [
                // Save source image as ORIGINAL asset for reliable retrieval
                {
                    id: `original_${Date.now()}`,
                    type: 'ORIGINAL',
                    url: sourceImage,
                    createdAt: Date.now()
                }
            ];

            // Add all generated videos (including the new one)
            // currentVideos is passed from the caller to avoid stale closure issues
            const allVideos = [...currentVideos];
            if (!allVideos.includes(videoUrl)) {
                allVideos.push(videoUrl);
            }

            allVideos.forEach((url, index) => {
                assets.push({
                    id: `motion_${Date.now()}_${index}`,
                    type: 'MOTION_VIDEO',
                    url: url,
                    createdAt: Date.now(),
                    metadata: {
                        cameraMovement,
                        speed,
                        duration,
                        qualityMode,
                        aspectRatio
                    }
                });
            });

            const project = createProject(
                motionName,
                marketplace || 'motion',
                sourceImage,
                assets,
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

            // IMPORTANT: Reuse existing project ID to prevent duplicate entries
            if (currentProjectId) {
                project.id = currentProjectId;
                console.log('🎬 Updating existing Motion project:', currentProjectId);
            } else {
                // First save - store the new project ID for future updates
                setCurrentProjectId(project.id);
                console.log('🎬 Creating new Motion project:', project.id);
            }

            await saveProject(project);
            console.log('🎬 Motion project saved to history with', assets.length, 'assets');
        } catch (err) {
            console.warn('Failed to save motion to history:', err);
        }
    }, [sourceImage, marketplace, cameraMovement, speed, duration, qualityMode, aspectRatio, customDirective, currentProjectId]);

    // Start polling for video completion with simulated progress
    const startPolling = useCallback((opName, modId) => {
        setPollingStatus('Processing video...');
        setProgress(5); // Start at 5%

        let simulatedProgress = 5;
        let pollCount = 0;
        const maxPollCount = 60; // ~5 minutes max at 5s intervals

        pollingIntervalRef.current = setInterval(async () => {
            pollCount++;

            try {
                const result = await pollMotionGeneration(opName, modId);

                if (result.status === 'COMPLETE') {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;

                    setPollingStatus('Video ready!');
                    setProgress(100);
                    setIsGenerating(false);
                    setIsEditing(false);
                    setEditPrompt(''); // Clear edit prompt after success

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

                            // Save to history with the updated videos array
                            // We pass newVideos to avoid stale closure issues
                            saveVideoToHistory(result.video_url, newVideos);

                            return newVideos;
                        });
                    }

                } else if (result.status === 'FAILED' || result.status === 'ERROR') {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;

                    setError(result.error || 'Video generation failed');
                    setIsGenerating(false);
                    setIsEditing(false);
                    setPollingStatus('');

                } else {
                    // Still processing - use API progress if available, otherwise simulate
                    const apiProgress = result.progress || 0;

                    // Simulate progress: gradually increase but never exceed 95% until complete
                    // Progress speeds up initially then slows down as it approaches 95%
                    if (apiProgress > simulatedProgress) {
                        simulatedProgress = apiProgress;
                    } else {
                        // Simulate progress based on poll count
                        // Fast early (5-50%), slower mid (50-80%), very slow late (80-95%)
                        if (simulatedProgress < 50) {
                            simulatedProgress = Math.min(50, simulatedProgress + 8);
                        } else if (simulatedProgress < 80) {
                            simulatedProgress = Math.min(80, simulatedProgress + 4);
                        } else if (simulatedProgress < 95) {
                            simulatedProgress = Math.min(95, simulatedProgress + 1);
                        }
                    }

                    setProgress(simulatedProgress);
                    setPollingStatus(`Processing... ${simulatedProgress}%`);
                }

                // Timeout check
                if (pollCount >= maxPollCount) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                    setError('Video generation timed out. Please try again.');
                    setIsGenerating(false);
                    setIsEditing(false);
                    setPollingStatus('');
                }
            } catch (err) {
                console.error('Polling error:', err);
                // Continue polling on transient errors, but still update simulated progress
                if (simulatedProgress < 30) {
                    simulatedProgress = Math.min(30, simulatedProgress + 3);
                    setProgress(simulatedProgress);
                    setPollingStatus(`Processing... ${simulatedProgress}%`);
                }
            }
        }, 5000); // Poll every 5 seconds
    }, [saveVideoToHistory]);

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
        setIsEditing(false);
        setPollingStatus('');
        setProgress(0);
        setEditPrompt('');
        // Reset project ID so next session creates a new project
        setCurrentProjectId(null);
    };

    // Edit video - generates new video with edit instructions
    const handleEditVideo = async () => {
        if (!sourceImage || !editPrompt.trim() || activeVideoIndex < 0) return;

        // Check credits (same as generation)
        const creditFeature = qualityMode === 'pro' ? 'motion_pro' : 'motion_fast';
        const creditResult = useCreditsHook(creditFeature);
        if (!creditResult.success) {
            setShowCreditsModal(true);
            return;
        }

        setIsEditing(true);
        setError(null);
        setPollingStatus('Starting video edit...');
        setProgress(0);

        try {
            const result = await startMotionEdit(sourceImage, editPrompt, {
                duration: parseInt(duration),
                qualityMode,
                aspectRatio
            });

            if (result.success && result.operation_name) {
                setOperationName(result.operation_name);
                setModelId(result.model_id);
                // Reuse the same polling mechanism
                startPolling(result.operation_name, result.model_id);
                // Note: isEditing will be cleared when polling completes (in startPolling)
            } else {
                throw new Error(result.error || 'Failed to start edit');
            }
        } catch (err) {
            setError(err.message);
            setIsEditing(false);
            setPollingStatus('');
        }
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

    // Add current video to library
    const handleAddToLibrary = async () => {
        const activeMedia = getActiveMedia();
        if (activeMedia.url) {
            try {
                await addToLibrary({
                    url: activeMedia.url,
                    type: activeMedia.type,
                    name: `Motion ${new Date().toLocaleDateString()}`,
                    source: 'generated',
                    metadata: { cameraMovement, speed, duration, qualityMode }
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
        setGeneratedVideos([]);
        setActiveVideoIndex(-1);
        setError(null);
    };

    const activeMedia = getActiveMedia();
    const creditCost = getCreditCost(duration, qualityMode);

    return (
        <>
            <div className="flex-1 flex min-h-0 bg-[#FAF9F6]">
                {/* ════════════════════════════════════════════════════════════
                    LEFT PANEL - 40% - Controls (Glassmorphism)
                ════════════════════════════════════════════════════════════ */}
                <aside className="w-[40%] min-w-[360px] max-w-[480px] glass-panel border-r border-[#E8E7E4]/60 overflow-y-auto">
                    <div className="p-5 space-y-4">
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
                                        className="w-full h-32 object-contain rounded-xl border border-[#E8E7E4] bg-[#F5F4F1]"
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
                                    onClick={() => setShowSourceModal(true)}
                                    className="w-full h-32 border-2 border-dashed border-[#E8E7E4] rounded-xl flex flex-col items-center justify-center text-[#8C8C8C] hover:border-violet-400 hover:text-violet-500 transition-colors"
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
                            <div className="grid grid-cols-2 gap-1.5">
                                {QUALITY_MODES.map((mode) => {
                                    const ModeIcon = mode.icon;
                                    const modeCreditCost = getCreditCost(duration, mode.id);
                                    return (
                                        <button
                                            key={mode.id}
                                            onClick={() => setQualityMode(mode.id)}
                                            className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border flex items-center justify-center gap-1.5
                                                ${qualityMode === mode.id
                                                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                                    : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                                }`}
                                        >
                                            <ModeIcon size={12} />
                                            {mode.label}
                                            <span className="opacity-70">
                                                {modeCreditCost}cr
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

                        {/* Generate Button with Pulse Glow */}
                        <button
                            onClick={handleGenerateVideo}
                            disabled={!sourceImage || isGenerating}
                            className={`w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative btn-shine
                                ${sourceImage && !isGenerating ? 'animate-pulse-glow-violet hover:scale-[1.02]' : ''}`}
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
                <section className="flex-1 flex flex-col p-6 overflow-y-auto">
                    {/* Video Canvas Area */}
                    <div className="flex flex-col">
                        <div
                            className="relative rounded-2xl overflow-hidden"
                            style={{ height: '450px' }}
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
                                            filter: 'blur(30px) brightness(0.7)',
                                            transform: 'scale(1.2)'
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/20" />

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
                                            <img
                                                src={activeMedia.url}
                                                alt="Source"
                                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                                            />
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
                                                onClick={handleAddToLibrary}
                                                className={`p-2 backdrop-blur-sm rounded-lg text-white transition-colors ${addedToLibrary
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

                                    {/* Loading Overlay with Ring Progress */}
                                    {isGenerating && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                            {/* Ring Progress Indicator */}
                                            <div
                                                className="ring-progress mb-4"
                                                style={{ '--progress': progress || 5, '--size': '100px', '--stroke-width': '8px' }}
                                            >
                                                <div className="ring-progress-inner text-white text-lg">
                                                    {progress || 5}%
                                                </div>
                                            </div>
                                            <p className="text-white font-medium">{pollingStatus}</p>
                                            <p className="text-white/50 text-xs mt-2">
                                                {t('motion.processingTip') || 'Video generation typically takes 1-3 minutes'}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center bg-[#F5F4F1] rounded-2xl border-2 border-dashed border-[#E8E7E4]">
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
                                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${activeVideoIndex === -1
                                            ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                                            : 'border-[#E8E7E4] hover:border-[#1A1A1A] hover:shadow-md'
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
                                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${activeVideoIndex === idx
                                                ? 'border-violet-500 ring-2 ring-violet-500/30 shadow-lg'
                                                : 'border-[#E8E7E4] hover:border-[#1A1A1A] hover:shadow-md'
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
                                        onClick={handleEditVideo}
                                        disabled={!editPrompt.trim() || isEditing || isGenerating || activeVideoIndex < 0}
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
