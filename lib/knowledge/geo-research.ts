/**
 * GEO Research Knowledge Base
 *
 * Evidence-graded recommendations for AI visibility optimization based on:
 * - Princeton/IIT Delhi GEO study (KDD 2024) — peer-reviewed
 * - Profound citation analysis (680M citations)
 * - Seer Interactive content freshness study
 * - Ahrefs AI Overview analysis (1.9M citations)
 * - MERJ crawler verification (500M+ requests)
 * - Documented case studies (Ramp, Go Fish Digital, Mint Studios)
 *
 * Evidence Tiers:
 *   Tier 1 = Peer-reviewed or officially confirmed
 *   Tier 2 = Large-dataset industry evidence
 *   Tier 3 = Practitioner hypotheses
 */

// ─── Evidence Tiers ──────────────────────────────────────────────

export type EvidenceTier = 1 | 2 | 3;

export interface ResearchFinding {
  tactic: string;
  impact: string;
  impactPct: number | null;
  source: string;
  tier: EvidenceTier;
  harmful?: boolean;
}

// ─── Proven Tactics (sorted by impact) ───────────────────────────

export const GEO_TACTICS: ResearchFinding[] = [
  {
    tactic: "Adding expert quotations to content",
    impact: "+40.9% visibility improvement",
    impactPct: 40.9,
    source: "Princeton/IIT Delhi GEO study, KDD 2024",
    tier: 1,
  },
  {
    tactic: "Including statistics and data points",
    impact: "+30.6% visibility improvement",
    impactPct: 30.6,
    source: "Princeton/IIT Delhi GEO study, KDD 2024",
    tier: 1,
  },
  {
    tactic: "Fluency optimization (clear, well-written prose)",
    impact: "+28.0% visibility improvement",
    impactPct: 28.0,
    source: "Princeton/IIT Delhi GEO study, KDD 2024",
    tier: 1,
  },
  {
    tactic: "Citing authoritative sources",
    impact: "+27.5% visibility improvement",
    impactPct: 27.5,
    source: "Princeton/IIT Delhi GEO study, KDD 2024",
    tier: 1,
  },
  {
    tactic: "Implementing FAQPage schema markup",
    impact: "2.7x citation rate improvement (41% vs 15%)",
    impactPct: 170, // 2.7x = ~170% improvement
    source: "Relixir study (n=50 websites)",
    tier: 1,
  },
  {
    tactic: "Authoritative writing tone",
    impact: "+10.4% visibility improvement",
    impactPct: 10.4,
    source: "Princeton/IIT Delhi GEO study, KDD 2024",
    tier: 1,
  },
  {
    tactic: "Schema markup (JSON-LD) for content structure",
    impact: "Confirmed by Microsoft and Google to help LLM understanding",
    impactPct: null,
    source: "Microsoft (SMX Munich 2025), Google (Search Central Live NY)",
    tier: 1,
  },
  {
    tactic: "Server-side rendering (SSR) for all content",
    impact: "Mandatory — no AI crawler executes JavaScript",
    impactPct: null,
    source: "MERJ verification (500M+ GPTBot requests)",
    tier: 1,
  },
  {
    tactic: "Keyword stuffing",
    impact: "-8.3% visibility (harmful)",
    impactPct: -8.3,
    source: "Princeton/IIT Delhi GEO study, KDD 2024",
    tier: 1,
    harmful: true,
  },
];

// ─── Platform-Specific Insights ──────────────────────────────────

export interface PlatformInsight {
  platform: string;
  keyFindings: string[];
  topSources: { source: string; share: string }[];
  technicalRequirements: string[];
  contentStrategy: string[];
  uniqueAdvantage: string;
}

