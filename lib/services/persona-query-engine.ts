/**
 * Persona-to-Query Intent Mapping Engine
 * 
 * CRITICAL RULE: Never include persona names literally in generated questions.
 * The persona informs the *framing, intent, and context* of the question—not the wording.
 */

export interface QueryPattern {
  pattern: string;
  variables: string[];
}

export interface PersonaQueryConfig {
  queryModifiers: string[];
  intentType: string;
  questionPatterns: QueryPattern[];
  pricePoints?: string[];
  urgencyLevel: 'low' | 'medium' | 'high';
  researchDepth: 'shallow' | 'medium' | 'deep';
}

/**
 * Comprehensive persona-to-query intent mapping
 * Based on 2024-2025 market intelligence
 */
export const PERSONA_QUERY_MAPPING: Record<string, PersonaQueryConfig> = {
  // ============================================
  // DECISION-STAGE PERSONAS (urgency, availability, immediate action)
  // ============================================
  
  "impulse-buyer": {
    queryModifiers: ["right now", "today", "best deal", "available now", "fast delivery"],
    intentType: "immediate_purchase",
    questionPatterns: [
      { pattern: "best {subcategory} to buy right now", variables: ["subcategory"] },
      { pattern: "{subcategory} deals today", variables: ["subcategory"] },
      { pattern: "top {subcategory} under {price}", variables: ["subcategory", "price"] },
      { pattern: "{subcategory} with same-day delivery", variables: ["subcategory"] },
      { pattern: "where to buy {subcategory} today", variables: ["subcategory"] },
    ],
    pricePoints: ["€50", "€100", "€150", "$50", "$100", "$150"],
    urgencyLevel: "high",
    researchDepth: "shallow",
  },
  
  "connected-shopper": {
    queryModifiers: ["reviews", "ratings", "compared to", "vs", "which is better"],
    intentType: "quick_comparison",
    questionPatterns: [
      { pattern: "best {subcategory} reviews {year}", variables: ["subcategory", "year"] },
      { pattern: "{brand} vs {competitor} {subcategory}", variables: ["brand", "competitor", "subcategory"] },
      { pattern: "top rated {subcategory}", variables: ["subcategory"] },
      { pattern: "{subcategory} comparison {year}", variables: ["subcategory", "year"] },
      { pattern: "which {subcategory} has best reviews", variables: ["subcategory"] },
    ],
    urgencyLevel: "medium",
    researchDepth: "medium",
  },
  
  "brand-champion": {
    queryModifiers: ["why choose", "benefits of", "vs competitors", "worth it"],
    intentType: "brand_validation",
    questionPatterns: [
      { pattern: "why choose {brand} {subcategory}", variables: ["brand", "subcategory"] },
      { pattern: "{brand} {subcategory} vs competitors", variables: ["brand", "subcategory"] },
      { pattern: "is {brand} worth it for {subcategory}", variables: ["brand", "subcategory"] },
      { pattern: "what makes {brand} {subcategory} special", variables: ["brand", "subcategory"] },
      { pattern: "{brand} {subcategory} advantages", variables: ["brand", "subcategory"] },
    ],
    urgencyLevel: "low",
    researchDepth: "medium",
  },

  // ============================================
  // RESEARCH-STAGE PERSONAS (depth, technical details, methodology)
  // ============================================
  
  "skintellectual": {
    queryModifiers: ["ingredients", "technology", "how does", "science behind", "formulation"],
    intentType: "technical_research",
    questionPatterns: [
      { pattern: "how does {subcategory} technology work", variables: ["subcategory"] },
      { pattern: "{subcategory} ingredients explained", variables: ["subcategory"] },
      { pattern: "science behind {subcategory}", variables: ["subcategory"] },
      { pattern: "best {subcategory} active ingredients", variables: ["subcategory"] },
      { pattern: "{subcategory} formulation guide", variables: ["subcategory"] },
    ],
    urgencyLevel: "low",
    researchDepth: "deep",
  },
  
  "science-backer": {
    queryModifiers: ["clinical studies", "research", "proven", "evidence", "tested"],
    intentType: "evidence_seeking",
    questionPatterns: [
      { pattern: "{subcategory} clinical studies", variables: ["subcategory"] },
      { pattern: "scientifically proven {subcategory}", variables: ["subcategory"] },
      { pattern: "research on {subcategory} effectiveness", variables: ["subcategory"] },
      { pattern: "evidence-based {subcategory} recommendations", variables: ["subcategory"] },
      { pattern: "{subcategory} with clinical backing", variables: ["subcategory"] },
    ],
    urgencyLevel: "low",
    researchDepth: "deep",
  },
  
  "self-quantifier": {
    queryModifiers: ["metrics", "tracking", "measure", "data", "monitor"],
    intentType: "measurement_focused",
    questionPatterns: [
      { pattern: "how to measure {subcategory} results", variables: ["subcategory"] },
      { pattern: "{subcategory} with tracking features", variables: ["subcategory"] },
      { pattern: "best {subcategory} for data tracking", variables: ["subcategory"] },
      { pattern: "{subcategory} performance metrics", variables: ["subcategory"] },
      { pattern: "quantifiable benefits of {subcategory}", variables: ["subcategory"] },
    ],
    urgencyLevel: "low",
    researchDepth: "deep",
  },

  // ============================================
  // VALUES-DRIVEN PERSONAS (ethics, sustainability, principles)
  // ============================================
  
  "circular-economist": {
    queryModifiers: ["sustainable", "recycled", "eco-friendly", "second-hand", "resale"],
    intentType: "sustainability_focused",
    questionPatterns: [
      { pattern: "most sustainable {subcategory}", variables: ["subcategory"] },
      { pattern: "{subcategory} made from recycled materials", variables: ["subcategory"] },
      { pattern: "eco-friendly {subcategory} brands", variables: ["subcategory"] },
      { pattern: "best {subcategory} for sustainability", variables: ["subcategory"] },
      { pattern: "{subcategory} with circular economy practices", variables: ["subcategory"] },
    ],
    urgencyLevel: "low",
    researchDepth: "medium",
  },
  
  "sustainable-changemaker": {
    queryModifiers: ["ethical", "carbon neutral", "fair trade", "B-corp", "certified"],
    intentType: "ethical_consumption",
    questionPatterns: [
      { pattern: "ethical {subcategory} brands", variables: ["subcategory"] },
      { pattern: "carbon neutral {subcategory}", variables: ["subcategory"] },
      { pattern: "{subcategory} with sustainable practices", variables: ["subcategory"] },
      { pattern: "B-corp certified {subcategory}", variables: ["subcategory"] },
      { pattern: "fair trade {subcategory} options", variables: ["subcategory"] },
    ],
    urgencyLevel: "low",
    researchDepth: "medium",
  },
  
  "clean-beauty": {
    queryModifiers: ["natural", "organic", "chemical-free", "non-toxic", "clean"],
    intentType: "purity_focused",
    questionPatterns: [
      { pattern: "natural {subcategory} without chemicals", variables: ["subcategory"] },
      { pattern: "organic {subcategory} brands", variables: ["subcategory"] },
      { pattern: "non-toxic {subcategory}", variables: ["subcategory"] },
      { pattern: "clean {subcategory} ingredients", variables: ["subcategory"] },
      { pattern: "chemical-free {subcategory} alternatives", variables: ["subcategory"] },
    ],
    urgencyLevel: "low",
    researchDepth: "medium",
  },

  // ============================================
  // VALUE-CONSCIOUS PERSONAS (price, ROI, longevity)
  // ============================================
  
  "value-budgeteer": {
    queryModifiers: ["budget", "affordable", "cheap but good", "value for money", "under"],
    intentType: "price_sensitive",
    questionPatterns: [
      { pattern: "best budget {subcategory}", variables: ["subcategory"] },
      { pattern: "affordable {subcategory} that actually work", variables: ["subcategory"] },
      { pattern: "{subcategory} best value for money", variables: ["subcategory"] },
      { pattern: "cheap {subcategory} worth buying", variables: ["subcategory"] },
      { pattern: "best {subcategory} under {price}", variables: ["subcategory", "price"] },
    ],
    pricePoints: ["€50", "€100", "$50", "$100"],
    urgencyLevel: "medium",
    researchDepth: "medium",
  },
  
  "roi-pragmatist": {
    queryModifiers: ["worth it", "cost per use", "long-term value", "investment", "ROI"],
    intentType: "roi_focused",
    questionPatterns: [
      { pattern: "is {brand} {subcategory} worth the price", variables: ["brand", "subcategory"] },
      { pattern: "best {subcategory} for long-term use", variables: ["subcategory"] },
      { pattern: "{subcategory} cost vs quality comparison", variables: ["subcategory"] },
      { pattern: "{subcategory} with best return on investment", variables: ["subcategory"] },
      { pattern: "most cost-effective {subcategory}", variables: ["subcategory"] },
    ],
    urgencyLevel: "low",
    researchDepth: "deep",
  },
  
  "heirloom-investor": {
    queryModifiers: ["durable", "lifetime", "quality", "built to last", "premium"],
    intentType: "longevity_focused",
    questionPatterns: [
      { pattern: "most durable {subcategory}", variables: ["subcategory"] },
      { pattern: "{subcategory} that last forever", variables: ["subcategory"] },
      { pattern: "highest quality {subcategory}", variables: ["subcategory"] },
      { pattern: "best {subcategory} for longevity", variables: ["subcategory"] },
      { pattern: "premium {subcategory} worth the investment", variables: ["subcategory"] },
    ],
    urgencyLevel: "low",
    researchDepth: "deep",
  },

  // ============================================
  // EXPERIENCE-SEEKING PERSONAS (lifestyle, community, emotion)
  // ============================================
  
  "experience-seeker": {
    queryModifiers: ["unique", "best experience", "memorable", "exclusive", "innovative"],
    intentType: "experience_focused",
    questionPatterns: [
      { pattern: "best {subcategory} experience", variables: ["subcategory"] },
      { pattern: "unique {subcategory} brands", variables: ["subcategory"] },
      { pattern: "most memorable {subcategory}", variables: ["subcategory"] },
      { pattern: "innovative {subcategory} options", variables: ["subcategory"] },
      { pattern: "{subcategory} with exceptional experience", variables: ["subcategory"] },
    ],
    urgencyLevel: "medium",
    researchDepth: "medium",
  },
  
  "little-treat": {
    queryModifiers: ["indulgent", "treat yourself", "luxury affordable", "small pleasure", "reward"],
    intentType: "emotional_reward",
    questionPatterns: [
      { pattern: "best {subcategory} to treat yourself", variables: ["subcategory"] },
      { pattern: "affordable luxury {subcategory}", variables: ["subcategory"] },
      { pattern: "indulgent {subcategory} worth trying", variables: ["subcategory"] },
      { pattern: "premium {subcategory} at reasonable price", variables: ["subcategory"] },
      { pattern: "best small luxury {subcategory}", variables: ["subcategory"] },
    ],
    urgencyLevel: "medium",
    researchDepth: "shallow",
  },
  
  "community-focused": {
    queryModifiers: ["popular", "recommended by", "community favorite", "group", "social"],
    intentType: "social_proof",
    questionPatterns: [
      { pattern: "most popular {subcategory}", variables: ["subcategory"] },
      { pattern: "{subcategory} recommended by experts", variables: ["subcategory"] },
      { pattern: "best {subcategory} according to professionals", variables: ["subcategory"] },
      { pattern: "top-rated {subcategory} by users", variables: ["subcategory"] },
      { pattern: "{subcategory} with best community reviews", variables: ["subcategory"] },
    ],
    urgencyLevel: "medium",
    researchDepth: "medium",
  },

  // ============================================
  // B2B PERSONAS
  // ============================================
  
  "enterprise-buyer": {
    queryModifiers: ["enterprise", "scalable", "integration", "ROI", "compliance"],
    intentType: "enterprise_evaluation",
    questionPatterns: [
      { pattern: "best {subcategory} for enterprise", variables: ["subcategory"] },
      { pattern: "{subcategory} enterprise features", variables: ["subcategory"] },
      { pattern: "{subcategory} scalability comparison", variables: ["subcategory"] },
      { pattern: "{subcategory} compliance certifications", variables: ["subcategory"] },
      { pattern: "enterprise-grade {subcategory} solutions", variables: ["subcategory"] },
    ],
    urgencyLevel: "low",
    researchDepth: "deep",
  },
  
  "technical-evaluator": {
    queryModifiers: ["API", "integration", "technical specs", "architecture", "documentation"],
    intentType: "technical_evaluation",
    questionPatterns: [
      { pattern: "{subcategory} technical specifications", variables: ["subcategory"] },
      { pattern: "{subcategory} API capabilities", variables: ["subcategory"] },
      { pattern: "{subcategory} integration options", variables: ["subcategory"] },
      { pattern: "{subcategory} architecture comparison", variables: ["subcategory"] },
      { pattern: "best {subcategory} for developers", variables: ["subcategory"] },
    ],
    urgencyLevel: "low",
    researchDepth: "deep",
  },
};

