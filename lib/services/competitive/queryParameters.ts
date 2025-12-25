/**
 * Query Parameter Matrix
 *
 * Defines various query modifiers to test which triggers cause AI platforms
 * to recommend competitors over your brand.
 */

export interface QueryModifier {
  category: string;
  type: string;
  modifier: string;
}

/**
 * Comprehensive query parameters for competitive trigger testing
 */
export const queryParameters = {
  // Price-related modifiers
  priceModifiers: {
    budget: [
      "cheap",
      "budget",
      "affordable",
      "under $25",
      "under $50",
      "under $100",
      "under €50",
      "under €100",
      "best value",
      "value for money",
      "economical",
      "inexpensive"
    ],
    premium: [
      "premium",
      "luxury",
      "high-end",
      "best quality",
      "expensive",
      "top tier",
      "professional grade",
      "deluxe"
    ]
  },

  // Use case modifiers
  useCaseModifiers: {
    activity: [
      "running",
      "hiking",
      "gym",
      "training",
      "yoga",
      "walking",
      "jogging",
      "cycling",
      "swimming",
      "basketball"
    ],
    terrain: [
      "road",
      "trail",
      "indoor",
      "outdoor",
      "pavement",
      "dirt",
      "track",
      "treadmill"
    ],
    frequency: [
      "daily",
      "occasional",
      "frequent",
      "intensive",
      "casual",
      "professional"
    ],
    level: [
      "beginner",
      "intermediate",
      "advanced",
      "expert",
      "novice",
      "pro"
    ]
  },

  // User-specific modifiers
  userModifiers: {
    physical: [
      "wide feet",
      "narrow feet",
      "flat feet",
      "high arch",
      "plantar fasciitis",
      "bunions",
      "heel pain",
      "knee problems",
      "back pain",
      "overpronation",
      "supination"
    ],
    preference: [
      "comfort",
      "style",
      "performance",
      "durability",
      "lightweight",
      "cushioning",
      "support",
      "breathable",
      "waterproof",
      "flexible"
    ],
    demographic: [
      "women",
      "men",
      "kids",
      "seniors",
      "youth",
      "adults",
      "teenagers"
    ]
  },

  // Values-based modifiers
  valuesModifiers: {
    sustainability: [
      "sustainable",
      "eco-friendly",
      "recycled",
      "carbon neutral",
      "environmentally friendly",
      "green",
      "renewable",
      "biodegradable",
      "zero waste",
      "circular economy"
    ],
    ethics: [
      "ethical",
      "fair trade",
      "vegan",
      "cruelty-free",
      "organic",
      "natural",
      "non-toxic",
      "chemical-free",
      "paraben-free",
      "locally made"
    ],
    social: [
      "socially responsible",
      "minority-owned",
      "women-owned",
      "charitable",
      "gives back"
    ]
  },

  // Quality modifiers
  qualityModifiers: {
    performance: [
      "best performing",
      "highest rated",
      "top quality",
      "most effective",
      "fastest",
      "strongest",
      "most durable",
      "longest lasting"
    ],
    reliability: [
      "most reliable",
      "trusted",
      "proven",
      "tested",
      "certified",
      "endorsed",
      "award-winning"
    ]
  },

  // Availability modifiers
  availabilityModifiers: {
    location: [
      "available near me",
      "local",
      "in store",
      "online",
      "shipped to US",
      "shipped to UK",
      "shipped to EU",
      "international shipping"
    ],
    timing: [
      "available now",
      "in stock",
      "fast shipping",
      "same day delivery",
      "next day delivery",
      "immediate delivery"
    ]
  },

  // Feature modifiers
  featureModifiers: {
    technology: [
      "latest technology",
      "innovative",
      "advanced features",
      "smart",
      "AI-powered",
      "connected",
      "app-enabled"
    ],
    design: [
      "stylish",
      "modern design",
      "sleek",
      "minimalist",
      "classic",
      "trendy",
      "fashionable",
      "unique design"
    ]
  }
};

/**
 * Generate test query matrix for a subcategory
 */
export function generateTestMatrix(
  baseQuery: string,
  subcategory: string
): Array<{
  id: string;
  modifier: string;
  modifierCategory: string;
  modifierType: string;
  fullQuery: string;
}> {
  const matrix = [];
  let idCounter = 0;

  // Iterate through all modifier categories
  for (const [category, modifierGroups] of Object.entries(queryParameters)) {
    for (const [type, modifiers] of Object.entries(modifierGroups as any)) {
      for (const modifier of modifiers as string[]) {
        matrix.push({
          id: `test-${idCounter++}`,
          modifier,
          modifierCategory: category,
          modifierType: type,
          fullQuery: `best ${modifier} ${subcategory}`
        });
      }
    }
  }

  return matrix;
}

/**
 * Generate targeted test matrix (subset of most important modifiers)
 */
export function generateTargetedTestMatrix(subcategory: string): Array<{
  id: string;
  modifier: string;
  modifierCategory: string;
  modifierType: string;
  fullQuery: string;
}> {
  const priorityModifiers = {
    price: ["budget", "affordable", "under $50", "premium", "luxury"],
    values: ["sustainable", "eco-friendly", "vegan", "organic", "ethical"],
    performance: ["best performing", "highest rated", "most effective"],
    userNeeds: ["for beginners", "for professionals", "comfortable", "durable"]
  };

  const matrix = [];
  let idCounter = 0;

  for (const [category, modifiers] of Object.entries(priorityModifiers)) {
    for (const modifier of modifiers as string[]) {
      matrix.push({
        id: `targeted-${idCounter++}`,
        modifier,
        modifierCategory: category,
        modifierType: category,
        fullQuery: `best ${modifier} ${subcategory}`
      });
    }
  }

  return matrix;
}

/**
 * Get modifier category label
 */
export function getModifierCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    priceModifiers: "Price Sensitivity",
    useCaseModifiers: "Use Case",
    userModifiers: "User Needs",
    valuesModifiers: "Values & Ethics",
    qualityModifiers: "Quality Focus",
    availabilityModifiers: "Availability",
    featureModifiers: "Features"
  };

  return labels[category] || category;
}

/**
 * Get all unique modifiers across categories
 */
export function getAllModifiers(): QueryModifier[] {
  const allModifiers: QueryModifier[] = [];

  for (const [category, modifierGroups] of Object.entries(queryParameters)) {
    for (const [type, modifiers] of Object.entries(modifierGroups as any)) {
      for (const modifier of modifiers as string[]) {
        allModifiers.push({
          category,
          type,
          modifier
        });
      }
    }
  }

  return allModifiers;
}

/**
 * Get modifiers by category
 */
export function getModifiersByCategory(category: string): string[] {
  const categoryData = (queryParameters as any)[category];
  if (!categoryData) return [];

  const modifiers: string[] = [];

  for (const modifierGroup of Object.values(categoryData)) {
    modifiers.push(...(modifierGroup as string[]));
  }

  return modifiers;
}
