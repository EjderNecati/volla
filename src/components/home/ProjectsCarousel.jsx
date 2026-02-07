import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronLeft, ChevronRight, Sparkles, Video, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { getProjects } from '../../utils/projectManager';

/**
 * ProjectsCarousel - Yatay scroll son projeler
 * Home dashboard'da gösterilir
 */

// Marketplace color configuration
const MARKETPLACE_COLORS = {
    etsy: { primary: '#F1641E', text: 'white' },
    amazon: { primary: '#FF9900', text: 'black' },
    shopify: { primary: '#96BF48', text: 'white' }
};

// Feature type gradients
const FEATURE_GRADIENTS = {
    handsfree: 'from-cyan-500 to-blue-500',
    motion: 'from-violet-500 to-purple-500',
    creative: 'from-pink-500 to-rose-500'
};

export default function ProjectsCarousel({ onLoadProject, onNavigate }) {
    const { t } = useTranslation();
    const [projects, setProjects] = useState([]);
    const carouselRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Load projects
    useEffect(() => {
        try {
            const allProjects = getProjects();
            // Get last 8 projects
            setProjects(allProjects.slice(0, 8));
        } catch (err) {
            console.error('Failed to load projects:', err);
        }
    }, []);

    // Update scroll buttons
    const updateScrollButtons = () => {
        if (!carouselRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        updateScrollButtons();
        const el = carouselRef.current;
        if (el) {
            el.addEventListener('scroll', updateScrollButtons);
            return () => el.removeEventListener('scroll', updateScrollButtons);
        }
    }, [projects]);

    const scroll = (direction) => {
        if (!carouselRef.current) return;
        const scrollAmount = 280; // Card width + gap
        carouselRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
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

    // Get project thumbnail
    const getThumbnail = (project) => {
        return project.originalImage || project.assets?.[0]?.url || null;
    };

    // Get feature type badge
    const getFeatureIcon = (project) => {
        const featureType = project.productInfo?.featureType;
        if (featureType === 'motion') return Video;
        if (featureType === 'handsfree' || featureType === 'creative') return Sparkles;
        return ImageIcon;
    };

    if (projects.length === 0) {
        return (
            <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-[#8C8C8C] uppercase tracking-wider">
                        {t('home.recentProjects') || 'Recent Projects'}
                    </h2>
                </div>
                <div className="bg-white border border-[#E8E7E4] rounded-2xl p-8 text-center">
                    <Clock className="w-10 h-10 text-[#8C8C8C] mx-auto mb-3" />
                    <p className="text-[#5C5C5C] text-sm">
                        {t('home.noRecentProjects') || 'No recent projects yet'}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#8C8C8C] uppercase tracking-wider">
                    {t('home.recentProjects') || 'Recent Projects'}
                </h2>
                <div className="flex items-center gap-2">
                    {/* Scroll buttons */}
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className="p-1.5 rounded-lg bg-white border border-[#E8E7E4] disabled:opacity-30 hover:bg-[#F5F4F1] transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-[#5C5C5C]" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className="p-1.5 rounded-lg bg-white border border-[#E8E7E4] disabled:opacity-30 hover:bg-[#F5F4F1] transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-[#5C5C5C]" />
                    </button>
                    {/* View all */}
                    <button
                        onClick={() => onNavigate && onNavigate('history')}
                        className="text-sm font-medium text-[#E06847] hover:underline ml-2"
                    >
                        {t('home.viewAll') || 'View All'}
                    </button>
                </div>
            </div>

            {/* Carousel container */}
            <div className="relative">
                <div
                    ref={carouselRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {projects.map((project) => {
                        const thumbnail = getThumbnail(project);
                        const marketplaceColor = MARKETPLACE_COLORS[project.marketplace] || MARKETPLACE_COLORS.etsy;
                        const featureType = project.productInfo?.featureType;
                        const featureGradient = FEATURE_GRADIENTS[featureType];
                        const FeatureIcon = getFeatureIcon(project);

                        return (
                            <button
                                key={project.id}
                                onClick={() => {
                                    if (onLoadProject) onLoadProject(project);
                                    if (onNavigate) onNavigate('studio');
                                }}
                                className="group flex-shrink-0 w-[200px] bg-white border border-[#E8E7E4] rounded-xl overflow-hidden hover:shadow-lg hover:border-[#1A1A1A]/10 transition-all text-left"
                            >
                                {/* Thumbnail */}
                                <div className="aspect-square relative overflow-hidden bg-[#F5F4F1]">
                                    {thumbnail ? (
                                        <img
                                            src={thumbnail}
                                            alt={project.title || 'Project'}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Sparkles className="w-8 h-8 text-[#8C8C8C]" />
                                        </div>
                                    )}

                                    {/* Feature type badge */}
                                    {featureGradient ? (
                                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-medium uppercase text-white bg-gradient-to-r ${featureGradient}`}>
                                            {featureType}
                                        </div>
                                    ) : project.marketplace && (
                                        <div
                                            className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-medium uppercase"
                                            style={{
                                                backgroundColor: marketplaceColor.primary,
                                                color: marketplaceColor.text
                                            }}
                                        >
                                            {project.marketplace}
                                        </div>
                                    )}

                                    {/* Asset count */}
                                    {project.assets?.length > 1 && (
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[9px] font-medium text-white flex items-center gap-1">
                                            <FeatureIcon className="w-3 h-3" />
                                            {project.assets.length}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <p className="text-xs font-medium text-[#1A1A1A] truncate mb-0.5">
                                        {project.title || t('home.untitledProject') || 'Untitled'}
                                    </p>
                                    <p className="text-xs text-[#8C8C8C] truncate">
                                        {formatDate(project.updatedAt || project.createdAt)}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
