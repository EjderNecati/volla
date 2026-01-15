import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { LanguageProvider } from './i18n';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CreditProvider } from './contexts/CreditContext';

// Views
import LandingPage from './views/LandingPage';
import LoginPage from './views/LoginPage';
import HomeView from './views/HomeView';
import AIStudioView from './views/AIStudioView';
import AnalysisView from './views/AnalysisView';
import HistoryView from './views/HistoryView';
import SettingsView from './views/SettingsView';
import PricingView from './views/PricingView';
import PrivacyPage from './views/PrivacyPage';
import TermsPage from './views/TermsPage';

import './index.css';

// Route-based navigation using URL path
function getInitialRoute() {
    const path = window.location.pathname;
    if (path === '/login') return 'login';
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';
    if (path === '/pricing') return 'pricing';
    if (path === '/home') return 'home';
    if (path === '/studio') return 'studio';
    if (path === '/analysis') return 'analysis';
    if (path === '/history') return 'history';
    if (path === '/settings') return 'settings';
    return 'landing';
}

// Main App with state-based routing
function AppContent() {
    const { user, loading: authLoading } = useAuth();
    const [currentRoute, setCurrentRoute] = useState(getInitialRoute);

    // Global state
    const [marketplace, setMarketplace] = useState('etsy');
    const [loadedAsset, setLoadedAsset] = useState(null);
    const [loadedProject, setLoadedProject] = useState(null);

    // URL sync
    useEffect(() => {
        const handlePopstate = () => {
            setCurrentRoute(getInitialRoute());
        };
        window.addEventListener('popstate', handlePopstate);
        return () => window.removeEventListener('popstate', handlePopstate);
    }, []);

    const handleNavigate = (tab) => {
        const path = tab === 'home' ? '/home' : tab === 'landing' ? '/' : `/${tab}`;
        window.history.pushState({}, '', path);
        setCurrentRoute(tab);
    };

    const handleLoadAsset = (asset) => {
        setLoadedAsset(asset);
    };

    const handleLoadProject = (project) => {
        setLoadedProject(project);
        if (project?.marketplace) {
            setMarketplace(project.marketplace);
        }
    };

    // Auth loading
    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#E06847] border-t-transparent rounded-full" />
            </div>
        );
    }

    // Public routes
    if (currentRoute === 'landing' && !user) {
        return <LandingPage onNavigate={handleNavigate} />;
    }
    if (currentRoute === 'login' && !user) {
        return <LoginPage onNavigate={handleNavigate} />;
    }
    if (currentRoute === 'privacy') {
        return <PrivacyPage onNavigate={handleNavigate} />;
    }
    if (currentRoute === 'terms') {
        return <TermsPage onNavigate={handleNavigate} />;
    }
    if (currentRoute === 'pricing') {
        return <PricingView embedded={false} onNavigate={handleNavigate} />;
    }

    // Redirect to landing if not logged in
    if (!user) {
        return <LandingPage onNavigate={handleNavigate} />;
    }

    // Redirect to home if landing while logged in
    if (currentRoute === 'landing' || currentRoute === 'login') {
        setCurrentRoute('home');
        window.history.replaceState({}, '', '/home');
    }

    // Protected routes
    const renderView = () => {
        switch (currentRoute) {
            case 'home':
                return (
                    <HomeView
                        onNavigate={handleNavigate}
                        onLoadAsset={handleLoadAsset}
                        onLoadProject={handleLoadProject}
                        marketplace={marketplace}
                        onMarketplaceSelect={setMarketplace}
                    />
                );
            case 'studio':
                return (
                    <AIStudioView
                        loadedAsset={loadedAsset}
                        loadedProject={loadedProject}
                        onClearLoaded={() => { setLoadedAsset(null); setLoadedProject(null); }}
                        onNavigate={handleNavigate}
                        marketplace={marketplace}
                        onMarketplaceSelect={setMarketplace}
                    />
                );
            case 'analysis':
                return <AnalysisView marketplace={marketplace} />;
            case 'history':
                return (
                    <HistoryView
                        onNavigate={handleNavigate}
                        onLoadProject={handleLoadProject}
                    />
                );
            case 'settings':
                return <SettingsView />;
            default:
                return (
                    <HomeView
                        onNavigate={handleNavigate}
                        onLoadAsset={handleLoadAsset}
                        onLoadProject={handleLoadProject}
                        marketplace={marketplace}
                        onMarketplaceSelect={setMarketplace}
                    />
                );
        }
    };

    return (
        <Layout activeTab={currentRoute} onNavigate={handleNavigate} marketplace={marketplace}>
            {renderView()}
        </Layout>
    );
}

function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <CreditProvider>
                    <AppContent />
                </CreditProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
