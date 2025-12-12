"use client";

import { X, Lock, Sparkles, Calendar, ArrowRight } from "lucide-react";
import { 
  UpgradeModalTrigger, 
  UPGRADE_MODAL_CONTENT, 
  BOOKING_URL,
  LEARN_MORE_URL 
} from "@/lib/tier/types";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: UpgradeModalTrigger;
}

export function UpgradeModal({ isOpen, onClose, trigger }: UpgradeModalProps) {
  if (!isOpen) return null;

  const content = UPGRADE_MODAL_CONTENT[trigger];

  const handleBookCall = () => {
    window.open(BOOKING_URL, "_blank");
  };

  const handleLearnMore = () => {
    window.open(LEARN_MORE_URL, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 rounded-full p-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              Full AI Visibility Audit
            </span>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{content.headline}</h2>
          <p className="text-white/90">{content.description}</p>
        </div>

        {/* Benefits */}
        {content.benefits && content.benefits.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              What You&apos;ll Get
            </h3>
            <ul className="space-y-3">
              {content.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-1 mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA Section */}
        <div className="p-6 bg-gray-50">
          <button
            onClick={handleBookCall}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Calendar className="w-5 h-5" />
            Book a Free Strategy Call
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            No commitment required. We&apos;ll discuss your AI visibility goals.
          </p>
          
          <button
            onClick={handleLearnMore}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-3"
          >
            Learn more about our services →
          </button>
        </div>
      </div>
    </div>
  );
}

// Premium Badge Component for reuse
export function PremiumBadge({ 
  size = "sm",
  className = "" 
}: { 
  size?: "sm" | "md"; 
  className?: string;
}) {
  return (
    <span className={`
      inline-flex items-center gap-1 
      ${size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"}
      bg-gradient-to-r from-amber-100 to-yellow-100 
      text-amber-700 font-medium rounded-full
      border border-amber-200
      ${className}
    `}>
      <Sparkles className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      Premium
    </span>
  );
}

// Lock Overlay Component for locked sections
export function LockOverlay({ 
  onClick,
  message = "Included in Full Audit"
}: { 
  onClick: () => void;
  message?: string;
}) {
  return (
    <div 
      className="absolute inset-0 bg-gray-100/80 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer z-10 rounded-lg"
      onClick={onClick}
    >
      <div className="bg-white rounded-full p-3 shadow-lg mb-2">
        <Lock className="w-6 h-6 text-gray-400" />
      </div>
      <span className="text-sm font-medium text-gray-600">{message}</span>
      <span className="text-xs text-blue-600 mt-1">Click to unlock →</span>
    </div>
  );
}

// Blurred Content Wrapper
export function BlurredContent({ 
  children, 
  isLocked,
  onClick,
  message
}: { 
  children: React.ReactNode;
  isLocked: boolean;
  onClick: () => void;
  message?: string;
}) {
  if (!isLocked) return <>{children}</>;
  
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>
      <LockOverlay onClick={onClick} message={message} />
    </div>
  );
}
