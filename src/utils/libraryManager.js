// =====================================================
// LIBRARY MANAGER - Personal Asset Library
// =====================================================
// Handles user's personal asset library with FIFO queue
// Max: 20 assets (photos + videos combined)

import { compressImage } from './projectManager';

const STORAGE_KEY = 'volla_library';
const MAX_ASSETS = 20;

// =====================================================
// CORE: Get All Library Assets
// =====================================================
export const getLibraryAssets = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error('Failed to load library:', err);
        return [];
    }
};

// =====================================================
// CORE: Get Single Asset
// =====================================================
export const getLibraryAsset = (assetId) => {
    const assets = getLibraryAssets();
    return assets.find(a => a.id === assetId) || null;
};

// =====================================================
// CORE: Add Asset to Library (FIFO queue)
// =====================================================
export const addToLibrary = async (asset) => {
    if (!asset || !asset.url) {
        throw new Error('Invalid asset: missing url');
    }

    const assets = getLibraryAssets();

    // Check if asset already exists (by url hash or id)
    const existingIndex = assets.findIndex(a => a.id === asset.id);
    if (existingIndex !== -1) {
        // Update existing asset
        assets[existingIndex] = {
            ...assets[existingIndex],
            ...asset,
            updatedAt: Date.now()
        };
    } else {
        // Compress image if it's an image (not video)
        let processedUrl = asset.url;
        if (asset.type !== 'video' && asset.url.startsWith('data:image')) {
            processedUrl = await compressImage(asset.url, 300);
        }

        // Create new asset
        const newAsset = {
            id: asset.id || `lib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: processedUrl,
            type: asset.type || 'image', // 'image' or 'video'
            name: asset.name || 'Untitled',
            source: asset.source || 'upload', // 'upload', 'generated', 'motion'
            createdAt: Date.now(),
            updatedAt: Date.now(),
            metadata: asset.metadata || {}
        };

        // FIFO: Remove oldest if at limit
        if (assets.length >= MAX_ASSETS) {
            assets.shift(); // Remove first (oldest) item
            console.log('📚 Library full, removed oldest asset');
        }

        assets.push(newAsset);
    }

    // Save to localStorage
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
        console.log('📚 Asset saved to library');
        return assets[assets.length - 1];
    } catch (err) {
        if (err.name === 'QuotaExceededError') {
            // Remove oldest assets until it fits
            while (assets.length > 1) {
                assets.shift();
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
                    return assets[assets.length - 1];
                } catch (e) {
                    continue;
                }
            }
        }
        throw err;
    }
};

// =====================================================
// CORE: Remove Asset from Library
// =====================================================
export const removeFromLibrary = (assetId) => {
    const assets = getLibraryAssets();
    const filtered = assets.filter(a => a.id !== assetId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
};

// =====================================================
// CORE: Clear All Library Assets
// =====================================================
export const clearLibrary = () => {
    localStorage.removeItem(STORAGE_KEY);
    return true;
};

// =====================================================
// HELPERS: Stats and Info
// =====================================================
export const getLibraryStats = () => {
    const assets = getLibraryAssets();
    const images = assets.filter(a => a.type === 'image').length;
    const videos = assets.filter(a => a.type === 'video').length;

    return {
        total: assets.length,
        images,
        videos,
        maxAssets: MAX_ASSETS,
        usagePercent: Math.round((assets.length / MAX_ASSETS) * 100),
        isFull: assets.length >= MAX_ASSETS
    };
};

// =====================================================
// HELPER: Check if URL exists in library
// =====================================================
export const isInLibrary = (url) => {
    const assets = getLibraryAssets();
    return assets.some(a => a.url === url);
};