/**
 * Funnel stage question patterns
 * Different patterns for each stage of the buyer journey
 */
export const FUNNEL_STAGE_PATTERNS = {
  awareness: {
    description: "Educational, category-level questions where brand mentions are not expected",
    patterns: [
      { pattern: "what is {subcategory}", variables: ["subcategory"] },
      { pattern: "how does {subcategory} work", variables: ["subcategory"] },
      { pattern: "{subcategory} explained", variables: ["subcategory"] },
      { pattern: "benefits of {subcategory}", variables: ["subcategory"] },
      { pattern: "types of {subcategory}", variables: ["subcategory"] },
      { pattern: "{subcategory} guide for beginners", variables: ["subcategory"] },
      { pattern: "what to know about {subcategory}", variables: ["subcategory"] },
      { pattern: "{subcategory} basics", variables: ["subcategory"] },
    ],
    personaInfluence: "low" as const,
    expectedBrandMentions: "low" as const,
    primaryMetric: "content_citation_rate",
  },
  
  consideration: {
    description: "Comparison and evaluation questions where brand should appear in recommendations",
    patterns: [
      { pattern: "best {subcategory} {year}", variables: ["subcategory", "year"] },
      { pattern: "top {subcategory} brands", variables: ["subcategory"] },
      { pattern: "{subcategory} comparison", variables: ["subcategory"] },
      { pattern: "{subcategory} reviews {year}", variables: ["subcategory", "year"] },
      { pattern: "how to choose {subcategory}", variables: ["subcategory"] },
      { pattern: "{subcategory} buying guide", variables: ["subcategory"] },
      { pattern: "what to look for in {subcategory}", variables: ["subcategory"] },
      { pattern: "{subcategory} recommendations", variables: ["subcategory"] },
    ],
    personaInfluence: "medium" as const,
    expectedBrandMentions: "medium" as const,
    primaryMetric: "mention_rate_and_position",
  },
  
  decision: {
    description: "Purchase-intent questions where brand positioning is critical",
    patterns: [
      { pattern: "{brand} {subcategory} review", variables: ["brand", "subcategory"] },
      { pattern: "is {brand} {subcategory} worth it", variables: ["brand", "subcategory"] },
      { pattern: "{brand} vs {competitor}", variables: ["brand", "competitor"] },
      { pattern: "where to buy {brand} {subcategory}", variables: ["brand", "subcategory"] },
      { pattern: "{brand} {subcategory} price", variables: ["brand", "subcategory"] },
      { pattern: "should I buy {brand} {subcategory}", variables: ["brand", "subcategory"] },
      { pattern: "{brand} {subcategory} pros and cons", variables: ["brand", "subcategory"] },
      { pattern: "{brand} vs alternatives", variables: ["brand"] },
    ],
    personaInfluence: "high" as const,
    expectedBrandMentions: "high" as const,
    primaryMetric: "sentiment_and_recommendation_strength",
  },
};