export const PLATFORM_INSIGHTS: Record<string, PlatformInsight> = {
  ChatGPT: {
    platform: "ChatGPT",
    keyFindings: [
      "Relies on Microsoft Bing's infrastructure for search",
      "Wikipedia accounts for 47.9% of top citations",
      "Reddit accounts for 11.3% of top citations",
      "E-E-A-T framework strongly influences source selection",
      "75%+ of health-related citations from institutional sources",
      "Preferred publisher partnerships (Washington Post, FT, Condé Nast, Reddit)",
    ],
    topSources: [
      { source: "Wikipedia", share: "47.9%" },
      { source: "Reddit", share: "11.3%" },
    ],
    technicalRequirements: [
      "Allow OAI-SearchBot in robots.txt for search visibility",
      "Optimize for Bing (ChatGPT search relies on Bing index)",
      "Ensure content is server-side rendered (GPTBot doesn't execute JS)",
    ],
    contentStrategy: [
      "Create Wikipedia-style authoritative, neutral-tone content",
      "Build encyclopedic depth on core topics with proper sourcing",
      "Demonstrate E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness",
      "Include expert credentials and author attribution",
    ],
    uniqueAdvantage: "Strong institutional bias — brands with Wikipedia presence and authoritative, well-sourced content gain disproportionate visibility.",
  },

  Perplexity: {
    platform: "Perplexity",
    keyFindings: [
      "Real-time search aggregator, not static training data",
      "Reddit dominates citations at 46.7% of top sources",
      "YouTube accounts for 11.11% of citations",
      "Content freshness decay begins 2-3 days after publication",
      "Always cites exactly 5 sources per response",
      "Content not refreshed quarterly is 3x more likely to lose citations",
    ],
    topSources: [
      { source: "Reddit", share: "46.7%" },
      { source: "YouTube", share: "11.11%" },
    ],
    technicalRequirements: [
      "Allow PerplexityBot in robots.txt",
      "Maintain aggressive content update cadence",
      "Include explicit timestamps ('as of January 2026')",
      "Add lastmod tags in XML sitemaps with accurate dates",
    ],
    contentStrategy: [
      "Prioritize content freshness — update key pages at least quarterly",
      "Build Reddit community presence and engagement",
      "Create video content on YouTube for additional citation surface",
      "Include 'last updated' dates visibly on pages",
    ],
    uniqueAdvantage: "Freshness-first platform — brands that update content frequently and maintain Reddit/YouTube presence gain a significant edge.",
  },

  Gemini: {
    platform: "Gemini (Google AI Overviews)",
    keyFindings: [
      "76% of AI Overview citations come from pages ranking in Google's top 10",
      "Ranking #1 gives only 53% probability of appearing in AI Overviews",
      "Median cited position is #2 — top-3 positions have meaningful advantage",
      "Knowledge Graph entities receive 60% more citations",
      "Google Business Profile is primary data feed for local AI queries",
    ],
    topSources: [
      { source: "Top-10 organic results", share: "76%" },
      { source: "Knowledge Graph entities", share: "+60% citation boost" },
    ],
    technicalRequirements: [
      "Allow Google-Extended in robots.txt",
      "Optimize for traditional Google SEO (top-10 is prerequisite)",
      "Create/optimize Wikidata entry for brand entity recognition",
      "Maintain and optimize Google Business Profile",
    ],
    contentStrategy: [
      "Focus on traditional SEO fundamentals — ranking top-10 is the gateway",
      "Optimize Wikidata entry with sameAs links to official profiles",
      "Maintain comprehensive Google Business Profile with reviews",
      "Use structured data to strengthen Knowledge Graph presence",
    ],
    uniqueAdvantage: "Traditional SEO is foundational — brands ranking in Google's top 10 have a massive head start. Knowledge Graph presence adds a 60% citation boost.",
  },

  Copilot: {
    platform: "Microsoft Copilot",
    keyFindings: [
      "Emphasizes block-level content parsing (headers, paragraphs, lists, tables)",
      "Each content block is an independent citation signal",
      "Draws from Bing's index (desktop-first indexing)",
      "LinkedIn content appears faster in Copilot results",
      "Social signals (especially Facebook) influence ranking more than Google",
    ],
    topSources: [
      { source: "Bing index", share: "Primary" },
      { source: "LinkedIn", share: "Accelerated indexing" },
    ],
    technicalRequirements: [
      "Verify site in Bing Webmaster Tools",
      "Implement IndexNow for faster content indexing",
      "Ensure desktop rendering is optimized (desktop-first, not mobile-first)",
      "Use clear section headers with immediate answers (1-3 sentences)",
    ],
    contentStrategy: [
      "Structure content in clear, modular blocks with mini-titles",
      "Follow each header with a direct 1-3 sentence answer",
      "Optimize LinkedIn company page and publish content there",
      "Build social engagement signals (especially Facebook, LinkedIn)",
    ],
    uniqueAdvantage: "Block-level parsing means each content section is independently evaluable — brands with well-structured, modular content get cited more often.",
  },
};

