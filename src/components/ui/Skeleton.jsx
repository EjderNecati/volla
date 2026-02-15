/**
 * Skeleton Loading Components
 * Tutarlı loading state'ler için
 */

// Base skeleton with shimmer animation
export function Skeleton({ className = '', ...props }) {
    return (
        <div
            className={`
                bg-gradient-to-r from-[#F5F4F1] via-[#E8E7E4] to-[#F5F4F1]
                bg-[length:200%_100%] animate-shimmer rounded-lg
                ${className}
            `}
            {...props}
        />
    );
}

// Text line skeleton
export function SkeletonText({ lines = 1, className = '' }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

// Card skeleton
export function SkeletonCard({ className = '' }) {
    return (
        <div className={`bg-white rounded-2xl border border-[#E8E7E4] p-4 ${className}`}>
            <Skeleton className="w-full h-40 mb-4" />
            <SkeletonText lines={2} />
        </div>
    );
}

// Image skeleton with aspect ratio
export function SkeletonImage({ aspectRatio = '1/1', className = '' }) {
    return (
        <div className={`relative overflow-hidden rounded-xl ${className}`} style={{ aspectRatio }}>
            <Skeleton className="absolute inset-0" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#E8E7E4]/50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#D4D3D0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

// Avatar skeleton
export function SkeletonAvatar({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-14 h-14'
    };

    return <Skeleton className={`${sizes[size]} rounded-full ${className}`} />;
}

// Button skeleton
export function SkeletonButton({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'h-8 w-20',
        md: 'h-10 w-28',
        lg: 'h-12 w-36'
    };

    return <Skeleton className={`${sizes[size]} rounded-xl ${className}`} />;
}

// List item skeleton
export function SkeletonListItem({ hasAvatar = false, className = '' }) {
    return (
        <div className={`flex items-center gap-3 p-3 ${className}`}>
            {hasAvatar && <SkeletonAvatar size="md" />}
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}

// Grid of cards skeleton
export function SkeletonGrid({ count = 6, columns = 3, className = '' }) {
    return (
        <div className={`grid grid-cols-${columns} gap-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export default Skeleton;
