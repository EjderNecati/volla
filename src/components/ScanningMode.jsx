import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';

export default function ScanningMode({ selectedPlatform, onComplete, scannedImage }) {
  const [currentStatus, setCurrentStatus] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const statusMessages = [
    'Identifying Object...',
    `Scanning ${selectedPlatform} Trends...`,
    'Extracting High Volume Keywords...',
  ];

  useEffect(() => {
    // Cycle through status messages every second
    const statusInterval = setInterval(() => {
      setCurrentStatus((prev) => (prev + 1) % statusMessages.length);
    }, 1000);

    // Complete scanning after 3 seconds
    const completeTimer = setTimeout(() => {
      setIsComplete(true);
    }, 3000);

    return () => {
      clearInterval(statusInterval);
      clearTimeout(completeTimer);
    };
  }, [selectedPlatform]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Scanning Container */}
        <div className="relative">
          {/* Product Image with Blur */}
          <div className="relative rounded-2xl overflow-hidden bg-[#F5F4F1] border-2 border-[#E06847]/50 shadow-2xl shadow-[#E06847]/20">
            <img
              src={scannedImage || "/src/assets/product_placeholder.png"}
              alt="Product being scanned"
              className={`w-full h-80 object-cover transition-all duration-1000 ${isComplete ? 'blur-none' : 'blur-md'
                }`}
            />

            {/* Laser Scanner Animation */}
            {!isComplete && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="laser-line"></div>
              </div>
            )}

            {/* Scanning Grid Overlay */}
            {!isComplete && (
              <div className="absolute inset-0 bg-gradient-to-b from-[#E06847]/10 via-transparent to-[#E06847]/10 pointer-events-none">
                <div className="w-full h-full" style={{
                  backgroundImage: `
                    linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                }} />
              </div>
            )}
          </div>

          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#E06847]"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#E06847]"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#E06847]"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#E06847]"></div>
        </div>

        {/* Status Text */}
        <div className="text-center space-y-4">
          {!isComplete ? (
            <>
              {/* AI Status */}
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-[#E06847] rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-[#E06847] rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-[#E06847] rounded-full animate-pulse delay-150"></div>
              </div>

              {/* Dynamic Status Message */}
              <div className="min-h-[3rem] flex items-center justify-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-5 h-5 text-[#E06847]" />
                  {statusMessages[currentStatus]}
                </h3>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#E06847] to-purple-500 animate-progress"></div>
              </div>
            </>
          ) : (
            <>
              {/* Complete State */}
              <div className="flex items-center justify-center gap-2 text-emerald-400 animate-bounce-once">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-bold">Scan Complete!</span>
              </div>

              {/* Analysis Complete Button */}
              <button
                onClick={onComplete}
                className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-[#E06847] hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-[#E06847]/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E06847]/60"
              >
                View Analysis Results
              </button>
            </>
          )}
        </div>
      </div>

      {/* Custom Styles for Animations */}
      <style>{`
        .laser-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(139, 92, 246, 0.3),
            rgba(139, 92, 246, 1),
            rgba(139, 92, 246, 0.3),
            transparent
          );
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.8),
                      0 0 40px rgba(139, 92, 246, 0.6);
          animation: scan 2s ease-in-out infinite;
        }

        @keyframes scan {
          0%, 100% {
            top: 0;
          }
          50% {
            top: calc(100% - 3px);
          }
        }

        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        .animate-progress {
          animation: progress 3s ease-out forwards;
        }

        .delay-75 {
          animation-delay: 75ms;
        }

        .delay-150 {
          animation-delay: 150ms;
        }

        .animate-bounce-once {
          animation: bounce 0.6s ease-out;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
