import OpenAI from "openai";

export interface AITestResult {
  platform: "chatgpt" | "gemini";
  modelVersion: string;
  queryNumber: number;
  brandMentioned: boolean;
  position: number | null;
  contextExtract: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  recommendationType: "direct" | "conditional" | "listed" | null;
  citedUrls: string[];
  fullResponse: string;
}

export class BatchAITestingService {
  private openaiClient: OpenAI;
  private geminiApiKey: string;

  constructor(openaiKey: string, geminiKey?: string) {
    this.openaiClient = new OpenAI({ apiKey: openaiKey });
    this.geminiApiKey = geminiKey || "";
  }

  /**
   * Test a single question multiple times for statistical significance
   * OPTIMIZED for speed
   */
  async testQuestion(
    question: string,
    brandName: string,
    testsPerPlatform: number = 3
  ): Promise<AITestResult[]> {
    const results: AITestResult[] = [];

    // Test with ChatGPT only (faster, Gemini often has no key anyway)
    for (let i = 1; i <= testsPerPlatform; i++) {
      try {
        const result = await this.queryChatGPT(question, brandName, i);
        results.push(result);

        // Reduced delay for speed (500ms instead of 1000ms)
        await this.delay(500);
      } catch (error) {
        console.error(`ChatGPT test ${i} failed:`, error);
      }
    }

    // Skip Gemini for speed (can enable later if needed)
    // Most users don't have Gemini API key anyway

    return results;
  }

  /**
   * Query ChatGPT
   */
  private async queryChatGPT(
    question: string,
    brandName: string,
    queryNumber: number
  ): Promise<AITestResult> {
    const completion = await this.openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: question }],
      max_tokens: 500,
      temperature: 0.7, // Add variation for statistical testing
    });

    const response = completion.choices[0]?.message?.content || "";

    return this.analyzeResponse(
      response,
      brandName,
      "chatgpt",
      completion.model,
      queryNumber
    );
  }

  /**
   * Query Gemini (placeholder - would need actual Gemini SDK)
   */
  private async queryGemini(
    question: string,
    brandName: string,
    queryNumber: number
  ): Promise<AITestResult> {
    // TODO: Implement Gemini API when available
    // For now, return placeholder

    return {
      platform: "gemini",
      modelVersion: "gemini-pro",
      queryNumber,
      brandMentioned: false,
      position: null,
      contextExtract: null,
      sentiment: null,
      recommendationType: null,
      citedUrls: [],
      fullResponse: "Gemini integration pending",
    };
  }

  /**
   * Analyze AI response for brand mentions
   */
  private analyzeResponse(
    response: string,
    brandName: string,
    platform: "chatgpt" | "gemini",
    modelVersion: string,
    queryNumber: number
  ): AITestResult {
    // Check if brand is mentioned
    const brandMentioned = response
      .toLowerCase()
      .includes(brandName.toLowerCase());

    // Find position
    let position: number | null = null;
    let contextExtract: string | null = null;

    if (brandMentioned) {
      const sentences = response.split(/[.!?]+/).filter((s) => s.trim());

      for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].toLowerCase().includes(brandName.toLowerCase())) {
          position = i + 1;
          contextExtract = sentences[i].trim();
          break;
        }
      }
    }

    // Determine sentiment
    const sentiment = this.analyzeSentiment(contextExtract || response, brandName);

    // Determine recommendation type
    const recommendationType = this.analyzeRecommendationType(
      response,
      brandName
    );

    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const citedUrls = response.match(urlRegex) || [];

    return {
      platform,
      modelVersion,
      queryNumber,
      brandMentioned,
      position,
      contextExtract,
      sentiment,
      recommendationType,
      citedUrls,
      fullResponse: response,
    };
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(
    text: string,
    brandName: string
  ): "positive" | "neutral" | "negative" | null {
    if (!text.toLowerCase().includes(brandName.toLowerCase())) {
      return null;
    }

    const positiveWords = [
      "best",
      "excellent",
      "great",
      "recommended",
      "top",
      "leading",
      "innovative",
      "quality",
      "popular",
      "trusted",
    ];

    const negativeWords = [
      "expensive",
      "overpriced",
      "not recommended",
      "avoid",
      "poor",
      "disappointing",
    ];

    const lowerText = text.toLowerCase();

    const positiveCount = positiveWords.filter((w) =>
      lowerText.includes(w)
    ).length;
    const negativeCount = negativeWords.filter((w) =>
      lowerText.includes(w)
    ).length;

    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";

    return "neutral";
  }

  /**
   * Analyze recommendation type
   */
  private analyzeRecommendationType(
    response: string,
    brandName: string
  ): "direct" | "conditional" | "listed" | null {
    if (!response.toLowerCase().includes(brandName.toLowerCase())) {
      return null;
    }

    const lowerResponse = response.toLowerCase();
    const brandLower = brandName.toLowerCase();

    // Direct recommendation patterns
    const directPatterns = [
      `i recommend ${brandLower}`,
      `${brandLower} is the best`,
      `go with ${brandLower}`,
      `choose ${brandLower}`,
      `${brandLower} would be`,
    ];

    if (directPatterns.some((pattern) => lowerResponse.includes(pattern))) {
      return "direct";
    }

    // Conditional recommendation patterns
    const conditionalPatterns = [
      `if you`,
      `for those who`,
      `when you`,
      `depending on`,
    ];

    const brandSentenceIndex = lowerResponse.indexOf(brandLower);
    const contextBefore = lowerResponse.substring(
      Math.max(0, brandSentenceIndex - 100),
      brandSentenceIndex
    );

    if (
      conditionalPatterns.some((pattern) => contextBefore.includes(pattern))
    ) {
      return "conditional";
    }

    // Listed as option (appears in a list)
    const listPatterns = ["include", "options", "consider", "such as"];

    if (listPatterns.some((pattern) => contextBefore.includes(pattern))) {
      return "listed";
    }

    return "listed"; // Default to listed if mentioned but pattern unclear
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate aggregate statistics from test results
   */
  calculateStats(results: AITestResult[]) {
    const total = results.length;
    const mentioned = results.filter((r) => r.brandMentioned).length;
    const mentionRate = total > 0 ? (mentioned / total) * 100 : 0;

    const positions = results
      .filter((r) => r.position !== null)
      .map((r) => r.position as number);

    const avgPosition =
      positions.length > 0
        ? positions.reduce((a, b) => a + b, 0) / positions.length
        : null;

    const sentiments = results
      .filter((r) => r.sentiment !== null)
      .map((r) => r.sentiment!);

    const sentimentCounts = {
      positive: sentiments.filter((s) => s === "positive").length,
      neutral: sentiments.filter((s) => s === "neutral").length,
      negative: sentiments.filter((s) => s === "negative").length,
    };

    const recommendationTypes = results
      .filter((r) => r.recommendationType !== null)
      .map((r) => r.recommendationType!);

    const recommendationCounts = {
      direct: recommendationTypes.filter((t) => t === "direct").length,
      conditional: recommendationTypes.filter((t) => t === "conditional")
        .length,
      listed: recommendationTypes.filter((t) => t === "listed").length,
    };

    return {
      totalTests: total,
      mentionCount: mentioned,
      mentionRate,
      avgPosition,
      sentimentCounts,
      recommendationCounts,
    };
  }
}
