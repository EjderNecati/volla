/**
 * Volla Design System
 * Tutarlı tasarım için merkezi stil tanımları
 */

// ═══════════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════════

export const colors = {
    // Primary
    primary: '#E06847',
    primaryHover: '#c85a3d',
    primaryLight: '#FEF3F0',

    // Neutrals
    background: '#FAF9F6',
    surface: '#FFFFFF',
    surfaceHover: '#F5F4F1',
    border: '#E8E7E4',
    borderHover: '#D4D3D0',

    // Text
    textPrimary: '#1A1A1A',
    textSecondary: '#6B6B6B',
    textMuted: '#8C8C8C',
    textDisabled: '#B8B8B8',

    // Semantic
    success: '#10B981',
    successLight: '#D1FAE5',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    info: '#3B82F6',
    infoLight: '#DBEAFE',

    // Feature Colors
    handsfree: {
        gradient: 'from-cyan-500 to-blue-500',
        bg: 'bg-gradient-to-r from-cyan-500 to-blue-500',
        text: 'text-cyan-600',
        light: 'bg-cyan-50'
    },
    motion: {
        gradient: 'from-violet-500 to-purple-500',
        bg: 'bg-gradient-to-r from-violet-500 to-purple-500',
        text: 'text-violet-600',
        light: 'bg-violet-50'
    },
    creative: {
        gradient: 'from-pink-500 to-rose-500',
        bg: 'bg-gradient-to-r from-pink-500 to-rose-500',
        text: 'text-pink-600',
        light: 'bg-pink-50'
    },
    reels: {
        gradient: 'from-orange-500 to-red-500',
        bg: 'bg-gradient-to-r from-orange-500 to-red-500',
        text: 'text-orange-600',
        light: 'bg-orange-50'
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON STYLES
// ═══════════════════════════════════════════════════════════════════════════════

export const buttonStyles = {
    // Primary - Ana aksiyonlar
    primary: `
        bg-[#E06847] hover:bg-[#c85a3d] text-white
        font-medium rounded-xl
        transition-all duration-200 ease-out
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
    `,

    // Secondary - İkincil aksiyonlar
    secondary: `
        bg-[#F5F4F1] hover:bg-[#E8E7E4] text-[#1A1A1A]
        font-medium rounded-xl border border-[#E8E7E4]
        transition-all duration-200 ease-out
        active:scale-[0.98]
    `,

    // Ghost - Minimal aksiyonlar
    ghost: `
        bg-transparent hover:bg-[#F5F4F1] text-[#6B6B6B] hover:text-[#1A1A1A]
        font-medium rounded-xl
        transition-all duration-200 ease-out
    `,

    // Outline
    outline: `
        bg-transparent hover:bg-[#F5F4F1] text-[#1A1A1A]
        font-medium rounded-xl border border-[#E8E7E4] hover:border-[#D4D3D0]
        transition-all duration-200 ease-out
        active:scale-[0.98]
    `,

    // Chip/Tag style buttons
    chip: {
        base: `
            px-3 py-1.5 rounded-lg text-xs font-medium
            border transition-all duration-200 ease-out
        `,
        active: `bg-[#1A1A1A] text-white border-[#1A1A1A]`,
        inactive: `bg-[#F5F4F1] text-[#1A1A1A] border-[#E8E7E4] hover:bg-[#E8E7E4]`
    },

    // Icon button
    icon: `
        p-2 rounded-lg
        hover:bg-[#F5F4F1] text-[#6B6B6B] hover:text-[#1A1A1A]
        transition-all duration-200 ease-out
        active:scale-95
    `
};

// Button sizes
export const buttonSizes = {
    xs: 'px-2 py-1 text-[10px]',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPACING (Tailwind uyumlu)
// ═══════════════════════════════════════════════════════════════════════════════

export const spacing = {
    section: 'space-y-6',      // Bölümler arası
    group: 'space-y-4',        // Gruplar arası
    item: 'space-y-2',         // Elemanlar arası
    inline: 'gap-2',           // Yan yana elemanlar
    inlineSmall: 'gap-1.5',    // Küçük yan yana
    grid: 'gap-3',             // Grid elemanları
    padding: {
        card: 'p-4',
        section: 'p-6',
        modal: 'p-6',
        button: 'px-4 py-2'
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CARD STYLES
// ═══════════════════════════════════════════════════════════════════════════════

export const cardStyles = {
    base: `
        bg-white rounded-2xl border border-[#E8E7E4]
        transition-all duration-200 ease-out
    `,
    elevated: `
        bg-white rounded-2xl border border-[#E8E7E4]
        shadow-sm hover:shadow-md
        transition-all duration-200 ease-out
    `,
    interactive: `
        bg-white rounded-2xl border border-[#E8E7E4]
        hover:border-[#D4D3D0] hover:shadow-sm
        cursor-pointer
        transition-all duration-200 ease-out
        active:scale-[0.99]
    `,
    selected: `
        bg-white rounded-2xl border-2 border-[#E06847]
        shadow-sm
    `
};

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT STYLES
// ═══════════════════════════════════════════════════════════════════════════════

export const inputStyles = {
    base: `
        w-full px-4 py-3
        bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl
        text-[#1A1A1A] placeholder-[#8C8C8C]
        focus:outline-none focus:ring-2 focus:ring-[#E06847] focus:border-transparent
        transition-all duration-200 ease-out
    `,
    small: `
        w-full px-3 py-2
        bg-[#F5F4F1] border border-[#E8E7E4] rounded-lg
        text-sm text-[#1A1A1A] placeholder-[#8C8C8C]
        focus:outline-none focus:ring-2 focus:ring-[#E06847] focus:border-transparent
        transition-all duration-200 ease-out
    `,
    textarea: `
        w-full px-4 py-3
        bg-[#F5F4F1] border border-[#E8E7E4] rounded-xl
        text-[#1A1A1A] placeholder-[#8C8C8C]
        focus:outline-none focus:ring-2 focus:ring-[#E06847] focus:border-transparent
        transition-all duration-200 ease-out
        resize-none
    `
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════════

export const typography = {
    // Headings
    h1: 'text-3xl font-bold text-[#1A1A1A]',
    h2: 'text-2xl font-bold text-[#1A1A1A]',
    h3: 'text-xl font-semibold text-[#1A1A1A]',
    h4: 'text-lg font-semibold text-[#1A1A1A]',

    // Body
    body: 'text-sm text-[#1A1A1A]',
    bodySmall: 'text-xs text-[#1A1A1A]',

    // Labels
    label: 'text-xs font-semibold uppercase tracking-wider text-[#8C8C8C]',
    labelSmall: 'text-[10px] font-semibold uppercase tracking-wider text-[#8C8C8C]',

    // Muted
    muted: 'text-sm text-[#6B6B6B]',
    mutedSmall: 'text-xs text-[#8C8C8C]'
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATIONS & TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const transitions = {
    fast: 'transition-all duration-150 ease-out',
    default: 'transition-all duration-200 ease-out',
    slow: 'transition-all duration-300 ease-out',
    spring: 'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
};

// Keyframes for CSS
export const keyframes = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }
`;

// Animation classes
export const animations = {
    fadeIn: 'animate-[fadeIn_0.2s_ease-out]',
    slideUp: 'animate-[slideUp_0.3s_ease-out]',
    slideDown: 'animate-[slideDown_0.3s_ease-out]',
    scaleIn: 'animate-[scaleIn_0.2s_ease-out]',
    pulse: 'animate-pulse',
    shimmer: 'animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]'
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING STATES
// ═══════════════════════════════════════════════════════════════════════════════

export const loadingStyles = {
    spinner: `
        w-5 h-5 border-2 border-current border-t-transparent rounded-full
        animate-spin
    `,
    spinnerLarge: `
        w-8 h-8 border-3 border-current border-t-transparent rounded-full
        animate-spin
    `,
    skeleton: `
        bg-gradient-to-r from-[#F5F4F1] via-[#E8E7E4] to-[#F5F4F1]
        bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]
        rounded-lg
    `,
    skeletonText: `
        h-4 bg-gradient-to-r from-[#F5F4F1] via-[#E8E7E4] to-[#F5F4F1]
        bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]
        rounded
    `
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATES
// ═══════════════════════════════════════════════════════════════════════════════

export const emptyStateStyles = {
    container: `
        flex flex-col items-center justify-center
        py-12 px-6 text-center
    `,
    icon: `
        w-16 h-16 mb-4 text-[#D4D3D0]
    `,
    title: `
        text-lg font-semibold text-[#1A1A1A] mb-2
    `,
    description: `
        text-sm text-[#8C8C8C] max-w-sm
    `
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE OPTIMIZATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const mobile = {
    // Minimum touch target size (44x44px Apple HIG)
    touchTarget: 'min-h-[44px] min-w-[44px]',

    // Safe area padding
    safeArea: 'pb-safe pt-safe',

    // Responsive text
    responsiveText: {
        xs: 'text-[10px] sm:text-xs',
        sm: 'text-xs sm:text-sm',
        base: 'text-sm sm:text-base',
        lg: 'text-base sm:text-lg'
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Z-INDEX SCALE
// ═══════════════════════════════════════════════════════════════════════════════

export const zIndex = {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
    toast: 70
};