// ─── Universal Principles (apply across all platforms) ───────────

export const UNIVERSAL_PRINCIPLES = [
  {
    principle: "Content extractability",
    detail: "Each section must be a standalone unit answering a specific question. Optimal paragraph length: 40-60 words. Begin with direct answer in first 1-3 sentences.",
    tier: 2 as EvidenceTier,
  },
  {
    principle: "Server-side rendering is mandatory",
    detail: "No major AI crawler executes JavaScript (verified across 500M+ GPTBot requests). All strategic content must use SSR or static generation.",
    tier: 1 as EvidenceTier,
  },
  {
    principle: "Content freshness is a ranking signal",
    detail: "85% of AI Overview citations come from content published in the last 2 years. Pages not refreshed quarterly are 3x more likely to lose AI citations.",
    tier: 1 as EvidenceTier,
  },
  {
    principle: "Brand authority transfers to AI systems",
    detail: "Brand search volume shows 0.334 correlation with LLM citation probability — the strongest single predictor. Sites cited across 4+ AI platforms are 2.8x more likely to appear in ChatGPT.",
    tier: 2 as EvidenceTier,
  },
  {
    principle: "Schema markup helps LLMs understand content",
    detail: "Priority schemas: FAQPage (2.7x citations), Organization, Person, Article, HowTo. Use JSON-LD with sameAs properties linking to Wikidata and official profiles.",
    tier: 1 as EvidenceTier,
  },
  {
    principle: "Allow AI crawler access",
    detail: "Configure robots.txt to allow GPTBot, OAI-SearchBot, Google-Extended, anthropic-ai, and PerplexityBot. Over 3.5% of websites block GPTBot — competitive opportunity.",
    tier: 1 as EvidenceTier,
  },
];

// ─── Stage-Specific Recommendations ──────────────────────────────

export interface StageRecommendation {
  stage: "awareness" | "consideration" | "decision";
  lowScore: { commonPattern: string; contentType: string; focusedAction: string };
  mediumScore: { commonPattern: string; contentType: string; focusedAction: string };
  highScore: { commonPattern: string; contentType: string; focusedAction: string };
}

