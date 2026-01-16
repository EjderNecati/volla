import React, { createContext, useContext, useState, useEffect } from 'react';
import { PLANS, getCreditCost, canAfford, deductCredits, getSubscription, saveSubscription, initializeFreeTrial } from '../utils/creditManager';
import { useAuth } from './AuthContext';

// Admin emails with unlimited credits
const ADMIN_EMAILS = [
    'dogukangokce00@gmail.com'
];

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
    const [isAdmin, setIsAdmin] = useState(false);

    // Try to get user email from auth (won't cause circular dependency since AuthProvider is parent)
    useEffect(() => {
        // Check localStorage for user email
        const checkAdmin = () => {
            try {
                const savedUser = localStorage.getItem('volla_user');
                if (savedUser) {
                    const user = JSON.parse(savedUser);
                    if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                        setIsAdmin(true);
                        console.log('👑 Admin user detected - unlimited credits enabled');
                    } else {
                        setIsAdmin(false); // Ensure isAdmin is false if user is not an admin
                    }
                } else {
                    setIsAdmin(false); // Ensure isAdmin is false if no user is saved
                }
            } catch (e) {
                console.error('Admin check failed:', e);
                setIsAdmin(false); // Default to false on error
            }
        };
        checkAdmin();
        // Re-check when storage changes
        window.addEventListener('storage', checkAdmin);
        return () => window.removeEventListener('storage', checkAdmin);
    }, []);

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
        if (isAdmin) return true; // Admin always has credits
        if (!subscription) return false;
        return canAfford(subscription.credits, feature);
    };

    // Use credits for a feature
    const useCredits = (feature) => {
        if (isAdmin) return { success: true, creditsUsed: 0, remaining: Infinity }; // Admin uses no credits

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
        credits: isAdmin ? Infinity : (subscription?.credits || 0),
        plan: isAdmin ? 'admin' : (subscription?.plan || 'free'),
        isAdmin,
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
