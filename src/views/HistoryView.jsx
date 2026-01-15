import React, { useState, useEffect } from 'react';
import { Clock, Image, Trash2, ExternalLink, Sparkles, FolderOpen, MoreHorizontal, Database } from 'lucide-react';
import { getProjects, deleteProject, deleteAllProjects, getStorageUsage } from '../utils/projectManager';
import { useTranslation } from '../i18n';

// Marketplace color configuration
const MARKETPLACE_COLORS = {
    etsy: { primary: '#F1641E', hover: '#D55419' },
    amazon: { primary: '#FF9900', hover: '#E68A00' },
    shopify: { primary: '#96BF48', hover: '#7FA03C' }
};

/**
 * HistoryView - Project Library & History
 * 
 * Features:
 * - Shows saved projects with all assets
 * - Multi-thumbnail preview (up to 4 images)
 * - Storage usage display (X/20 projects, Y/200 photos)
 * - Resume project functionality
 */
export default function HistoryView({ onNavigate, onLoadProject, marketplace }) {
    const { t } = useTranslation();
    const [projects, setProjects] = useState([]);
    const [storageUsage, setStorageUsage] = useState(null);

    // Get marketplace-specific colors (default to Volla primary)
    const color = MARKETPLACE_COLORS[marketplace] || { primary: '#E06847', hover: '#C85A3D' };

    // Load projects from projectManager on mount
    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = () => {
        const savedProjects = getProjects();
        setProjects(savedProjects);
        setStorageUsage(getStorageUsage());
    };

    // Clear all history
    const handleClearAll = () => {
        if (window.confirm(t('settings.confirmDeleteHistory'))) {
            deleteAllProjects();
            loadProjects();
        }
    };

    // Delete single project
    const handleDelete = (projectId, e) => {
        e.stopPropagation();
        if (window.confirm('Delete this project?')) {
            deleteProject(projectId);
            loadProjects();
        }
    };

    // Resume project in Studio
    const handleResumeProject = (project) => {
        if (onLoadProject) {
            onLoadProject(project);
        }
        if (onNavigate) {
            onNavigate('studio');
        }
    };

    // Format date
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get asset count for display
    const getAssetCountText = (project) => {
        const count = project.assets?.length || 0;
        if (count === 0) return 'No images';
        if (count === 1) return '1 image';
        return `${count} images`;
    };

    // Render multi-thumbnail preview (shows up to 4 images in grid)
    const renderThumbnailGrid = (project) => {
        const assets = project.assets || [];

        if (assets.length === 0) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-[#F5F4F1]">
                    <Image className="w-12 h-12 text-[#8C8C8C]" />
                </div>
            );
        }

        // Single image
        if (assets.length === 1) {
            return (
                <img
                    src={assets[0].url}
                    alt="Project"
                    className="w-full h-full object-cover"
                />
            );
        }

        // 2-4 images: grid layout
        const displayAssets = assets.slice(0, 4);
        const remaining = assets.length - 4;

        return (
            <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
                {displayAssets.map((asset, i) => (
                    <div key={asset.id || i} className="relative overflow-hidden">
                        <img
                            src={asset.url}
                            alt={asset.label || 'Asset'}
                            className="w-full h-full object-cover"
                        />
                        {/* Show "+X more" badge on last tile if more than 4 */}
                        {i === 3 && remaining > 0 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">+{remaining}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Render storage usage bar
    const renderStorageUsage = () => {
        if (!storageUsage) return null;

        return (
            <div className="bg-white border border-[#E8E7E4] rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#5C5C5C]" />
                        <span className="text-sm font-medium text-[#1A1A1A]">{t('history.storageUsage')}</span>
                    </div>
                    <span className="text-xs text-[#8C8C8C]">
                        {storageUsage.projects}/{storageUsage.maxProjects} projects • {storageUsage.assets}/{storageUsage.maxAssets} photos
                    </span>
                </div>

                {/* Projects bar */}
                <div className="mb-2">
                    <div className="flex justify-between text-xs text-[#8C8C8C] mb-1">
                        <span>{t('settings.projects')}</span>
                        <span>{storageUsage.projectsPercent}%</span>
                    </div>
                    <div className="h-2 bg-[#F5F4F1] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${storageUsage.projectsPercent}%`,
                                backgroundColor: storageUsage.projectsPercent > 80 ? '#EF4444' : color.primary
                            }}
                        />
                    </div>
                </div>

                {/* Photos bar */}
                <div>
                    <div className="flex justify-between text-xs text-[#8C8C8C] mb-1">
                        <span>{t('settings.photos')}</span>
                        <span>{storageUsage.assetsPercent}%</span>
                    </div>
                    <div className="h-2 bg-[#F5F4F1] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${storageUsage.assetsPercent}%`,
                                backgroundColor: storageUsage.assetsPercent > 80 ? '#EF4444' : '#059669'
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] p-6 md:p-10 font-poppins">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <FolderOpen className="w-8 h-8" style={{ color: color.primary }} />
                            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                                {t('history.title')}
                            </h1>
                        </div>
                        <p className="text-[#5C5C5C]">
                            {t('history.startScanning')}
                        </p>
                    </div>
                    {projects.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="flex items-center gap-2 px-4 py-2 text-[#5C5C5C] hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm">{t('common.clearAll')}</span>
                        </button>
                    )}
                </div>

                {/* Storage Usage */}
                {renderStorageUsage()}

                {/* Empty State */}
                {projects.length === 0 ? (
                    <div className="bg-white border border-[#E8E7E4] rounded-2xl p-12 text-center">
                        <div className="w-20 h-20 bg-[#F5F4F1] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Image className="w-10 h-10 text-[#8C8C8C]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                            {t('history.noProjects')}
                        </h3>
                        <p className="text-[#5C5C5C] text-sm max-w-sm mx-auto mb-6">
                            {t('history.startScanning')}
                        </p>
                        <button
                            onClick={() => onNavigate && onNavigate('studio')}
                            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-medium transition-colors"
                            style={{ backgroundColor: color.primary }}
                        >
                            <Sparkles className="w-5 h-5" />
                            <span>{t('history.openAIStudio')}</span>
                        </button>
                    </div>
                ) : (
                    /* Grid of Project Cards */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {projects.map((project) => {
                            // Project-specific color based on its marketplace
                            const projectColor = MARKETPLACE_COLORS[project.marketplace] || color;
                            return (
                                <button
                                    key={project.id}
                                    onClick={() => handleResumeProject(project)}
                                    className="group bg-white border border-[#E8E7E4] rounded-xl overflow-hidden hover:shadow-lg hover:border-[#1A1A1A]/20 transition-all text-left"
                                >
                                    {/* Thumbnail Grid */}
                                    <div className="aspect-square relative overflow-hidden bg-[#F5F4F1]">
                                        {renderThumbnailGrid(project)}

                                        {/* Marketplace Badge */}
                                        {project.marketplace && (
                                            <div
                                                className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium uppercase text-white"
                                                style={{ backgroundColor: projectColor.primary }}
                                            >
                                                {project.marketplace}
                                            </div>
                                        )}

                                        {/* Asset Count Badge */}
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[10px] font-medium text-white">
                                            {getAssetCountText(project)}
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => handleDelete(project.id, e)}
                                            className="absolute bottom-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                        >
                                            <Trash2 className="w-3 h-3 text-white" />
                                        </button>

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="flex items-center gap-2 text-white text-sm font-medium">
                                                <ExternalLink className="w-4 h-4" />
                                                <span>{t('history.resumeProject')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-3">
                                        <h4 className="text-sm font-medium text-[#1A1A1A] truncate">
                                            {project.title || 'Untitled Project'}
                                        </h4>
                                        <p className="text-xs text-[#8C8C8C] mt-0.5">
                                            {formatDate(project.updatedAt || project.createdAt)}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
