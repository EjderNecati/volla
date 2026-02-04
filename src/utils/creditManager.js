// Credit System Configuration

// Plans with pricing (prices shown as "discounted" from fake higher price)
// Note: features use i18n keys like 'plans.feature.credits100' etc.
export const PLANS = {
    free: {
        id: 'free',
        name: 'Free Trial',
        credits: 20,
        monthlyPrice: 0,
        yearlyPrice: 0,
        fakePrice: 0,
        priority: 'standard',
        featureKeys: ['plans.feature.credits20', 'plans.feature.allFeatures', 'plans.feature.standardQueue']
    },
    starter: {
        id: 'starter',
        name: 'Starter',
        credits: 100,
        monthlyPrice: 9,
        yearlyPrice: 84,
        fakePrice: 18,
        priority: 'standard',
        featureKeys: ['plans.feature.credits100', 'plans.feature.allFeatures', 'plans.feature.standardQueue']
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        credits: 400,
        monthlyPrice: 29,
        yearlyPrice: 276,
        fakePrice: 58,
        popular: true,
        priority: 'priority',
        featureKeys: ['plans.feature.credits400', 'plans.feature.allFeatures', 'plans.feature.priorityQueue']
    },
    business: {
        id: 'business',
        name: 'Business',
        credits: 1200,
        monthlyPrice: 79,
        yearlyPrice: 756,
        fakePrice: 158,
        priority: 'high',
        featureKeys: ['plans.feature.credits1200', 'plans.feature.allFeatures', 'plans.feature.highPriorityQueue']
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        credits: null,
        monthlyPrice: null,
        yearlyPrice: null,
        fakePrice: null,
        priority: 'top',
        isEnterprise: true,
        featureKeys: ['plans.feature.unlimitedCredits', 'plans.feature.topPriorityQueue', 'plans.feature.dedicatedManager', 'plans.feature.customOnboarding']
    }
};

// Credit costs per feature (NEW: per-photo pricing)
export const CREDIT_COSTS = {
    // NEW: Per-unit costs
    photo_generation: 2,      // 2 credits per photo generated
    seo_analysis: 1,          // 1 credit for SEO (when marketplace selected)
    canvas_shots: 6,          // Fixed 6 credits for Shots button on canvas (3 outputs)

    // Legacy costs (for backward compatibility)
    seo_content: 2,
    studio_shot: 5,           // Deprecated - use photo_generation * count
    real_life: 5,             // Deprecated - use photo_generation * count
    handsfree: 8,             // Keep existing handsfree cost

    // Motion (Video Generation) costs
    motion_fast: 10,          // 10 credits for Fast mode (veo-3.1-fast-generate-001)
    motion_pro: 20,           // 20 credits for Pro mode (veo-3.1-generate-001)

    // Creative Studio costs
    creative_studio: 2        // 2 credits per promotional image (same as photo_generation)
};

// NEW: Calculate generation cost dynamically
export const calculateGenerationCost = (outputCount, hasMarketplace, isCanvasShots = false) => {
    if (isCanvasShots) {
        return CREDIT_COSTS.canvas_shots; // Fixed 6 credits
    }
    const photoCost = outputCount * CREDIT_COSTS.photo_generation;
    const seoCost = hasMarketplace ? CREDIT_COSTS.seo_analysis : 0;
    return photoCost + seoCost;
};

// Get credit cost for a feature
export const getCreditCost = (feature) => {
    return CREDIT_COSTS[feature] || 0;
};

// NEW: Check if user can afford generation
export const canAffordGeneration = (currentCredits, outputCount, hasMarketplace, isCanvasShots = false) => {
    const cost = calculateGenerationCost(outputCount, hasMarketplace, isCanvasShots);
    return currentCredits >= cost;
};

// Check if user can afford a feature (legacy)
export const canAfford = (currentCredits, feature) => {
    const cost = getCreditCost(feature);
    return currentCredits >= cost;
};

// NEW: Deduct generation credits
export const deductGenerationCredits = (currentCredits, outputCount, hasMarketplace, isCanvasShots = false) => {
    const cost = calculateGenerationCost(outputCount, hasMarketplace, isCanvasShots);
    return Math.max(0, currentCredits - cost);
};

// Deduct credits (legacy)
export const deductCredits = (currentCredits, feature) => {
    const cost = getCreditCost(feature);
    return Math.max(0, currentCredits - cost);
};

// LocalStorage key
const STORAGE_KEY = 'volla_subscription';

// Get subscription from localStorage
export const getSubscription = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

// Save subscription to localStorage
export const saveSubscription = (subscription) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
    } catch (e) {
        console.error('Failed to save subscription:', e);
    }
};

// Initialize free trial
export const initializeFreeTrial = () => {
    const now = new Date();
    const subscription = {
        plan: 'free',
        billing: 'none',
        credits: PLANS.free.credits,
        creditsUsedThisMonth: 0,
        startDate: now.toISOString(),
        expiresAt: null, // No expiry for free trial credits
        isTrialUsed: true
    };
    saveSubscription(subscription);
    return subscription;
};

// Feature name mapping for display
export const FEATURE_NAMES = {
    seo_analysis: 'SEO Analysis',
    seo_content: 'SEO Content Generation',
    studio_shot: 'Studio Shot',
    real_life: 'Real Life Shot',
    handsfree: 'Handsfree Generation',
    motion_fast: 'Motion Video (Fast)',
    motion_pro: 'Motion Video (Pro)'
};

// Retention offer (20% extra discount)
export const RETENTION_DISCOUNT = 0.20;

// Calculate retention price
export const getRetentionPrice = (plan, billing = 'monthly') => {
    const basePrice = billing === 'yearly'
        ? PLANS[plan].yearlyPrice / 12
        : PLANS[plan].monthlyPrice;
    return (basePrice * (1 - RETENTION_DISCOUNT)).toFixed(2);
};
