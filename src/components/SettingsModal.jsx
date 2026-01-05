import { useState } from 'react';
import { X, Key, Save, Sparkles } from 'lucide-react';
import { getLastApiStatus } from '../utils/aiHelpers';

export default function SettingsModal({ isOpen, onClose }) {
    const [apiKey, setApiKey] = useState(localStorage.getItem('volla_api_key') || '');
    const [vertexApiKey, setVertexApiKey] = useState(localStorage.getItem('volla_vertex_api_key') || '');
    const [saved, setSaved] = useState(false);
    const [apiStatus, setApiStatus] = useState('Waiting for scan...');

    // Get current marketplace from localStorage for dynamic theming
    const marketplace = localStorage.getItem('volla_marketplace') || 'etsy';
    const platformColor = marketplace === 'amazon' ? '#FF9900' : marketplace === 'shopify' ? '#96BF48' : '#F1641E';

    if (!isOpen) return null;

    // Update status when modal opens
    const currentStatus = getLastApiStatus();
    if (currentStatus !== apiStatus) {
        setApiStatus(currentStatus);
    }

    const handleSave = () => {
        localStorage.setItem('volla_api_key', apiKey);
        localStorage.setItem('volla_vertex_api_key', vertexApiKey);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleRefreshStatus = () => {
        setApiStatus(getLastApiStatus());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40/95 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white border border-[#E8E7E4] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg bg-[#F5F4F1] hover:bg-[#4B5046] text-[#8C8C8C] hover:text-[#1A1A1A] transition-all duration-300"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1D3232] to-[#142424] border border-[#E8E7E4] rounded-full mb-4">
                        <Key className="w-8 h-8" style={{ color: platformColor }} />
                    </div>
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                        Settings
                    </h2>
                    <p className="text-sm text-[#8C8C8C]">
                        Configure your AI integration
                    </p>
                </div>

                {/* API Keys Section */}
                <div className="space-y-4 mb-6">
                    {/* Gemini API Key */}
                    <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                            🔵 Google Gemini API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIza..."
                            className="input-luxury"
                        />
                        <p className="mt-1 text-xs text-[#8C8C8C]">
                            For product analysis & SEO generation
                        </p>
                    </div>

                    {/* Vertex API Key (Imagen 3) */}
                    <div>
                        <label className="block text-sm font-medium text-[#1A1A1A] mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" style={{ color: platformColor }} />
                            Vertex AI API Key (Imagen 3)
                        </label>
                        <input
                            type="password"
                            value={vertexApiKey}
                            onChange={(e) => setVertexApiKey(e.target.value)}
                            placeholder="AQ.Ab8..."
                            className="input-luxury"
                        />
                        <p className="mt-1 text-xs text-[#8C8C8C]">
                            For AI Studio & Multi-Angle Shots (BGSWAP)
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className="btn-luxury w-full flex items-center justify-center gap-2"
                >
                    {saved ? (
                        <>
                            <span className="w-5 h-5 border-2 border-[#0D1818] rounded-full flex items-center justify-center">
                                ✓
                            </span>
                            Saved!
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Settings
                        </>
                    )}
                </button>

                {/* Info */}
                <div className="mt-4 p-3 bg-[#F5F4F1] border border-[#E8E7E4] rounded-lg space-y-2">
                    <p className="text-xs text-[#5C5C5C]">
                        💡 <strong className="text-[#1A1A1A]">Gemini API:</strong>{' '}
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            style={{ color: platformColor }}
                        >
                            Google AI Studio
                        </a>
                    </p>
                    <p className="text-xs text-[#5C5C5C]">
                        ✨ <strong className="text-[#1A1A1A]">Vertex AI:</strong>{' '}
                        <a
                            href="https://console.cloud.google.com/vertex-ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            style={{ color: platformColor }}
                        >
                            Google Cloud Console
                        </a>
                    </p>
                </div>

                {/* DEBUG: Last API Status */}
                <div className="mt-4 p-4 bg-[#F5F4F1] border border-[#E8E7E4] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold" style={{ color: platformColor }}>Debug: Last API Status</h3>
                        <button
                            onClick={handleRefreshStatus}
                            className="text-xs text-[#8C8C8C] hover:text-[#1A1A1A] transition-colors"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                    <div className="bg-black/40 rounded p-2">
                        <code className="text-xs text-[#E06847] font-mono break-all">
                            {apiStatus}
                        </code>
                    </div>
                    <p className="mt-2 text-xs text-[#8C8C8C]">
                        This shows the result of the last scan attempt
                    </p>
                </div>

                {/* Powered by */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-[#8C8C8C]">
                        Powered by{' '}
                        <span className="text-[#E06847] font-semibold">Gemini</span>
                        {' + '}
                        <span className="text-[#E06847] font-semibold">Imagen 3</span>
                    </p>
                </div>
            </div>

            {/* Custom Animation */}
            <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}

