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
    Check,
    Sparkles,
    Music,
    Volume2,
    VolumeX,
    Lightbulb,
    Film,
    Plus,
    X,
    Wand2
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useCredits } from '../contexts/CreditContext';
import { startMotionGeneration, pollMotionGeneration, startMotionEdit, qualityCheckMotion, getSmartRecommendation, addMusicToVideo, stitchVideoSequence } from '../utils/aiHelpers';
import { createProject, saveProject } from '../utils/projectManager';
import { addToLibrary } from '../utils/libraryManager';
import InsufficientCreditsModal from './InsufficientCreditsModal';
import SourceSelectionModal from './SourceSelectionModal';

// ═══════════════════════════════════════════════════════════════════════════════
// MOTION STUDIO v4.0 - WORLD-CLASS VIDEO ENGINE
// Features: Smart Recommendation, Multi-Shot Sequence, Background Music, Quality Gate
// ═══════════════════════════════════════════════════════════════════════════════

// Shot type categories for organized display
const SHOT_CATEGORIES = [
    { id: 'hero', name: 'Hero Shots', icon: '🎬', description: 'Dramatic reveals' },
    { id: 'detail', name: 'Detail', icon: '🔍', description: 'Close-ups & texture' },
    { id: 'movement', name: 'Movement', icon: '🎥', description: 'Orbit & dolly' },
    { id: 'cinematic', name: 'Cinematic', icon: '🎞️', description: 'Film techniques' },
    { id: 'safe', name: 'Product Safe', icon: '🔒', description: 'Zero distortion' },
    { id: 'dynamic', name: 'Dynamic', icon: '⚡', description: 'High energy' }
];

// Professional shot types - real cinematography techniques
const SHOT_TYPES = [
    // Hero Shots
    { id: 'hero_reveal', label: 'Hero Reveal', category: 'hero', description: 'Shadow to light reveal' },
    { id: 'hero_spotlight', label: 'Spotlight', category: 'hero', description: 'Moving spotlight effect' },

    // Detail Shots
    { id: 'detail_explorer', label: 'Detail Explorer', category: 'detail', description: 'Quick zooms to details' },
    { id: 'macro_texture', label: 'Macro Texture', category: 'detail', description: 'Extreme close-up pull' },

    // Movement
    { id: 'cinematic_orbit', label: 'Cinematic Orbit', category: 'movement', description: '180° smooth orbit' },
    { id: 'dolly_showcase', label: 'Dolly Showcase', category: 'movement', description: 'Forward dolly reveal' },

    // Cinematic Techniques
    { id: 'rack_focus', label: 'Rack Focus', category: 'cinematic', description: 'Focus shift effect' },
    { id: 'vertigo_zoom', label: 'Vertigo Effect', category: 'cinematic', description: 'Dolly zoom drama' },

    // Product Safe (guaranteed no distortion)
    { id: 'static_breathe', label: 'Static Breathe', category: 'safe', description: 'Subtle motion, 100% safe' },
    { id: 'environment_motion', label: 'Environment Motion', category: 'safe', description: 'Background moves only' },

    // Dynamic
    { id: 'whip_pan_multi', label: 'Whip Pan', category: 'dynamic', description: 'Fast angle transitions' },
    { id: 'crash_zoom', label: 'Crash Zoom', category: 'dynamic', description: 'Dramatic fast zoom' }
];

// Legacy mapping for backwards compatibility
const CAMERA_MOVEMENTS = SHOT_TYPES;

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

// Music library (synced with backend)
const MUSIC_LIBRARY = {
    elegant_piano: { name: 'Elegant Piano', mood: 'luxury', icon: '🎹' },
    upbeat_corporate: { name: 'Upbeat', mood: 'energetic', icon: '🎸' },
    cinematic_epic: { name: 'Cinematic', mood: 'dramatic', icon: '🎬' },
    soft_ambient: { name: 'Ambient', mood: 'calm', icon: '🌊' },
    tech_modern: { name: 'Tech', mood: 'modern', icon: '🤖' },
    fashion_groove: { name: 'Groove', mood: 'stylish', icon: '💃' }
};

