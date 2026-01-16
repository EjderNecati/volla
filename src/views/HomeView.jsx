import React, { useState, useEffect } from 'react';
import {
    Sparkles, ArrowRight, Clock, Upload, Loader2, Check,
    Store, ShoppingBag, ShoppingCart
} from 'lucide-react';
import { fileToBase64 } from '../utils/aiHelpers';
import { getProjects } from '../utils/projectManager';
import { useTranslation } from '../i18n';

/**
 * HomeView - Landing Dashboard
 * 
 * Features:
 * - Platform selector (ETSY/AMAZON/SHOPIFY) with marketplace colors
 * - Quick Upload: Select platform → Upload photo → Go to Studio (single flow)
 * - Recent Projects from project library
 */

// Marketplace color configuration
const MARKETPLACE_COLORS = {
    etsy: { primary: '#F1641E', hover: '#D55419', text: 'white', icon: Store },
    amazon: { primary: '#FF9900', hover: '#E68A00', text: 'black', icon: ShoppingBag },
    shopify: { primary: '#96BF48', hover: '#7FA03C', text: 'white', icon: ShoppingCart }
};

export default function HomeView({ onNavigate, onLoadAsset, onLoadProject, marketplace, onMarketplaceSelect }) {
    const { t } = useTranslation();

    // Local state
    const [uploading, setUploading] = useState(false);
    const [recentProjects, setRecentProjects] = useState([]);

    // Get active marketplace color
    const getColor = () => MARKETPLACE_COLORS[marketplace] || MARKETPLACE_COLORS.etsy;

    // Load recent projects from projectManager
    useEffect(() => {
        try {
            const projects = getProjects();
            // Get last 3 projects (newest first already from projectManager)
            setRecentProjects(projects.slice(0, 3));
        } catch (err) {
            console.error('Failed to load recent projects:', err);
        }
    }, []);

    // ═══════════════════════════════════════════════════════════════════
    // QUICK UPLOAD: Platform-aware upload to AI Studio
    // ═══════════════════════════════════════════════════════════════════
    const handleQuickUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const base64 = await fileToBase64(file);

            // Send directly to AI Studio with marketplace info
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

    // Format date helper
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] p-6 md:p-10 font-poppins">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-2">
                        {t('home.welcomeBack')}
                    </h1>
                    <p className="text-[#5C5C5C] text-lg">
                        {t('home.quickTools')}
                    </p>
                </div>

                {/* ═══════════════════════════════════════════════════════
                    SECTION A: Quick Start - Platform Selection + Upload
                    ═══════════════════════════════════════════════════════ */}
                <section className="mb-10">
                    <h2 className="text-sm font-semibold text-[#8C8C8C] uppercase tracking-wider mb-4">
                        {t('home.quickStart')}
                    </h2>

                    <div className="bg-white border border-[#E8E7E4] rounded-2xl overflow-hidden">
                        {/* STEP 1: Platform Selector */}
                        <div className="p-6 border-b border-[#E8E7E4]">
                            <p className="text-sm text-[#5C5C5C] mb-4 text-center">
                                {t('home.selectMarketplace')}
                            </p>
                            <div className="flex justify-center">
                                <div className="inline-flex bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl p-1 gap-1">
                                    {Object.entries(MARKETPLACE_COLORS).map(([key, colors]) => {
                                        const Icon = colors.icon;
                                        const isActive = marketplace === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => onMarketplaceSelect(key)}
                                                className="px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
                                                style={{
                                                    backgroundColor: isActive ? colors.primary : 'transparent',
                                                    color: isActive ? colors.text : '#5C5C5C'
                                                }}
                                            >
                                                <Icon size={16} />
                                                <span>{key.toUpperCase()}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* STEP 2: Upload (only visible when marketplace selected) */}
                        {marketplace ? (
                            <label className="flex flex-col items-center justify-center py-12 px-8 cursor-pointer hover:bg-[#F5F4F1] transition-colors">
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: getColor().primary }} />
                                        <span className="text-[#5C5C5C]">{t('home.openingStudio')}</span>
                                    </>
                                ) : (
                                    <>
                                        <div
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                                            style={{
                                                backgroundColor: getColor().primary,
                                                boxShadow: `0 4px 20px ${getColor().primary}30`
                                            }}
                                        >
                                            <Sparkles className="w-8 h-8" style={{ color: getColor().text }} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">
                                            {t('home.uploadProductPhoto')}
                                        </h3>
                                        <p className="text-[#5C5C5C] text-sm text-center max-w-sm mb-4">
                                            {t('home.getAIOptimized', { marketplace: marketplace?.toUpperCase() })}
                                        </p>
                                        <div
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                            style={{
                                                backgroundColor: getColor().primary,
                                                color: getColor().text
                                            }}
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span>{t('studio.chooseImage')}</span>
                                        </div>
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
                        ) : (
                            <div className="py-12 text-center text-[#8C8C8C]">
                                <p className="text-sm">👆 {t('home.selectMarketplaceFirst')}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════
                    SECTION B: Recent Projects
                    ═══════════════════════════════════════════════════════ */}
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-[#8C8C8C] uppercase tracking-wider">
                            {t('home.recentProjects')}
                        </h2>
                        {recentProjects.length > 0 && (
                            <button
                                onClick={() => onNavigate && onNavigate('history')}
                                className="text-sm hover:underline"
                                style={{ color: getColor()?.primary || '#E06847' }}
                            >
                                {t('home.viewAll')}
                            </button>
                        )}
                    </div>

                    {recentProjects.length === 0 ? (
                        <div className="bg-white border border-[#E8E7E4] rounded-2xl p-8 text-center">
                            <Clock className="w-10 h-10 text-[#8C8C8C] mx-auto mb-3" />
                            <p className="text-[#5C5C5C] text-sm">
                                {t('home.noRecentProjects')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-4">
                            {recentProjects.map((project) => {
                                const projectColor = MARKETPLACE_COLORS[project.marketplace] || MARKETPLACE_COLORS.etsy;
                                // Get thumbnail - prefer originalImage, fallback to first asset
                                const thumbnailUrl = project.originalImage || project.assets?.[0]?.url || null;

                                return (
                                    <button
                                        key={project.id}
                                        onClick={() => {
                                            // Use onLoadProject to resume full project
                                            if (onLoadProject) {
                                                onLoadProject(project);
                                            }
                                            if (onNavigate) onNavigate('studio');
                                        }}
                                        className="group bg-white border border-[#E8E7E4] rounded-xl overflow-hidden hover:shadow-md transition-all text-left"
                                        style={{ '--hover-border': projectColor.primary }}
                                    >
                                        {/* Thumbnail */}
                                        <div className="aspect-square relative overflow-hidden bg-[#F5F4F1]">
                                            {thumbnailUrl ? (
                                                <img
                                                    src={thumbnailUrl}
                                                    alt={project.title || 'Project'}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Sparkles className="w-8 h-8 text-[#8C8C8C]" />
                                                </div>
                                            )}

                                            {/* Marketplace Badge */}
                                            {project.marketplace && (
                                                <div
                                                    className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-medium uppercase"
                                                    style={{
                                                        backgroundColor: projectColor.primary,
                                                        color: projectColor.text
                                                    }}
                                                >
                                                    {project.marketplace}
                                                </div>
                                            )}

                                            {/* Asset count badge */}
                                            {project.assets?.length > 1 && (
                                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[9px] font-medium text-white">
                                                    {project.assets.length}
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-3">
                                            <p className="text-xs font-medium text-[#1A1A1A] truncate mb-0.5">
                                                {project.title || t('home.untitledProject')}
                                            </p>
                                            <p className="text-xs text-[#8C8C8C] truncate">
                                                {formatDate(project.updatedAt || project.createdAt)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ═══════════════════════════════════════════════════════
                    SECTION C: Quick Actions
                    ═══════════════════════════════════════════════════════ */}
                <section>
                    <h2 className="text-sm font-semibold text-[#8C8C8C] uppercase tracking-wider mb-4">
                        {t('home.moreTools')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => onNavigate && onNavigate('studio')}
                            className="group rounded-2xl p-6 text-left hover:shadow-lg transition-all"
                            style={{
                                background: marketplace
                                    ? `linear-gradient(135deg, ${getColor().primary}, ${getColor().hover})`
                                    : 'linear-gradient(135deg, #E06847, #C85A3D)'
                            }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                                {t('nav.aiStudio')}
                            </h3>
                            <p className="text-white/80 text-sm">
                                {t('home.aiStudioDescription')}
                            </p>
                        </button>

                        <button
                            onClick={() => onNavigate && onNavigate('analysis')}
                            className="group bg-white border border-[#E8E7E4] rounded-2xl p-6 text-left hover:shadow-md transition-all"
                            style={{ '--hover-border': getColor()?.primary || '#E06847' }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 bg-[#F5F4F1] rounded-xl flex items-center justify-center">
                                    <Check className="w-6 h-6 text-[#5C5C5C]" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-[#8C8C8C] group-hover:translate-x-1 transition-all" style={{ '--hover-color': getColor()?.primary }} />
                            </div>
                            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">
                                {t('nav.analysis')}
                            </h3>
                            <p className="text-[#5C5C5C] text-sm">
                                {t('home.textAnalysisDescription')}
                            </p>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