/**
 * SEO to AI Query Transformation
 * Converts SEO keywords into conversational AI-native queries
 */
export function transformSEOtoAIQuery(
  seoKeyword: string,
  context: {
    subcategory: string;
    brand?: string;
    persona?: string;
    funnelStage: 'awareness' | 'consideration' | 'decision';
  }
): string {
  let aiQuery = seoKeyword;
  
  // Transformation rules
  const transformations = [
    // "best X" -> "what are the best X"
    { pattern: /^(best|top)\s+(.+)$/i, transform: (m: RegExpMatchArray) => `what are the ${m[1]} ${m[2]}` },
    
    // "X vs Y" -> "which is better X or Y"
    { pattern: /^(.+)\s+vs\.?\s+(.+)$/i, transform: (m: RegExpMatchArray) => `which is better ${m[1]} or ${m[2]}` },
    
    // "X review" -> "should I buy X"
    { pattern: /^(.+)\s+review$/i, transform: (m: RegExpMatchArray) => `should I buy ${m[1]}` },
    
    // "X price" -> "how much does X cost"
    { pattern: /^(.+)\s+price$/i, transform: (m: RegExpMatchArray) => `how much does ${m[1]} cost` },
    
    // "X benefits" -> "what are the benefits of X"
    { pattern: /^(.+)\s+benefits$/i, transform: (m: RegExpMatchArray) => `what are the benefits of ${m[1]}` },
    
    // "how to X" stays the same (already conversational)
    { pattern: /^how to\s+/i, transform: null },
    
    // "what is X" stays the same
    { pattern: /^what is\s+/i, transform: null },
  ];
  
  // Apply transformations
  for (const rule of transformations) {
    const match = aiQuery.match(rule.pattern);
    if (match && rule.transform) {
      aiQuery = rule.transform(match);
      break;
    }
  }
  
  // Add persona context if applicable (for consideration/decision stages only)
  if (context.persona && context.funnelStage !== 'awareness') {
    const personaConfig = PERSONA_QUERY_MAPPING[context.persona];
    if (personaConfig && personaConfig.queryModifiers.length > 0) {
      // Don't add modifier if it's already in the query
      const modifier = personaConfig.queryModifiers[0];
      if (!aiQuery.toLowerCase().includes(modifier.toLowerCase())) {
        // Only add modifiers that make sense contextually
        if (personaConfig.intentType === 'price_sensitive' && !aiQuery.includes('budget') && !aiQuery.includes('affordable')) {
          aiQuery = `${aiQuery} for budget`;
        } else if (personaConfig.intentType === 'sustainability_focused' && !aiQuery.includes('sustainable')) {
          aiQuery = `sustainable ${aiQuery}`;
        }
      }
    }
  }
  
  return aiQuery;
}