// Sequence presets with shot configurations
const SEQUENCE_PRESETS = [
    { id: 'single', label: 'Single Shot', icon: '📷', description: 'One professional shot', shots: [] },
    { id: 'custom', label: 'Custom Sequence', icon: '🎨', description: 'Build your own shot sequence', shots: [], isCustom: true },
    { id: 'product_showcase', label: 'Product Showcase', icon: '🎬', description: '4 shots: Reveal → Detail → Orbit → Static',
      shots: ['hero_reveal', 'detail_explorer', 'cinematic_orbit', 'static_breathe'],
      durations: [3, 2, 3, 2],
      music: 'upbeat_corporate'
    },
    { id: 'luxury_reveal', label: 'Luxury Reveal', icon: '💎', description: '4 shots: Breathe → Spotlight → Macro → Hero',
      shots: ['static_breathe', 'hero_spotlight', 'macro_texture', 'hero_reveal'],
      durations: [2, 3, 2, 3],
      music: 'elegant_piano'
    },
    { id: 'dynamic_promo', label: 'Dynamic Promo', icon: '⚡', description: '4 shots: Crash → Whip → Detail → Crash',
      shots: ['crash_zoom', 'whip_pan_multi', 'detail_explorer', 'crash_zoom'],
      durations: [2, 2, 2, 2],
      music: 'fashion_groove'  // Fixed: was tech_modern, now matches backend
    }
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
    const [cameraMovement, setCameraMovement] = useState('hero_reveal');
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

    // Quality Gate state
    const [qualityScore, setQualityScore] = useState(null);
    const [qualityIssues, setQualityIssues] = useState([]);
    const [isQualityChecking, setIsQualityChecking] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 2;

    // v4.0 World-Class Features
    const [aiRecommendation, setAiRecommendation] = useState(null);
    const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
    const [musicEnabled, setMusicEnabled] = useState(true);
    const [selectedMusic, setSelectedMusic] = useState('elegant_piano');
    const [sequenceMode, setSequenceMode] = useState('single');
    const [sequenceProgress, setSequenceProgress] = useState({ current: 0, total: 0, videos: [] });
    // v4.1 Custom Sequence Builder
    const [customSequence, setCustomSequence] = useState([]);  // Array of { shotId, duration }

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

    // Fetch AI recommendations for an image
    const fetchRecommendations = async (imageData) => {
        setIsLoadingRecommendation(true);
        try {
            const result = await getSmartRecommendation(imageData);
            setAiRecommendation(result);

            // Auto-select first recommended shot
            if (result.recommended_shots?.length > 0) {
                const firstShot = result.recommended_shots[0];
                if (firstShot.id) {
                    setCameraMovement(firstShot.id);
                }
                // Set recommended music
                if (firstShot.music) {
                    setSelectedMusic(firstShot.music);
                }
            }
        } catch (err) {
            console.warn('Recommendation failed:', err);
        } finally {
            setIsLoadingRecommendation(false);
        }
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
            setAiRecommendation(null);

            // Auto-add device uploads to library
            addToLibrary({
                url: imageData,
                type: 'image',
                name: file.name || `Upload ${new Date().toLocaleDateString()}`,
                source: 'upload'
            }).catch(err => console.warn('Auto-add to library failed:', err));

            // Fetch AI recommendations
            fetchRecommendations(imageData);
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

            // Fetch recommendations for loaded image
            if (sourceImg) {
                fetchRecommendations(sourceImg);
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

                    // Quality Gate Check
                    if (result.video_url) {
                        setPollingStatus('Analyzing video quality...');
                        setProgress(95);
                        setIsQualityChecking(true);

                        try {
                            const qualityResult = await qualityCheckMotion(
                                result.video_url,
                                sourceImage,
                                cameraMovement,
                                retryCount
                            );

                            setQualityScore(qualityResult.score || 0);
                            setQualityIssues(qualityResult.issues || []);
                            setIsQualityChecking(false);

                            // Check if quality is approved or we've exceeded retries
                            if (qualityResult.approved || retryCount >= MAX_RETRIES) {
                                // Accept the video - add music if enabled
                                let finalVideoUrl = result.video_url;

                                if (musicEnabled && selectedMusic) {
                                    setPollingStatus('Adding background music...');
                                    try {
                                        const musicResult = await addMusicToVideo(result.video_url, selectedMusic, true);
                                        if (musicResult.success && musicResult.video_url) {
                                            finalVideoUrl = musicResult.video_url;
                                            console.log('🎵 Music added successfully');
                                        }
                                    } catch (musicErr) {
                                        console.warn('Music overlay failed, using original:', musicErr);
                                    }
                                }

                                setPollingStatus(qualityResult.approved ? 'Video ready!' : 'Video ready (best effort)');
                                setProgress(100);
                                setIsGenerating(false);
                                setIsEditing(false);
                                setEditPrompt('');
                                setRetryCount(0);

                                setGeneratedVideos(prev => {
                                    if (prev.includes(finalVideoUrl)) {
                                        return prev;
                                    }
                                    const newVideos = [...prev, finalVideoUrl];
                                    setActiveVideoIndex(newVideos.length - 1);
                                    saveVideoToHistory(finalVideoUrl, newVideos);
                                    return newVideos;
                                });
                            } else if (qualityResult.should_retry) {
                                // Auto-retry with stricter prompts
                                setRetryCount(prev => prev + 1);
                                setPollingStatus(`Quality issue detected, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
                                setProgress(10);

                                // Restart generation with retry count
                                const retryResult = await startMotionGeneration(sourceImage, {
                                    cameraMovement,
                                    speed,
                                    duration: parseInt(duration),
                                    qualityMode,
                                    aspectRatio,
                                    customDirective,
                                    retryCount: retryCount + 1
                                });

                                if (retryResult.success && retryResult.operation_name) {
                                    setOperationName(retryResult.operation_name);
                                    setModelId(retryResult.model_id);
                                    startPolling(retryResult.operation_name, retryResult.model_id);
                                } else {
                                    throw new Error('Retry failed to start');
                                }
                            } else {
                                // Quality check failed but no retry needed - still add music
                                let finalVideoUrl = result.video_url;

                                if (musicEnabled && selectedMusic) {
                                    setPollingStatus('Adding background music...');
                                    try {
                                        const musicResult = await addMusicToVideo(result.video_url, selectedMusic, true);
                                        if (musicResult.success && musicResult.video_url) {
                                            finalVideoUrl = musicResult.video_url;
                                        }
                                    } catch (musicErr) {
                                        console.warn('Music overlay failed:', musicErr);
                                    }
                                }

                                setPollingStatus('Video ready!');
                                setProgress(100);
                                setIsGenerating(false);
                                setIsEditing(false);
                                setEditPrompt('');

                                setGeneratedVideos(prev => {
                                    if (prev.includes(finalVideoUrl)) {
                                        return prev;
                                    }
                                    const newVideos = [...prev, finalVideoUrl];
                                    setActiveVideoIndex(newVideos.length - 1);
                                    saveVideoToHistory(finalVideoUrl, newVideos);
                                    return newVideos;
                                });
                            }
                        } catch (qualityError) {
                            console.warn('Quality check failed, accepting video:', qualityError);
                            // On quality check error, accept the video anyway - still try to add music
                            let finalVideoUrl = result.video_url;

                            if (musicEnabled && selectedMusic) {
                                try {
                                    const musicResult = await addMusicToVideo(result.video_url, selectedMusic, true);
                                    if (musicResult.success && musicResult.video_url) {
                                        finalVideoUrl = musicResult.video_url;
                                    }
                                } catch (musicErr) {
                                    console.warn('Music overlay failed:', musicErr);
                                }
                            }

                            setPollingStatus('Video ready!');
                            setProgress(100);
                            setIsGenerating(false);
                            setIsEditing(false);
                            setEditPrompt('');
                            setIsQualityChecking(false);

                            setGeneratedVideos(prev => {
                                if (prev.includes(finalVideoUrl)) {
                                    return prev;
                                }
                                const newVideos = [...prev, finalVideoUrl];
                                setActiveVideoIndex(newVideos.length - 1);
                                saveVideoToHistory(finalVideoUrl, newVideos);
                                return newVideos;
                            });
                        }
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
    }, [saveVideoToHistory, sourceImage, cameraMovement, speed, duration, qualityMode, aspectRatio, customDirective, retryCount, musicEnabled, selectedMusic]);

    // Generate a single video and wait for completion (promise-based)
    const generateSingleVideo = async (shotType, shotDuration) => {
        const genResult = await startMotionGeneration(sourceImage, {
            cameraMovement: shotType,
            speed,
            duration: shotDuration || parseInt(duration),
            qualityMode,
            aspectRatio,
            customDirective,
            retryCount: 0
        });

        if (!genResult.success || !genResult.operation_name) {
            throw new Error(genResult.error || 'Failed to start generation');
        }

        // Poll until complete
        let pollCount = 0;
        const maxPollCount = 60;

        while (pollCount < maxPollCount) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            pollCount++;

            const result = await pollMotionGeneration(genResult.operation_name, genResult.model_id);

            if (result.status === 'COMPLETE' && result.video_url) {
                return result.video_url;
            } else if (result.status === 'FAILED' || result.status === 'ERROR') {
                throw new Error(result.error || 'Video generation failed');
            }

            // Update progress
            const shotProgress = Math.min(95, Math.floor((pollCount / maxPollCount) * 100));
            setProgress(shotProgress);
        }

        throw new Error('Video generation timed out');
    };

    // Generate video (single or sequence)
    const handleGenerateVideo = async () => {
        if (!sourceImage) return;

        const sequencePreset = SEQUENCE_PRESETS.find(p => p.id === sequenceMode);
        const isCustomSequence = sequenceMode === 'custom' && customSequence.length > 0;
        const isPresetSequence = sequenceMode !== 'single' && sequenceMode !== 'custom' && sequencePreset?.shots?.length > 0;
        const isSequence = isCustomSequence || isPresetSequence;

        // Calculate credit multiplier based on sequence length
        const creditFeature = qualityMode === 'pro' ? 'motion_pro' : 'motion_fast';
        const creditMultiplier = isCustomSequence ? customSequence.length : (isPresetSequence ? sequencePreset.shots.length : 1);

        for (let i = 0; i < creditMultiplier; i++) {
            const creditResult = useCreditsHook(creditFeature);
            if (!creditResult.success) {
                setShowCreditsModal(true);
                return;
            }
        }

        setIsGenerating(true);
        setError(null);
        setProgress(0);

        // Reset state
        setRetryCount(0);
        setQualityScore(null);
        setQualityIssues([]);

        try {
            if (isSequence) {
                // ═══════════════════════════════════════════════════════════
                // MULTI-SHOT SEQUENCE GENERATION (Custom or Preset)
                // ═══════════════════════════════════════════════════════════
                let shots, durations, sequenceMusic;

                if (isCustomSequence) {
                    // Custom sequence - use user-defined shots
                    shots = customSequence.map(s => s.shotId);
                    durations = customSequence.map(s => s.duration);
                    sequenceMusic = selectedMusic;  // User's selected music
                } else {
                    // Preset sequence
                    shots = sequencePreset.shots;
                    durations = sequencePreset.durations || shots.map(() => 3);
                    sequenceMusic = sequencePreset.music || selectedMusic;
                }

                setSequenceProgress({ current: 0, total: shots.length, videos: [] });
                setPollingStatus(`Generating shot 1/${shots.length}...`);

                const generatedVideoUrls = [];

                for (let i = 0; i < shots.length; i++) {
                    const shotType = shots[i];
                    const shotDuration = durations[i];
                    const shotLabel = SHOT_TYPES.find(s => s.id === shotType)?.label || shotType;

                    setPollingStatus(`Generating shot ${i + 1}/${shots.length}: ${shotLabel}...`);
                    setProgress(Math.floor((i / shots.length) * 70)); // 0-70% for individual shots

                    try {
                        let videoUrl = await generateSingleVideo(shotType, shotDuration);

                        // Quality Gate for each shot (with 1 retry)
                        setPollingStatus(`Checking quality: shot ${i + 1}...`);
                        try {
                            const qualityResult = await qualityCheckMotion(videoUrl, sourceImage, shotType, 0);

                            if (!qualityResult.approved && qualityResult.should_retry) {
                                // Retry this shot with stricter prompt
                                console.log(`Shot ${i + 1} quality failed (score: ${qualityResult.score}), retrying...`);
                                setPollingStatus(`Retrying shot ${i + 1}: ${shotLabel}...`);
                                videoUrl = await generateSingleVideo(shotType, shotDuration);
                            }
                        } catch (qErr) {
                            console.warn(`Quality check failed for shot ${i + 1}:`, qErr);
                            // Continue with the video anyway
                        }

                        generatedVideoUrls.push(videoUrl);
                        setSequenceProgress(prev => ({
                            ...prev,
                            current: i + 1,
                            videos: [...prev.videos, videoUrl]
                        }));
                    } catch (err) {
                        console.error(`Shot ${i + 1} failed:`, err);
                        // Continue with remaining shots, don't fail entire sequence
                    }
                }

                if (generatedVideoUrls.length === 0) {
                    throw new Error('All shots failed to generate');
                }

                // Stitch videos together
                setPollingStatus('Stitching videos together...');
                setProgress(75);

                let finalVideoUrl;

                if (generatedVideoUrls.length === 1) {
                    // Only one video succeeded, use it directly
                    finalVideoUrl = generatedVideoUrls[0];
                } else {
                    // Stitch multiple videos
                    const stitchResult = await stitchVideoSequence(
                        generatedVideoUrls,
                        musicEnabled ? sequenceMusic : null,
                        musicEnabled
                    );

                    if (stitchResult.success && stitchResult.video_url) {
                        finalVideoUrl = stitchResult.video_url;
                    } else {
                        // Stitching failed, use the last video
                        console.warn('Stitching failed, using last video');
                        finalVideoUrl = generatedVideoUrls[generatedVideoUrls.length - 1];

                        // Still try to add music if stitching failed
                        if (musicEnabled) {
                            try {
                                const musicResult = await addMusicToVideo(finalVideoUrl, sequenceMusic, true);
                                if (musicResult.success && musicResult.video_url) {
                                    finalVideoUrl = musicResult.video_url;
                                }
                            } catch (musicErr) {
                                console.warn('Music overlay failed:', musicErr);
                            }
                        }
                    }
                }

                // Success - add to generated videos
                setPollingStatus('Sequence complete!');
                setProgress(100);
                setIsGenerating(false);
                setSequenceProgress({ current: 0, total: 0, videos: [] });

                setGeneratedVideos(prev => {
                    const newVideos = [...prev, finalVideoUrl];
                    setActiveVideoIndex(newVideos.length - 1);
                    saveVideoToHistory(finalVideoUrl, newVideos);
                    return newVideos;
                });

            } else {
                // ═══════════════════════════════════════════════════════════
                // SINGLE SHOT GENERATION (existing flow with polling)
                // ═══════════════════════════════════════════════════════════
                setPollingStatus('Starting video generation...');

                const result = await startMotionGeneration(sourceImage, {
                    cameraMovement,
                    speed,
                    duration: parseInt(duration),
                    qualityMode,
                    aspectRatio,
                    customDirective,
                    retryCount: 0
                });

                if (result.success && result.operation_name) {
                    setOperationName(result.operation_name);
                    setModelId(result.model_id);
                    startPolling(result.operation_name, result.model_id);
                } else {
                    throw new Error(result.error || 'Failed to start generation');
                }
            }
        } catch (err) {
            setError(err.message);
            setIsGenerating(false);
            setPollingStatus('');
            setSequenceProgress({ current: 0, total: 0, videos: [] });
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
        // Reset quality gate state
        setQualityScore(null);
        setQualityIssues([]);
        setIsQualityChecking(false);
        setRetryCount(0);
        // Reset v4.0 features
        setAiRecommendation(null);
        setSequenceMode('single');
        setSequenceProgress({ current: 0, total: 0, videos: [] });
        // Reset v4.1 custom sequence
        setCustomSequence([]);
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
        setAiRecommendation(null);

        // Fetch AI recommendations
        fetchRecommendations(asset.url);
    };

    const activeMedia = getActiveMedia();
    const creditCost = getCreditCost(duration, qualityMode);

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

                        {/* AI Recommendation Banner */}
                        {sourceImage && (isLoadingRecommendation || aiRecommendation) && (
                            <div className="p-3 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb size={14} className="text-violet-600" />
                                    <span className="text-xs font-semibold text-violet-800">
                                        {t('motion.aiRecommendation') || 'AI Recommendation'}
                                    </span>
                                    {isLoadingRecommendation && <Loader2 size={12} className="animate-spin text-violet-500" />}
                                </div>
                                {aiRecommendation && !isLoadingRecommendation && (
                                    <>
                                        <p className="text-[10px] text-violet-700 mb-2">
                                            <span className="font-medium">{aiRecommendation.product_name || 'Product'}</span>
                                            {aiRecommendation.category && ` • ${aiRecommendation.category}`}
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {aiRecommendation.recommended_shots?.slice(0, 3).map((shot, idx) => (
                                                <button
                                                    key={shot.id || idx}
                                                    onClick={() => {
                                                        setCameraMovement(shot.id);
                                                        if (shot.music) setSelectedMusic(shot.music);
                                                    }}
                                                    className={`px-2 py-1 rounded text-[9px] font-medium transition-all ${
                                                        cameraMovement === shot.id
                                                            ? 'bg-violet-500 text-white'
                                                            : 'bg-white text-violet-700 hover:bg-violet-100'
                                                    }`}
                                                >
                                                    {idx === 0 && '⭐ '}{shot.name}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Music & Sequence Mode */}
                        {sourceImage && (
                            <div className="flex gap-2">
                                {/* Music Toggle */}
                                <div className="flex-1 p-2 bg-[#F5F4F1] rounded-lg border border-[#E8E7E4]">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[9px] font-semibold uppercase">
                                            <Music size={10} />
                                            Music
                                        </div>
                                        <button
                                            onClick={() => setMusicEnabled(!musicEnabled)}
                                            className={`p-1 rounded transition-colors ${
                                                musicEnabled ? 'bg-violet-500 text-white' : 'bg-[#E8E7E4] text-[#8C8C8C]'
                                            }`}
                                        >
                                            {musicEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                                        </button>
                                    </div>
                                    {musicEnabled && (
                                        <select
                                            value={selectedMusic}
                                            onChange={(e) => setSelectedMusic(e.target.value)}
                                            className="w-full px-2 py-1 bg-white border border-[#E8E7E4] rounded text-[10px] text-[#1A1A1A]"
                                        >
                                            {Object.entries(MUSIC_LIBRARY).map(([id, music]) => (
                                                <option key={id} value={id}>
                                                    {music.icon} {music.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Sequence Mode */}
                                <div className="flex-1 p-2 bg-[#F5F4F1] rounded-lg border border-[#E8E7E4]">
                                    <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[9px] font-semibold uppercase mb-2">
                                        <Film size={10} />
                                        Mode
                                    </div>
                                    <select
                                        value={sequenceMode}
                                        onChange={(e) => setSequenceMode(e.target.value)}
                                        className="w-full px-2 py-1 bg-white border border-[#E8E7E4] rounded text-[10px] text-[#1A1A1A]"
                                    >
                                        {SEQUENCE_PRESETS.map((preset) => (
                                            <option key={preset.id} value={preset.id}>
                                                {preset.icon} {preset.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Sequence Description or Custom Builder */}
                        {sequenceMode === 'custom' ? (
                            /* ═══════════════════════════════════════════════════════════
                               CUSTOM SEQUENCE BUILDER
                            ═══════════════════════════════════════════════════════════ */
                            <div className="p-3 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Wand2 size={14} className="text-violet-600" />
                                        <span className="text-xs font-bold text-violet-800">Custom Sequence Builder</span>
                                    </div>
                                    <span className="text-[9px] text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                                        {customSequence.length}/6 shots
                                    </span>
                                </div>

                                {/* Current Sequence */}
                                {customSequence.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {customSequence.map((item, idx) => {
                                            const shot = SHOT_TYPES.find(s => s.id === item.shotId);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-1 px-2 py-1 bg-white border border-violet-300 rounded-lg shadow-sm group"
                                                >
                                                    <span className="text-[9px] font-bold text-violet-600">{idx + 1}</span>
                                                    <span className="text-[10px] text-[#1A1A1A]">{shot?.label || item.shotId}</span>
                                                    {/* Duration selector */}
                                                    <select
                                                        value={item.duration}
                                                        onChange={(e) => {
                                                            const newDuration = parseInt(e.target.value);
                                                            setCustomSequence(prev => prev.map((s, i) =>
                                                                i === idx ? { ...s, duration: newDuration } : s
                                                            ));
                                                        }}
                                                        className="w-10 px-0.5 py-0 text-[8px] text-violet-600 bg-violet-50 border border-violet-200 rounded"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <option value={2}>2s</option>
                                                        <option value={3}>3s</option>
                                                        <option value={4}>4s</option>
                                                        <option value={5}>5s</option>
                                                    </select>
                                                    <button
                                                        onClick={() => setCustomSequence(prev => prev.filter((_, i) => i !== idx))}
                                                        className="ml-1 p-0.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-violet-600 italic">
                                        Click shots below to add them to your sequence
                                    </p>
                                )}

                                {/* Shot Picker Grid */}
                                <div className="space-y-2">
                                    <p className="text-[9px] text-violet-700 font-medium">Add shots:</p>
                                    <div className="grid grid-cols-3 gap-1">
                                        {SHOT_TYPES.map((shot) => (
                                            <button
                                                key={shot.id}
                                                onClick={() => {
                                                    if (customSequence.length < 6) {
                                                        setCustomSequence(prev => [...prev, { shotId: shot.id, duration: 3 }]);
                                                    }
                                                }}
                                                disabled={customSequence.length >= 6}
                                                className={`px-2 py-1.5 rounded text-[9px] font-medium transition-all border text-left
                                                    ${customSequence.some(s => s.shotId === shot.id)
                                                        ? 'bg-violet-100 text-violet-700 border-violet-300'
                                                        : 'bg-white text-[#5C5C5C] border-[#E8E7E4] hover:border-violet-300 hover:bg-violet-50'
                                                    }
                                                    ${customSequence.length >= 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Plus size={8} className="inline mr-1" />
                                                {shot.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCustomSequence([])}
                                        className="flex-1 px-2 py-1 text-[9px] text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        onClick={() => {
                                            // AI suggest based on product
                                            if (aiRecommendation?.recommended_shots?.length) {
                                                const aiShots = aiRecommendation.recommended_shots.slice(0, 4).map(s => ({
                                                    shotId: s.id,
                                                    duration: 3
                                                }));
                                                setCustomSequence(aiShots);
                                            }
                                        }}
                                        disabled={!aiRecommendation?.recommended_shots?.length}
                                        className="flex-1 px-2 py-1 text-[9px] text-violet-600 bg-violet-100 hover:bg-violet-200 rounded border border-violet-200 transition-colors disabled:opacity-50"
                                    >
                                        <Sparkles size={10} className="inline mr-1" />
                                        AI Suggest
                                    </button>
                                </div>

                                {/* Credit Info */}
                                {customSequence.length > 0 && (
                                    <p className="text-[8px] text-violet-600">
                                        {customSequence.length} videos × {getCreditCost(duration, qualityMode)} = {customSequence.length * getCreditCost(duration, qualityMode)} credits
                                    </p>
                                )}
                            </div>
                        ) : sequenceMode !== 'single' && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-[9px] text-amber-800">
                                    <span className="font-semibold">Multi-Shot Sequence:</span>{' '}
                                    {SEQUENCE_PRESETS.find(p => p.id === sequenceMode)?.description}
                                </p>
                                <p className="text-[8px] text-amber-600 mt-1">
                                    {SEQUENCE_PRESETS.find(p => p.id === sequenceMode)?.shots?.length || 4} videos will be generated and stitched together
                                </p>
                            </div>
                        )}

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

                        {/* Shot Type - Professional Cinematography */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-1.5 text-[#8C8C8C] text-[10px] font-semibold uppercase tracking-wider">
                                <Video size={12} />
                                {t('motion.shotType') || 'Shot Type'}
                                <span className="ml-auto px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded text-[8px] font-bold">
                                    PRO
                                </span>
                            </div>

                            {/* Category Tabs */}
                            <div className="flex flex-wrap gap-1">
                                {SHOT_CATEGORIES.map((cat) => {
                                    const isActive = SHOT_TYPES.find(s => s.id === cameraMovement)?.category === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                const firstInCategory = SHOT_TYPES.find(s => s.category === cat.id);
                                                if (firstInCategory) setCameraMovement(firstInCategory.id);
                                            }}
                                            className={`px-2 py-1 rounded text-[9px] font-medium transition-all ${
                                                isActive
                                                    ? 'bg-violet-500 text-white'
                                                    : 'bg-[#F5F4F1] text-[#5C5C5C] hover:bg-[#E8E7E4]'
                                            }`}
                                        >
                                            {cat.icon} {cat.name}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Shot Options in Selected Category */}
                            <div className="grid grid-cols-2 gap-1.5">
                                {SHOT_TYPES
                                    .filter(shot => shot.category === (SHOT_TYPES.find(s => s.id === cameraMovement)?.category || 'hero'))
                                    .map((shot) => (
                                        <button
                                            key={shot.id}
                                            onClick={() => setCameraMovement(shot.id)}
                                            className={`px-2 py-2 rounded-lg text-left transition-all border ${
                                                cameraMovement === shot.id
                                                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md'
                                                    : 'bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]'
                                            }`}
                                        >
                                            <div className="text-[10px] font-semibold">{shot.label}</div>
                                            <div className={`text-[8px] ${cameraMovement === shot.id ? 'text-white/70' : 'text-[#8C8C8C]'}`}>
                                                {shot.description}
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        </div>

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
                                    {sequenceMode !== 'single' ? <Film size={18} /> : <Video size={18} />}
                                    <span>
                                        {sequenceMode !== 'single'
                                            ? (t('motion.generateSequence') || 'Generate Sequence')
                                            : (t('motion.generateVideo') || 'Generate Video')
                                        }
                                    </span>
                                    <span className="absolute right-4 text-xs text-white/70">
                                        {sequenceMode !== 'single' ? `${creditCost * 4}` : creditCost} {t('credits.creditsUnit') || 'credits'}
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
                    RIGHT PANEL - Full width on mobile, 60% on desktop
                ════════════════════════════════════════════════════════════ */}
                <section className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
                    {/* Video Canvas Area */}
                    <div className="flex flex-col">
                        <div
                            className="relative rounded-2xl overflow-hidden h-[300px] md:h-[450px]"
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

                                    {/* Label with Quality Score */}
                                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                                            {activeVideoIndex === -1
                                                ? (t('motion.original') || 'Original')
                                                : `${t('motion.video') || 'Video'} ${activeVideoIndex + 1}`
                                            }
                                        </div>
                                        {/* Quality Score Badge */}
                                        {activeVideoIndex >= 0 && qualityScore !== null && (
                                            <div className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                                                qualityScore >= 80 ? 'bg-emerald-500/80 text-white' :
                                                qualityScore >= 60 ? 'bg-amber-500/80 text-white' :
                                                'bg-red-500/80 text-white'
                                            }`}>
                                                <span>{qualityScore >= 80 ? '✓' : qualityScore >= 60 ? '!' : '✗'}</span>
                                                <span>Q:{qualityScore}</span>
                                            </div>
                                        )}
                                        {/* Music Badge */}
                                        {activeVideoIndex >= 0 && musicEnabled && (
                                            <div className="px-2 py-1 rounded-lg text-[10px] font-medium bg-violet-500/80 text-white flex items-center gap-1">
                                                <Music size={10} />
                                                {MUSIC_LIBRARY[selectedMusic]?.icon}
                                            </div>
                                        )}
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
                                    {(isGenerating || isQualityChecking) && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                            {/* Sequence Progress Indicators */}
                                            {sequenceProgress.total > 0 && (
                                                <div className="flex gap-2 mb-4">
                                                    {Array.from({ length: sequenceProgress.total }).map((_, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                                                                idx < sequenceProgress.current
                                                                    ? 'bg-emerald-500 text-white'
                                                                    : idx === sequenceProgress.current
                                                                        ? 'bg-violet-500 text-white animate-pulse'
                                                                        : 'bg-white/20 text-white/50'
                                                            }`}
                                                        >
                                                            {idx < sequenceProgress.current ? '✓' : idx + 1}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Ring Progress Indicator */}
                                            <div
                                                className="ring-progress mb-4"
                                                style={{ '--progress': progress || 5, '--size': '100px', '--stroke-width': '8px' }}
                                            >
                                                <div className="ring-progress-inner text-white text-lg">
                                                    {isQualityChecking ? '🔍' : `${progress || 5}%`}
                                                </div>
                                            </div>
                                            <p className="text-white font-medium">{pollingStatus}</p>
                                            {retryCount > 0 && (
                                                <p className="text-amber-400 text-xs mt-1">
                                                    Auto-retry {retryCount}/{MAX_RETRIES} - Stricter prompts applied
                                                </p>
                                            )}
                                            <p className="text-white/50 text-xs mt-2">
                                                {isQualityChecking
                                                    ? (t('motion.qualityCheckTip') || 'AI is verifying product integrity...')
                                                    : sequenceProgress.total > 0
                                                        ? `Generating ${sequenceProgress.total}-shot sequence...`
                                                        : (t('motion.processingTip') || 'Video generation typically takes 1-3 minutes')
                                                }
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

                        {/* Quality Issues Alert */}
                        {qualityIssues.length > 0 && activeVideoIndex >= 0 && qualityScore !== null && qualityScore < 80 && (
                            <div className={`mt-4 p-3 rounded-xl border ${
                                qualityScore >= 60
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-red-50 border-red-200'
                            }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle size={14} className={qualityScore >= 60 ? 'text-amber-600' : 'text-red-600'} />
                                    <span className={`text-xs font-semibold ${qualityScore >= 60 ? 'text-amber-800' : 'text-red-800'}`}>
                                        {t('motion.qualityWarning') || 'Quality Notes'}
                                    </span>
                                </div>
                                <ul className={`text-[10px] space-y-1 ${qualityScore >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
                                    {qualityIssues.map((issue, idx) => (
                                        <li key={idx}>• {issue}</li>
                                    ))}
                                </ul>
                                <p className="text-[9px] mt-2 opacity-70">
                                    {t('motion.qualityTip') || 'Tip: Try "Static Breathe" or "Environment Motion" for guaranteed product safety.'}
                                </p>
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
