import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, Image, Video, Trash2, Upload, Plus, Database, Play } from 'lucide-react';
import { getLibraryAssets, addToLibrary, removeFromLibrary, clearLibrary, getLibraryStats } from '../utils/libraryManager';
import { useTranslation } from '../i18n';

// Marketplace color configuration
const MARKETPLACE_COLORS = {
    etsy: { primary: '#F1641E', hover: '#D55419' },
    amazon: { primary: '#FF9900', hover: '#E68A00' },
    shopify: { primary: '#96BF48', hover: '#7FA03C' }
};

/**
 * LibraryView - Personal Asset Library
 *
 * Features:
 * - Shows saved photos and videos (max 20)
 * - FIFO queue (oldest removed when full)
 * - Upload new assets
 * - Use assets in Studio/Handsfree/Motion
 */
export default function LibraryView({ onNavigate, onSelectAsset, marketplace }) {
    const { t } = useTranslation();
    const [assets, setAssets] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const fileInputRef = useRef(null);

    // Get marketplace-specific colors
    const color = MARKETPLACE_COLORS[marketplace] || { primary: '#E06847', hover: '#C85A3D' };

    // Load library on mount
    useEffect(() => {
        loadLibrary();
    }, []);

    const loadLibrary = () => {
        const savedAssets = getLibraryAssets();
        setAssets(savedAssets);
        setStats(getLibraryStats());
    };

    // Handle file upload
    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (const file of files) {
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');

            if (!isVideo && !isImage) continue;

            const reader = new FileReader();
            reader.onload = async (event) => {
                await addToLibrary({
                    url: event.target.result,
                    type: isVideo ? 'video' : 'image',
                    name: file.name,
                    source: 'upload'
                });
                loadLibrary();
            };
            reader.readAsDataURL(file);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Delete asset
    const handleDelete = (assetId, e) => {
        e.stopPropagation();
        if (window.confirm(t('library.confirmDelete') || 'Delete this asset?')) {
            removeFromLibrary(assetId);
            loadLibrary();
            if (selectedAsset?.id === assetId) {
                setSelectedAsset(null);
            }
        }
    };

    // Clear all
    const handleClearAll = () => {
        if (window.confirm(t('library.confirmClearAll') || 'Delete all library assets?')) {
            clearLibrary();
            loadLibrary();
            setSelectedAsset(null);
        }
    };

    // Select asset for use
    const handleSelectAsset = (asset) => {
        setSelectedAsset(asset);
        if (onSelectAsset) {
            onSelectAsset(asset);
        }
    };

    // Render storage usage bar
    const renderStorageUsage = () => {
        if (!stats) return null;

        return (
            <div className="bg-white border border-[#E8E7E4] rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#5C5C5C]" />
                        <span className="text-sm font-medium text-[#1A1A1A]">
                            {t('library.storageUsage') || 'Library Usage'}
                        </span>
                    </div>
                    <span className="text-xs text-[#8C8C8C]">
                        {stats.total}/{stats.maxAssets} {t('library.assets') || 'assets'}
                    </span>
                </div>
                <div className="space-y-2">
                    <div>
                        <div className="flex justify-between text-xs text-[#5C5C5C] mb-1">
                            <span>{t('library.images') || 'Images'}: {stats.images}</span>
                            <span>{t('library.videos') || 'Videos'}: {stats.videos}</span>
                        </div>
                        <div className="w-full h-2 bg-[#E8E7E4] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${stats.usagePercent}%`,
                                    backgroundColor: stats.usagePercent > 80 ? '#EF4444' : color.primary
                                }}
                            />
                        </div>
                    </div>
                </div>
                {stats.isFull && (
                    <p className="text-xs text-amber-600 mt-2">
                        {t('library.fullWarning') || 'Library full! Oldest assets will be removed when adding new ones.'}
                    </p>
                )}
            </div>
        );
    };

    // Render asset grid
    const renderAssetGrid = () => {
        if (assets.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FolderOpen className="w-16 h-16 text-[#E8E7E4] mb-4" />
                    <h3 className="text-lg font-medium text-[#5C5C5C] mb-2">
                        {t('library.empty') || 'Your library is empty'}
                    </h3>
                    <p className="text-sm text-[#8C8C8C] mb-6 max-w-sm">
                        {t('library.emptyDescription') || 'Upload photos and videos to use them across all modes without re-uploading.'}
                    </p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all hover:shadow-md"
                        style={{ backgroundColor: color.primary }}
                    >
                        <Upload className="w-5 h-5" />
                        {t('library.uploadFirst') || 'Upload Your First Asset'}
                    </button>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {assets.map((asset) => (
                    <div
                        key={asset.id}
                        onClick={() => handleSelectAsset(asset)}
                        className={`relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                            selectedAsset?.id === asset.id
                                ? 'border-[#E06847] ring-2 ring-[#E06847]/30'
                                : 'border-[#E8E7E4] hover:border-[#1A1A1A]'
                        }`}
                    >
                        {asset.type === 'video' ? (
                            <>
                                <video
                                    src={asset.url}
                                    className="w-full h-full object-cover"
                                    muted
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <Play className="w-8 h-8 text-white" />
                                </div>
                            </>
                        ) : (
                            <img
                                src={asset.url}
                                alt={asset.name}
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Type badge */}
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-lg text-white text-[10px] font-medium flex items-center gap-1">
                            {asset.type === 'video' ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                            {asset.type === 'video' ? 'Video' : 'Image'}
                        </div>

                        {/* Delete button */}
                        <button
                            onClick={(e) => handleDelete(asset.id, e)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Source badge */}
                        {asset.source === 'generated' && (
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-violet-500/80 rounded text-white text-[9px] font-medium">
                                AI
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#FAF9F6]">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <FolderOpen className="w-7 h-7" style={{ color: color.primary }} />
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">
                            {t('library.title') || 'Library'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {assets.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                {t('library.clearAll') || 'Clear All'}
                            </button>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all hover:shadow-md"
                            style={{ backgroundColor: color.primary }}
                        >
                            <Plus className="w-5 h-5" />
                            {t('library.addAsset') || 'Add Asset'}
                        </button>
                    </div>
                </div>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                />

                {/* Storage Usage */}
                {renderStorageUsage()}

                {/* Asset Grid */}
                {renderAssetGrid()}
            </div>
        </div>
    );
}
