import { X, Check, Zap } from 'lucide-react';

export default function PaywallModal({ isOpen, onClose, onUpgrade }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40/90 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#F5F4F1] border-2 border-[#E06847]/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-[#E06847]/20 animate-scale-in">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg bg-white hover:bg-[#E8E7E4] text-[#5C5C5C] hover:text-white transition-all duration-300"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#E06847] to-purple-600 rounded-full mb-4 animate-pulse-glow">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Unlock Global Sales 🚀
                    </h2>
                    <p className="text-sm text-[#5C5C5C]">
                        Get unlimited access to AI-powered insights
                    </p>
                </div>

                {/* Benefits */}
                <div className="space-y-3 mb-6">
                    {[
                        'Unlimited AI Scans',
                        'Real-time Trend Analysis',
                        'Copy-Paste SEO Keywords'
                    ].map((benefit, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-[#E8E7E4]/50">
                            <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="text-sm text-white font-medium">{benefit}</span>
                        </div>
                    ))}
                </div>

                {/* Pricing */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-[#E06847]/20 border border-emerald-500/50 rounded-xl p-4 mb-6 text-center">
                    <p className="text-xs text-[#5C5C5C] mb-1">Limited Time Offer</p>
                    <div className="text-4xl font-bold text-emerald-400 mb-1">
                        $4.99
                        <span className="text-lg text-[#5C5C5C]">/ week</span>
                    </div>
                    <p className="text-xs text-[#8C8C8C]">Cancel anytime</p>
                </div>

                {/* CTA Button */}
                <button
                    onClick={onUpgrade}
                    className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-[#E06847] hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-[#E06847]/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E06847]/60 animate-pulse-subtle"
                >
                    Upgrade to PRO
                </button>

                {/* Small Print */}
                <p className="text-xs text-center text-[#8C8C8C] mt-4">
                    Secure payment • No commitment • 7-day trial
                </p>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
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

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.8);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
