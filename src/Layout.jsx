import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';

/**
 * Layout Wrapper
 * Renders Sidebar on desktop (>= 768px) and BottomNav on mobile (< 768px)
 * Handles responsive navigation with marketplace-aware colors
 * Supports collapsible sidebar and studio mode switching
 */
export default function Layout({
    children,
    activeTab,
    onNavigate,
    marketplace,
    studioMode = 'standard',
    onModeChange
}) {
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

    // Load collapsed preference from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('volla_sidebar_collapsed');
        if (saved !== null) {
            setSidebarCollapsed(saved === 'true');
        }
    }, []);

    // Save collapsed preference
    const handleCollapsedChange = (collapsed) => {
        setSidebarCollapsed(collapsed);
        localStorage.setItem('volla_sidebar_collapsed', String(collapsed));
    };

    // For AI Studio on DESKTOP, render without navigation (full screen experience)
    // On mobile, we still show the bottom nav
    if (activeTab === 'studio' && !isMobile) {
        return <>{children}</>;
    }

    // For AI Studio on MOBILE, render with bottom nav
    if (activeTab === 'studio' && isMobile) {
        return (
            <div className="min-h-screen bg-[#FAF9F6]">
                <main className="pb-20 min-h-screen">
                    {children}
                </main>
                <BottomNav
                    activeTab={activeTab}
                    onTabChange={onNavigate}
                    marketplace={marketplace}
                    studioMode={studioMode}
                    onModeChange={onModeChange}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF9F6]">
            {/* Desktop Sidebar - with marketplace colors, mode switching, and collapse */}
            {!isMobile && (
                <Sidebar
                    activeTab={activeTab}
                    onNavigate={onNavigate}
                    marketplace={marketplace}
                    studioMode={studioMode}
                    onModeChange={onModeChange}
                    collapsed={sidebarCollapsed}
                    onCollapsedChange={handleCollapsedChange}
                />
            )}

            {/* Main Content Area */}
            <main
                className={`
                    ${!isMobile ? (sidebarCollapsed ? 'ml-16' : 'ml-64') : ''}
                    ${isMobile ? 'pb-20' : ''}
                    min-h-screen transition-all duration-300
                `}
            >
                {children}
            </main>

            {/* Mobile Bottom Nav - with marketplace colors and mode indicator */}
            {isMobile && (
                <BottomNav
                    activeTab={activeTab}
                    onTabChange={onNavigate}
                    marketplace={marketplace}
                    studioMode={studioMode}
                    onModeChange={onModeChange}
                />
            )}
        </div>
    );
}
