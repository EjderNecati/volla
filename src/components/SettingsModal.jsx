import { useState } from 'react';
import { X, Key, Save } from 'lucide-react';
import { getLastApiStatus } from '../utils/aiHelpers';

export default function SettingsModal({ isOpen, onClose }) {
    const [apiKey, setApiKey] = useState(localStorage.getItem('volla_api_key') || '');
    const [saved, setSaved] = useState(false);
    const [apiStatus, setApiStatus] = useState('Waiting for scan...');

    if (!isOpen) return null;

    // Update status when modal opens
    const currentStatus = getLastApiStatus();
    if (currentStatus !== apiStatus) {
        setApiStatus(currentStatus);
    }

    const handleSave = () => {
        localStorage.setItem('volla_api_key', apiKey);
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
                className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all duration-300"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-full mb-4">
                        <Key className="w-8 h-8 text-violet-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Settings
                    </h2>
                    <p className="text-sm text-zinc-400">
                        Configure your AI integration
                    </p>
                </div>

                {/* API Key Input */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Google Gemini API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIza..."
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-300"
                        />
                        <p className="mt-2 text-xs text-zinc-500">
                            Your API key is stored locally and never sent to our servers
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg shadow-violet-500/30 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                    {saved ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center">
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
                <div className="mt-4 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                    <p className="text-xs text-zinc-400">
                        💡 <strong className="text-white">How to get API key:</strong> Visit{' '}
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 underline"
                        >
                            Google AI Studio
                        </a>
                    </p>
                </div>

                {/* DEBUG: Last API Status */}
                <div className="mt-4 p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-violet-400">Debug: Last API Status</h3>
                        <button
                            onClick={handleRefreshStatus}
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                    <div className="bg-zinc-900 rounded p-2">
                        <code className="text-xs text-emerald-400 font-mono break-all">
                            {apiStatus}
                        </code>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                        This shows the result of the last scan attempt
                    </p>
                </div>

                {/* Powered by Gemini */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-zinc-600">
                        Powered by{' '}
                        <span className="text-violet-400 font-semibold">Google Gemini 1.5 Flash</span>
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
