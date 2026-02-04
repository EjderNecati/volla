// =====================================================
// LIBRARY MANAGER - Personal Asset Library
// =====================================================
// Handles user's personal asset library with FIFO queue
// Max: 20 assets (photos + videos combined)

import { compressImage } from './projectManager';

const STORAGE_KEY = 'volla_library';
const MAX_ASSETS = 20;

// Lock mechanism to prevent race conditions
let isWriting = false;
const writeQueue = [];

const processQueue = async () => {
    if (isWriting || writeQueue.length === 0) return;

    isWriting = true;
    const { asset, resolve, reject } = writeQueue.shift();

    try {
        const result = await addToLibraryInternal(asset);
        resolve(result);
    } catch (err) {
        reject(err);
    } finally {
        isWriting = false;
        processQueue(); // Process next in queue
    }
};

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
// CORE: Add Asset to Library (with queue for thread safety)
// =====================================================
export const addToLibrary = (asset) => {
    return new Promise((resolve, reject) => {
        if (!asset || !asset.url) {
            reject(new Error('Invalid asset: missing url'));
            return;
        }
        writeQueue.push({ asset, resolve, reject });
        processQueue();
    });
};

// Internal function that does the actual work
const addToLibraryInternal = async (asset) => {
    // Always read fresh from localStorage
    const assets = getLibraryAssets();

    // Check for duplicate URL (prevent same image added twice)
    const urlHash = asset.url.substring(0, 100); // First 100 chars as hash
    const duplicateIndex = assets.findIndex(a => a.url.substring(0, 100) === urlHash);
    if (duplicateIndex !== -1) {
        console.log('📚 Asset already in library, skipping');
        return assets[duplicateIndex];
    }

    // Compress image if it's an image (not video)
    let processedUrl = asset.url;
    if (asset.type !== 'video' && asset.url.startsWith('data:image')) {
        try {
            processedUrl = await compressImage(asset.url, 300);
        } catch (compressErr) {
            console.warn('📚 Compression failed, using original:', compressErr);
            // Use original URL if compression fails
        }
    }

    // Create new asset
    const newAsset = {
        id: `lib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: processedUrl,
        type: asset.type || 'image',
        name: asset.name || 'Untitled',
        source: asset.source || 'upload',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: asset.metadata || {}
    };

    // FIFO: Remove oldest if at limit
    if (assets.length >= MAX_ASSETS) {
        assets.shift();
        console.log('📚 Library full, removed oldest asset');
    }

    assets.push(newAsset);

    // Save to localStorage
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
        console.log('📚 Asset saved to library, total:', assets.length);
        return newAsset;
    } catch (err) {
        if (err.name === 'QuotaExceededError') {
            // Remove oldest assets until it fits
            while (assets.length > 1) {
                assets.shift();
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
                    return newAsset;
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
