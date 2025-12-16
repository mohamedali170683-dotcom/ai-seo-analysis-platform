// 3-Tier Pricing Model Types and Constants
// Based on behavioral science principles for client acquisition
// KEY INSIGHT: Free tier sees FULL PROBLEM (all platforms + full funnel), but cannot access SOLUTION (recommendations)
// "High Value Acquisition" strategy: Show real pain points, blur the fixes

export type UserTier = "free" | "professional" | "partner";
export type BillingCycle = "monthly" | "annual";
export type PurchaseType = "subscription" | "one_time";

export interface TierLimits {
  // Platform access - ALL tiers get all platforms now
  platforms: ("ChatGPT" | "Gemini" | "Copilot" | "Perplexity")[];
  
  // Analysis limits
  maxQuestions: number;
  allowedStages: ("awareness" | "consideration" | "decision")[];
  testsPerQuestion: number;
  maxCompetitors: number;
  analysesPerMonth: number;
  maxBrands: number;
  
  // Feature flags - THE KEY GATES (Blur Strategy)
  useRealSearchData: boolean;  // TRUE for all - show real pain points
  showDetailedRecommendations: boolean;  // THE PRIMARY GATE - Free sees issues, not fixes
  showDeepDiveDetails: boolean;  // NEW: Specific questions/keywords missed
  showCodeSnippets: boolean;
  allowPdfExport: boolean;
  saveResults: boolean;  // Can save to dashboard
  allowApiAccess: boolean;
  allowWhiteLabel: boolean;
  
  // Monitoring
  monitoringFrequency: "none" | "weekly" | "daily";
  
  // Team
  maxTeamMembers: number;
  
  // Support
  supportLevel: "email" | "email_chat" | "priority_dedicated";
  
  // Advisory (Partner only)
  includesStrategyCalls: boolean;
  includesImplementationSupport: boolean;
  includesSlackAccess: boolean;
  includesDedicatedManager: boolean;
}

export interface TierPricing {
  monthly: number;
  annual: number;
  annualSavings: number;
  oneTimeReport: number;  // NEW: One-time report purchase option
  currency: string;
}

export const TIER_PRICING: Record<UserTier, TierPricing> = {
  free: {
    monthly: 0,
    annual: 0,
    annualSavings: 0,
    oneTimeReport: 0,
    currency: "EUR",
  },
  professional: {
    monthly: 600,  // UPDATED: €600/month (high anchor price)
    annual: 6000,  // 2 months free
    annualSavings: 1200,
    oneTimeReport: 199,  // NEW: €199 one-time report option
    currency: "EUR",
  },
  partner: {
    monthly: 2990,
    annual: 32890, // 1 month free (11 months)
    annualSavings: 2990,
    oneTimeReport: 0, // Not applicable
    currency: "EUR",
  },
};

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    // "HIGH VALUE ACQUISITION" - Free tier sees the FULL PROBLEM
    // ALL platforms + ALL funnel stages + REAL data = maximum pain point visibility
    platforms: ["ChatGPT", "Gemini", "Copilot", "Perplexity"],  // ALL 4 platforms
    maxQuestions: 9,  // 3 per stage (awareness, consideration, decision)
    allowedStages: ["awareness", "consideration", "decision"],  // FULL FUNNEL
    testsPerQuestion: 1,
    maxCompetitors: 1,
    analysesPerMonth: 3,  // Allow a few analyses to build habit
    maxBrands: 1,
    // THE KEY GATES - see problem, NOT solution (Blur Strategy)
    useRealSearchData: true,  // YES - show real pain points
    showDetailedRecommendations: false,  // BLURRED - "7 issues found" but not the fixes
    showDeepDiveDetails: false,  // BLURRED - specific questions/keywords hidden
    showCodeSnippets: false,  // LOCKED
    allowPdfExport: false,  // LOCKED
    saveResults: false,  // Must sign up to save
    allowApiAccess: false,
    allowWhiteLabel: false,
    monitoringFrequency: "none",
    maxTeamMembers: 1,
    supportLevel: "email",
    includesStrategyCalls: false,
    includesImplementationSupport: false,
    includesSlackAccess: false,
    includesDedicatedManager: false,
  },
  professional: {
    // "ILLUSION OF FULL AUDIT" - Remove all caps
    platforms: ["ChatGPT", "Gemini", "Copilot", "Perplexity"],
    maxQuestions: Infinity,  // UNLIMITED
    allowedStages: ["awareness", "consideration", "decision"],
    testsPerQuestion: 3,
    maxCompetitors: 10,  // Up to 10 competitors
    analysesPerMonth: Infinity,  // UNLIMITED
    maxBrands: 3,
    useRealSearchData: true,
    showDetailedRecommendations: true,  // UNLOCKED
    showDeepDiveDetails: true,  // UNLOCKED
    showCodeSnippets: true,
    allowPdfExport: true,
    saveResults: true,
    allowApiAccess: false,
    allowWhiteLabel: false,
    monitoringFrequency: "weekly",
    maxTeamMembers: 1,
    supportLevel: "email_chat",
    includesStrategyCalls: false,
    includesImplementationSupport: false,
    includesSlackAccess: false,
    includesDedicatedManager: false,
  },
  partner: {
    platforms: ["ChatGPT", "Gemini", "Copilot", "Perplexity"],
    maxQuestions: Infinity,
    allowedStages: ["awareness", "consideration", "decision"],
    testsPerQuestion: 3,
    maxCompetitors: Infinity,
    analysesPerMonth: Infinity,
    maxBrands: Infinity,
    useRealSearchData: true,
    showDetailedRecommendations: true,
    showDeepDiveDetails: true,
    showCodeSnippets: true,
    allowPdfExport: true,
    saveResults: true,
    allowApiAccess: true,
    allowWhiteLabel: true,
    monitoringFrequency: "daily",
    maxTeamMembers: 10,
    supportLevel: "priority_dedicated",
    includesStrategyCalls: true,
    includesImplementationSupport: true,
    includesSlackAccess: true,
    includesDedicatedManager: true,
  },
};

