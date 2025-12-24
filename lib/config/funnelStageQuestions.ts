/**
 * Funnel Stage Question Configuration
 *
 * Defines how questions should be generated for each stage of the customer journey.
 */

export interface FunnelStageConfig {
  description: string;
  patterns: string[];
  personaInfluence: "LOW" | "MEDIUM" | "HIGH";
  primaryMetric: string;
}

export const funnelStageConfig: Record<string, FunnelStageConfig> = {
  awareness: {
    description: "Educational queries - brand mentions not expected",
    patterns: [
      "what is {subcategory}",
      "what are {subcategory}",
      "how does {subcategory} work",
      "how do {subcategory} work",
      "benefits of {subcategory}",
      "{subcategory} guide for beginners",
      "understanding {subcategory}",
      "{subcategory} explained",
      "why use {subcategory}",
      "when to use {subcategory}",
      "{subcategory} vs {alternative_category}",
      "do I need {subcategory}",
      "are {subcategory} worth it",
      "{subcategory} basics"
    ],
    personaInfluence: "LOW",
    primaryMetric: "content_citation_rate"
  },

  consideration: {
    description: "Comparison queries - brand should appear",
    patterns: [
      "best {subcategory} {year}",
      "best {subcategory}",
      "top {subcategory} brands",
      "top {subcategory}",
      "{subcategory} comparison",
      "{subcategory} reviews",
      "how to choose {subcategory}",
      "what to look for in {subcategory}",
      "{subcategory} buying guide",
      "most popular {subcategory}",
      "leading {subcategory} brands",
      "{subcategory} market leaders",
      "recommended {subcategory}",
      "{subcategory} for {use_case}",
      "which {subcategory} is best",
      "{subcategory} options"
    ],
    personaInfluence: "MEDIUM",
    primaryMetric: "mention_rate_and_position"
  },

  decision: {
    description: "Purchase-intent queries - brand positioning critical",
    patterns: [
      "{brand} {subcategory} review",
      "{brand} {subcategory} reviews",
      "is {brand} {subcategory} worth it",
      "is {brand} good for {subcategory}",
      "{brand} vs {competitor}",
      "{brand} vs {competitor} {subcategory}",
      "should I buy {brand} {subcategory}",
      "where to buy {brand} {subcategory}",
      "{brand} {subcategory} price",
      "{brand} {subcategory} alternatives",
      "why choose {brand} {subcategory}",
      "{brand} {subcategory} pros and cons",
      "{brand} {subcategory} worth the money",
      "best place to buy {brand} {subcategory}",
      "{brand} {subcategory} discount",
      "{brand} {subcategory} customer reviews"
    ],
    personaInfluence: "HIGH",
    primaryMetric: "sentiment_and_recommendation"
  }
};

/**
 * Use case modifiers for consideration stage
 */
export const useCaseModifiers = [
  "beginners",
  "professionals",
  "everyday use",
  "travel",
  "home use",
  "office use",
  "outdoor use",
  "sensitive skin",
  "oily skin",
  "dry skin",
  "combination skin",
  "athletes",
  "runners",
  "gym",
  "daily wear",
  "special occasions"
];

/**
 * Alternative categories for awareness stage comparisons
 */
export const alternativeCategories: Record<string, string[]> = {
  "running shoes": ["walking shoes", "training shoes", "cross-trainers"],
  "face cream": ["face serum", "face oil", "moisturizer"],
  "shampoo": ["conditioner", "hair treatment", "dry shampoo"],
  "laptop": ["tablet", "desktop", "chromebook"],
  "smartphone": ["tablet", "smartwatch", "feature phone"]
};