/**
 * Generate questions for a given context
 */
export function generatePersonaInformedQuestions(context: {
  subcategory: string;
  brand: string;
  competitors?: string[];
  persona?: string;
  funnelStage: 'awareness' | 'consideration' | 'decision';
  count?: number;
}): string[] {
  const { subcategory, brand, competitors = [], persona, funnelStage, count = 3 } = context;
  const questions: string[] = [];
  const currentYear = new Date().getFullYear().toString();
  
  // Get base patterns for funnel stage
  const stageConfig = FUNNEL_STAGE_PATTERNS[funnelStage];
  const basePatterns = [...stageConfig.patterns];
  
  // Add persona-specific patterns if persona selected and stage allows
  let personaPatterns: QueryPattern[] = [];
  if (persona && stageConfig.personaInfluence !== 'low') {
    const personaConfig = PERSONA_QUERY_MAPPING[persona];
    if (personaConfig) {
      personaPatterns = personaConfig.questionPatterns;
    }
  }
  
  // Combine patterns, prioritizing persona patterns for consideration/decision
  const allPatterns = funnelStage === 'awareness' 
    ? basePatterns 
    : [...personaPatterns, ...basePatterns];
  
  // Generate questions from patterns
  for (const patternConfig of allPatterns) {
    if (questions.length >= count) break;
    
    let question = patternConfig.pattern;
    
    // Replace variables
    question = question.replace('{subcategory}', subcategory);
    question = question.replace('{brand}', brand);
    question = question.replace('{year}', currentYear);
    question = question.replace('{competitor}', competitors[0] || 'alternatives');
    
    // Replace price if needed
    if (question.includes('{price}') && persona) {
      const personaConfig = PERSONA_QUERY_MAPPING[persona];
      const price = personaConfig?.pricePoints?.[0] || '€100';
      question = question.replace('{price}', price);
    }
    
    // Avoid duplicates
    if (!questions.includes(question)) {
      questions.push(question);
    }
  }
  
  return questions.slice(0, count);
}

