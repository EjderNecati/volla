import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '../../i18n';

/**
 * FeatureCard - Mod tanıtım kartı
 * Home dashboard'da her mod için gösterilir
 *
 * Props:
 * - icon: Lucide icon component
 * - mode: 'standard' | 'handsfree' | 'motion' | 'creative'
 * - gradient: Tailwind gradient class
 * - onClick: Click handler
 */

const MODE_CONFIG = {
    standard: {
        gradient: 'from-[#E06847] to-[#C85A3D]',
        bgGradient: 'from-[#E06847]/10 to-[#C85A3D]/5',
    },
    handsfree: {
        gradient: 'from-cyan-500 to-blue-500',
        bgGradient: 'from-cyan-500/10 to-blue-500/5',
    },
    motion: {
        gradient: 'from-violet-500 to-purple-500',
        bgGradient: 'from-violet-500/10 to-purple-500/5',
    },
    creative: {
        gradient: 'from-pink-500 to-rose-500',
        bgGradient: 'from-pink-500/10 to-rose-500/5',
    }
};

export default function FeatureCard({ icon: Icon, mode, onClick }) {
    const { t } = useTranslation();
    const config = MODE_CONFIG[mode] || MODE_CONFIG.standard;

    // Mode specific translations
    const title = t(`modes.${mode}`) || mode;
    const description = t(`modes.${mode}Desc`) || '';

    return (
        <button
            onClick={onClick}
            className="group relative bg-white border border-[#E8E7E4] rounded-2xl overflow-hidden hover:shadow-xl hover:border-transparent transition-all duration-300 text-left w-full flex flex-col"
        >
            {/* Header with gradient strip - always at top */}
            <div className={`h-2 w-full flex-shrink-0 bg-gradient-to-r ${config.gradient}`} />

            {/* Gradient Background on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

            {/* Content */}
            <div className="relative p-6 flex-1">
                {/* Icon + Title */}
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-[#1A1A1A] group-hover:text-[#1A1A1A]">
                            {title}
                        </h3>
                        <p className="text-sm text-[#8C8C8C]">
                            {mode === 'motion' ? 'Video' : 'Image'} Generation
                        </p>
                    </div>
                </div>

                {/* Description */}
                <p className="text-[#5C5C5C] text-sm mb-6 leading-relaxed">
                    {description}
                </p>

                {/* CTA */}
                <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                        {t('home.tryNow') || 'Try Now'}
                    </span>
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300`}>
                        <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                </div>
            </div>

            {/* Shine effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
        </button>
    );
}
