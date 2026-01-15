import React, { useState, useEffect, useRef } from 'react';
import {
    Sparkles, ArrowRight, Check, Play, Upload, Zap, Camera,
    Users, Tag, DollarSign, Globe, Palette, Image as ImageIcon,
    ChevronRight, Star, Store, ShoppingBag, ShoppingCart,
    MousePointer, Wand2, BarChart3, Layers, Rocket, ChevronDown
} from 'lucide-react';
import { useTranslation } from '../i18n';

/**
 * LandingPage - Anthropic.com-quality Professional Landing Page for Volla
 * 
 * Design Principles:
 * - Clean, minimalist with generous whitespace
 * - Bold, confident typography
 * - Smooth scroll animations
 * - Professional color palette
 * - Mobile-first responsive design
 * - Full i18n support
 */

// Language options
const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
];

// Animation hook for scroll reveal
const useScrollReveal = () => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1, rootMargin: '50px' }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return [ref, isVisible];
};

// Animated section wrapper
const AnimatedSection = ({ children, className = '', delay = 0 }) => {
    const [ref, isVisible] = useScrollReveal();

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ${className}`}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                transitionDelay: `${delay}ms`
            }}
        >
            {children}
        </div>
    );
};

export default function LandingPage({ onNavigate }) {
    const { t, currentLanguage, setLanguage } = useTranslation();
    const [hoveredFeature, setHoveredFeature] = useState(null);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState('yearly'); // 'monthly' or 'yearly'

    // Features data - uses i18n
    const features = [
        { id: 'studio', icon: Camera, color: '#F1641E' },
        { id: 'reallife', icon: Users, color: '#10B981' },
        { id: 'angles', icon: Layers, color: '#8B5CF6' },
        { id: 'seo', icon: BarChart3, color: '#FF9900' }
    ];

    // How it works steps - uses i18n
    const steps = [
        { number: '01', key: 'step1', icon: Upload },
        { number: '02', key: 'step2', icon: Store },
        { number: '03', key: 'step3', icon: Rocket }
    ];

    // Pricing tiers with monthly and yearly prices (yearly = 20% discount)
    const pricingTiers = [
        { name: 'Starter', monthlyPrice: 9, yearlyPrice: 7, credits: '100', popular: false },
        { name: 'Pro', monthlyPrice: 29, yearlyPrice: 23, credits: '400', popular: true },
        { name: 'Business', monthlyPrice: 79, yearlyPrice: 63, credits: '1200', popular: false }
    ];

    // Get current language
    const currentLang = LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-poppins overflow-x-hidden">
            {/* ════════════════════════════════════════════════════════════════
                NAVIGATION
            ════════════════════════════════════════════════════════════════ */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#F1641E] to-[#FF9900] rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-[#1A1A1A]">VOLLA</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors">{t('landing.nav.features')}</a>
                        <a href="#how-it-works" className="text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors">{t('landing.nav.howItWorks')}</a>
                        <a href="#pricing" className="text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors">{t('landing.nav.pricing')}</a>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Language Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setLangMenuOpen(!langMenuOpen)}
                                className="flex items-center gap-2 px-3 py-2 text-[#5C5C5C] hover:text-[#1A1A1A] hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <Globe size={18} />
                                <span className="text-lg">{currentLang.flag}</span>
                                <ChevronDown size={14} className={`transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {langMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang.code);
                                                setLangMenuOpen(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${currentLanguage === lang.code ? 'bg-[#F5F4F1]' : ''
                                                }`}
                                        >
                                            <span className="text-lg">{lang.flag}</span>
                                            <span className="text-sm text-[#1A1A1A]">{lang.name}</span>
                                            {currentLanguage === lang.code && (
                                                <Check size={14} className="ml-auto text-[#F1641E]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => onNavigate?.('login')}
                            className="hidden sm:block px-5 py-2.5 text-[#1A1A1A] font-medium hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            {t('landing.nav.logIn')}
                        </button>
                        <button
                            onClick={() => onNavigate?.('login')}
                            className="px-3 sm:px-5 py-2 sm:py-2.5 bg-[#1A1A1A] text-white text-sm sm:text-base font-medium rounded-xl hover:bg-[#333] transition-colors flex items-center gap-1 sm:gap-2"
                        >
                            {t('landing.nav.startFree') || 'Start Free'}
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* ════════════════════════════════════════════════════════════════
                HERO SECTION
            ════════════════════════════════════════════════════════════════ */}
            <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#FFF5F0] via-white to-[#FAFAFA]" />

                {/* Floating elements */}
                <div className="absolute top-40 left-10 w-64 h-64 bg-[#F1641E]/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#FF9900]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

                <div className="max-w-6xl mx-auto relative">
                    {/* Badge */}
                    <AnimatedSection>
                        <div className="flex justify-center mb-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-sm text-[#5C5C5C]">{t('landing.hero.badge')}</span>
                            </div>
                        </div>
                    </AnimatedSection>

                    {/* Main headline */}
                    <AnimatedSection delay={100}>
                        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-center text-[#1A1A1A] leading-[1.1] sm:leading-tight mb-6 sm:mb-8">
                            {t('landing.hero.headline1')}
                            <br />
                            <span className="bg-gradient-to-r from-[#F1641E] via-[#FF9900] to-[#F1641E] bg-clip-text text-transparent">
                                {t('landing.hero.headline2')}
                            </span>
                        </h1>
                    </AnimatedSection>

                    {/* Subheadline */}
                    <AnimatedSection delay={200}>
                        <p className="text-base sm:text-xl md:text-2xl text-[#5C5C5C] text-center max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2">
                            {t('landing.hero.subheadline')}
                        </p>
                    </AnimatedSection>

                    {/* CTA Buttons */}
                    <AnimatedSection delay={300}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-16 w-full px-2">
                            <button
                                onClick={() => onNavigate?.('login')}
                                className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#1A1A1A] text-white font-semibold rounded-2xl hover:bg-[#333] transition-all flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg shadow-xl hover:shadow-2xl hover:scale-105"
                            >
                                <Sparkles size={20} />
                                {t('landing.hero.ctaPrimary')}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#1A1A1A] font-semibold rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg hover:bg-gray-50">
                                <Play size={20} />
                                {t('landing.hero.ctaSecondary')}
                            </button>
                        </div>
                    </AnimatedSection>

                    {/* Trust badges */}
                    <AnimatedSection delay={400}>
                        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-8 text-[#8C8C8C]">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {[
                                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
                                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
                                        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
                                        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
                                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
                                    ].map((src, i) => (
                                        <img
                                            key={i}
                                            src={src}
                                            alt=""
                                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                        />
                                    ))}
                                </div>
                                <span className="text-sm">{t('landing.hero.sellers')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                                ))}
                                <span className="text-sm ml-1">{t('landing.hero.rating')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check size={16} className="text-emerald-500" />
                                <span className="text-sm">{t('landing.hero.noCard')}</span>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════
                LOGO BAR - Marketplace Trust
            ════════════════════════════════════════════════════════════════ */}
            <section className="py-12 bg-white border-y border-gray-100">
                <div className="max-w-6xl mx-auto px-6">
                    <p className="text-center text-[#8C8C8C] text-sm uppercase tracking-wider mb-8">
                        {t('landing.logos.optimizedFor')}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 md:gap-20">
                        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                            <Store size={32} className="text-[#F1641E]" />
                            <span className="text-2xl font-bold text-[#F1641E]">Etsy</span>
                        </div>
                        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                            <ShoppingBag size={32} className="text-[#FF9900]" />
                            <span className="text-2xl font-bold text-[#FF9900]">Amazon</span>
                        </div>
                        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                            <ShoppingCart size={32} className="text-[#96BF48]" />
                            <span className="text-2xl font-bold text-[#96BF48]">Shopify</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════
                FEATURES GRID
            ════════════════════════════════════════════════════════════════ */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <AnimatedSection>
                        <div className="text-center mb-16">
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4 px-2">
                                {t('landing.features.title')}
                            </h2>
                            <p className="text-base sm:text-xl text-[#5C5C5C] max-w-2xl mx-auto px-2">
                                {t('landing.features.subtitle')}
                            </p>
                        </div>
                    </AnimatedSection>

                    <div className="grid md:grid-cols-2 gap-6">
                        {features.map((feature, index) => (
                            <AnimatedSection key={feature.id} delay={index * 100}>
                                <div
                                    className="group relative bg-white rounded-3xl p-8 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden"
                                    onMouseEnter={() => setHoveredFeature(feature.id)}
                                    onMouseLeave={() => setHoveredFeature(null)}
                                >
                                    {/* Background glow on hover */}
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                                        style={{ backgroundColor: feature.color }}
                                    />

                                    <div className="relative">
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                                            style={{ backgroundColor: feature.color + '15' }}
                                        >
                                            <feature.icon size={28} style={{ color: feature.color }} />
                                        </div>

                                        <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3 group-hover:translate-x-1 transition-transform">
                                            {t(`landing.features.${feature.id}.title`)}
                                        </h3>

                                        <p className="text-[#5C5C5C] leading-relaxed">
                                            {t(`landing.features.${feature.id}.description`)}
                                        </p>
                                    </div>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════
                VALUE PROPOSITION - Big Typography
            ════════════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#1A1A1A] relative overflow-hidden">
                {/* Gradient orbs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F1641E]/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF9900]/20 rounded-full blur-3xl" />

                <div className="max-w-6xl mx-auto relative">
                    <AnimatedSection>
                        <h2 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center leading-tight">
                            {t('landing.valueProp.line1')}
                            <br />
                            <span className="bg-gradient-to-r from-[#F1641E] to-[#FF9900] bg-clip-text text-transparent">
                                {t('landing.valueProp.line2')}
                            </span>
                            <br />
                            {t('landing.valueProp.line3')}
                        </h2>
                    </AnimatedSection>

                    <AnimatedSection delay={200}>
                        <div className="mt-10 sm:mt-16 grid grid-cols-3 gap-4 sm:gap-8">
                            {[
                                { value: '10K+', label: t('landing.valueProp.activeSellers') },
                                { value: '500K+', label: t('landing.valueProp.imagesGenerated') },
                                { value: '98%', label: t('landing.valueProp.satisfaction') }
                            ].map((stat, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-2xl sm:text-5xl md:text-6xl font-bold text-white mb-1 sm:mb-2">{stat.value}</div>
                                    <div className="text-xs sm:text-base text-[#8C8C8C]">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════
                HOW IT WORKS
            ════════════════════════════════════════════════════════════════ */}
            <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <AnimatedSection>
                        <div className="text-center mb-16">
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4 px-2">
                                {t('landing.howItWorks.title')}
                            </h2>
                            <p className="text-base sm:text-xl text-[#5C5C5C]">
                                {t('landing.howItWorks.subtitle')}
                            </p>
                        </div>
                    </AnimatedSection>

                    <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
                        {steps.map((step, index) => (
                            <AnimatedSection key={step.number} delay={index * 150}>
                                <div className="relative">
                                    {/* Connector line */}
                                    {index < steps.length - 1 && (
                                        <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-transparent z-0" />
                                    )}

                                    <div className="relative bg-[#F5F4F1] rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:bg-[#EFEDE8] transition-colors">
                                        <div className="text-4xl sm:text-6xl font-bold text-[#E8E7E4] mb-3 sm:mb-4">
                                            {step.number}
                                        </div>
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1A1A1A] rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                                            <step.icon size={24} className="text-white" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-bold text-[#1A1A1A] mb-2">
                                            {t(`landing.howItWorks.${step.key}.title`)}
                                        </h3>
                                        <p className="text-sm sm:text-base text-[#5C5C5C]">
                                            {t(`landing.howItWorks.${step.key}.description`)}
                                        </p>
                                    </div>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════
                PRICING PREVIEW
            ════════════════════════════════════════════════════════════════ */}
            <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#FAFAFA]">
                <div className="max-w-5xl mx-auto">
                    <AnimatedSection>
                        <div className="text-center mb-8 sm:mb-12">
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4 px-2">
                                {t('landing.pricing.title')}
                            </h2>
                            <p className="text-base sm:text-xl text-[#5C5C5C] mb-6 sm:mb-8">
                                {t('landing.pricing.subtitle')}
                            </p>

                            {/* Billing Toggle */}
                            <div className="inline-flex items-center bg-[#F5F4F1] rounded-full p-1">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all ${billingCycle === 'monthly'
                                        ? 'bg-white text-[#1A1A1A] shadow-sm'
                                        : 'text-[#5C5C5C] hover:text-[#1A1A1A]'
                                        }`}
                                >
                                    {t('landing.pricing.monthly')}
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all flex items-center gap-1 sm:gap-2 ${billingCycle === 'yearly'
                                        ? 'bg-white text-[#1A1A1A] shadow-sm'
                                        : 'text-[#5C5C5C] hover:text-[#1A1A1A]'
                                        }`}
                                >
                                    {t('landing.pricing.yearly')}
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 sm:px-2 py-0.5 rounded-full font-semibold">
                                        -20%
                                    </span>
                                </button>
                            </div>
                        </div>
                    </AnimatedSection>

                    <div className="grid gap-6 md:grid-cols-3">
                        {pricingTiers.map((tier, index) => (
                            <AnimatedSection key={tier.name} delay={index * 100}>
                                <div className={`relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 transition-all hover:shadow-xl ${tier.popular ? 'border-[#F1641E] shadow-lg' : 'border-gray-100'
                                    }`}>
                                    {tier.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#F1641E] text-white text-sm font-medium rounded-full">
                                            {t('landing.pricing.mostPopular')}
                                        </div>
                                    )}

                                    <div className="text-center">
                                        <h3 className="text-lg sm:text-xl font-bold text-[#1A1A1A] mb-2">{tier.name}</h3>
                                        <div className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-1">
                                            ${billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice}
                                            <span className="text-base sm:text-lg font-normal text-[#8C8C8C]">{t('landing.pricing.perMonth')}</span>
                                        </div>
                                        {billingCycle === 'yearly' && (
                                            <p className="text-xs sm:text-sm text-emerald-600 mb-1">
                                                {t('landing.pricing.billedYearly')} (${tier.yearlyPrice * 12}/{t('landing.pricing.year')})
                                            </p>
                                        )}
                                        <p className="text-sm sm:text-base text-[#5C5C5C] mb-4 sm:mb-6">{tier.credits} {t('landing.pricing.creditsMonth')}</p>

                                        <button
                                            onClick={() => onNavigate?.('login')}
                                            className={`w-full py-3 rounded-xl font-semibold transition-colors ${tier.popular
                                                ? 'bg-[#1A1A1A] text-white hover:bg-[#333]'
                                                : 'bg-[#F5F4F1] text-[#1A1A1A] hover:bg-[#E8E7E4]'
                                                }`}
                                        >
                                            {t('landing.pricing.getStarted')}
                                        </button>
                                    </div>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>

                    <AnimatedSection delay={400}>
                        <p className="text-center text-[#8C8C8C] mt-8">
                            {t('landing.pricing.allFeatures')} <button onClick={() => onNavigate?.('login')} className="text-[#F1641E] hover:underline">{t('landing.pricing.viewDetails')}</button>
                        </p>
                    </AnimatedSection>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════
                FINAL CTA
            ════════════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A]">
                <div className="max-w-4xl mx-auto text-center">
                    <AnimatedSection>
                        <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-4 sm:mb-6 px-2">
                            {t('landing.cta.title1')}
                            <br />
                            {t('landing.cta.title2')}
                        </h2>
                    </AnimatedSection>

                    <AnimatedSection delay={100}>
                        <p className="text-base sm:text-xl text-[#8C8C8C] mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
                            {t('landing.cta.subtitle')}
                        </p>
                    </AnimatedSection>

                    <AnimatedSection delay={200}>
                        <button
                            onClick={() => onNavigate?.('login')}
                            className="group px-6 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-[#F1641E] to-[#FF9900] text-white font-bold text-base sm:text-xl rounded-2xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 sm:gap-3 mx-auto"
                        >
                            <Sparkles size={24} />
                            {t('landing.cta.button')}
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </AnimatedSection>

                    <AnimatedSection delay={300}>
                        <p className="text-[#5C5C5C] mt-6 text-sm">
                            {t('landing.cta.disclaimer')}
                        </p>
                    </AnimatedSection>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════
                FOOTER
            ════════════════════════════════════════════════════════════════ */}
            <footer className="py-10 sm:py-16 px-4 sm:px-6 bg-[#0A0A0A] border-t border-gray-800">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col items-center justify-between gap-6 sm:gap-8 md:flex-row">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#F1641E] to-[#FF9900] rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white">VOLLA</span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[#8C8C8C] text-sm sm:text-base">
                            <a href="#features" className="hover:text-white transition-colors">{t('landing.footer.features')}</a>
                            <a href="#pricing" className="hover:text-white transition-colors">{t('landing.footer.pricing')}</a>
                            <a href="mailto:support@volla.app" className="hover:text-white transition-colors">{t('landing.footer.support')}</a>
                            <button onClick={() => onNavigate?.('privacy')} className="hover:text-white transition-colors">{t('landing.footer.privacy')}</button>
                            <button onClick={() => onNavigate?.('terms')} className="hover:text-white transition-colors">{t('landing.footer.terms')}</button>
                        </div>
                    </div>

                    <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-800 text-center text-[#5C5C5C] text-xs sm:text-sm px-2">
                        {t('landing.footer.copyright')}
                    </div>
                </div>
            </footer>
        </div>
    );
}
