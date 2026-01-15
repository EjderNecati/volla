import React, { createContext, useContext, useState, useEffect } from 'react';
import { PLANS, getCreditCost, canAfford, deductCredits, getSubscription, saveSubscription, initializeFreeTrial } from '../utils/creditManager';

const CreditContext = createContext();

export const useCredits = () => {
    const context = useContext(CreditContext);
    if (!context) {
        throw new Error('useCredits must be used within a CreditProvider');
    }
    return context;
};

export const CreditProvider = ({ children }) => {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load subscription on mount
    useEffect(() => {
        const sub = getSubscription();
        if (!sub) {
            // First time user - give free trial
            const freeTrial = initializeFreeTrial();
            setSubscription(freeTrial);
        } else {
            setSubscription(sub);
        }
        setLoading(false);
    }, []);

    // Save subscription changes
    useEffect(() => {
        if (subscription) {
            saveSubscription(subscription);
        }
    }, [subscription]);

    // Check if user can afford a feature
    const checkCredits = (feature) => {
        if (!subscription) return false;
        return canAfford(subscription.credits, feature);
    };

    // Use credits for a feature
    const useCredits = (feature) => {
        if (!subscription) return { success: false, message: 'No subscription' };

        const cost = getCreditCost(feature);
        if (subscription.credits < cost) {
            return {
                success: false,
                message: `Not enough credits. Need ${cost}, have ${subscription.credits}`,
                needUpgrade: true
            };
        }

        const newCredits = deductCredits(subscription.credits, feature);
        setSubscription(prev => ({
            ...prev,
            credits: newCredits,
            creditsUsedThisMonth: (prev.creditsUsedThisMonth || 0) + cost
        }));

        return { success: true, creditsUsed: cost, remaining: newCredits };
    };

    // Upgrade plan
    const upgradePlan = (planId, billing = 'monthly') => {
        const plan = PLANS[planId];
        if (!plan) return false;

        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + (billing === 'yearly' ? 12 : 1));

        setSubscription({
            plan: planId,
            billing,
            credits: plan.credits,
            creditsUsedThisMonth: 0,
            startDate: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            price: billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
        });

        return true;
    };

    // Add credits (for purchases)
    const addCredits = (amount) => {
        setSubscription(prev => ({
            ...prev,
            credits: (prev?.credits || 0) + amount
        }));
    };

    const value = {
        subscription,
        loading,
        credits: subscription?.credits || 0,
        plan: subscription?.plan || 'free',
        checkCredits,
        useCredits,
        upgradePlan,
        addCredits,
        PLANS
    };

    return (
        <CreditContext.Provider value={value}>
            {children}
        </CreditContext.Provider>
    );
};

export default CreditContext;
