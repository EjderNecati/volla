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

// Credit costs per feature
export const CREDIT_COSTS = {
    seo_analysis: 1,
    seo_content: 2,
    studio_shot: 5,
    real_life: 5,
    handsfree: 8
};

// Get credit cost for a feature
export const getCreditCost = (feature) => {
    return CREDIT_COSTS[feature] || 0;
};

// Check if user can afford a feature
export const canAfford = (currentCredits, feature) => {
    const cost = getCreditCost(feature);
    return currentCredits >= cost;
};

// Deduct credits
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
    handsfree: 'Handsfree Generation'
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
