/**
 * Follow-Up Question Generator
 *
 * Generates dynamic follow-up questions based on AI responses to simulate
 * natural conversation flow.
 */

import type { ConversationSession } from "@/lib/types/features";

/**
 * Generate follow-up question based on previous response
 */
export async function generateFollowUp(
  previousResponse: any,
  session: ConversationSession,
  competitors: string[]
): Promise<string> {
  const content = (previousResponse.content || previousResponse.fullResponse || "").toLowerCase();
  const { brand, subcategory, persona } = session;
  const previousTurn = session.turns[session.turns.length - 1];

  // Analyze what happened in previous response
  const analysis = analyzeResponseForFollowUps(content, brand, competitors);

  // Strategy 1: Brand was mentioned - dig deeper
  if (previousTurn.brandPresent) {
    return generateBrandDeepDiveQuestion(brand, subcategory, analysis, persona);
  }

  // Strategy 2: Brand NOT mentioned - probe why
  if (!previousTurn.brandPresent && session.turns.length > 1) {
    return generateBrandProbeQuestion(brand, subcategory, analysis.mentionedBrands, competitors);
  }

  // Strategy 3: Follow criteria mentioned in response
  if (analysis.suggestedCriteria.length > 0) {
    return generateCriteriaFollowUpQuestion(
      subcategory,
      analysis.suggestedCriteria[0],
      brand
    );
  }

  // Strategy 4: Journey progression (awareness → consideration → decision)
  return getJourneyProgressionQuery(session, brand, subcategory);
}

/**
 * Analyze response to extract follow-up opportunities
 */
function analyzeResponseForFollowUps(
  content: string,
  brand: string,
  competitors: string[]
): {
  mentionedBrands: string[];
  suggestedCriteria: string[];
  hasRecommendation: boolean;
  hasPriceInfo: boolean;
  hasProsCons: boolean;
} {
  const mentionedBrands: string[] = [];

  // Check which brands are mentioned
  if (content.includes(brand.toLowerCase())) {
    mentionedBrands.push(brand);
  }

  for (const competitor of competitors) {
    if (content.includes(competitor.toLowerCase())) {
      mentionedBrands.push(competitor);
    }
  }

  // Extract suggested criteria
  const criteriaPatterns = [
    /consider (\w+)/gi,
    /look for (\w+)/gi,
    /important to (\w+)/gi,
    /focus on (\w+)/gi
  ];

  const suggestedCriteria: string[] = [];
  for (const pattern of criteriaPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && !suggestedCriteria.includes(match[1])) {
        suggestedCriteria.push(match[1]);
      }
    }
  }

  // Check for recommendation signals
  const hasRecommendation = /\b(recommend|suggest|choose|pick)\b/i.test(content);

  // Check for price information
  const hasPriceInfo = /\$\d+|\d+\s*(dollar|euro|pound)/i.test(content);

  // Check for pros/cons
  const hasProsCons = /\b(pros?|cons?|advantage|disadvantage)\b/i.test(content);

  return {
    mentionedBrands,
    suggestedCriteria,
    hasRecommendation,
    hasPriceInfo,
    hasProsCons
  };
}

/**
 * Generate deep-dive question when brand was mentioned
 */
function generateBrandDeepDiveQuestion(
  brand: string,
  subcategory: string,
  analysis: any,
  persona: string
): string {
  const templates = [
    `Tell me more about ${brand}'s ${subcategory}`,
    `What are the pros and cons of ${brand}?`,
    `Is ${brand} worth the price?`,
    `How does ${brand} compare to other options?`,
    `What makes ${brand} special?`,
    `Are there any downsides to ${brand}?`,
    `Would you recommend ${brand} for everyday use?`,
    `What do customers say about ${brand}?`
  ];

  // Persona-specific follow-ups
  if (persona === "Value-Conscious Budgeteer") {
    return `Is ${brand} good value for money?`;
  } else if (persona === "Circular Economist") {
    return `How sustainable is ${brand}?`;
  } else if (persona === "Skintellectual 2.0") {
    return `What are the key ingredients in ${brand} ${subcategory}?`;
  } else if (persona === "Impulse Buyer") {
    return `Where can I buy ${brand} ${subcategory} right now?`;
  }

  return selectRandomItem(templates);
}