/**
 * Get recommended personas for a subcategory
 */
export function getRecommendedPersonas(subcategory: string, _category?: string): string[] {
  // Subcategory to persona mapping for common categories
  const subcategoryPersonaMap: Record<string, string[]> = {
    // Fashion & Apparel
    "running shoes": ["community-focused", "self-quantifier", "value-budgeteer"],
    "basketball shoes": ["brand-champion", "experience-seeker", "connected-shopper"],
    "casual sneakers": ["little-treat", "experience-seeker", "value-budgeteer"],
    "athletic wear": ["community-focused", "sustainable-changemaker", "heirloom-investor"],
    
    // Beauty & Personal Care
    "skincare": ["skintellectual", "science-backer", "clean-beauty"],
    "moisturizer": ["skintellectual", "clean-beauty", "value-budgeteer"],
    "serum": ["skintellectual", "science-backer", "heirloom-investor"],
    "sunscreen": ["science-backer", "clean-beauty", "value-budgeteer"],
    
    // Technology
    "laptop": ["technical-evaluator", "roi-pragmatist", "connected-shopper"],
    "smartphone": ["connected-shopper", "experience-seeker", "impulse-buyer"],
    "headphones": ["experience-seeker", "heirloom-investor", "value-budgeteer"],
    
    // Fitness
    "gym equipment": ["self-quantifier", "community-focused", "heirloom-investor"],
    "fitness tracker": ["self-quantifier", "connected-shopper", "value-budgeteer"],
    "protein powder": ["science-backer", "value-budgeteer", "community-focused"],
  };
  
  // Try exact match
  const lowerSubcat = subcategory.toLowerCase();
  if (subcategoryPersonaMap[lowerSubcat]) {
    return subcategoryPersonaMap[lowerSubcat];
  }
  
  // Try partial match
  for (const [key, personas] of Object.entries(subcategoryPersonaMap)) {
    if (lowerSubcat.includes(key) || key.includes(lowerSubcat)) {
      return personas;
    }
  }
  
  // Default fallback personas based on common archetypes
  return ["connected-shopper", "value-budgeteer", "experience-seeker"];
}

/**
 * Query repetition configuration by funnel stage
 */
export const QUERY_REPETITION_CONFIG = {
  awareness: {
    repetitions: 1,
    rationale: "Awareness queries produce stable, deterministic responses",
    confidenceThreshold: 0.85,
  },
  consideration: {
    repetitions: 2,
    rationale: "Some variability in brand rankings and comparisons",
    confidenceThreshold: 0.75,
  },
  decision: {
    repetitions: 3,
    rationale: "High variability in recommendations and sentiment",
    confidenceThreshold: 0.65,
  },
};
