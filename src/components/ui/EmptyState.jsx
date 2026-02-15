/**
 * Empty State Components
 * Tutarlı boş ekran tasarımları için
 */

import { ImageIcon, FolderOpen, FileX, Upload, Search, Inbox } from 'lucide-react';

// Ana empty state komponenti
export function EmptyState({
    icon: Icon = Inbox,
    title = 'Nothing here yet',
    description = 'Get started by adding some content',
    action = null,
    actionLabel = 'Get Started',
    onAction = null,
    className = ''
}) {
    return (
        <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
            {/* Icon container */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F5F4F1] to-[#E8E7E4] flex items-center justify-center mb-6 shadow-inner">
                <Icon className="w-10 h-10 text-[#B8B8B8]" strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                {title}
            </h3>

            {/* Description */}
            <p className="text-sm text-[#8C8C8C] max-w-xs mb-6 leading-relaxed">
                {description}
            </p>

            {/* Action button */}
            {(action || onAction) && (
                <button
                    onClick={onAction}
                    className="px-6 py-3 bg-[#E06847] hover:bg-[#c85a3d] text-white font-medium rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                    {action || actionLabel}
                </button>
            )}
        </div>
    );
}

// Upload empty state
export function EmptyStateUpload({ onUpload, className = '' }) {
    return (
        <EmptyState
            icon={Upload}
            title="Upload an image"
            description="Drag and drop an image here, or click to browse your files"
            actionLabel="Browse Files"
            onAction={onUpload}
            className={className}
        />
    );
}

// No results empty state
export function EmptyStateNoResults({ searchTerm = '', onClear, className = '' }) {
    return (
        <EmptyState
            icon={Search}
            title="No results found"
            description={searchTerm ? `No matches for "${searchTerm}"` : 'Try adjusting your search or filters'}
            actionLabel="Clear Search"
            onAction={onClear}
            className={className}
        />
    );
}

// Empty folder/collection
export function EmptyStateFolder({ title = 'No items yet', onAdd, className = '' }) {
    return (
        <EmptyState
            icon={FolderOpen}
            title={title}
            description="Items you create or save will appear here"
            actionLabel="Create New"
            onAction={onAdd}
            className={className}
        />
    );
}

// Empty history
export function EmptyStateHistory({ onStart, className = '' }) {
    return (
        <EmptyState
            icon={FileX}
            title="No history yet"
            description="Your generated images and videos will appear here"
            actionLabel="Start Creating"
            onAction={onStart}
            className={className}
        />
    );
}

// Empty image preview
export function EmptyStateImage({ message = 'Upload an image to get started', className = '' }) {
    return (
        <div className={`h-full flex items-center justify-center bg-[#F5F4F1] rounded-2xl border-2 border-dashed border-[#E8E7E4] ${className}`}>
            <div className="text-center p-8">
                <div className="w-16 h-16 rounded-full bg-[#E8E7E4] flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-[#B8B8B8]" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-[#8C8C8C]">{message}</p>
            </div>
        </div>
    );
}

// Compact inline empty state
export function EmptyStateInline({ icon: Icon = Inbox, message, className = '' }) {
    return (
        <div className={`flex items-center justify-center gap-3 py-8 text-[#8C8C8C] ${className}`}>
            <Icon size={20} strokeWidth={1.5} />
            <span className="text-sm">{message}</span>
        </div>
    );
}

export default EmptyState;
