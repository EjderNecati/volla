import { Camera, Sparkles, Upload } from 'lucide-react';
import { useRef } from 'react';

// Platform-specific subtexts
const platformTexts = {
    Etsy: 'Volla analyzes handmade trends and niche markets.',
    eBay: 'Analyzing for technical specs & condition details.',
    Redbubble: 'Scanning for print-on-demand design trends.',
    Depop: 'Checking vintage fashion & streetwear vibes.',
};

export default function UploadArea({ selectedPlatform, credits, onShowPaywall, onFileSelect }) {
    const fileInputRef = useRef(null);
    const subtext = platformTexts[selectedPlatform] || 'Volla analyzes trends for the selected platform.';

    const handleClick = () => {
        if (credits <= 0) {
            onShowPaywall();
        } else {
            // Trigger file input click
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('Image size should be less than 10MB');
                return;
            }

            onFileSelect(file);
            // File is passed to parent, which will immediately start scanning
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center px-6 py-8">
            <div className="w-full max-w-sm">
                {/* Credits Display */}
                <div className="text-center mb-4">
                    <p className={`text-sm font-semibold transition-colors duration-300 ${credits === 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                        }`}>
                        {credits === 0 ? '⚠️ No Free Scans Left' : `✨ ${credits} Free Scan${credits !== 1 ? 's' : ''} Left`}
                    </p>
                </div>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* Upload Zone */}
                <div className="relative group">
                    <div
                        onClick={handleClick}
                        className={`
              border-2 border-dashed rounded-3xl
              bg-zinc-900/50 backdrop-blur-sm
              p-12
              transition-all duration-300 ease-out
              cursor-pointer
              ${credits === 0
                                ? 'border-red-500/50 hover:border-red-500 hover:bg-red-900/20'
                                : 'border-zinc-700 hover:border-violet-500 hover:bg-zinc-900/80 hover:scale-[1.02]'
                            }
            `}
                    >
                        {/* Animated glow effect on hover */}
                        <div className={`
              absolute inset-0 rounded-3xl transition-all duration-300
              ${credits === 0
                                ? 'bg-gradient-to-br from-red-500/0 to-red-500/0 group-hover:from-red-500/10 group-hover:to-red-500/10'
                                : 'bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/10 group-hover:to-purple-500/10'
                            }
            `} />

                        {/* Content */}
                        <div className="relative flex flex-col items-center gap-4 text-center">
                            {/* Camera Icon with animated background */}
                            <div className="relative">
                                <div className={`
                  absolute inset-0 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-300
                  ${credits === 0 ? 'bg-red-500/20' : 'bg-violet-500/20'}
                `} />
                                <div className={`
                  relative p-6 rounded-full transition-all duration-300
                  ${credits === 0
                                        ? 'bg-zinc-800 group-hover:bg-zinc-700'
                                        : 'bg-zinc-800 group-hover:bg-zinc-700'
                                    }
                `}>
                                    {credits === 0 ? (
                                        <Upload className={`
                      w-12 h-12 transition-colors duration-300
                      text-red-400 group-hover:text-red-300
                    `} />
                                    ) : (
                                        <Camera className={`
                      w-12 h-12 transition-colors duration-300
                      text-violet-400 group-hover:text-violet-300
                    `} />
                                    )}
                                </div>
                            </div>

                            {/* Text */}
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                                    {credits === 0 ? 'Unlock More Scans' : 'Snap or Upload Product'}
                                    <Sparkles className={`w-4 h-4 ${credits === 0 ? 'text-red-400' : 'text-violet-400'}`} />
                                </h3>
                                <p className="text-sm text-zinc-400 max-w-xs transition-all duration-300">
                                    {credits === 0 ? 'Upgrade to PRO for unlimited AI scans' : subtext}
                                </p>
                            </div>

                            {/* Hint */}
                            <div className={`
                mt-2 px-4 py-2 border rounded-lg
                ${credits === 0
                                    ? 'bg-red-500/10 border-red-500/20'
                                    : 'bg-emerald-500/10 border-emerald-500/20'
                                }
              `}>
                                <p className={`text-xs font-medium ${credits === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {credits === 0 ? 'Upgrade Required' : 'AI-Powered Analysis'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
