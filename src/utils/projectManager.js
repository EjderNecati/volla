// =====================================================
// PROJECT MANAGER - History & Library System
// =====================================================
// Handles project persistence, asset management, and limits
// Max: 20 projects, 200 photos total

const STORAGE_KEYS = {
    PROJECTS: 'volla_projects',
    PROJECT_COUNT: 'volla_project_count',
    ASSET_COUNT: 'volla_asset_count'
};

const LIMITS = {
    MAX_PROJECTS: 20,
    MAX_ASSETS: 200,
    MAX_ASSET_SIZE_KB: 500 // Compress images to max 500KB
};

// =====================================================
// HELPER: Compress Image
// =====================================================
export const compressImage = (base64Image, maxSizeKB = LIMITS.MAX_ASSET_SIZE_KB) => {
    return new Promise((resolve) => {
        // If already small enough, return as-is
        const sizeKB = (base64Image.length * 3) / 4 / 1024;
        if (sizeKB <= maxSizeKB) {
            resolve(base64Image);
            return;
        }

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');

            // Calculate new dimensions (max 800px on longest side)
            let width = img.width;
            let height = img.height;
            const maxDim = 800;

            if (width > height && width > maxDim) {
                height = (height / width) * maxDim;
                width = maxDim;
            } else if (height > maxDim) {
                width = (width / height) * maxDim;
                height = maxDim;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compress with quality reduction
            let quality = 0.7;
            let result = canvas.toDataURL('image/jpeg', quality);

            // Further reduce quality if still too large
            while ((result.length * 3) / 4 / 1024 > maxSizeKB && quality > 0.3) {
                quality -= 0.1;
                result = canvas.toDataURL('image/jpeg', quality);
            }

            resolve(result);
        };

        img.onerror = () => resolve(base64Image); // Return original on error
        img.src = base64Image;
    });
};

// =====================================================
// CORE: Get All Projects
// =====================================================
export const getProjects = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error('Failed to load projects:', err);
        return [];
    }
};

// =====================================================
// CORE: Get Single Project
// =====================================================
export const getProject = (projectId) => {
    const projects = getProjects();
    return projects.find(p => p.id === projectId) || null;
};

// =====================================================
// CORE: Save Project (Create or Update)
// =====================================================
export const saveProject = async (project) => {
    if (!project || !project.id) {
        throw new Error('Invalid project: missing id');
    }

    const projects = getProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);

    // Check limits for new projects
    if (existingIndex === -1 && projects.length >= LIMITS.MAX_PROJECTS) {
        // Auto-delete oldest project to make room
        console.log('⚠️ Project limit reached, removing oldest project');
        const oldestProject = projects[projects.length - 1];
        deleteProject(oldestProject.id);
        // Reload projects after deletion
        const updatedProjects = getProjects();
        projects.length = 0;
        projects.push(...updatedProjects);
    }

    // Check asset limits - more lenient, just warn
    const totalAssets = projects.reduce((sum, p) => {
        if (p.id === project.id) return sum;
        return sum + (p.assets?.length || 0);
    }, 0);

    const newProjectAssets = project.assets?.length || 0;
    if (totalAssets + newProjectAssets > LIMITS.MAX_ASSETS) {
        console.log('⚠️ Photo limit approaching, removing oldest project');
        // Remove oldest project to free space
        const oldestProject = projects[projects.length - 1];
        if (oldestProject && oldestProject.id !== project.id) {
            deleteProject(oldestProject.id);
        }
    }

    // Compress all images in assets with aggressive compression for storage
    if (project.assets && project.assets.length > 0) {
        project.assets = await Promise.all(
            project.assets.map(async (asset) => ({
                ...asset,
                url: asset.url ? await compressImage(asset.url, 300) : null // More aggressive: 300KB max
            }))
        );
    }

    // Compress original image aggressively
    if (project.originalImage) {
        project.originalImage = await compressImage(project.originalImage, 200); // 200KB max
    }

    // Update or add project
    project.updatedAt = Date.now();

    if (existingIndex !== -1) {
        projects[existingIndex] = project;
    } else {
        project.createdAt = project.createdAt || Date.now();
        projects.unshift(project);
    }

    // Save to localStorage with fallback
    const saveAttempt = (projectsList) => {
        try {
            const data = JSON.stringify(projectsList);
            localStorage.setItem(STORAGE_KEYS.PROJECTS, data);
            updateCounts();
            return true;
        } catch (err) {
            // Check for quota exceeded (different browsers use different error names)
            if (err.name === 'QuotaExceededError' ||
                err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                err.message?.includes('quota') ||
                err.message?.includes('storage')) {
                return false;
            }
            throw err;
        }
    };

    // First attempt
    if (saveAttempt(projects)) {
        return project;
    }

    // If failed, try removing oldest projects until it works
    console.log('⚠️ Storage full, removing old projects to make space...');
    while (projects.length > 1) {
        const removed = projects.pop(); // Remove oldest
        console.log(`🗑️ Removed project ${removed.id} to free space`);

        if (saveAttempt(projects)) {
            console.log('✅ Save succeeded after cleanup');
            return project;
        }
    }

    // Last resort: clear all and save just this one
    console.log('⚠️ Clearing all old projects to save current');
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    if (saveAttempt([project])) {
        return project;
    }

    throw new Error('Storage full. Could not save project.');
};

