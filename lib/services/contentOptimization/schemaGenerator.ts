/**
 * Schema Markup Generator
 *
 * Generates JSON-LD schema markup for different content types to improve AI platform understanding
 */

import type {
  SchemaRecommendation,
  SchemaType,
  SchemaProperty,
  SchemaImpact,
  SchemaImplementation
} from "@/lib/types/contentOptimization";

/**
 * Generate schema recommendations for content
 */
export async function generateSchemaRecommendations(
  contentUrl: string,
  contentType: string,
  contentData: any
): Promise<SchemaRecommendation[]> {
  const recommendations: SchemaRecommendation[] = [];

  // Determine applicable schema types
  const applicableSchemas = determineApplicableSchemas(contentType, contentData);

  for (const schemaType of applicableSchemas) {
    const recommendation = createSchemaRecommendation(
      contentUrl,
      schemaType,
      contentData
    );
    recommendations.push(recommendation);
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Determine applicable schema types based on content
 */
function determineApplicableSchemas(
  contentType: string,
  contentData: any
): string[] {
  const schemas: string[] = [];

  // FAQ content
  if (hasQuestions(contentData)) {
    schemas.push("FAQPage");
  }

  // How-to content
  if (hasSteps(contentData)) {
    schemas.push("HowTo");
  }

  // Product pages
  if (isProduct(contentType, contentData)) {
    schemas.push("Product");
  }

  // Article content
  if (isArticle(contentType)) {
    schemas.push("Article");
  }

  // Organization/Business
  if (isOrganization(contentType)) {
    schemas.push("Organization");
  }

  // Local business
  if (isLocalBusiness(contentData)) {
    schemas.push("LocalBusiness");
  }

  // Reviews
  if (hasReviews(contentData)) {
    schemas.push("Review");
  }

  // Events
  if (isEvent(contentData)) {
    schemas.push("Event");
  }

  // Software/App
  if (isSoftware(contentType, contentData)) {
    schemas.push("SoftwareApplication");
  }

  return schemas;
}

/**
 * Create schema recommendation
 */
function createSchemaRecommendation(
  contentUrl: string,
  schemaType: string,
  contentData: any
): SchemaRecommendation {
  const schema = buildSchemaType(schemaType, contentData);
  const impact = estimateSchemaImpact(schemaType);
  const implementation = generateSchemaImplementation(schemaType, schema);

  return {
    id: generateSchemaRecommendationId(),
    pageUrl: contentUrl,
    currentSchema: [], // Would be detected from page
    recommendedSchema: [schema],
    priority: determineSchemaPriority(schemaType, impact),
    impact,
    implementation
  };
}

/**
 * Build schema type with properties
 */
function buildSchemaType(schemaType: string, contentData: any): SchemaType {
  const builders: Record<string, () => SchemaType> = {
    FAQPage: () => buildFAQSchema(contentData),
    HowTo: () => buildHowToSchema(contentData),
    Product: () => buildProductSchema(contentData),
    Article: () => buildArticleSchema(contentData),
    Organization: () => buildOrganizationSchema(contentData),
    LocalBusiness: () => buildLocalBusinessSchema(contentData),
    SoftwareApplication: () => buildSoftwareSchema(contentData)
  };

  const builder = builders[schemaType];
  return builder ? builder() : buildGenericSchema(schemaType);
}

/**
 * Build FAQ schema
 */
function buildFAQSchema(contentData: any): SchemaType {
  const questions = extractQuestions(contentData);

  const example = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  };

  return {
    type: "FAQPage",
    reason: "Your content contains Q&A format which is highly valued by AI platforms",
    properties: [
      {
        name: "mainEntity",
        required: true,
        suggestion: "Add all question-answer pairs from your content"
      }
    ],
    example
  };
}

/**
 * Build HowTo schema
 */
function buildHowToSchema(contentData: any): SchemaType {
  const steps = extractSteps(contentData);

  const example = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": contentData.title || "How to Guide",
    "description": contentData.description || "",
    "step": steps.map((step, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "name": step.name,
      "text": step.text,
      "url": step.url
    }))
  };

  return {
    type: "HowTo",
    reason: "Step-by-step instructions are favored for instructional queries",
    properties: [
      { name: "name", required: true, suggestion: contentData.title },
      { name: "description", required: false, suggestion: contentData.description },
      { name: "step", required: true, suggestion: "Add all steps from your guide" }
    ],
    example
  };
}

/**
 * Build Product schema
 */
