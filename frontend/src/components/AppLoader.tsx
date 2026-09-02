import { useState, useEffect } from 'react';
import { Command } from 'lucide-react';

const LOADING_MESSAGES = [
  "Initializing workspace...",
  "Checking your session...",
  "Loading your dashboard..."
];

export default function AppLoader() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ops-bg-base font-sans">
      <div className="flex flex-col items-center max-w-[240px] w-full">
        {/* Logomark & Wordmark */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded bg-ops-primary flex items-center justify-center text-white">
            <Command size={18} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-ops-text-primary">
            OpsDesk
          </h1>
        </div>

        {/* Thin Indeterminate Progress Bar */}
        <div className="w-full h-[2px] bg-ops-border-default rounded-full overflow-hidden mb-4 relative">
          <div className="absolute top-0 left-0 h-full bg-ops-primary animate-sweep"></div>
        </div>

        {/* Rotating Status Text */}
        <div className="h-4">
          <p className="text-[11px] font-medium text-ops-text-muted animate-pulse">
            {LOADING_MESSAGES[messageIndex]}
          </p>
        </div>
      </div>

      {/* Bottom Text */}
      <div className="absolute bottom-6 text-[10px] text-ops-text-muted font-medium tracking-wide">
        OpsDesk Operations Portal &middot; v1.0
      </div>

      <style>{`
        @keyframes sweep {
          0% { width: 0%; left: -20%; }
          50% { width: 40%; }
          100% { width: 0%; left: 120%; }
        }
        .animate-sweep {
          animation: sweep 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
