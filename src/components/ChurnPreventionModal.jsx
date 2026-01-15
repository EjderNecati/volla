import React, { useState } from 'react';
import { X, AlertTriangle, Gift, Heart, Zap } from 'lucide-react';
import { useCredits } from '../contexts/CreditContext';
import { getRetentionPrice, PLANS } from '../utils/creditManager';
import { useTranslation } from '../i18n/LanguageContext';

const ChurnPreventionModal = ({ isOpen, onClose, onStay, onConfirmCancel }) => {
    const { t } = useTranslation();
    const { plan, subscription } = useCredits();
    const [step, setStep] = useState(1);

    if (!isOpen) return null;

    const currentPlan = PLANS[plan];
    const retentionPrice = getRetentionPrice(plan, subscription?.billing);

    const handleStayWithDiscount = () => {
        onStay && onStay();
        onClose();
    };

    const handleConfirmCancel = () => {
        setStep(2);
    };

    const handleFinalCancel = () => {
        onConfirmCancel && onConfirmCancel();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
                {step === 1 ? (
                    <>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-coral-500 to-red-500 p-6 text-white relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle size={28} />
                                <h2 className="text-xl font-bold">{t('churn.waitTitle') || 'Wait! Don\'t Go!'}</h2>
                            </div>
                            <p className="text-white/90 text-sm">
                                {t('churn.waitSubtitle') || 'We have a special offer just for you'}
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Special Offer */}
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Gift size={20} className="text-emerald-600" />
                                    <span className="font-bold text-emerald-700">
                                        {t('churn.exclusiveOffer') || 'Exclusive Offer'}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-emerald-600">${retentionPrice}</span>
                                    <span className="text-sm text-[#5C5C5C]">/month</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-red-500 line-through">
                                        ${currentPlan?.monthlyPrice}/mo
                                    </span>
                                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded">
                                        EXTRA 20% OFF
                                    </span>
                                </div>
                                <p className="text-sm text-emerald-600 mt-2">
                                    {t('churn.keepCredits') || 'Keep all your credits and features!'}
                                </p>
                            </div>

                            {/* Benefits reminder */}
                            <div className="mb-6">
                                <p className="text-sm font-medium text-[#3C3C3C] mb-3">
                                    {t('churn.youWillLose') || 'If you cancel, you\'ll lose:'}
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-[#5C5C5C]">
                                        <Zap size={16} className="text-amber-500" />
                                        {currentPlan?.credits} {t('churn.monthlyCredits') || 'monthly credits'}
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-[#5C5C5C]">
                                        <Heart size={16} className="text-red-400" />
                                        {t('churn.premiumFeatures') || 'All premium features'}
                                    </li>
                                </ul>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleStayWithDiscount}
                                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                                >
                                    <Gift size={18} />
                                    {t('churn.stayWithDiscount') || 'Stay & Get 20% Off'}
                                </button>
                                <button
                                    onClick={handleConfirmCancel}
                                    className="w-full py-3 bg-[#F5F4F1] hover:bg-[#E8E7E4] text-[#5C5C5C] rounded-xl font-medium transition-all"
                                >
                                    {t('churn.continueCancel') || 'Continue to Cancel'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Final confirmation */}
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">
                                {t('churn.confirmTitle') || 'Are you sure?'}
                            </h3>
                            <p className="text-sm text-[#5C5C5C] mb-6">
                                {t('churn.confirmMessage') || 'Your subscription will end at the current billing period. You won\'t be charged again.'}
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-xl font-semibold transition-all"
                                >
                                    {t('churn.keepSubscription') || 'Keep My Subscription'}
                                </button>
                                <button
                                    onClick={handleFinalCancel}
                                    className="w-full py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-all"
                                >
                                    {t('churn.confirmCancel') || 'Yes, Cancel Subscription'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChurnPreventionModal;
