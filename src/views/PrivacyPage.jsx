import React from 'react';
import { ArrowLeft, Shield, Lock, Globe, Database, Eye, Mail, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n';

/**
 * PrivacyPage - GDPR/KVKK/CCPA Compliant Privacy Policy
 * Matches the professional design of the landing page
 */
export default function PrivacyPage({ onNavigate }) {
    const { t } = useTranslation();

    const sections = [
        { key: 'dataCollection', icon: Database },
        { key: 'dataUsage', icon: Eye },
        { key: 'imageProcessing', icon: Sparkles },
        { key: 'cookies', icon: Globe },
        { key: 'gdpr', icon: Shield },
        { key: 'kvkk', icon: Shield },
        { key: 'ccpa', icon: Shield },
        { key: 'thirdParties', icon: Lock },
        { key: 'security', icon: Lock },
        { key: 'contact', icon: Mail }
    ];

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-poppins">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => onNavigate?.('landing')}
                        className="flex items-center gap-2 text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#F1641E] to-[#FF9900] rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-[#1A1A1A]">VOLLA</span>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <header className="py-16 px-6 bg-gradient-to-b from-white to-[#FAFAFA]">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F1641E]/10 rounded-2xl mb-6">
                        <Shield size={32} className="text-[#F1641E]" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
                        {t('privacy.title')}
                    </h1>
                    <p className="text-[#5C5C5C]">
                        {t('privacy.lastUpdated')}: January 11, 2026
                    </p>
                </div>
            </header>

            {/* Content */}
            <main className="pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Introduction */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
                        <p className="text-lg text-[#5C5C5C] leading-relaxed">
                            {t('privacy.intro')}
                        </p>
                    </div>

                    {/* Sections */}
                    <div className="space-y-6">
                        {sections.map((section, index) => {
                            const Icon = section.icon;
                            return (
                                <div
                                    key={section.key}
                                    className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-[#F5F4F1] rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Icon size={24} className="text-[#F1641E]" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-[#1A1A1A] mb-3">
                                                {t(`privacy.sections.${section.key}.title`)}
                                            </h2>
                                            <p className="text-[#5C5C5C] leading-relaxed whitespace-pre-line">
                                                {t(`privacy.sections.${section.key}.content`)}
                                            </p>
                                            {section.key === 'contact' && (
                                                <a
                                                    href="mailto:privacy@volla.app"
                                                    className="inline-flex items-center gap-2 mt-4 text-[#F1641E] font-medium hover:underline"
                                                >
                                                    <Mail size={16} />
                                                    privacy@volla.app
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 px-6 bg-white border-t border-gray-100">
                <div className="max-w-4xl mx-auto text-center text-[#8C8C8C] text-sm">
                    © 2026 Volla. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