/**
 * Generate probing question when brand was NOT mentioned
 */
function generateBrandProbeQuestion(
  brand: string,
  subcategory: string,
  mentionedBrands: string[],
  competitors: string[]
): string {
  // If competitors were mentioned instead
  if (mentionedBrands.length > 0 && !mentionedBrands.includes(brand)) {
    const competitor = mentionedBrands[0];
    return `What about ${brand}? How does it compare to ${competitor}?`;
  }

  // Generic probe
  const templates = [
    `What about ${brand}? Are they good for ${subcategory}?`,
    `Have you heard of ${brand}? What do you think about them?`,
    `How does ${brand} compare?`,
    `Is ${brand} a good option for ${subcategory}?`,
    `Why didn't you mention ${brand}?`
  ];

  return selectRandomItem(templates);
}

/**
 * Generate follow-up based on criteria mentioned in response
 */
function generateCriteriaFollowUpQuestion(
  subcategory: string,
  criterion: string,
  brand: string
): string {
  const templates = [
    `Which ${subcategory} is best for ${criterion}?`,
    `Tell me more about ${criterion} in ${subcategory}`,
    `How important is ${criterion} when choosing ${subcategory}?`,
    `Does ${brand} excel at ${criterion}?`
  ];

  return selectRandomItem(templates);
}

/**
 * Get journey progression query based on conversation stage
 */
function getJourneyProgressionQuery(
  session: ConversationSession,
  brand: string,
  subcategory: string
): string {
  const turnCount = session.turns.length;

  // Early turns: General exploration
  if (turnCount <= 2) {
    return `What should I look for when choosing ${subcategory}?`;
  }

  // Middle turns: Comparison
  if (turnCount <= 4) {
    return `What are the top 3 ${subcategory} brands?`;
  }

  // Later turns: Decision support
  if (turnCount <= 6) {
    return `Which ${subcategory} would you recommend for me?`;
  }

  // Final turns: Purchase intent
  return `Where can I buy the best ${subcategory}?`;
}

/**
 * Helper: Select random item from array
 */
function selectRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate initial query for conversation
 */
export function generateInitialQuery(
  subcategory: string,
  persona: string
): string {
  const personaInitialQueries: Record<string, string[]> = {
    "Impulse Buyer": [
      `Best ${subcategory} to buy right now`,
      `${subcategory} available today`,
      `Quick ${subcategory} recommendations`
    ],
    "Skintellectual 2.0": [
      `How does ${subcategory} work`,
      `Science behind ${subcategory}`,
      `${subcategory} ingredients explained`
    ],
    "Circular Economist": [
      `Most sustainable ${subcategory}`,
      `Eco-friendly ${subcategory} brands`,
      `Sustainable ${subcategory} options`
    ],
    "Value-Conscious Budgeteer": [
      `Best budget ${subcategory}`,
      `Affordable ${subcategory} that work`,
      `${subcategory} best value for money`
    ],
    "Performance Optimizer": [
      `Best performing ${subcategory}`,
      `Highest rated ${subcategory}`,
      `Professional grade ${subcategory}`
    ],
    "Health Conscious": [
      `Natural ${subcategory} without chemicals`,
      `Organic ${subcategory} brands`,
      `Safe ${subcategory} for sensitive skin`
    ],
    "Style Seeker": [
      `Most stylish ${subcategory}`,
      `Trendy ${subcategory} 2025`,
      `Fashion-forward ${subcategory}`
    ],
    "Convenience Seeker": [
      `Easiest ${subcategory} to use`,
      `Most convenient ${subcategory}`,
      `Quick ${subcategory} results`
    ]
  };

  const queries = personaInitialQueries[persona] || [
    `What are the best ${subcategory}?`
  ];

  return selectRandomItem(queries);
}
