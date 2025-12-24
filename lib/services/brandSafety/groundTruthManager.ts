/**
 * Ground Truth Manager
 *
 * Manages verified facts about a brand for hallucination detection
 */

import type {
  GroundTruth,
  GroundTruthFact,
  GroundTruthCategory
} from "@/lib/types/brandSafety";

/**
 * Create ground truth from brand information
 */
export function createGroundTruth(
  brandId: string,
  category: GroundTruthCategory,
  topic: string,
  facts: Omit<GroundTruthFact, "id">[]
): GroundTruth {
  const now = new Date().toISOString();

  return {
    id: generateGroundTruthId(),
    brandId,
    category,
    topic,
    facts: facts.map(fact => ({
      ...fact,
      id: generateFactId()
    })),
    lastVerified: now,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Add fact to ground truth
 */
export function addFact(
  groundTruth: GroundTruth,
  fact: Omit<GroundTruthFact, "id">
): GroundTruth {
  return {
    ...groundTruth,
    facts: [
      ...groundTruth.facts,
      {
        ...fact,
        id: generateFactId()
      }
    ],
    updatedAt: new Date().toISOString()
  };
}

/**
 * Update fact in ground truth
 */
export function updateFact(
  groundTruth: GroundTruth,
  factId: string,
  updates: Partial<Omit<GroundTruthFact, "id">>
): GroundTruth {
  return {
    ...groundTruth,
    facts: groundTruth.facts.map(fact =>
      fact.id === factId ? { ...fact, ...updates } : fact
    ),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Remove fact from ground truth
 */
export function removeFact(
  groundTruth: GroundTruth,
  factId: string
): GroundTruth {
  return {
    ...groundTruth,
    facts: groundTruth.facts.filter(fact => fact.id !== factId),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Mark fact as deprecated
 */
export function deprecateFact(
  groundTruth: GroundTruth,
  factId: string,
  reason?: string
): GroundTruth {
  return updateFact(groundTruth, factId, {
    confidence: "deprecated",
    expiresAt: new Date().toISOString()
  });
}

/**
 * Verify all facts in ground truth
 */
export function verifyGroundTruth(groundTruth: GroundTruth): GroundTruth {
  const now = new Date().toISOString();

  return {
    ...groundTruth,
    facts: groundTruth.facts.map(fact => ({
      ...fact,
      verifiedAt: now,
      confidence: "verified"
    })),
    lastVerified: now,
    updatedAt: now
  };
}

/**
 * Get expired facts
 */
export function getExpiredFacts(groundTruth: GroundTruth): GroundTruthFact[] {
  const now = new Date();

  return groundTruth.facts.filter(fact => {
    if (!fact.expiresAt) return false;
    return new Date(fact.expiresAt) < now;
  });
}

/**
 * Get facts needing verification
 */
export function getFactsNeedingVerification(
  groundTruth: GroundTruth,
  daysThreshold: number = 30
): GroundTruthFact[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

  return groundTruth.facts.filter(fact => {
    const verifiedDate = new Date(fact.verifiedAt);
    return verifiedDate < cutoffDate || fact.confidence === "assumed";
  });
}

/**
 * Import ground truth from JSON
 */
export function importGroundTruthFromJSON(
  brandId: string,
  json: any
): GroundTruth[] {
  const groundTruths: GroundTruth[] = [];

  // Company Info
  if (json.company) {
    groundTruths.push(createGroundTruth(brandId, "company_info", "Company Information", [
      {
        statement: "Company name",
        value: json.company.name,
        source: json.company.source || "Website",
        verifiedAt: new Date().toISOString(),
        confidence: "verified"
      },
      ...(json.company.founded ? [{
        statement: "Founded year",
        value: json.company.founded,
        source: json.company.source || "Website",
        verifiedAt: new Date().toISOString(),
        confidence: "verified"
      }] : []),
      ...(json.company.headquarters ? [{
        statement: "Headquarters location",
        value: json.company.headquarters,
        source: json.company.source || "Website",
        verifiedAt: new Date().toISOString(),
        confidence: "verified"
      }] : [])
    ]));
  }

  // Products
  if (json.products && Array.isArray(json.products)) {
    const productFacts: Omit<GroundTruthFact, "id">[] = json.products.map((product: any) => ({
      statement: `Product: ${product.name}`,
      value: product.name,
      source: product.source || "Product catalog",
      verifiedAt: new Date().toISOString(),
      confidence: "verified"
    }));

    if (productFacts.length > 0) {
      groundTruths.push(createGroundTruth(brandId, "products", "Product Catalog", productFacts));
    }
  }

  // Pricing
  if (json.pricing && Array.isArray(json.pricing)) {
    const pricingFacts: Omit<GroundTruthFact, "id">[] = json.pricing.map((price: any) => ({
      statement: `Price for ${price.product}`,
      value: price.value,
      source: price.source || "Pricing page",
      verifiedAt: new Date().toISOString(),
      confidence: "verified",
      expiresAt: price.expiresAt
    }));

    if (pricingFacts.length > 0) {
      groundTruths.push(createGroundTruth(brandId, "pricing", "Pricing Information", pricingFacts));
    }
  }

  // Features
  if (json.features && Array.isArray(json.features)) {
    const featureFacts: Omit<GroundTruthFact, "id">[] = json.features.map((feature: any) => ({
      statement: `Feature: ${feature.name}`,
      value: feature.name,
      source: feature.source || "Feature list",
      verifiedAt: new Date().toISOString(),
      confidence: "verified"
    }));

    if (featureFacts.length > 0) {
      groundTruths.push(createGroundTruth(brandId, "features", "Features", featureFacts));
    }
  }

  return groundTruths;
}

/**
 * Export ground truth to JSON
 */
export function exportGroundTruthToJSON(groundTruths: GroundTruth[]): any {
  const json: any = {
    exportedAt: new Date().toISOString(),
    categories: {}
  };

  for (const groundTruth of groundTruths) {
    json.categories[groundTruth.category] = {
      topic: groundTruth.topic,
      lastVerified: groundTruth.lastVerified,
      facts: groundTruth.facts.map(fact => ({
        statement: fact.statement,
        value: fact.value,
        source: fact.source,
        verifiedAt: fact.verifiedAt,
        expiresAt: fact.expiresAt,
        confidence: fact.confidence
      }))
    };
  }

  return json;
}

/**
 * Generate ground truth template
 */
export function generateTemplate(category: GroundTruthCategory): Omit<GroundTruthFact, "id">[] {
  const now = new Date().toISOString();

  const templates: Record<GroundTruthCategory, Omit<GroundTruthFact, "id">[]> = {
    company_info: [
      {
        statement: "Company name",
        value: "",
        source: "Website",
        verifiedAt: now,
        confidence: "assumed"
      },
      {
        statement: "Founded year",
        value: "",
        source: "Website",
        verifiedAt: now,
        confidence: "assumed"
      },
      {
        statement: "Headquarters location",
        value: "",
        source: "Website",
        verifiedAt: now,
        confidence: "assumed"
      }
    ],
    products: [
      {
        statement: "Product name",
        value: "",
        source: "Product catalog",
        verifiedAt: now,
        confidence: "assumed"
      }
    ],
    pricing: [
      {
        statement: "Price",
        value: "",
        source: "Pricing page",
        verifiedAt: now,
        confidence: "assumed"
      }
    ],
    features: [
      {
        statement: "Feature",
        value: "",
        source: "Feature list",
        verifiedAt: now,
        confidence: "assumed"
      }
    ],
    availability: [
      {
        statement: "Available in region",
        value: "",
        source: "Website",
        verifiedAt: now,
        confidence: "assumed"
      }
    ],
    leadership: [
      {
        statement: "CEO name",
        value: "",
        source: "About page",
        verifiedAt: now,
        confidence: "assumed"
      }
    ],
    locations: [
      {
        statement: "Office location",
        value: "",
        source: "Contact page",
        verifiedAt: now,
        confidence: "assumed"
      }
    ],
    certifications: [
      {
        statement: "Certification",
        value: "",
        source: "Certifications page",
        verifiedAt: now,
        confidence: "assumed"
      }
    ],
    awards: [
      {
        statement: "Award received",
        value: "",
        source: "Press page",
        verifiedAt: now,
        confidence: "assumed"
      }
    ],
    partnerships: [
      {
        statement: "Partner company",
        value: "",
        source: "Partners page",
        verifiedAt: now,
        confidence: "assumed"
      }
    ]
  };

  return templates[category] || [];
}

/**
 * Validate ground truth
 */
export function validateGroundTruth(groundTruth: GroundTruth): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty facts
  if (groundTruth.facts.length === 0) {
    errors.push("Ground truth must have at least one fact");
  }

  // Check each fact
  for (const fact of groundTruth.facts) {
    if (!fact.statement || fact.statement.trim() === "") {
      errors.push(`Fact ${fact.id} is missing statement`);
    }

    if (fact.value === null || fact.value === undefined || fact.value === "") {
      errors.push(`Fact ${fact.id} is missing value`);
    }

    if (!fact.source || fact.source.trim() === "") {
      warnings.push(`Fact ${fact.id} is missing source`);
    }

    // Check for stale verification
    const daysSinceVerified = Math.floor(
      (new Date().getTime() - new Date(fact.verifiedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceVerified > 90) {
      warnings.push(`Fact ${fact.id} hasn't been verified in ${daysSinceVerified} days`);
    }

    // Check for expired facts
    if (fact.expiresAt && new Date(fact.expiresAt) < new Date()) {
      warnings.push(`Fact ${fact.id} has expired`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate ground truth ID
 */
function generateGroundTruthId(): string {
  return `gt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate fact ID
 */
function generateFactId(): string {
  return `fact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
