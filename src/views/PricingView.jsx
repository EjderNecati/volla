import React, { useState, useEffect } from 'react';
import { Check, Zap, ArrowLeft, Crown, Sparkles, Star, Rocket, Building2, Mail, Loader2 } from 'lucide-react';
import { useCredits } from '../contexts/CreditContext';
import { CREDIT_COSTS, FEATURE_NAMES } from '../utils/creditManager';
import { useTranslation } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { buildCheckoutUrl } from '../config/lemonsqueezy';

const PricingView = ({ onBack }) => {
    const { t } = useTranslation();
    const { plan: currentPlan, credits, upgradePlan, PLANS } = useCredits();
    const { user, isAuthenticated } = useAuth();
    const [billing, setBilling] = useState('monthly');
    const [loadingPlan, setLoadingPlan] = useState(null);

    // Reset loading state when user returns to page (browser back button)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setLoadingPlan(null);
            }
        };

        const handlePageShow = (event) => {
            if (event.persisted) {
                setLoadingPlan(null);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pageshow', handlePageShow);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, []);

    const planOrder = ['starter', 'pro', 'business', 'enterprise'];

    const getPrice = (planId) => {
        const plan = PLANS[planId];
        if (billing === 'yearly') {
            return (plan.yearlyPrice / 12).toFixed(0);
        }
        return plan.monthlyPrice;
    };

    // Handle checkout - redirect to LemonSqueezy
    const handleCheckout = async (planId) => {
        setLoadingPlan(planId);

        try {
            // Build checkout URL with user email if logged in
            const checkoutUrl = buildCheckoutUrl(planId, user?.email);

            if (!checkoutUrl) {
                console.error('Invalid plan:', planId);
                setLoadingPlan(null);
                return;
            }

            // Redirect to LemonSqueezy checkout
            window.location.href = checkoutUrl;

        } catch (error) {
            console.error('Checkout error:', error);
            setLoadingPlan(null);
        }
    };

    // Legacy handler for demo mode (just updates local state)
    const handleSelectPlan = (planId) => {
        handleCheckout(planId);
    };

    return (
        <div className="min-h-screen bg-[#F5F4F1]">
            {/* Header */}
            <div className="bg-white border-b border-[#E8E7E4] px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-[#F5F4F1] rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-[#1A1A1A]">
                            {t('pricing.title')}
                        </h1>
                        <p className="text-sm text-[#5C5C5C]">
                            {t('pricing.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Current Status */}
                <div className="bg-white rounded-2xl p-4 mb-6 flex items-center justify-between border border-[#E8E7E4]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Zap size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-[#5C5C5C]">{t('pricing.currentPlan')}</p>
                            <p className="font-bold text-[#1A1A1A] capitalize">{PLANS[currentPlan]?.name || 'Free Trial'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-[#5C5C5C]">{t('pricing.credits')}</p>
                        <p className="font-bold text-2xl text-emerald-600">{credits}</p>
                    </div>
                </div>

                {/* Motivational Slogan */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-full">
                        <Rocket size={20} />
                        <span className="font-semibold">{t('pricing.slogan')}</span>
                    </div>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-xl p-1 flex gap-1 border border-[#E8E7E4]">
                        <button
                            onClick={() => setBilling('monthly')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billing === 'monthly'
                                ? 'bg-[#1A1A1A] text-white'
                                : 'text-[#5C5C5C] hover:bg-[#F5F4F1]'
                                }`}
                        >
                            {t('pricing.monthly')}
                        </button>
                        <button
                            onClick={() => setBilling('yearly')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billing === 'yearly'
                                ? 'bg-[#1A1A1A] text-white'
                                : 'text-[#5C5C5C] hover:bg-[#F5F4F1]'
                                }`}
                        >
                            {t('pricing.yearly')}
                            <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                                -20%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Plans Grid - 4 columns for 4 plans */}
                <div className="grid md:grid-cols-4 gap-4 mb-12">
                    {planOrder.map((planId) => {
                        const plan = PLANS[planId];
                        const isPopular = plan.popular;
                        const isCurrent = currentPlan === planId;
                        const price = getPrice(planId);

                        return (
                            <div
                                key={planId}
                                className={`relative bg-white rounded-2xl border-2 transition-all flex flex-col ${isPopular
                                    ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                                    : 'border-[#E8E7E4] hover:border-[#CFCECA]'
                                    }`}
                            >
                                {/* Popular Badge - top right corner */}
                                {isPopular && (
                                    <div className="absolute top-3 right-3">
                                        <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                            POPULAR
                                        </div>
                                    </div>
                                )}

                                <div className="p-5 flex flex-col flex-1">
                                    {/* Plan Header */}
                                    <div className="flex items-center gap-2 mb-2">
                                        {planId === 'enterprise' && <Building2 size={20} className="text-purple-500" />}
                                        {planId === 'business' && <Crown size={20} className="text-amber-500" />}
                                        {planId === 'pro' && <Sparkles size={20} className="text-emerald-500" />}
                                        <h3 className="text-lg font-bold text-[#1A1A1A]">{plan.name}</h3>
                                    </div>

                                    {/* Pricing - special for Enterprise */}
                                    <div className="mb-4">
                                        {plan.isEnterprise ? (
                                            <>
                                                <div className="text-2xl font-bold text-[#1A1A1A]">Custom</div>
                                                <p className="text-sm text-[#5C5C5C] mt-1">Tailored for your needs</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-bold text-[#1A1A1A]">${price}</span>
                                                    <span className="text-sm text-[#5C5C5C]">/mo</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-sm text-red-500 line-through">${plan.fakePrice}/mo</span>
                                                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded">
                                                        50% OFF
                                                    </span>
                                                </div>
                                                {billing === 'yearly' && (
                                                    <p className="text-xs text-emerald-600 mt-1">
                                                        ${plan.yearlyPrice} {t('pricing.billedYearly')}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Credits - special for Enterprise */}
                                    <div className="bg-[#F5F4F1] rounded-xl p-3 mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-[#5C5C5C]">{t('pricing.monthlyCredits')}</span>
                                            <span className="font-bold text-emerald-600">
                                                {plan.isEnterprise ? t('pricing.unlimited') : plan.credits}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Features - flex-1 to push button to bottom */}
                                    <ul className="space-y-2 mb-4 flex-1">
                                        {plan.featureKeys?.map((featureKey, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-[#3C3C3C]">
                                                <Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                                <span>{t(featureKey)}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button - Contact Us for Enterprise */}
                                    {plan.isEnterprise ? (
                                        <a
                                            href="mailto:contact@volla.app?subject=Enterprise%20Plan%20Inquiry"
                                            className="w-full py-3 rounded-xl font-semibold transition-all mt-auto bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
                                        >
                                            <Mail size={16} />
                                            {t('pricing.contactUs')}
                                        </a>
                                    ) : (
                                        <button
                                            onClick={() => handleSelectPlan(planId)}
                                            disabled={isCurrent || loadingPlan !== null}
                                            className={`w-full py-3 rounded-xl font-semibold transition-all mt-auto flex items-center justify-center gap-2 ${isCurrent
                                                ? 'bg-[#E8E7E4] text-[#8C8C8C] cursor-not-allowed'
                                                : loadingPlan === planId
                                                    ? 'bg-[#1A1A1A] text-white opacity-75 cursor-wait'
                                                    : isPopular
                                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                        : 'bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white'
                                                }`}
                                        >
                                            {loadingPlan === planId ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    {t('common.loading') || 'Loading...'}
                                                </>
                                            ) : (
                                                isCurrent ? t('pricing.currentPlan') : t('pricing.selectPlan')
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Credit Costs Table */}
                <div className="bg-white rounded-2xl border border-[#E8E7E4] p-6">
                    <h3 className="text-lg font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                        <Zap size={20} className="text-emerald-500" />
                        {t('pricing.creditCosts')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(CREDIT_COSTS).map(([key, cost]) => (
                            <div key={key} className="bg-[#F5F4F1] rounded-xl p-3">
                                <p className="text-sm text-[#5C5C5C]">{FEATURE_NAMES[key]}</p>
                                <p className="text-lg font-bold text-[#1A1A1A]">
                                    {cost === 0 ? (
                                        <span className="text-emerald-600">{t('pricing.free')}</span>
                                    ) : (
                                        <>{cost} {t('credits.creditsUnit')}</>
                                    )}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingView;
