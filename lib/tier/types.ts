// 3-Tier Pricing Model Types and Constants
// Based on behavioral science principles for client acquisition

export type UserTier = "free" | "professional" | "partner";
export type BillingCycle = "monthly" | "annual";

export interface TierLimits {
  // Platform access
  platforms: ("ChatGPT" | "Gemini" | "Copilot" | "Perplexity")[];
  
  // Analysis limits
  maxQuestions: number;
  allowedStages: ("awareness" | "consideration" | "decision")[];
  testsPerQuestion: number;
  maxCompetitors: number;
  analysesPerMonth: number;
  maxBrands: number;
  
  // Feature flags
  useRealSearchData: boolean;
  showDetailedRecommendations: boolean;
  showCodeSnippets: boolean;
  allowPdfExport: boolean;
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
  currency: string;
}

export const TIER_PRICING: Record<UserTier, TierPricing> = {
  free: {
    monthly: 0,
    annual: 0,
    annualSavings: 0,
    currency: "EUR",
  },
  professional: {
    monthly: 299,
    annual: 2990, // 2 months free
    annualSavings: 598,
    currency: "EUR",
  },
  partner: {
    monthly: 2990,
    annual: 32890, // 1 month free (11 months)
    annualSavings: 2990,
    currency: "EUR",
  },
};

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    platforms: ["ChatGPT"],
    maxQuestions: 3,
    allowedStages: ["awareness"],
    testsPerQuestion: 1,
    maxCompetitors: 1, // View comparison only
    analysesPerMonth: 1,
    maxBrands: 1,
    useRealSearchData: false,
    showDetailedRecommendations: false,
    showCodeSnippets: false,
    allowPdfExport: false,
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
    platforms: ["ChatGPT", "Gemini", "Copilot", "Perplexity"],
    maxQuestions: 18,
    allowedStages: ["awareness", "consideration", "decision"],
    testsPerQuestion: 3,
    maxCompetitors: 3,
    analysesPerMonth: 5,
    maxBrands: 3,
    useRealSearchData: true,
    showDetailedRecommendations: true,
    showCodeSnippets: true,
    allowPdfExport: true,
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
    maxCompetitors: 10,
    analysesPerMonth: Infinity,
    maxBrands: Infinity,
    useRealSearchData: true,
    showDetailedRecommendations: true,
    showCodeSnippets: true,
    allowPdfExport: true,
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

// Upgrade modal trigger types
export type UpgradeModalTrigger =
  | "funnel_stages"
  | "platforms"
  | "competitors"
  | "recommendations"
  | "pdf_export"
  | "question_limit"
  | "real_search_data"
  | "technical_audit"
  | "gemini"
  | "copilot"
  | "perplexity"
  | "consideration"
  | "decision"
  | "analysis_limit"
  | "code_snippets"
  | "api_access"
  | "white_label";

export interface UpgradeModalContent {
  headline: string;
  description: string;
  keyMessage: string;
}

export const UPGRADE_MODAL_CONTENT: Record<UpgradeModalTrigger, UpgradeModalContent> = {
  platforms: {
    headline: "Test All 4 AI Platforms",
    description: "ChatGPT is only 25% of the picture. See how Gemini, Copilot, and Perplexity represent your brand.",
    keyMessage: "Complete coverage of the AI landscape",
  },
  funnel_stages: {
    headline: "Unlock Full Journey Analysis",
    description: "See how AI influences your customers from discovery to purchase decision.",
    keyMessage: "Awareness → Consideration → Decision",
  },
  competitors: {
    headline: "Compare Against Competitors",
    description: "Know exactly where you stand. See who AI recommends more.",
    keyMessage: "Track up to 3 competitors side-by-side",
  },
  recommendations: {
    headline: "Get Your Fix Recommendations",
    description: "We found issues affecting your AI visibility. Get specific fixes with implementation code.",
    keyMessage: "Actionable optimization roadmap",
  },
  pdf_export: {
    headline: "Download Your Report",
    description: "Get a professional PDF to share with your team or stakeholders.",
    keyMessage: "Shareable, presentation-ready format",
  },
  question_limit: {
    headline: "Go Deeper with 18 Questions",
    description: "Analyze more queries across the full customer journey.",
    keyMessage: "6x more questions for comprehensive analysis",
  },
  real_search_data: {
    headline: "Access Real Search Data",
    description: "See actual questions users search for, with monthly search volumes.",
    keyMessage: "Real data from DataForSEO",
  },
  technical_audit: {
    headline: "Get Full Technical Audit",
    description: "Receive detailed technical recommendations with implementation guides.",
    keyMessage: "Code snippets included",
  },
  gemini: {
    headline: "Test on Google Gemini",
    description: "See how Google's AI assistant discusses your brand - critical for search visibility.",
    keyMessage: "Integrated with Google Search & AI Overviews",
  },
  copilot: {
    headline: "Test on Microsoft Copilot",
    description: "Understand your presence on Microsoft's AI platform used by millions.",
    keyMessage: "Built into Windows, Edge, and Office",
  },
  perplexity: {
    headline: "Test on Perplexity",
    description: "See how this fast-growing AI search engine represents your brand.",
    keyMessage: "The AI-native search experience",
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
  analysis_limit: {
    headline: "Run More Analyses",
    description: "You've used your monthly analysis. Upgrade for 5/month.",
    keyMessage: "Track changes over time",
  },
  code_snippets: {
    headline: "Get Implementation Code",
    description: "Ready-to-use code snippets for schema markup and technical fixes.",
    keyMessage: "Copy-paste implementation",
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
