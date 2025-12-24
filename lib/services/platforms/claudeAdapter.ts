/**
 * Claude Adapter
 *
 * Handles querying Claude AI and parsing responses
 */

import type {
  ClaudeConfig,
  ClaudeResponse,
  ClaudeArtifact,
  PlatformQueryResult
} from "@/lib/types/platforms";

/**
 * Query Claude AI
 */
export async function queryClaude(
  query: string,
  config: ClaudeConfig,
  brand?: string
): Promise<PlatformQueryResult> {
  const startTime = Date.now();

  try {
    const response = await callClaudeAPI(query, config, brand);
    const parsed = parseClaudeResponse(response, query, brand);

    const duration = Date.now() - startTime;
    const cost = calculateClaudeCost(parsed.usage);

    return {
      platform: "claude",
      query,
      response: parsed,
      executedAt: new Date().toISOString(),
      duration,
      cost
    };
  } catch (error) {
    return {
      platform: "claude",
      query,
      response: createEmptyClaudeResponse(query),
      executedAt: new Date().toISOString(),
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Call Claude API
 */
async function callClaudeAPI(
  query: string,
  config: ClaudeConfig,
  brand?: string
): Promise<any> {
  const apiKey = config.apiKey;
  if (!apiKey) {
    throw new Error("Claude API key not configured");
  }

  const endpoint = config.endpoint || "https://api.anthropic.com/v1/messages";
  const model = config.options?.model || "claude-3.5-sonnet-20241022";

  // Build system prompt
  let systemPrompt = config.options?.systemPrompt || "";
  if (brand) {
    systemPrompt += `\n\nWhen answering, consider information about the brand "${brand}" and cite relevant sources if available.`;
  }

  // Build request
  const requestBody: any = {
    model,
    max_tokens: config.options?.maxTokens || 4096,
    messages: [
      {
        role: "user",
        content: query
      }
    ]
  };

  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  if (config.options?.temperature !== undefined) {
    requestBody.temperature = config.options.temperature;
  }

  // Make API call
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Parse Claude API response
 */
function parseClaudeResponse(
  apiResponse: any,
  query: string,
  brand?: string
): ClaudeResponse {
  // Extract main content
  const content = apiResponse.content?.[0]?.text || "";

  // Extract artifacts if present
  const artifacts = extractArtifacts(apiResponse);

  // Extract thinking process if using extended thinking
  const thinkingProcess = extractThinking(apiResponse);

  // Extract brand mentions
  const brandMentioned = brand ? content.toLowerCase().includes(brand.toLowerCase()) : false;

  // Extract citations (Claude doesn't natively provide citations, but we can parse URLs)
  const citations = extractCitationsFromContent(content);

  // Determine sentiment
  const sentiment = analyzeSentiment(content, brand);

  return {
    llm: "claude",
    query,
    content,
    fullResponse: content,
    modelVersion: apiResponse.model || "unknown",
    stopReason: apiResponse.stop_reason,
    artifacts,
    thinkingProcess,
    brandMentioned,
    citations,
    sentiment,
    timestamp: new Date().toISOString(),
    usage: {
      inputTokens: apiResponse.usage?.input_tokens || 0,
      outputTokens: apiResponse.usage?.output_tokens || 0
    }
  };
}

/**
 * Extract artifacts from Claude response
 */
function extractArtifacts(apiResponse: any): ClaudeArtifact[] {
  const artifacts: ClaudeArtifact[] = [];

  // Claude may include code blocks or structured content
  const content = apiResponse.content?.[0]?.text || "";

  // Extract code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let artifactIndex = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || "text";
    const code = match[2];

    artifacts.push({
      id: `artifact_${artifactIndex++}`,
      type: "code",
      title: `Code snippet (${language})`,
      content: code,
      language
    });
  }

  return artifacts;
}

/**
 * Extract thinking process
 */
function extractThinking(apiResponse: any): string | undefined {
  // Extended thinking would be in a separate field
  // This is a placeholder for future Claude features
  return undefined;
}

/**
 * Extract citations from content
 */
function extractCitationsFromContent(content: string): Array<{ url: string; title: string }> {
  const citations: Array<{ url: string; title: string }> = [];

  // Extract URLs from content
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const urls = content.match(urlRegex) || [];

  for (const url of urls) {
    citations.push({
      url,
      title: extractTitleFromURL(url)
    });
  }

  return citations;
}

/**
 * Extract title from URL
 */
function extractTitleFromURL(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Analyze sentiment
 */
function analyzeSentiment(content: string, brand?: string): "positive" | "neutral" | "negative" {
  if (!brand) return "neutral";

  const lowerContent = content.toLowerCase();
  const brandLower = brand.toLowerCase();

  // Find sentences mentioning the brand
  const sentences = content.split(/[.!?]+/);
  const brandSentences = sentences.filter(s =>
    s.toLowerCase().includes(brandLower)
  );

  if (brandSentences.length === 0) return "neutral";

  // Count positive and negative words
  const positiveWords = ["excellent", "great", "good", "best", "innovative", "leading", "top", "recommended"];
  const negativeWords = ["poor", "bad", "worst", "avoid", "issues", "problems", "disappointing"];

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
 * Calculate Claude API cost
 */
function calculateClaudeCost(usage: { inputTokens: number; outputTokens: number }): number {
  // Claude 3.5 Sonnet pricing (as of 2024)
  // $3 per million input tokens, $15 per million output tokens
  const inputCost = (usage.inputTokens / 1_000_000) * 3;
  const outputCost = (usage.outputTokens / 1_000_000) * 15;

  return inputCost + outputCost;
}

/**
 * Create empty Claude response for errors
 */
function createEmptyClaudeResponse(query: string): ClaudeResponse {
  return {
    llm: "claude",
    query,
    content: "",
    fullResponse: "",
    modelVersion: "unknown",
    artifacts: [],
    brandMentioned: false,
    citations: [],
    sentiment: "neutral",
    timestamp: new Date().toISOString(),
    usage: {
      inputTokens: 0,
      outputTokens: 0
    }
  };
}

/**
 * Test Claude connection
 */
export async function testClaudeConnection(config: ClaudeConfig): Promise<{
  success: boolean;
  error?: string;
  responseTime?: number;
}> {
  const startTime = Date.now();

  try {
    const testQuery = "Hello, this is a test message. Please respond with 'OK'.";
    const response = await callClaudeAPI(testQuery, config);

    return {
      success: true,
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Batch query Claude
 */
export async function batchQueryClaude(
  queries: string[],
  config: ClaudeConfig,
  brand?: string
): Promise<PlatformQueryResult[]> {
  const results: PlatformQueryResult[] = [];

  // Process queries sequentially to avoid rate limiting
  for (const query of queries) {
    const result = await queryClaude(query, config, brand);
    results.push(result);

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Get Claude model capabilities
 */
export function getClaudeCapabilities(model: string): any {
  const capabilities: Record<string, any> = {
    "claude-3-opus": {
      maxTokens: 200000,
      contextWindow: 200000,
      capabilities: ["text", "code", "analysis", "reasoning"],
      strengths: ["Complex reasoning", "Long-form content", "Code generation"]
    },
    "claude-3.5-sonnet": {
      maxTokens: 200000,
      contextWindow: 200000,
      capabilities: ["text", "code", "analysis", "reasoning", "artifacts"],
      strengths: ["Balanced performance", "Code generation", "Artifacts"]
    },
    "claude-3-sonnet": {
      maxTokens: 200000,
      contextWindow: 200000,
      capabilities: ["text", "code", "analysis"],
      strengths: ["Balanced", "Cost-effective"]
    },
    "claude-3-haiku": {
      maxTokens: 200000,
      contextWindow: 200000,
      capabilities: ["text", "code"],
      strengths: ["Speed", "Cost-effective", "Simple tasks"]
    }
  };

  return capabilities[model] || capabilities["claude-3.5-sonnet"];
}

/**
 * Extract brand positioning from Claude response
 */
export function extractBrandPositioning(response: ClaudeResponse, brand: string): {
  mentioned: boolean;
  position: number | null; // Position among mentioned brands
  context: string[];
  competitors: string[];
} {
  const content = response.content;
  const sentences = content.split(/[.!?]+/);

  const brandLower = brand.toLowerCase();
  const brandSentences: string[] = [];
  const competitors: string[] = [];

  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(brandLower)) {
      brandSentences.push(sentence.trim());
    }
  }

  return {
    mentioned: brandSentences.length > 0,
    position: brandSentences.length > 0 ? 0 : null, // Would need more sophisticated positioning logic
    context: brandSentences,
    competitors
  };
}