export const STAGE_RECOMMENDATIONS: StageRecommendation[] = [
  {
    stage: "awareness",
    lowScore: {
      commonPattern:
        "Research shows 92% of AI citations come from pages already ranking in Google's top 10 (Ahrefs, 1.9M citations). Your brand's content is not being cited as a source — AI platforms don't recognize it as authoritative yet.",
      contentType:
        "Authoritative educational content with expert quotations (+40.9% visibility, KDD 2024), statistics (+30.6%), and source citations (+27.5%). Implement FAQPage schema for 2.7x citation improvement.",
      focusedAction:
        "Create comprehensive, fact-dense educational guides about your domain. Include expert quotes, original data, and proper source citations. Implement FAQPage schema markup on key pages — this alone can boost citation rates from 15% to 41%.",
    },
    mediumScore: {
      commonPattern:
        "Your content gets moderate citation but hasn't reached its potential. The GEO study (KDD 2024) shows adding statistics increases visibility by 30.6% and expert quotations by 40.9% — these are the highest-impact optimizations available.",
      contentType:
        "Data-rich authority content with expert endorsements, original research, and structured data. Keep content fresh — 85% of AI citations come from content published in the last 2 years (Seer Interactive).",
      focusedAction:
        "Audit your top content pages and enrich them with statistics, expert quotations, and authoritative source citations. Add visible 'last updated' timestamps and refresh quarterly — content not updated quarterly is 3x more likely to lose AI citations.",
    },
    highScore: {
      commonPattern:
        "Your brand is well-cited as an authority source. Sites cited across 4+ AI platforms are 2.8x more likely to appear in ChatGPT responses (Profound, 680M citations). Focus on cross-platform authority building.",
      contentType:
        "Maintain content freshness cadence. Expand into adjacent topics to deepen topical authority. Create original research and benchmark reports that become industry reference points.",
      focusedAction:
        "Protect your position by refreshing key content quarterly with 10-15% substantive updates. Pursue media coverage and expert mentions to strengthen cross-platform authority signals — brand search volume is the strongest predictor (0.334 correlation) of AI citation probability.",
    },
  },
  {
    stage: "consideration",
    lowScore: {
      commonPattern:
        "AI platforms favor comparison-friendly content with verifiable claims. The GEO study found that adding authoritative source citations increases visibility by 27.5%, and fluency optimization by 28.0%. Your brand is missing from most 'best of' queries.",
      contentType:
        "Comparison guides with factual differentiators, verified customer testimonials, and third-party review aggregation. Use Article and Product schema for structured recognition.",
      focusedAction:
        "Develop head-to-head comparison content with specific data points (not opinions). Include verified customer testimonials and third-party endorsements. Critical: avoid keyword stuffing, which harms AI visibility by -8.3% (KDD 2024).",
    },
    mediumScore: {
      commonPattern:
        "Your brand appears in some comparisons but not consistently. Research shows challenger brands benefit disproportionately from GEO — sites ranking 5th gained 115.1% visibility from source citations vs. a 30% decrease for top-ranked sites.",
      contentType:
        "Detailed competitive analysis content with unique data, transparent pricing comparisons, and clear differentiators. Use an authoritative writing tone (+10.4% visibility, KDD 2024).",
      focusedAction:
        "Create content directly addressing 'Brand X vs Brand Y' and 'best [category]' queries with factual, data-backed comparisons. Include expert opinions and industry analysis — this is where challenger brands have the most to gain.",
    },
    highScore: {
      commonPattern:
        "Strong competitive positioning. Your brand consistently appears in comparison and 'best of' queries. AI-sourced leads convert at 6-27x higher rates than traditional search (documented case studies).",
      contentType:
        "Thought leadership and industry benchmark content. Create original research that positions your brand as the category authority.",
      focusedAction:
        "Strengthen your position by publishing original industry research and benchmark reports. Maintain comparison content freshness — on Perplexity, content decay begins 2-3 days after publication. Continue building review signals across platforms.",
    },
  },
  {
    stage: "decision",
    lowScore: {
      commonPattern:
        "AI platforms rely heavily on E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness) when making purchase recommendations. Over 75% of health-related ChatGPT citations come from established institutional sources. Your brand needs stronger trust signals.",
      contentType:
        "Trust-building content: verified reviews, expert endorsements, case studies with measurable outcomes, transparent pricing, and clear purchase paths. Implement Product and Review schema.",
      focusedAction:
        "Build trust signals that AI can verify: publish case studies with specific metrics, aggregate verified reviews, and create transparent pricing pages. Implement Organization and Product schema to establish brand entity in knowledge graphs — Knowledge Graph entities get 60% more citations (GEO research).",
    },
    mediumScore: {
      commonPattern:
        "Mixed recommendation signals. Harvard research (2024) shows strategically crafted content can influence AI product recommendations in ~40% of evaluations. Focus on being the most citation-worthy option through factual, well-sourced content.",
      contentType:
        "Detailed purchase guides, ROI calculators, verified case studies, and transparent competitive positioning. Include specific performance data and third-party validations.",
      focusedAction:
        "Strengthen social proof with specific, verifiable claims: exact ROI percentages, named customer testimonials, and third-party endorsements. Ensure pricing and purchase information is clearly structured for AI extraction (40-60 word blocks with direct answers).",
    },
    highScore: {
      commonPattern:
        "Strong purchase-intent performance. Your brand is frequently recommended by AI platforms. Companies like Ramp achieved 693% visibility improvement through AI-optimized content that generated 300+ citations in one month (verified by Adweek).",
      contentType:
        "Continue strengthening social proof and maintain content freshness. Expand into adjacent purchase-intent queries. Monitor conversion rates — AI-sourced leads show 25x higher conversion rates in documented cases.",
      focusedAction:
        "Protect your conversion funnel by keeping product/pricing pages current with visible timestamps. Track AI referral traffic separately in analytics. Consider creating targeted landing pages for specific AI pickup — Ramp generated 300+ citations from just two targeted pages in 30 days.",
    },
  },
];

