"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserTier, TierLimits, TIER_LIMITS } from "./types";

interface TierContextType {
  tier: UserTier;
  limits: TierLimits;
  setTier: (tier: UserTier) => void;
  isFeatureAllowed: (feature: keyof TierLimits) => boolean;
  isStageAllowed: (stage: "awareness" | "consideration" | "decision") => boolean;
  isPlatformAllowed: (platform: "ChatGPT" | "Gemini" | "Copilot") => boolean;
}

const TierContext = createContext<TierContextType | undefined>(undefined);

const TIER_STORAGE_KEY = "velaris_user_tier";

export function TierProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<UserTier>("free");

  // Load tier from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TIER_STORAGE_KEY);
    if (stored === "paid" || stored === "free") {
      setTierState(stored);
    }
  }, []);

  const setTier = (newTier: UserTier) => {
    setTierState(newTier);
    localStorage.setItem(TIER_STORAGE_KEY, newTier);
  };

  const limits = TIER_LIMITS[tier];

  const isFeatureAllowed = (feature: keyof TierLimits): boolean => {
    const value = limits[feature];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };

  const isStageAllowed = (stage: "awareness" | "consideration" | "decision"): boolean => {
    return limits.allowedStages.includes(stage);
  };

  const isPlatformAllowed = (platform: "ChatGPT" | "Gemini" | "Copilot"): boolean => {
    return limits.allowedPlatforms.includes(platform);
  };

  return (
    <TierContext.Provider
      value={{
        tier,
        limits,
        setTier,
        isFeatureAllowed,
        isStageAllowed,
        isPlatformAllowed,
      }}
    >
      {children}
    </TierContext.Provider>
  );
}

export function useTier() {
  const context = useContext(TierContext);
  if (context === undefined) {
    throw new Error("useTier must be used within a TierProvider");
  }
  return context;
}
