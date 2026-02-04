import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Monitor, Image, Video, Play, Check } from 'lucide-react';
import { getLibraryAssets } from '../utils/libraryManager';
import { useTranslation } from '../i18n';

/**
 * SourceSelectionModal - Choose between Library and Device upload
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onSelectFromLibrary: (asset) => void
 * - onSelectFromDevice: () => void
 * - acceptVideo: boolean (default false)
 */
export default function SourceSelectionModal({
    isOpen,
    onClose,
    onSelectFromLibrary,
    onSelectFromDevice,
    acceptVideo = false
}) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('library'); // 'library' | 'device'
    const [libraryAssets, setLibraryAssets] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState(null);

    useEffect(() => {
        if (isOpen) {
            const assets = getLibraryAssets();
            // Filter by type if not accepting video
            const filteredAssets = acceptVideo
                ? assets
                : assets.filter(a => a.type === 'image');
            setLibraryAssets(filteredAssets);
            setSelectedAsset(null);
        }
    }, [isOpen, acceptVideo]);

    if (!isOpen) return null;

    const handleSelectFromLibrary = () => {
        if (selectedAsset) {
            onSelectFromLibrary(selectedAsset);
            onClose();
        }
    };

    const handleSelectFromDevice = () => {
        onSelectFromDevice();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#E8E7E4]">
                    <h2 className="text-lg font-bold text-[#1A1A1A]">
                        {t('library.selectSource') || 'Select Source'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#F5F4F1] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-[#5C5C5C]" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#E8E7E4]">
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'library'
                                ? 'text-[#E06847] border-b-2 border-[#E06847]'
                                : 'text-[#5C5C5C] hover:text-[#1A1A1A]'
                        }`}
                    >
                        <FolderOpen className="w-4 h-4" />
                        {t('library.fromLibrary') || 'From Library'}
                    </button>
                    <button
                        onClick={() => setActiveTab('device')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'device'
                                ? 'text-[#E06847] border-b-2 border-[#E06847]'
                                : 'text-[#5C5C5C] hover:text-[#1A1A1A]'
                        }`}
                    >
                        <Monitor className="w-4 h-4" />
                        {t('library.fromDevice') || 'From Device'}
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[50vh]">
                    {activeTab === 'library' ? (
                        libraryAssets.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {libraryAssets.map((asset) => (
                                    <div
                                        key={asset.id}
                                        onClick={() => setSelectedAsset(asset)}
                                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all ${
                                            selectedAsset?.id === asset.id
                                                ? 'ring-2 ring-[#E06847] ring-offset-2'
                                                : 'hover:opacity-80'
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
                                                    <Play className="w-6 h-6 text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <img
                                                src={asset.url}
                                                alt={asset.name}
                                                className="w-full h-full object-cover"
                                            />
                                        )}

                                        {/* Selected checkmark */}
                                        {selectedAsset?.id === asset.id && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-[#E06847] rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}

                                        {/* Type badge */}
                                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-white text-[9px] flex items-center gap-1">
                                            {asset.type === 'video' ? <Video className="w-2.5 h-2.5" /> : <Image className="w-2.5 h-2.5" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <FolderOpen className="w-12 h-12 text-[#E8E7E4] mb-3" />
                                <p className="text-sm text-[#5C5C5C] mb-2">
                                    {t('library.empty') || 'Your library is empty'}
                                </p>
                                <p className="text-xs text-[#8C8C8C]">
                                    {t('library.emptyDescription') || 'Upload assets to your library first'}
                                </p>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Monitor className="w-16 h-16 text-[#E8E7E4] mb-4" />
                            <p className="text-sm text-[#5C5C5C] mb-4">
                                {t('library.uploadFromDevice') || 'Upload from your device'}
                            </p>
                            <button
                                onClick={handleSelectFromDevice}
                                className="px-6 py-3 bg-[#E06847] text-white rounded-xl font-medium hover:bg-[#C85A3D] transition-colors"
                            >
                                {t('common.upload') || 'Upload'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer - only show for library tab with selection */}
                {activeTab === 'library' && libraryAssets.length > 0 && (
                    <div className="p-4 border-t border-[#E8E7E4] flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-[#5C5C5C] hover:bg-[#F5F4F1] rounded-lg transition-colors"
                        >
                            {t('common.cancel') || 'Cancel'}
                        </button>
                        <button
                            onClick={handleSelectFromLibrary}
                            disabled={!selectedAsset}
                            className="px-6 py-2 bg-[#E06847] text-white rounded-lg font-medium hover:bg-[#C85A3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('common.select') || 'Select'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