export const TIER_NAMES: Record<UserTier, { name: string; tagline: string; badge?: string }> = {
  free: {
    name: "AI Visibility Check",
    tagline: "See if you have a problem",
  },
  professional: {
    name: "Full AI Visibility Platform",
    tagline: "The smart choice for serious brands",
    badge: "Most Popular",
  },
  partner: {
    name: "AI Visibility Partner",
    tagline: "For teams who want results, not just data",
  },
};

// Upgrade modal trigger types - Blur Strategy focused gating
export type UpgradeModalTrigger =
  | "recommendations" // Primary gate - see issues, unlock fixes
  | "deep_dive" // NEW: Specific questions/keywords missed
  | "actionable_insights" // NEW: Actionable insights blurred
  | "code_snippets"
  | "pdf_export"
  | "save_results"
  | "email_unlock" // NEW: Lead magnet - unlock one detail for email
  | "funnel_stages"
  | "consideration"
  | "decision"
  | "question_limit"
  | "competitor_limit"
  | "competitors" // Alias for competitor_limit
  | "analysis_limit"
  | "api_access"
  | "white_label"
  | "team_management"
  | "technical_audit"; // Technical recommendations lock

export interface UpgradeModalContent {
  headline: string;
  description: string;
  keyMessage: string;
}

export const UPGRADE_MODAL_CONTENT: Record<UpgradeModalTrigger, UpgradeModalContent> = {
  recommendations: {
    headline: "Unlock Your Fix Recommendations",
    description: "You've identified optimization opportunities. Get the detailed fixes with implementation code.",
    keyMessage: "See exactly what to fix and how",
  },
  deep_dive: {
    headline: "Unlock Deep Dive Details",
    description: "See the specific questions and keywords where you're losing visibility to competitors.",
    keyMessage: "Know exactly what you're missing",
  },
  actionable_insights: {
    headline: "Unlock Actionable Insights",
    description: "Get step-by-step recommendations with implementation guides to fix your visibility gaps.",
    keyMessage: "From diagnosis to solution",
  },
  code_snippets: {
    headline: "Get Implementation Code",
    description: "Copy-paste ready fixes for your development team. Schema markup, meta tags, and more.",
    keyMessage: "Ready-to-use code for developers",
  },
  pdf_export: {
    headline: "Download Your Report",
    description: "Get a professional PDF to share with your team or stakeholders.",
    keyMessage: "Shareable, presentation-ready format",
  },
  save_results: {
    headline: "Save & Track Your Results",
    description: "Build a history of your AI visibility over time. See what's improving.",
    keyMessage: "Track progress across analyses",
  },
  email_unlock: {
    headline: "Unlock Top 10 Missed Questions",
    description: "Enter your email to reveal the top questions where competitors are beating you.",
    keyMessage: "Quick win: See what you're missing",
  },
  funnel_stages: {
    headline: "Unlock Full Journey Analysis",
    description: "See how AI influences your customers from discovery to purchase decision.",
    keyMessage: "Awareness → Consideration → Decision",
  },
  consideration: {
    headline: "Unlock Consideration Stage",
    description: "See how AI compares you to alternatives when users are evaluating options.",
    keyMessage: "Critical for competitive positioning",
  },
  decision: {
    headline: "Unlock Decision Stage",
    description: "Discover what AI says when users are ready to buy.",
    keyMessage: "Where recommendations drive conversions",
  },
  question_limit: {
    headline: "Analyze Unlimited Questions",
    description: "Go deeper with unlimited queries across the full customer journey.",
    keyMessage: "No limits on your analysis",
  },
  competitor_limit: {
    headline: "Compare More Competitors",
    description: "Track up to 10 competitors. Know exactly where you stand.",
    keyMessage: "Full competitive landscape",
  },
  competitors: {
    headline: "Compare More Competitors",
    description: "See detailed competitive analysis with up to 10 competitors.",
    keyMessage: "Full competitive landscape",
  },
  analysis_limit: {
    headline: "Run Unlimited Analyses",
    description: "You've used your monthly analysis. Upgrade for unlimited analyses.",
    keyMessage: "Analyze as often as you need",
  },
  api_access: {
    headline: "API Access",
    description: "Integrate AI visibility data into your own tools and dashboards.",
    keyMessage: "Full programmatic access",
  },
  white_label: {
    headline: "White-Label Reports",
    description: "Remove Velaris branding and add your own for client-ready reports.",
    keyMessage: "Perfect for agencies",
  },
  team_management: {
    headline: "Team Access",
    description: "Invite up to 10 team members with role-based access.",
    keyMessage: "Collaborate across your organization",
  },
  technical_audit: {
    headline: "Unlock Technical Recommendations",
    description: "Get detailed fixes for technical SEO issues affecting your AI visibility.",
    keyMessage: "Schema markup, robots.txt, and content fixes",
  },
};

// URLs - Placeholder for now
export const BOOKING_URLS = {
  demo: "/book-demo", // Professional tier demo
  strategyCall: "/book-strategy-call", // Partner tier
  checkout: "/checkout", // Stripe checkout
};

export const SUPPORT_EMAIL = "support@velaris.ai";
export const TRIAL_DAYS = 14;

// Stripe Product IDs (placeholders)
export const STRIPE_PRICES = {
  professional_monthly: "price_professional_monthly",
  professional_annual: "price_professional_annual",
  partner_monthly: "price_partner_monthly",
  partner_annual: "price_partner_annual",
};
