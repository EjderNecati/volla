import React from 'react';
import { X, AlertCircle, Zap, ArrowRight } from 'lucide-react';
import { useCredits } from '../contexts/CreditContext';
import { FEATURE_NAMES, getCreditCost } from '../utils/creditManager';
import { useTranslation } from '../i18n/LanguageContext';

const InsufficientCreditsModal = ({ isOpen, onClose, feature, onNavigate }) => {
    const { t } = useTranslation();
    const { credits } = useCredits();

    if (!isOpen) return null;

    const cost = getCreditCost(feature);
    const featureName = FEATURE_NAMES[feature] || feature;
    const needed = cost - credits;

    const handleUpgrade = () => {
        onClose();
        if (onNavigate) {
            onNavigate('pricing');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <AlertCircle size={24} />
                        <h2 className="text-lg font-bold">{t('credits.insufficient')}</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    <div className="bg-[#F5F4F1] rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#5C5C5C]">{t('credits.feature')}</span>
                            <span className="font-medium text-[#1A1A1A]">{featureName}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#5C5C5C]">{t('credits.required')}</span>
                            <span className="font-bold text-amber-600">{cost} {t('credits.creditsUnit')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[#5C5C5C]">{t('credits.available')}</span>
                            <span className="font-bold text-red-500">{credits} {t('credits.creditsUnit')}</span>
                        </div>
                        <div className="border-t border-[#E8E7E4] mt-3 pt-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#3C3C3C]">{t('credits.needed')}</span>
                                <span className="font-bold text-[#1A1A1A]">{needed} {t('credits.moreCredits')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleUpgrade}
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                        >
                            <Zap size={18} />
                            {t('credits.upgrade')}
                            <ArrowRight size={16} />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 text-[#5C5C5C] hover:bg-[#F5F4F1] rounded-xl font-medium transition-all"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsufficientCreditsModal;
