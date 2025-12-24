/**
 * Persona-to-Query Mapping Configuration
 *
 * CRITICAL RULE: Never include persona names literally in generated questions.
 * The persona informs the *intent and framing* of the question.
 */

export interface PersonaConfig {
  queryModifiers: string[];
  intentType: string;
  patterns: string[];
}

export const personaQueryMapping: Record<string, PersonaConfig> = {
  // Decision-stage personas (urgency, immediate action)
  "Impulse Buyer": {
    queryModifiers: ["right now", "today", "best deal", "available now", "quick delivery"],
    intentType: "immediate_purchase",
    patterns: [
      "best {subcategory} to buy right now",
      "{subcategory} deals today",
      "top {subcategory} under {price_point}",
      "{subcategory} with fast shipping",
      "where to buy {subcategory} today"
    ]
  },

  // Research-stage personas (depth, technical)
  "Skintellectual 2.0": {
    queryModifiers: ["ingredients", "technology", "science behind", "how it works", "clinical studies"],
    intentType: "technical_research",
    patterns: [
      "how does {subcategory} technology work",
      "{subcategory} ingredients explained",
      "science behind {subcategory}",
      "{subcategory} clinical research",
      "what makes {subcategory} effective"
    ]
  },

  // Values-driven personas (ethics, sustainability)
  "Circular Economist": {
    queryModifiers: ["sustainable", "recycled", "eco-friendly", "carbon neutral", "ethical"],
    intentType: "sustainability_focused",
    patterns: [
      "most sustainable {subcategory}",
      "eco-friendly {subcategory} brands",
      "{subcategory} made from recycled materials",
      "carbon neutral {subcategory}",
      "sustainable alternatives to {subcategory}"
    ]
  },

  // Value-conscious personas (price, ROI)
  "Value-Conscious Budgeteer": {
    queryModifiers: ["budget", "affordable", "value for money", "best price", "cheap"],
    intentType: "price_sensitive",
    patterns: [
      "best budget {subcategory}",
      "{subcategory} best value for money",
      "affordable {subcategory} that work",
      "{subcategory} under {price_point}",
      "cheapest good quality {subcategory}"
    ]
  },

  // Performance-focused personas
  "Performance Optimizer": {
    queryModifiers: ["best performance", "highest rated", "professional grade", "advanced"],
    intentType: "performance_focused",
    patterns: [
      "best performing {subcategory}",
      "professional grade {subcategory}",
      "highest rated {subcategory}",
      "advanced {subcategory} features",
      "{subcategory} for serious users"
    ]
  },

  // Health-conscious personas
  "Health Conscious": {
    queryModifiers: ["natural", "organic", "chemical-free", "non-toxic", "safe"],
    intentType: "health_focused",
    patterns: [
      "natural {subcategory} without chemicals",
      "organic {subcategory} brands",
      "non-toxic {subcategory}",
      "safe {subcategory} for sensitive skin",
      "chemical-free {subcategory}"
    ]
  },

  // Style-conscious personas
  "Style Seeker": {
    queryModifiers: ["trendy", "fashionable", "stylish", "latest", "design"],
    intentType: "style_focused",
    patterns: [
      "most stylish {subcategory}",
      "trendy {subcategory} {year}",
      "{subcategory} fashion trends",
      "best looking {subcategory}",
      "designer {subcategory}"
    ]
  },

  // Convenience-focused personas
  "Convenience Seeker": {
    queryModifiers: ["easy to use", "convenient", "hassle-free", "simple", "quick"],
    intentType: "convenience_focused",
    patterns: [
      "easiest {subcategory} to use",
      "convenient {subcategory}",
      "hassle-free {subcategory}",
      "simple {subcategory} setup",
      "quick {subcategory} results"
    ]
  }
};

/**
 * Price point options for query generation
 */
export const pricePoints = [
  "$25",
  "$50",
  "$100",
  "$200",
  "$500",
  "€25",
  "€50",
  "€100",
  "€200",
  "€500"
];

/**
 * Get current year for query generation
 */
export function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}
