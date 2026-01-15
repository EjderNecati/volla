import React from 'react';
import { ArrowLeft, FileText, AlertTriangle, Shield, Cpu, UserCheck, CreditCard, Scale, XCircle, RefreshCcw, Mail, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n';

/**
 * TermsPage - Terms of Service with AI Disclaimer and Content Policy
 * Matches the professional design of the landing page
 */
export default function TermsPage({ onNavigate }) {
    const { t } = useTranslation();

    const sections = [
        { key: 'aiDisclaimer', icon: Cpu, highlight: true },
        { key: 'acceptableUse', icon: UserCheck, highlight: true },
        { key: 'contentPolicy', icon: Shield, highlight: true },
        { key: 'intellectualProperty', icon: FileText },
        { key: 'accountResponsibility', icon: UserCheck },
        { key: 'payments', icon: CreditCard },
        { key: 'limitation', icon: Scale },
        { key: 'termination', icon: XCircle },
        { key: 'changes', icon: RefreshCcw },
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
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1A1A1A] rounded-2xl mb-6">
                        <FileText size={32} className="text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
                        {t('terms.title')}
                    </h1>
                    <p className="text-[#5C5C5C]">
                        {t('terms.lastUpdated')}: January 11, 2026
                    </p>
                </div>
            </header>

            {/* Content */}
            <main className="pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Introduction */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
                        <p className="text-lg text-[#5C5C5C] leading-relaxed">
                            {t('terms.intro')}
                        </p>
                    </div>

                    {/* Important Notice Banner */}
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-800 mb-1">Important Notice</h3>
                            <p className="text-amber-700 text-sm">
                                This platform uses AI technology (Google Gemini, Vertex AI) which may produce inaccurate results.
                                Please review all generated content before use. We do not guarantee specific sales outcomes.
                            </p>
                        </div>
                    </div>

                    {/* Sections */}
                    <div className="space-y-6">
                        {sections.map((section, index) => {
                            const Icon = section.icon;
                            return (
                                <div
                                    key={section.key}
                                    className={`rounded-2xl border-2 p-8 hover:shadow-lg transition-shadow ${section.highlight
                                            ? 'bg-[#1A1A1A] border-[#1A1A1A]'
                                            : 'bg-white border-gray-100'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${section.highlight ? 'bg-white/10' : 'bg-[#F5F4F1]'
                                            }`}>
                                            <Icon size={24} className={section.highlight ? 'text-white' : 'text-[#F1641E]'} />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className={`text-xl font-bold mb-3 ${section.highlight ? 'text-white' : 'text-[#1A1A1A]'
                                                }`}>
                                                {t(`terms.sections.${section.key}.title`)}
                                            </h2>
                                            <p className={`leading-relaxed whitespace-pre-line ${section.highlight ? 'text-gray-300' : 'text-[#5C5C5C]'
                                                }`}>
                                                {t(`terms.sections.${section.key}.content`)}
                                            </p>
                                            {section.key === 'contact' && (
                                                <a
                                                    href="mailto:legal@volla.app"
                                                    className="inline-flex items-center gap-2 mt-4 text-[#F1641E] font-medium hover:underline"
                                                >
                                                    <Mail size={16} />
                                                    legal@volla.app
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
