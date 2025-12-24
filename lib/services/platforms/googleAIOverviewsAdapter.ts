/**
 * Google AI Overviews Adapter
 *
 * Handles querying Google AI Overviews (formerly SGE) and parsing results
 */

import type {
  GoogleAIOverviewsConfig,
  GoogleAIOverviewsResponse,
  AIOverview,
  AIOverviewSource,
  OrganicResult,
  SearchInfo,
  PlatformQueryResult
} from "@/lib/types/platforms";

/**
 * Query Google AI Overviews
 */
export async function queryGoogleAIOverviews(
  query: string,
  config: GoogleAIOverviewsConfig,
  brand?: string
): Promise<PlatformQueryResult> {
  const startTime = Date.now();

  try {
    const response = await searchGoogleWithAI(query, config);
    const parsed = parseGoogleAIResponse(response, query, brand);

    const duration = Date.now() - startTime;

    return {
      platform: "google_ai_overviews",
      query,
      response: parsed,
      executedAt: new Date().toISOString(),
      duration,
      cost: 0 // Google AI Overviews is free (part of search)
    };
  } catch (error) {
    return {
      platform: "google_ai_overviews",
      query,
      response: createEmptyGoogleAIResponse(query),
      executedAt: new Date().toISOString(),
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Search Google with AI Overviews enabled
 * Note: In production, this would use Google's Search API or a third-party SERP API
 */
async function searchGoogleWithAI(
  query: string,
  config: GoogleAIOverviewsConfig
): Promise<any> {
  const apiKey = config.apiKey;
  if (!apiKey) {
    throw new Error("Google API key or SERP API key not configured");
  }

  // In production, use one of these approaches:
  // 1. Google Custom Search JSON API (limited AI Overview support)
  // 2. Third-party SERP APIs (SerpAPI, ScraperAPI, etc.) with AI Overview extraction
  // 3. Custom scraping (not recommended, violates ToS)

  const endpoint = config.endpoint || "https://serpapi.com/search";

  const params = new URLSearchParams({
    q: query,
    api_key: apiKey,
    engine: "google",
    google_domain: "google.com",
    gl: config.options?.location || "us",
    hl: config.options?.language || "en",
    safe: config.options?.safeSearch || "off"
  });

  const response = await fetch(`${endpoint}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Parse Google AI Overviews response
 */
function parseGoogleAIResponse(
  apiResponse: any,
  query: string,
  brand?: string
): GoogleAIOverviewsResponse {
  // Extract AI Overview
  const overview = extractAIOverview(apiResponse, brand);

  // Extract organic results
  const organicResults = extractOrganicResults(apiResponse, brand);

  // Extract related questions
  const relatedQuestions = extractRelatedQuestions(apiResponse);

  // Extract search info
  const searchInfo = extractSearchInfo(apiResponse);

  // Determine if brand was mentioned in AI overview
  const brandMentioned = overview.generated && brand
    ? overview.content.toLowerCase().includes(brand.toLowerCase())
    : false;

  // Extract citations
  const citations = overview.sources.map(source => ({
    url: source.url,
    title: source.title,
    platform: "google_ai_overviews"
  }));

  // Determine sentiment
  const sentiment = brand ? analyzeSentiment(overview.content, brand) : "neutral";

  return {
    llm: "google_ai_overviews",
    query,
    content: overview.content,
    fullResponse: overview.content,
    overview,
    organicResults,
    relatedQuestions,
    searchInfo,
    brandMentioned,
    citations,
    sentiment,
    timestamp: new Date().toISOString()
  };
}

/**
 * Extract AI Overview from response
 */
function extractAIOverview(apiResponse: any, brand?: string): AIOverview {
  // AI Overview structure varies by SERP API provider
  // This is a generalized implementation

  const aiOverviewData = apiResponse.ai_overview || apiResponse.answer_box || null;

  if (!aiOverviewData) {
    return {
      generated: false,
      content: "",
      sources: [],
      confidence: "low"
    };
  }

  // Extract content
  const content = aiOverviewData.snippet || aiOverviewData.answer || aiOverviewData.text || "";

  // Extract sources
  const sources: AIOverviewSource[] = [];

  if (aiOverviewData.sources) {
    aiOverviewData.sources.forEach((source: any, index: number) => {
      sources.push({
        title: source.title || "",
        url: source.link || source.url || "",
        snippet: source.snippet || "",
        position: index + 1,
        domain: extractDomain(source.link || source.url || ""),
        favicon: source.favicon
      });
    });
  }

  // Determine confidence based on number of sources and content length
  let confidence: "high" | "medium" | "low" = "medium";
  if (sources.length >= 3 && content.length > 200) {
    confidence = "high";
  } else if (sources.length < 2 || content.length < 100) {
    confidence = "low";
  }

  return {
    generated: true,
    content,
    sources,
    confidence,
    disclaimer: aiOverviewData.disclaimer
  };
}

/**
 * Extract organic search results
 */
function extractOrganicResults(apiResponse: any, brand?: string): OrganicResult[] {
  const results: OrganicResult[] = [];

  const organicData = apiResponse.organic_results || apiResponse.organic || [];

  for (const result of organicData.slice(0, 10)) {
    results.push({
      position: result.position || 0,
      title: result.title || "",
      url: result.link || result.url || "",
      domain: extractDomain(result.link || result.url || ""),
      snippet: result.snippet || result.description || "",
      date: result.date,
      richSnippet: extractRichSnippet(result)
    });
  }

  return results;
}

/**
 * Extract rich snippet from result
 */
function extractRichSnippet(result: any): any {
  if (result.rich_snippet) {
    return {
      type: determineSnippetType(result.rich_snippet),
      data: result.rich_snippet
    };
  }

  if (result.faq) {
    return {
      type: "faq",
      data: result.faq
    };
  }

  return undefined;
}

/**
 * Determine snippet type
 */
function determineSnippetType(snippet: any): string {
  if (snippet.faq) return "faq";
  if (snippet.recipe) return "recipe";
  if (snippet.product) return "product";
  if (snippet.review) return "review";
  if (snippet.howto) return "howto";
  return "unknown";
}

/**
 * Extract related questions (People Also Ask)
 */
function extractRelatedQuestions(apiResponse: any): string[] {
  const questions: string[] = [];

  const relatedData = apiResponse.related_questions || apiResponse.people_also_ask || [];

  for (const item of relatedData) {
    if (item.question) {
      questions.push(item.question);
    }
  }

  return questions;
}

/**
 * Extract search info
 */
function extractSearchInfo(apiResponse: any): SearchInfo {
  const searchInfo = apiResponse.search_information || {};

  return {
    totalResults: parseInt(searchInfo.total_results) || 0,
    searchTime: parseFloat(searchInfo.time_taken_displayed) || 0,
    location: searchInfo.location,
    language: searchInfo.detected_language
  };
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Analyze sentiment in AI Overview
 */
function analyzeSentiment(content: string, brand: string): "positive" | "neutral" | "negative" {
  const lowerContent = content.toLowerCase();
  const brandLower = brand.toLowerCase();

  if (!lowerContent.includes(brandLower)) {
    return "neutral";
  }

  // Find sentences mentioning the brand
  const sentences = content.split(/[.!?]+/);
  const brandSentences = sentences.filter(s =>
    s.toLowerCase().includes(brandLower)
  );

  if (brandSentences.length === 0) return "neutral";

  // Count positive and negative words
  const positiveWords = ["best", "top", "leading", "excellent", "recommended", "popular", "trusted"];
  const negativeWords = ["worst", "avoid", "poor", "bad", "issues", "problems", "complaints"];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const sentence of brandSentences) {
    const lower = sentence.toLowerCase();
    positiveCount += positiveWords.filter(w => lower.includes(w)).length;
    negativeCount += negativeWords.filter(w => lower.includes(w)).length;
  }

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

/**
 * Create empty Google AI response for errors
 */
function createEmptyGoogleAIResponse(query: string): GoogleAIOverviewsResponse {
  return {
    llm: "google_ai_overviews",
    query,
    content: "",
    fullResponse: "",
    overview: {
      generated: false,
      content: "",
      sources: []
    },
    organicResults: [],
    relatedQuestions: [],
    brandMentioned: false,
    citations: [],
    sentiment: "neutral",
    timestamp: new Date().toISOString()
  };
}

/**
 * Test Google AI Overviews connection
 */
export async function testGoogleAIConnection(config: GoogleAIOverviewsConfig): Promise<{
  success: boolean;
  error?: string;
  responseTime?: number;
  aiOverviewSupported?: boolean;
}> {
  const startTime = Date.now();

  try {
    const testQuery = "what is artificial intelligence";
    const response = await searchGoogleWithAI(testQuery, config);

    const hasAIOverview = !!(response.ai_overview || response.answer_box);

    return {
      success: true,
      responseTime: Date.now() - startTime,
      aiOverviewSupported: hasAIOverview
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - startTime,
      aiOverviewSupported: false
    };
  }
}

/**
 * Batch query Google AI Overviews
 */
export async function batchQueryGoogleAI(
  queries: string[],
  config: GoogleAIOverviewsConfig,
  brand?: string
): Promise<PlatformQueryResult[]> {
  const results: PlatformQueryResult[] = [];

  // Process queries with rate limiting
  for (const query of queries) {
    const result = await queryGoogleAIOverviews(query, config, brand);
    results.push(result);

    // Delay between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Analyze brand position in AI Overview
 */
export function analyzeBrandPositionInAIOverview(
  response: GoogleAIOverviewsResponse,
  brand: string
): {
  inAIOverview: boolean;
  sourcePosition: number | null; // Position in AI overview sources
  inOrganicResults: boolean;
  organicPosition: number | null;
  totalCompetitors: number;
  citationAdvantage: number; // How many sources cite you vs competitors
} {
  const brandLower = brand.toLowerCase();

  // Check AI Overview sources
  let sourcePosition: number | null = null;
  for (let i = 0; i < response.overview.sources.length; i++) {
    const source = response.overview.sources[i];
    if (source.url.toLowerCase().includes(brandLower) ||
        source.domain.toLowerCase().includes(brandLower)) {
      sourcePosition = i + 1;
      break;
    }
  }

  // Check organic results
  let organicPosition: number | null = null;
  for (const result of response.organicResults || []) {
    if (result.url.toLowerCase().includes(brandLower) ||
        result.domain.toLowerCase().includes(brandLower)) {
      organicPosition = result.position;
      break;
    }
  }

  return {
    inAIOverview: sourcePosition !== null,
    sourcePosition,
    inOrganicResults: organicPosition !== null,
    organicPosition,
    totalCompetitors: response.overview.sources.length,
    citationAdvantage: sourcePosition ? (response.overview.sources.length - sourcePosition) : 0
  };
}

/**
 * Extract keyword opportunities from related questions
 */
export function extractKeywordOpportunities(
  response: GoogleAIOverviewsResponse
): Array<{
  keyword: string;
  type: "question" | "topic";
  searchIntent: string;
}> {
  const opportunities: Array<{ keyword: string; type: "question" | "topic"; searchIntent: string }> = [];

  // Extract from related questions
  for (const question of response.relatedQuestions || []) {
    opportunities.push({
      keyword: question,
      type: "question",
      searchIntent: determineSearchIntent(question)
    });
  }

  return opportunities;
}

/**
 * Determine search intent
 */
function determineSearchIntent(query: string): string {
  const lower = query.toLowerCase();

  if (lower.match(/^(how|what|why|when|where|who)/)) return "informational";
  if (lower.match(/(buy|price|cost|cheap|best|review)/)) return "commercial";
  if (lower.match(/(near me|location|hours|contact)/)) return "local";

  return "navigational";
}

/**
 * Compare AI Overview visibility across queries
 */
export function compareAIOverviewVisibility(
  results: PlatformQueryResult[],
  brand: string
): {
  totalQueries: number;
  aiOverviewShown: number;
  brandInAIOverview: number;
  averageSourcePosition: number;
  visibilityRate: number; // % of AI overviews that mention brand
} {
  let aiOverviewShown = 0;
  let brandInAIOverview = 0;
  let totalPosition = 0;
  let positionCount = 0;

  for (const result of results) {
    const response = result.response as GoogleAIOverviewsResponse;

    if (response.overview.generated) {
      aiOverviewShown++;

      const position = analyzeBrandPositionInAIOverview(response, brand);
      if (position.inAIOverview) {
        brandInAIOverview++;

        if (position.sourcePosition) {
          totalPosition += position.sourcePosition;
          positionCount++;
        }
      }
    }
  }

  return {
    totalQueries: results.length,
    aiOverviewShown,
    brandInAIOverview,
    averageSourcePosition: positionCount > 0 ? totalPosition / positionCount : 0,
    visibilityRate: aiOverviewShown > 0 ? (brandInAIOverview / aiOverviewShown) * 100 : 0
  };
}
