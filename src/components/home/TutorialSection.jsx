import React, { useState } from 'react';
import { Upload, Wand2, Download, Sparkles, Zap, Video, Palette, Camera, Settings, Play, Image, FileText, Brush } from 'lucide-react';
import { useTranslation } from '../../i18n';

/**
 * TutorialSection - 4 mod için "Nasıl Kullanılır" section
 * Her mod için ayrı adımlar ve renkler
 */

const MODE_TABS = [
    {
        id: 'standard',
        icon: Sparkles,
        gradient: 'from-[#E06847] to-[#C85A3D]',
        bgGradient: 'from-[#E06847]/10 to-[#C85A3D]/5',
    },
    {
        id: 'handsfree',
        icon: Zap,
        gradient: 'from-cyan-500 to-blue-500',
        bgGradient: 'from-cyan-500/10 to-blue-500/5',
    },
    {
        id: 'motion',
        icon: Video,
        gradient: 'from-violet-500 to-purple-500',
        bgGradient: 'from-violet-500/10 to-purple-500/5',
    },
    {
        id: 'creative',
        icon: Palette,
        gradient: 'from-pink-500 to-rose-500',
        bgGradient: 'from-pink-500/10 to-rose-500/5',
    }
];

// Mode-specific tutorial steps
const MODE_TUTORIALS = {
    standard: {
        steps: [
            { icon: Upload, titleKey: 'home.tutorial.standard.step1Title', descKey: 'home.tutorial.standard.step1Desc', color: 'from-[#E06847] to-[#C85A3D]' },
            { icon: Settings, titleKey: 'home.tutorial.standard.step2Title', descKey: 'home.tutorial.standard.step2Desc', color: 'from-violet-500 to-purple-500' },
            { icon: Download, titleKey: 'home.tutorial.standard.step3Title', descKey: 'home.tutorial.standard.step3Desc', color: 'from-emerald-500 to-teal-500' }
        ]
    },
    handsfree: {
        steps: [
            { icon: Upload, titleKey: 'home.tutorial.handsfree.step1Title', descKey: 'home.tutorial.handsfree.step1Desc', color: 'from-cyan-500 to-blue-500' },
            { icon: Camera, titleKey: 'home.tutorial.handsfree.step2Title', descKey: 'home.tutorial.handsfree.step2Desc', color: 'from-violet-500 to-purple-500' },
            { icon: FileText, titleKey: 'home.tutorial.handsfree.step3Title', descKey: 'home.tutorial.handsfree.step3Desc', color: 'from-emerald-500 to-teal-500' }
        ]
    },
    motion: {
        steps: [
            { icon: Image, titleKey: 'home.tutorial.motion.step1Title', descKey: 'home.tutorial.motion.step1Desc', color: 'from-violet-500 to-purple-500' },
            { icon: Settings, titleKey: 'home.tutorial.motion.step2Title', descKey: 'home.tutorial.motion.step2Desc', color: 'from-cyan-500 to-blue-500' },
            { icon: Play, titleKey: 'home.tutorial.motion.step3Title', descKey: 'home.tutorial.motion.step3Desc', color: 'from-emerald-500 to-teal-500' }
        ]
    },
    creative: {
        steps: [
            { icon: Upload, titleKey: 'home.tutorial.creative.step1Title', descKey: 'home.tutorial.creative.step1Desc', color: 'from-pink-500 to-rose-500' },
            { icon: Brush, titleKey: 'home.tutorial.creative.step2Title', descKey: 'home.tutorial.creative.step2Desc', color: 'from-violet-500 to-purple-500' },
            { icon: Download, titleKey: 'home.tutorial.creative.step3Title', descKey: 'home.tutorial.creative.step3Desc', color: 'from-emerald-500 to-teal-500' }
        ]
    }
};

export default function TutorialSection() {
    const { t } = useTranslation();
    const [activeMode, setActiveMode] = useState('standard');

    const currentTutorial = MODE_TUTORIALS[activeMode];
    const activeTab = MODE_TABS.find(tab => tab.id === activeMode);

    return (
        <section className="mb-10">
            <h2 className="text-sm font-semibold text-[#8C8C8C] uppercase tracking-wider mb-6">
                {t('home.howToUse') || 'How to Use'}
            </h2>

            <div className="bg-white border border-[#E8E7E4] rounded-2xl overflow-hidden">
                {/* Mode Tabs */}
                <div className="flex border-b border-[#E8E7E4]">
                    {MODE_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeMode === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveMode(tab.id)}
                                className={`
                                    flex-1 flex items-center justify-center gap-2 py-4 px-3 transition-all duration-300
                                    ${isActive
                                        ? `bg-gradient-to-r ${tab.gradient} text-white`
                                        : 'text-[#5C5C5C] hover:bg-[#F5F4F1]'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium text-sm hidden sm:inline">
                                    {t(`modes.${tab.id}`) || tab.id}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tutorial Content */}
                <div className={`p-8 bg-gradient-to-br ${activeTab.bgGradient}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {currentTutorial.steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div key={index} className="relative text-center group">
                                    {/* Connector Line (between steps) */}
                                    {index < currentTutorial.steps.length - 1 && (
                                        <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#E8E7E4] to-transparent" />
                                    )}

                                    {/* Step Number + Icon */}
                                    <div className="relative inline-flex mb-4">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-8 h-8 text-white" />
                                        </div>
                                        {/* Step number badge */}
                                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#1A1A1A] text-white text-xs font-bold flex items-center justify-center shadow-md">
                                            {index + 1}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                                        {t(step.titleKey) || `Step ${index + 1}`}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-sm text-[#5C5C5C] max-w-[220px] mx-auto">
                                        {t(step.descKey) || 'Description'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
