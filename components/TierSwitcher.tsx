"use client";

import { useTier } from "@/lib/tier";
import { UserTier, TIER_NAMES } from "@/lib/tier/types";
import { Settings, X } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Development-only tier switcher for prototype testing.
 * Allows quickly switching between tiers to see UI behavior.
 * Hidden on WPP demo page (/wpp-demo).
 */
export function TierSwitcher() {
  const { tier, setTier } = useTier();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  // Hide on WPP demo page
  if (pathname?.startsWith("/wpp-demo")) {
    return null;
  }

  const tiers: UserTier[] = ["free", "professional", "partner"];

  const tierColors: Record<UserTier, string> = {
    free: "bg-gray-100 text-gray-700 border-gray-300",
    professional: "bg-blue-100 text-blue-700 border-blue-300",
    partner: "bg-amber-100 text-amber-700 border-amber-300",
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition-all"
        title="Switch Tier (Prototype Mode)"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold mb-2">
                🧪 Prototype Mode
              </div>
              <h3 className="text-lg font-bold text-gray-900">Switch Tier</h3>
              <p className="text-sm text-gray-500">
                Test how the UI behaves for different user tiers
              </p>
            </div>

            <div className="space-y-2">
              {tiers.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTier(t);
                    setIsOpen(false);
                  }}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    tier === t 
                      ? `${tierColors[t]} ring-2 ring-offset-2 ring-blue-500` 
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 capitalize">{t}</div>
                      <div className="text-xs text-gray-500">{TIER_NAMES[t].name}</div>
                    </div>
                    {tier === t && (
                      <span className="text-green-600 text-sm font-bold">Active</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              This switcher is for prototype testing only.
              <br />
              In production, tier is set by subscription.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