// =====================================================
// CORE: Delete Project
// =====================================================
export const deleteProject = (projectId) => {
    const projects = getProjects();
    const updated = projects.filter(p => p.id !== projectId);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
    updateCounts();
    return true;
};

// =====================================================
// CORE: Delete All Projects
// =====================================================
export const deleteAllProjects = () => {
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    updateCounts();
    return true;
};

// =====================================================
// CORE: Add Asset to Project
// =====================================================
export const addAssetToProject = async (projectId, asset) => {
    const project = getProject(projectId);
    if (!project) {
        throw new Error('Project not found');
    }

    // Check if asset already exists
    const existingAsset = project.assets?.find(a => a.id === asset.id);
    if (existingAsset) {
        // Update existing asset
        project.assets = project.assets.map(a =>
            a.id === asset.id ? { ...a, ...asset } : a
        );
    } else {
        // Add new asset
        project.assets = project.assets || [];
        project.assets.push({
            ...asset,
            url: await compressImage(asset.url)
        });
    }

    return saveProject(project);
};

// =====================================================
// HELPERS: Counts & Limits
// =====================================================
const updateCounts = () => {
    const projects = getProjects();
    const projectCount = projects.length;
    const assetCount = projects.reduce((sum, p) => sum + (p.assets?.length || 0), 0);

    localStorage.setItem(STORAGE_KEYS.PROJECT_COUNT, String(projectCount));
    localStorage.setItem(STORAGE_KEYS.ASSET_COUNT, String(assetCount));
};

export const getProjectCount = () => {
    const projects = getProjects();
    return projects.length;
};

export const getAssetCount = () => {
    const projects = getProjects();
    return projects.reduce((sum, p) => sum + (p.assets?.length || 0), 0);
};

export const canAddProject = () => {
    return getProjectCount() < LIMITS.MAX_PROJECTS;
};

export const canAddAssets = (count = 1) => {
    return getAssetCount() + count <= LIMITS.MAX_ASSETS;
};

export const getStorageUsage = () => {
    return {
        projects: getProjectCount(),
        maxProjects: LIMITS.MAX_PROJECTS,
        assets: getAssetCount(),
        maxAssets: LIMITS.MAX_ASSETS,
        projectsPercent: Math.round((getProjectCount() / LIMITS.MAX_PROJECTS) * 100),
        assetsPercent: Math.round((getAssetCount() / LIMITS.MAX_ASSETS) * 100)
    };
};

// =====================================================
// HELPER: Create New Project
// =====================================================
export const createProject = (title, marketplace, originalImage, assets = [], seoResults = null, productInfo = null) => {
    return {
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: title || 'Untitled Project',
        marketplace: marketplace || 'etsy',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        originalImage,
        seoResults,
        assets,
        productInfo
    };
};

// =====================================================
// MIGRATION: Convert old history format to new
// =====================================================
export const migrateOldHistory = () => {
    try {
        const oldHistory = localStorage.getItem('volla_history');
        if (!oldHistory) return;

        const oldItems = JSON.parse(oldHistory);
        if (!Array.isArray(oldItems) || oldItems.length === 0) return;

        // Check if already migrated
        const projects = getProjects();
        if (projects.length > 0) return;

        // Convert old items to new format
        const newProjects = oldItems.slice(0, LIMITS.MAX_PROJECTS).map((item, index) => ({
            id: item.id || `migrated_${Date.now()}_${index}`,
            title: item.title || 'Migrated Project',
            marketplace: item.marketplace || 'etsy',
            createdAt: item.timestamp || Date.now(),
            updatedAt: item.timestamp || Date.now(),
            originalImage: item.imageUrl,
            seoResults: item.results || null,
            assets: [
                {
                    id: `asset_original_${index}`,
                    type: 'ORIGINAL',
                    url: item.imageUrl,
                    label: 'Upload'
                }
            ],
            productInfo: null
        }));

        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(newProjects));
        localStorage.removeItem('volla_history'); // Remove old format
        updateCounts();

        console.log(`✅ Migrated ${newProjects.length} old history items to new project format`);
    } catch (err) {
        console.error('Migration failed:', err);
    }
};

// Auto-migrate on module load
migrateOldHistory();
