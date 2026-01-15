import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';

/**
 * Layout Wrapper
 * Renders Sidebar on desktop (>= 768px) and BottomNav on mobile (< 768px)
 * Handles responsive navigation with marketplace-aware colors
 */
export default function Layout({ children, activeTab, onNavigate, marketplace }) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Initial check
        checkMobile();

        // Listen for resize
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // For AI Studio, render without navigation (full screen experience)
    if (activeTab === 'studio') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-[#FAF9F6]">
            {/* Desktop Sidebar - now with marketplace colors */}
            {!isMobile && (
                <Sidebar activeTab={activeTab} onNavigate={onNavigate} marketplace={marketplace} />
            )}

            {/* Main Content Area */}
            <main
                className={`
                    ${!isMobile ? 'ml-64' : ''} 
                    ${isMobile ? 'pb-20' : ''}
                    min-h-screen
                `}
            >
                {children}
            </main>

            {/* Mobile Bottom Nav - now with marketplace colors */}
            {isMobile && (
                <BottomNav activeTab={activeTab} onNavigate={onNavigate} marketplace={marketplace} />
            )}
        </div>
    );
}