function buildProductSchema(contentData: any): SchemaType {
  const example: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": contentData.name || "",
    "description": contentData.description || "",
    "brand": {
      "@type": "Brand",
      "name": contentData.brand || ""
    },
    "offers": {
      "@type": "Offer",
      "price": contentData.price || "",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  };

  if (contentData.rating) {
    example["aggregateRating"] = {
      "@type": "AggregateRating",
      "ratingValue": contentData.rating,
      "reviewCount": contentData.reviewCount || 0
    };
  }

  return {
    type: "Product",
    reason: "Product schema improves visibility for product-related queries",
    properties: [
      { name: "name", required: true, suggestion: contentData.name },
      { name: "description", required: true, suggestion: contentData.description },
      { name: "price", required: true, suggestion: contentData.price },
      { name: "aggregateRating", required: false, suggestion: "Add if you have reviews" }
    ],
    example
  };
}

/**
 * Build Article schema
 */
function buildArticleSchema(contentData: any): SchemaType {
  const example = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": contentData.title || "",
    "description": contentData.description || "",
    "author": {
      "@type": "Person",
      "name": contentData.author || ""
    },
    "datePublished": contentData.publishedAt || new Date().toISOString(),
    "dateModified": contentData.updatedAt || new Date().toISOString()
  };

  return {
    type: "Article",
    reason: "Article schema helps AI platforms understand content freshness and authorship",
    properties: [
      { name: "headline", required: true, suggestion: contentData.title },
      { name: "author", required: true, suggestion: contentData.author },
      { name: "datePublished", required: true, suggestion: contentData.publishedAt },
      { name: "dateModified", required: false, suggestion: "Update when content changes" }
    ],
    example
  };
}

/**
 * Build Organization schema
 */
function buildOrganizationSchema(contentData: any): SchemaType {
  const example = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": contentData.name || "",
    "url": contentData.url || "",
    "logo": contentData.logo || "",
    "description": contentData.description || "",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": contentData.phone || "",
      "contactType": "customer service"
    }
  };

  return {
    type: "Organization",
    reason: "Organization schema establishes brand identity for AI platforms",
    properties: [
      { name: "name", required: true, suggestion: contentData.name },
      { name: "url", required: true, suggestion: contentData.url },
      { name: "logo", required: false, suggestion: "Add your logo URL" }
    ],
    example
  };
}

/**
 * Build LocalBusiness schema
 */
function buildLocalBusinessSchema(contentData: any): SchemaType {
  const example = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": contentData.name || "",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": contentData.address || "",
      "addressLocality": contentData.city || "",
      "addressRegion": contentData.state || "",
      "postalCode": contentData.zip || "",
      "addressCountry": contentData.country || "US"
    },
    "telephone": contentData.phone || "",
    "openingHoursSpecification": []
  };

  return {
    type: "LocalBusiness",
    reason: "Local business schema improves visibility for location-based queries",
    properties: [
      { name: "name", required: true, suggestion: contentData.name },
      { name: "address", required: true, suggestion: "Add full address" },
      { name: "telephone", required: false, suggestion: contentData.phone }
    ],
    example
  };
}

/**
 * Build Software schema
 */
function buildSoftwareSchema(contentData: any): SchemaType {
  const example = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": contentData.name || "",
    "operatingSystem": contentData.os || "Web",
    "applicationCategory": contentData.category || "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": contentData.price || "0",
      "priceCurrency": "USD"
    }
  };

  return {
    type: "SoftwareApplication",
    reason: "Software schema helps AI platforms understand your product features",
    properties: [
      { name: "name", required: true, suggestion: contentData.name },
      { name: "applicationCategory", required: true, suggestion: contentData.category },
      { name: "offers", required: false, suggestion: "Add pricing information" }
    ],
    example
  };
}

/**
 * Build generic schema
 */
function buildGenericSchema(schemaType: string): SchemaType {
  return {
    type: schemaType,
    reason: "This schema type may improve AI platform understanding",
    properties: [],
    example: {
      "@context": "https://schema.org",
      "@type": schemaType
    }
  };
}

/**
 * Estimate schema impact
 */
function estimateSchemaImpact(schemaType: string): SchemaImpact {
  const impacts: Record<string, Partial<SchemaImpact>> = {
    FAQPage: {
      richSnippetChance: 80,
      visibilityIncrease: 25,
      competitorsUsingIt: 60,
      aiPlatformSupport: ["ChatGPT", "Gemini", "Perplexity"]
    },
    HowTo: {
      richSnippetChance: 75,
      visibilityIncrease: 20,
      competitorsUsingIt: 50,
      aiPlatformSupport: ["ChatGPT", "Gemini"]
    },
    Product: {
      richSnippetChance: 85,
      visibilityIncrease: 30,
      competitorsUsingIt: 80,
      aiPlatformSupport: ["ChatGPT", "Gemini", "Perplexity", "Bing"]
    },
    Article: {
      richSnippetChance: 60,
      visibilityIncrease: 15,
      competitorsUsingIt: 70,
      aiPlatformSupport: ["ChatGPT", "Gemini"]
    }
  };

  const defaultImpact: SchemaImpact = {
    richSnippetChance: 50,
    visibilityIncrease: 10,
    competitorsUsingIt: 40,
    aiPlatformSupport: ["ChatGPT"]
  };

  return { ...defaultImpact, ...impacts[schemaType] } as SchemaImpact;
}

