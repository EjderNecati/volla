import React, { useState } from 'react';
import {
    Sparkles, Upload, Loader2, Zap, Video, Palette,
    ArrowRight
} from 'lucide-react';
import { fileToBase64 } from '../utils/aiHelpers';
import { useTranslation } from '../i18n';

// New Components
import FeatureCard from '../components/home/FeatureCard';
import TutorialSection from '../components/home/TutorialSection';
import ProjectsCarousel from '../components/home/ProjectsCarousel';

/**
 * HomeView - Premium Landing Dashboard
 *
 * Features:
 * - Hero section with animated gradient (CENTERED)
 * - Feature cards for each studio mode
 * - Tutorial section (How to Use) - with 4 mode tabs
 * - Projects carousel (horizontal scroll)
 */

// Mode configurations for feature cards
const FEATURE_MODES = [
    { id: 'standard', icon: Sparkles, studioMode: 'standard' },
    { id: 'handsfree', icon: Zap, studioMode: 'handsfree' },
    { id: 'motion', icon: Video, studioMode: 'motion' },
    { id: 'creative', icon: Palette, studioMode: 'creative' }
];

export default function HomeView({
    onNavigate,
    onLoadAsset,
    onLoadProject,
    marketplace,
    onMarketplaceSelect,
    studioMode,
    onModeChange
}) {
    const { t } = useTranslation();

    // Local state
    const [uploading, setUploading] = useState(false);

    // Handle feature card click - navigate to studio with selected mode
    const handleFeatureClick = (mode) => {
        // Clear any loaded project when switching modes to prevent auto-redirect
        if (onLoadProject) {
            onLoadProject(null);
        }
        if (onModeChange) {
            onModeChange(mode);
        }
        if (onNavigate) {
            onNavigate('studio');
        }
    };

    // Quick upload handler
    const handleQuickUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const base64 = await fileToBase64(file);
            if (onLoadAsset) {
                onLoadAsset({ url: base64, marketplace });
            }
            if (onNavigate) {
                onNavigate('studio');
            }
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] p-6 md:p-10 font-poppins">
            <div className="max-w-5xl mx-auto">
                {/* ═══════════════════════════════════════════════════════
                    HERO SECTION (Centered)
                ═══════════════════════════════════════════════════════ */}
                <section className="mb-12">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] p-8 md:p-12">
                        {/* Animated gradient orbs */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#E06847]/30 to-transparent rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-gradient-to-tr from-violet-500/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
                        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-full blur-2xl animate-pulse delay-500" />

                        <div className="relative z-10 text-center">
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                                {t('home.heroTitle') || 'AI Product Photography Studio'}
                            </h1>
                            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-xl mx-auto">
                                {t('home.heroSubtitle') || 'Transform your products into sales magnets with AI-powered photography'}
                            </p>

                            {/* Quick Upload CTA */}
                            <label className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#E06847] to-[#C85A3D] text-white rounded-xl font-semibold cursor-pointer hover:shadow-lg hover:shadow-[#E06847]/30 transition-all group">
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{t('home.openingStudio') || 'Opening Studio...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        <span>{t('home.uploadProductPhoto') || 'Upload Product Photo'}</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleQuickUpload}
                                    accept="image/*"
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════
                    FEATURE CARDS - Studio Modes
                ═══════════════════════════════════════════════════════ */}
                <section className="mb-12">
                    <h2 className="text-sm font-semibold text-[#8C8C8C] uppercase tracking-wider mb-6">
                        {t('home.featuredModes') || 'Explore Studio Modes'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {FEATURE_MODES.map((mode) => (
                            <FeatureCard
                                key={mode.id}
                                icon={mode.icon}
                                mode={mode.id}
                                onClick={() => handleFeatureClick(mode.studioMode)}
                            />
                        ))}
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════
                    TUTORIAL SECTION - How to Use (4 Mode Tabs)
                ═══════════════════════════════════════════════════════ */}
                <TutorialSection />

                {/* ═══════════════════════════════════════════════════════
                    PROJECTS CAROUSEL - Recent Projects
                ═══════════════════════════════════════════════════════ */}
                <ProjectsCarousel
                    onLoadProject={onLoadProject}
                    onNavigate={onNavigate}
                />
            </div>
        </div>
    );
}
