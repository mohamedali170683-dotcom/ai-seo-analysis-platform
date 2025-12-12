// Tier Types and Constants

export type UserTier = "free" | "paid";

export interface TierLimits {
  maxQuestions: number;
  allowedStages: ("awareness" | "consideration" | "decision")[];
  allowedPlatforms: ("ChatGPT" | "Gemini" | "Copilot")[];
  testsPerQuestion: number;
  allowCompetitors: boolean;
  maxCompetitors: number;
  useRealSearchData: boolean;
  showDetailedRecommendations: boolean;
  showCodeSnippets: boolean;
  allowPdfExport: boolean;
  showFullTechnicalAudit: boolean;
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    maxQuestions: 3,
    allowedStages: ["awareness"],
    allowedPlatforms: ["ChatGPT"],
    testsPerQuestion: 1,
    allowCompetitors: false,
    maxCompetitors: 0,
    useRealSearchData: false,
    showDetailedRecommendations: false,
    showCodeSnippets: false,
    allowPdfExport: false,
    showFullTechnicalAudit: false,
  },
  paid: {
    maxQuestions: 18,
    allowedStages: ["awareness", "consideration", "decision"],
    allowedPlatforms: ["ChatGPT", "Gemini", "Copilot"],
    testsPerQuestion: 3,
    allowCompetitors: true,
    maxCompetitors: 2,
    useRealSearchData: true,
    showDetailedRecommendations: true,
    showCodeSnippets: true,
    allowPdfExport: true,
    showFullTechnicalAudit: true,
  },
};

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
  | "consideration"
  | "decision";

export interface UpgradeModalContent {
  headline: string;
  description: string;
  benefits?: string[];
}

export const UPGRADE_MODAL_CONTENT: Record<UpgradeModalTrigger, UpgradeModalContent> = {
  funnel_stages: {
    headline: "Unlock Full Funnel Analysis",
    description: "See how AI represents your brand from first discovery through purchase decision.",
    benefits: [
      "Awareness stage: How users discover your brand",
      "Consideration stage: How you compare to alternatives",
      "Decision stage: What drives final purchase decisions",
    ],
  },
  platforms: {
    headline: "Test All AI Platforms",
    description: "ChatGPT is only part of the picture. See how Gemini and Copilot discuss your brand.",
    benefits: [
      "ChatGPT (OpenAI) - Most popular AI assistant",
      "Google Gemini - Integrated with Google Search",
      "Microsoft Copilot - Built into Windows & Edge",
    ],
  },
  competitors: {
    headline: "Compare Against Competitors",
    description: "Discover if AI platforms recommend you or your competitors more often.",
    benefits: [
      "Track up to 2 competitors",
      "Side-by-side visibility comparison",
      "Identify competitive gaps in AI responses",
    ],
  },
  recommendations: {
    headline: "Get Your Fix Recommendations",
    description: "We found issues affecting your AI visibility. Get specific fixes with implementation guides.",
    benefits: [
      "Detailed action items for each issue",
      "Priority-ranked by impact",
      "Code snippets for technical fixes",
    ],
  },
  pdf_export: {
    headline: "Download Your Full Report",
    description: "Get a professional PDF report to share with your team or stakeholders.",
    benefits: [
      "Branded, shareable PDF format",
      "All insights and recommendations included",
      "Perfect for executive presentations",
    ],
  },
  question_limit: {
    headline: "Analyze More Questions",
    description: "Go deeper with up to 18 questions across the full customer journey.",
    benefits: [
      "Test 18 questions (vs 3 in free)",
      "Cover all customer journey stages",
      "More data = more reliable insights",
    ],
  },
  real_search_data: {
    headline: "Access Real Search Data",
    description: "See actual questions users search for, with monthly search volumes.",
    benefits: [
      "Real questions from search engines",
      "Monthly search volume data",
      "Prioritize high-impact questions",
    ],
  },
  technical_audit: {
    headline: "Get Full Technical Audit",
    description: "Receive detailed technical recommendations with implementation guides.",
    benefits: [
      "Specific schema markup recommendations",
      "Ready-to-use code snippets",
      "Priority-ranked fixes",
    ],
  },
  gemini: {
    headline: "Test on Google Gemini",
    description: "See how Google's AI assistant discusses your brand - critical for search visibility.",
    benefits: [
      "Google Gemini integration",
      "AI Overviews impact analysis",
      "Search-integrated AI insights",
    ],
  },
  copilot: {
    headline: "Test on Microsoft Copilot",
    description: "Understand your presence on Microsoft's AI platform used by millions.",
    benefits: [
      "Microsoft Copilot analysis",
      "Windows & Edge AI visibility",
      "Enterprise audience insights",
    ],
  },
  consideration: {
    headline: "Unlock Consideration Stage",
    description: "See how AI compares you to alternatives when users are evaluating options.",
    benefits: [
      "Comparison query analysis",
      "Competitive positioning insights",
      "Feature highlight recommendations",
    ],
  },
  decision: {
    headline: "Unlock Decision Stage",
    description: "Discover what AI says when users are ready to buy.",
    benefits: [
      "Purchase-intent query analysis",
      "Conversion opportunity insights",
      "Trust signal recommendations",
    ],
  },
};

// Booking URL - Update this with actual Calendly/booking link
export const BOOKING_URL = "https://calendly.com/your-agency/strategy-call";
export const LEARN_MORE_URL = "/services"; // Or external URL