/**
 * Generate schema implementation guide
 */
function generateSchemaImplementation(schemaType: string, schema: SchemaType): SchemaImplementation {
  const codeSnippet = `<script type="application/ld+json">
${JSON.stringify(schema.example, null, 2)}
</script>`;

  return {
    difficulty: determineDifficulty(schemaType),
    estimatedTime: estimateImplementationTime(schemaType),
    codeSnippet,
    validationUrl: "https://search.google.com/test/rich-results",
    testingTips: [
      "Validate markup using Google's Rich Results Test",
      "Test on multiple AI platforms after implementation",
      "Monitor changes in visibility metrics",
      "Update schema when content changes"
    ]
  };
}

/**
 * Determine difficulty
 */
function determineDifficulty(schemaType: string): "easy" | "medium" | "hard" {
  const easy = ["FAQPage", "Article", "Organization"];
  const medium = ["HowTo", "Product", "LocalBusiness"];

  if (easy.includes(schemaType)) return "easy";
  if (medium.includes(schemaType)) return "medium";
  return "hard";
}

/**
 * Estimate implementation time
 */
function estimateImplementationTime(schemaType: string): string {
  const times: Record<string, string> = {
    FAQPage: "30-60 minutes",
    HowTo: "1-2 hours",
    Product: "1-2 hours",
    Article: "30 minutes",
    Organization: "1 hour",
    LocalBusiness: "1-2 hours"
  };

  return times[schemaType] || "2-4 hours";
}

/**
 * Determine schema priority
 */
function determineSchemaPriority(
  schemaType: string,
  impact: SchemaImpact
): "critical" | "high" | "medium" | "low" {
  if (impact.richSnippetChance >= 80 && impact.visibilityIncrease >= 25) {
    return "critical";
  }
  if (impact.richSnippetChance >= 70 || impact.visibilityIncrease >= 20) {
    return "high";
  }
  if (impact.richSnippetChance >= 60 || impact.visibilityIncrease >= 10) {
    return "medium";
  }
  return "low";
}

// Helper functions for content detection

function hasQuestions(contentData: any): boolean {
  return contentData.hasQuestions || (contentData.questions && contentData.questions.length > 0);
}

function hasSteps(contentData: any): boolean {
  return contentData.hasSteps || (contentData.steps && contentData.steps.length > 0);
}

function isProduct(contentType: string, contentData: any): boolean {
  return contentType === "product" || !!contentData.price;
}

function isArticle(contentType: string): boolean {
  return ["article", "blog", "news"].includes(contentType);
}

function isOrganization(contentType: string): boolean {
  return contentType === "about" || contentType === "organization";
}

function isLocalBusiness(contentData: any): boolean {
  return !!contentData.address || !!contentData.location;
}

function hasReviews(contentData: any): boolean {
  return !!contentData.reviews || !!contentData.rating;
}

function isEvent(contentData: any): boolean {
  return !!contentData.eventDate || !!contentData.startDate;
}

function isSoftware(contentType: string, contentData: any): boolean {
  return contentType === "software" || contentType === "app" || !!contentData.appCategory;
}

function extractQuestions(contentData: any): Array<{ question: string; answer: string }> {
  if (contentData.questions) return contentData.questions;
  return [];
}

function extractSteps(contentData: any): Array<{ name: string; text: string; url?: string }> {
  if (contentData.steps) return contentData.steps;
  return [];
}

function generateSchemaRecommendationId(): string {
  return `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate schema markup
 */
export async function validateSchemaMarkup(markup: string): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const schema = JSON.parse(markup);

    // Check for required @context
    if (!schema["@context"]) {
      errors.push("Missing required @context property");
    }

    // Check for required @type
    if (!schema["@type"]) {
      errors.push("Missing required @type property");
    }

    // Type-specific validation
    if (schema["@type"] === "FAQPage") {
      if (!schema.mainEntity || schema.mainEntity.length === 0) {
        errors.push("FAQPage must have at least one question in mainEntity");
      }
    }

    if (schema["@type"] === "Product") {
      if (!schema.name) errors.push("Product must have a name");
      if (!schema.offers) warnings.push("Product should have offers");
    }

  } catch (error) {
    errors.push(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