// ─── Case Studies ────────────────────────────────────────────────

export interface CaseStudy {
  company: string;
  industry: string;
  result: string;
  strategy: string;
  evidence: string;
  timeframe: string;
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    company: "Ramp",
    industry: "Fintech",
    result: "Visibility increase from 3.2% to 22.2% (693% improvement)",
    strategy: "Created targeted landing pages for AI pickup based on AI-specific query research. Two pages generated 300+ citations in one month.",
    evidence: "HIGH — verified by Adweek, documented by third-party platform (Profound)",
    timeframe: "30 days",
  },
  {
    company: "Go Fish Digital",
    industry: "Agency (multiple clients)",
    result: "+43% AI-driven traffic, +83% conversions from AI referrals",
    strategy: "Prompt mapping, fact-dense cornerstone content with statistics and schema markup, query fan-out expansion targeting adjacent buyer prompts.",
    evidence: "HIGH — GA4-tracked with detailed methodology, 25x higher conversion rates",
    timeframe: "3 months",
  },
  {
    company: "Mint Studios",
    industry: "B2B Financial Services",
    result: "Visibility growth from 23.3% to 38.9% (67% increase)",
    strategy: "'GPT Articles' — short (500-1000 words), fact-dense content targeting specific prompts. New client achieved AI visibility in 1 week before any traditional SEO.",
    evidence: "HIGH — multiple clients, control comparisons, third-party tool verification",
    timeframe: "1 week to 3 months",
  },
];

// ─── Implementation Priorities ───────────────────────────────────

export interface ImplementationPriority {
  order: number;
  phase: "immediate" | "medium_term" | "ongoing";
  action: string;
  evidenceTier: EvidenceTier;
  expectedImpact: string;
}

export const IMPLEMENTATION_PRIORITIES: ImplementationPriority[] = [
  { order: 1, phase: "immediate", action: "Configure robots.txt to allow OAI-SearchBot, GPTBot, Google-Extended, and PerplexityBot", evidenceTier: 1, expectedImpact: "Prerequisite for all AI visibility" },
  { order: 2, phase: "immediate", action: "Implement server-side rendering for all strategic content pages", evidenceTier: 1, expectedImpact: "Mandatory — client-side content is invisible to AI" },
  { order: 3, phase: "immediate", action: "Deploy FAQPage, Organization, and Article schema in JSON-LD", evidenceTier: 1, expectedImpact: "2.7x citation rate improvement" },
  { order: 4, phase: "immediate", action: "Audit key content: add statistics, expert quotations, source citations", evidenceTier: 1, expectedImpact: "+30-40% visibility improvement" },
  { order: 5, phase: "immediate", action: "Establish content freshness cadence with visible timestamps", evidenceTier: 1, expectedImpact: "85% of AI citations from content < 2 years old" },
  { order: 6, phase: "medium_term", action: "Create or optimize Wikidata entry for brand entity recognition", evidenceTier: 2, expectedImpact: "60% more citations for Knowledge Graph entities" },
  { order: 7, phase: "medium_term", action: "Develop author profile pages with credentials and sameAs schema", evidenceTier: 2, expectedImpact: "Strengthens E-E-A-T signals for AI evaluation" },
  { order: 8, phase: "medium_term", action: "Build presence on high-citation platforms (Reddit for Perplexity, Wikipedia for ChatGPT)", evidenceTier: 2, expectedImpact: "Reddit = 46.7% of Perplexity citations" },
  { order: 9, phase: "medium_term", action: "Implement answer-first content architecture (40-60 word paragraph blocks)", evidenceTier: 2, expectedImpact: "Improved content extractability for LLMs" },
  { order: 10, phase: "medium_term", action: "Enable IndexNow for Bing/Copilot and verify in Bing Webmaster Tools", evidenceTier: 2, expectedImpact: "Faster indexing for Copilot visibility" },
  { order: 11, phase: "ongoing", action: "Track AI referral traffic separately in analytics", evidenceTier: 2, expectedImpact: "Enables measurement of AI visibility ROI" },
  { order: 12, phase: "ongoing", action: "Monitor citation rates across platforms using AI visibility tools", evidenceTier: 2, expectedImpact: "Continuous optimization feedback loop" },
  { order: 13, phase: "ongoing", action: "Refresh high-value content quarterly with 10-15% substantive updates", evidenceTier: 1, expectedImpact: "3x less likely to lose AI citations" },
  { order: 14, phase: "ongoing", action: "Pursue media coverage and expert mentions for cross-platform authority", evidenceTier: 2, expectedImpact: "Brand search volume = strongest citation predictor (0.334)" },
];

