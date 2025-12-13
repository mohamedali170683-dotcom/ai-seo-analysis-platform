"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserTier, TierLimits, TIER_LIMITS, BillingCycle } from "./types";

interface UserSubscription {
  tier: UserTier;
  billingCycle: BillingCycle | null;
  trialEndsAt: Date | null;
  isTrialing: boolean;
  analysesUsedThisMonth: number;
  analysesResetAt: Date | null;
}

interface TierContextType {
  // User state
  tier: UserTier;
  limits: TierLimits;
  subscription: UserSubscription;
  userEmail: string | null;
  
  // Setters
  setTier: (tier: UserTier) => void;
  setUserEmail: (email: string) => void;
  incrementAnalysesUsed: () => void;
  
  // Checks
  isFeatureAllowed: (feature: keyof TierLimits) => boolean;
  isStageAllowed: (stage: "awareness" | "consideration" | "decision") => boolean;
  isPlatformAllowed: (platform: "ChatGPT" | "Gemini" | "Copilot" | "Perplexity") => boolean;
  canRunAnalysis: () => boolean;
  getRemainingAnalyses: () => number;
  
  // Tier comparisons
  isProfessionalOrHigher: () => boolean;
  isPartner: () => boolean;
}

const TierContext = createContext<TierContextType | undefined>(undefined);

const TIER_STORAGE_KEY = "velaris_user_tier";
const EMAIL_STORAGE_KEY = "velaris_user_email";
const ANALYSES_STORAGE_KEY = "velaris_analyses_used";
const ANALYSES_RESET_KEY = "velaris_analyses_reset";

export function TierProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<UserTier>("free");
  const [userEmail, setUserEmailState] = useState<string | null>(null);
  const [analysesUsed, setAnalysesUsed] = useState(0);
  const [analysesResetAt, setAnalysesResetAt] = useState<Date | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const storedTier = localStorage.getItem(TIER_STORAGE_KEY);
    if (storedTier === "professional" || storedTier === "partner" || storedTier === "free") {
      setTierState(storedTier);
    }
    
    const storedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (storedEmail) {
      setUserEmailState(storedEmail);
    }
    
    const storedAnalyses = localStorage.getItem(ANALYSES_STORAGE_KEY);
    if (storedAnalyses) {
      setAnalysesUsed(parseInt(storedAnalyses, 10));
    }
    
    const storedReset = localStorage.getItem(ANALYSES_RESET_KEY);
    if (storedReset) {
      const resetDate = new Date(storedReset);
      // Check if we need to reset the counter (new month)
      if (new Date() > resetDate) {
        setAnalysesUsed(0);
        const nextReset = new Date();
        nextReset.setMonth(nextReset.getMonth() + 1);
        nextReset.setDate(1);
        nextReset.setHours(0, 0, 0, 0);
        setAnalysesResetAt(nextReset);
        localStorage.setItem(ANALYSES_STORAGE_KEY, "0");
        localStorage.setItem(ANALYSES_RESET_KEY, nextReset.toISOString());
      } else {
        setAnalysesResetAt(resetDate);
      }
    } else {
      // Initialize reset date
      const nextReset = new Date();
      nextReset.setMonth(nextReset.getMonth() + 1);
      nextReset.setDate(1);
      nextReset.setHours(0, 0, 0, 0);
      setAnalysesResetAt(nextReset);
      localStorage.setItem(ANALYSES_RESET_KEY, nextReset.toISOString());
    }
  }, []);

  const setTier = (newTier: UserTier) => {
    setTierState(newTier);
    localStorage.setItem(TIER_STORAGE_KEY, newTier);
  };

  const setUserEmail = (email: string) => {
    setUserEmailState(email);
    localStorage.setItem(EMAIL_STORAGE_KEY, email);
  };

  const incrementAnalysesUsed = () => {
    const newCount = analysesUsed + 1;
    setAnalysesUsed(newCount);
    localStorage.setItem(ANALYSES_STORAGE_KEY, newCount.toString());
  };

  const limits = TIER_LIMITS[tier];

  const subscription: UserSubscription = {
    tier,
    billingCycle: tier === "free" ? null : "monthly", // Default assumption
    trialEndsAt: null, // Would come from backend
    isTrialing: false,
    analysesUsedThisMonth: analysesUsed,
    analysesResetAt,
  };

  const isFeatureAllowed = (feature: keyof TierLimits): boolean => {
    const value = limits[feature];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0 && value !== Infinity ? true : value === Infinity;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };

  const isStageAllowed = (stage: "awareness" | "consideration" | "decision"): boolean => {
    return limits.allowedStages.includes(stage);
  };

  const isPlatformAllowed = (platform: "ChatGPT" | "Gemini" | "Copilot" | "Perplexity"): boolean => {
    return limits.platforms.includes(platform);
  };

  const canRunAnalysis = (): boolean => {
    if (limits.analysesPerMonth === Infinity) return true;
    return analysesUsed < limits.analysesPerMonth;
  };

  const getRemainingAnalyses = (): number => {
    if (limits.analysesPerMonth === Infinity) return Infinity;
    return Math.max(0, limits.analysesPerMonth - analysesUsed);
  };

  const isProfessionalOrHigher = (): boolean => {
    return tier === "professional" || tier === "partner";
  };

  const isPartner = (): boolean => {
    return tier === "partner";
  };

  return (
    <TierContext.Provider
      value={{
        tier,
        limits,
        subscription,
        userEmail,
        setTier,
        setUserEmail,
        incrementAnalysesUsed,
        isFeatureAllowed,
        isStageAllowed,
        isPlatformAllowed,
        canRunAnalysis,
        getRemainingAnalyses,
        isProfessionalOrHigher,
        isPartner,
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