// ─── Helper: Get recommendations by score range ──────────────────

export function getStageRecommendation(
  stage: "awareness" | "consideration" | "decision",
  score: number
): { commonPattern: string; contentType: string; focusedAction: string } {
  const stageRec = STAGE_RECOMMENDATIONS.find(r => r.stage === stage);
  if (!stageRec) {
    return { commonPattern: "", contentType: "", focusedAction: "" };
  }

  if (score < 40) return stageRec.lowScore;
  if (score < 70) return stageRec.mediumScore;
  return stageRec.highScore;
}

// ─── Helper: Get platform-specific advice ────────────────────────

export function getPlatformAdvice(
  platform: string,
  score: number
): string[] {
  const key = normalizePlatformKey(platform);
  const insight = PLATFORM_INSIGHTS[key];
  if (!insight) return [];

  if (score >= 70) {
    return [
      `Strong performance on ${insight.platform}. ${insight.uniqueAdvantage}`,
      ...insight.contentStrategy.slice(0, 1),
    ];
  }

  // Low/medium score: return actionable advice
  return [
    ...insight.technicalRequirements.slice(0, 2),
    ...insight.contentStrategy.slice(0, 2),
  ];
}

// ─── Helper: Get top tactics for action items ────────────────────

export function getTopTactics(count: number = 3): ResearchFinding[] {
  return GEO_TACTICS
    .filter(t => !t.harmful && t.impactPct !== null)
    .sort((a, b) => (b.impactPct ?? 0) - (a.impactPct ?? 0))
    .slice(0, count);
}

// ─── Helper: Get relevant case study ─────────────────────────────

export function getRelevantCaseStudy(isChallenger: boolean): CaseStudy {
  // Challenger brands benefit most from Mint Studios / Ramp approach
  if (isChallenger) {
    return CASE_STUDIES[2]; // Mint Studios — visibility in 1 week with no prior SEO
  }
  return CASE_STUDIES[0]; // Ramp — 693% improvement
}

// ─── Helper: Normalize platform name to key ──────────────────────

function normalizePlatformKey(platform: string): string {
  const lower = platform.toLowerCase();
  if (lower.includes("chatgpt") || lower.includes("openai")) return "ChatGPT";
  if (lower.includes("perplexity")) return "Perplexity";
  if (lower.includes("gemini") || lower.includes("google")) return "Gemini";
  if (lower.includes("copilot") || lower.includes("microsoft") || lower.includes("bing")) return "Copilot";
  return platform;
}

// ─── Helper: Get priorities by phase ─────────────────────────────

export function getPrioritiesByPhase(phase: "immediate" | "medium_term" | "ongoing"): ImplementationPriority[] {
  return IMPLEMENTATION_PRIORITIES.filter(p => p.phase === phase);
}

// ─── Challenger Brand Advantage Insight ──────────────────────────

export const CHALLENGER_BRAND_INSIGHT = {
  finding: "Lower-ranked sites benefit disproportionately from GEO optimization",
  detail: "Sites ranking 5th in search gained 115.1% visibility from source citations, compared to a 30% decrease for sites already ranking 1st.",
  source: "Princeton/IIT Delhi GEO study, KDD 2024",
  tier: 1 as EvidenceTier,
  implication: "Challenger brands implementing GEO tactics can gain 100%+ visibility improvements while market leaders see diminishing returns.",
};

// ─── Conversion Rate Insight ─────────────────────────────────────

export const AI_CONVERSION_INSIGHT = {
  finding: "AI-sourced leads demonstrate dramatically higher conversion rates",
  range: "6x-27x higher than traditional search",
  bestCase: "25x higher conversion rates (Go Fish Digital, GA4-tracked)",
  tier: 2 as EvidenceTier,
};
