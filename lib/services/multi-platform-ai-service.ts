import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIPlatform = "ChatGPT" | "Gemini" | "Copilot" | "Perplexity";

export interface AIResponse {
  platform: AIPlatform;
  modelVersion: string;
  queryNumber: number;
  question: string;
  fullResponse: string;
  brandMentioned: boolean;
  brandPosition: number | null;
  contextExtract: string | null;
  sentiment: "positive" | "neutral" | "negative";
  recommendationType: "direct" | "conditional" | "listed" | null;
  competitorsMentioned: string[];
  citedUrls: string[];
  isRealAPI: boolean; // NEW: Track if this was a real API call
}

export interface PlatformStats {
  platform: AIPlatform;
  totalTests: number;
  mentionCount: number;
  mentionRate: number;
  avgPosition: number | null;
  sentimentCounts: { positive: number; neutral: number; negative: number };
}

export interface QuestionAnalysis {
  question: string;
  searchVolume: number;
  category: "awareness" | "consideration" | "decision";
  totalResponses: number;
  responses: AIResponse[];
  aggregated: {
    mentionRate: number;
    avgPosition: number | null;
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
      dominant: "positive" | "neutral" | "negative";
    };
    competitorMentions: { [competitor: string]: number };
    platformBreakdown: PlatformStats[];
  };
}

export class MultiPlatformAIService {
  private openaiClient: OpenAI;
  private geminiClient: GoogleGenerativeAI | null = null;
  private perplexityClient: OpenAI | null = null; // Perplexity uses OpenAI-compatible API
  private testsPerPlatform: number;
  
  // Track which platforms have real API access
  public platformStatus: Record<AIPlatform, { isReal: boolean; reason: string }>;

  constructor(
    openaiApiKey: string, 
    geminiApiKey?: string, 
    testsPerPlatform: number = 3,
    perplexityApiKey?: string
  ) {
    this.openaiClient = new OpenAI({ 
      apiKey: openaiApiKey,
      timeout: 15000,
      maxRetries: 1,
    });
    
    // Initialize platform status
    this.platformStatus = {
      ChatGPT: { isReal: true, reason: "OpenAI API (gpt-4o-mini)" },
      Gemini: { isReal: false, reason: "No API key - simulated via OpenAI" },
      Copilot: { isReal: false, reason: "No public API - simulated via OpenAI" },
      Perplexity: { isReal: false, reason: "No API key - simulated via OpenAI" },
    };
    
    // Initialize Gemini client if API key provided
    if (geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiApiKey);
      this.platformStatus.Gemini = { isReal: true, reason: "Google Gemini API (gemini-1.5-flash)" };
      console.log("✅ [AI] Gemini API initialized (REAL)");
    } else {
      console.log("⚠️ [AI] Gemini API key not provided - will use simulation");
    }
    
    // Initialize Perplexity client if API key provided
    // Perplexity uses an OpenAI-compatible API
    if (perplexityApiKey) {
      this.perplexityClient = new OpenAI({
        apiKey: perplexityApiKey,
        baseURL: "https://api.perplexity.ai",
        timeout: 20000,
        maxRetries: 1,
      });
      this.platformStatus.Perplexity = { isReal: true, reason: "Perplexity API (llama-3.1-sonar-small-128k-online)" };
      console.log("✅ [AI] Perplexity API initialized (REAL)");
    } else {
      console.log("⚠️ [AI] Perplexity API key not provided - will use simulation");
    }
    
    // Note: Microsoft Copilot does not have a public consumer API
    // Enterprise Copilot requires Azure setup - keeping simulated for now
    console.log("ℹ️ [AI] Copilot: No public API available - using simulation");
    
    this.testsPerPlatform = Math.min(testsPerPlatform, 10);
    
    // Log overall status
    console.log("🤖 [AI] Platform Status:");
    Object.entries(this.platformStatus).forEach(([platform, status]) => {
      console.log(`   ${status.isReal ? "✅" : "⚠️"} ${platform}: ${status.reason}`);
    });
  }

  /**
   * Test a question - PARALLEL platforms for speed
   */
  async testQuestion(
    question: string,
    brandName: string,
    competitors: string[] = [],
    testsPerPlatform?: number
  ): Promise<QuestionAnalysis> {
    const numTests = testsPerPlatform || this.testsPerPlatform;
    console.log(`🤖 [AI] Testing: "${question.substring(0, 50)}..." (${numTests} tests × 4 platforms)`);
    const startTime = Date.now();

    // Run all 4 platforms in PARALLEL using Promise.allSettled
    // Each platform will run numTests times for statistical significance
    const results = await Promise.allSettled([
      this.testSinglePlatform("ChatGPT", question, brandName, competitors, numTests),
      this.testSinglePlatform("Gemini", question, brandName, competitors, numTests),
      this.testSinglePlatform("Copilot", question, brandName, competitors, numTests),
      this.testSinglePlatform("Perplexity", question, brandName, competitors, numTests),
    ]);

    // Collect successful responses
    const allResponses: AIResponse[] = [];
    const platformNames: AIPlatform[] = ["ChatGPT", "Gemini", "Copilot", "Perplexity"];
    results.forEach((result, index) => {
      const platform = platformNames[index];
      if (result.status === "fulfilled") {
        allResponses.push(...result.value);
      } else {
        console.error(`  ⚠️ ${platform} failed: ${result.reason?.message || result.reason}`);
      }
    });

    const aggregated = this.calculateAggregatedStats(allResponses, competitors);
    console.log(`✅ [AI] Done in ${Date.now() - startTime}ms - ${allResponses.length} responses`);

    return {
      question,
      searchVolume: 0,
      category: "awareness",
      totalResponses: allResponses.length,
      responses: allResponses,
      aggregated,
    };
  }

  /**
   * Test a question on SELECTED platforms
   * Runs platforms in PARALLEL with strict per-platform timeout
   */
  async testQuestionOnPlatforms(
    question: string,
    brandName: string,
    competitors: string[] = [],
    platforms: AIPlatform[],
    testsPerPlatform?: number
  ): Promise<QuestionAnalysis> {
    const numTests = testsPerPlatform || this.testsPerPlatform;
    console.log(`🤖 Q: "${question.substring(0, 30)}..." (${numTests}×${platforms.length})`);
    const startTime = Date.now();

    // Run ALL platforms in PARALLEL with individual timeouts
    const platformPromises = platforms.map(async (platform) => {
      try {
        // Strict 15-second timeout per platform
        const result = await this.withTimeout(
          this.testSinglePlatform(platform, question, brandName, competitors, numTests),
          15000,
          `${platform} timeout`
        );
        console.log(`  ✓ ${platform}: ${result.length}/${numTests}`);
        return result;
      } catch (error: any) {
        console.warn(`  ✗ ${platform}: ${error.message}`);
        return [] as AIResponse[];
      }
    });

    // Wait for all platforms (max ~15s total since parallel)
    const results = await Promise.all(platformPromises);
    const allResponses = results.flat();

    const aggregated = this.calculateAggregatedStats(allResponses, competitors);
    console.log(`✅ ${allResponses.length} responses in ${Date.now() - startTime}ms`);

    return {
      question,
      searchVolume: 0,
      category: "awareness",
      totalResponses: allResponses.length,
      responses: allResponses,
      aggregated,
    };
  }

  /**
   * Utility: wrap a promise with a strict timeout
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(errorMsg)), ms);
    });
    
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  }

  /**
   * Parallel version (not used - kept for future optimization)
   */
  private async testQuestionOnPlatformsParallel(
    question: string,
    brandName: string,
    competitors: string[] = [],
    platforms: AIPlatform[],
    testsPerPlatform?: number
  ): Promise<QuestionAnalysis> {
    const numTests = testsPerPlatform || this.testsPerPlatform;
    const startTime = Date.now();

    const platformPromises = platforms.map(platform => 
      this.testSinglePlatform(platform, question, brandName, competitors, numTests)
        .catch(() => [] as AIResponse[])
    );
    
    const results = await Promise.allSettled(platformPromises);

    // Collect successful responses
    const allResponses: AIResponse[] = [];
    results.forEach((result, index) => {
      const platform = platforms[index];
      if (result.status === "fulfilled") {
        allResponses.push(...result.value);
      } else {
        console.error(`  ⚠️ ${platform} failed: ${result.reason?.message || result.reason}`);
      }
    });

    const aggregated = this.calculateAggregatedStats(allResponses, competitors);
    console.log(`✅ [AI] Done in ${Date.now() - startTime}ms - ${allResponses.length} responses`);

    return {
      question,
      searchVolume: 0,
      category: "awareness",
      totalResponses: allResponses.length,
      responses: allResponses,
      aggregated,
    };
  }

  private async testSinglePlatform(
    platform: AIPlatform,
    question: string,
    brandName: string,
    competitors: string[],
    numTests: number
  ): Promise<AIResponse[]> {
    // Use real Gemini API if available
    if (platform === "Gemini" && this.geminiClient) {
      return this.testGeminiReal(question, brandName, competitors, numTests);
    }
    
    // Use real Perplexity API if available
    if (platform === "Perplexity" && this.perplexityClient) {
      return this.testPerplexityReal(question, brandName, competitors, numTests);
    }
    
    // Use OpenAI for ChatGPT, Copilot (simulated), and Perplexity (simulated if no API key)
    const systemPrompts: Record<string, string> = {
      "ChatGPT": "",
      "Copilot": "You are Microsoft Copilot. Provide helpful, balanced answers with references when possible.",
      "Perplexity": "You are Perplexity AI, an AI-powered answer engine. Provide comprehensive, well-researched answers with citations and sources when available. Focus on accuracy and include relevant context.",
      "Gemini": "You are Google Gemini. Provide helpful, accurate, and comprehensive answers.",
    };

    const isRealAPI = platform === "ChatGPT"; // Only ChatGPT is real when using OpenAI directly

    // Run all tests for this platform in PARALLEL
    const testPromises = Array.from({ length: numTests }, async (_, idx) => {
      const i = idx + 1;
      try {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
        if (systemPrompts[platform]) {
          messages.push({ role: "system", content: systemPrompts[platform] });
        }
        messages.push({ role: "user", content: question });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const completion = await this.openaiClient.chat.completions.create(
          {
            model: "gpt-4o-mini",
            messages,
            max_tokens: 250,
            temperature: 0.7,
          },
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);
        const fullResponse = completion?.choices?.[0]?.message?.content || "";
        
        if (fullResponse) {
          const analysis = this.analyzeResponse(fullResponse, brandName, competitors);
          const modelVersionMap: Record<AIPlatform, string> = {
            "ChatGPT": "gpt-4o-mini",
            "Copilot": "gpt-4o-mini (simulated)",
            "Perplexity": "gpt-4o-mini (simulated)",
            "Gemini": "gpt-4o-mini (simulated)",
          };
          return {
            platform,
            modelVersion: modelVersionMap[platform],
            queryNumber: i,
            question,
            fullResponse,
            isRealAPI,
            ...analysis,
          } as AIResponse;
        }
        return null;
      } catch (error: any) {
        return null;
      }
    });

    const results = await Promise.all(testPromises);
    return results.filter((r): r is AIResponse => r !== null);
  }
  
  /**
   * Test using REAL Perplexity API
   * Perplexity has an OpenAI-compatible API with online search capabilities
   */
  private async testPerplexityReal(
    question: string,
    brandName: string,
    competitors: string[],
    numTests: number
  ): Promise<AIResponse[]> {
    if (!this.perplexityClient) return [];

    const testPromises = Array.from({ length: numTests }, async (_, idx) => {
      const i = idx + 1;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Perplexity can be slower due to search

        const completion = await this.perplexityClient!.chat.completions.create(
          {
            model: "llama-3.1-sonar-small-128k-online", // Perplexity's online model with web search
            messages: [
              { role: "user", content: question }
            ],
            max_tokens: 400,
            temperature: 0.7,
          },
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);
        const fullResponse = completion?.choices?.[0]?.message?.content || "";
        
        if (fullResponse) {
          const analysis = this.analyzeResponse(fullResponse, brandName, competitors);
          return {
            platform: "Perplexity" as const,
            modelVersion: "llama-3.1-sonar-small-128k-online",
            queryNumber: i,
            question,
            fullResponse,
            isRealAPI: true,
            ...analysis,
          } as AIResponse;
        }
        return null;
      } catch (error: any) {
        console.warn(`⚠️ [Perplexity] Test ${i} failed: ${error.message}`);
        return null;
      }
    });

    const results = await Promise.all(testPromises);
    return results.filter((r): r is AIResponse => r !== null);
  }

  /**
   * Test using REAL Google Gemini API
   */
  private async testGeminiReal(
    question: string,
    brandName: string,
    competitors: string[],
    numTests: number
  ): Promise<AIResponse[]> {
    if (!this.geminiClient) return [];

    const testPromises = Array.from({ length: numTests }, async (_, idx) => {
      const i = idx + 1;
      try {
        const model = this.geminiClient!.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7,
          },
        });

        // Add timeout using Promise.race
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 10000); // 10s timeout
        });

        const resultPromise = model.generateContent(question);
        const result = await Promise.race([resultPromise, timeoutPromise]);
        
        if (!result) return null;
        
        const response = await (result as any).response;
        const fullResponse = response.text();
        
        if (fullResponse) {
          const analysis = this.analyzeResponse(fullResponse, brandName, competitors);
          return {
            platform: "Gemini" as const,
            modelVersion: "gemini-1.5-flash",
            queryNumber: i,
            question,
            fullResponse,
            isRealAPI: true,
            ...analysis,
          } as AIResponse;
        }
        return null;
      } catch (error: any) {
        console.warn(`⚠️ [Gemini] Test ${i} failed: ${error.message}`);
        return null;
      }
    });

    const results = await Promise.all(testPromises);
    return results.filter((r): r is AIResponse => r !== null);
  }

  private analyzeResponse(
    response: string,
    brandName: string,
    competitors: string[]
  ): Omit<AIResponse, 'platform' | 'modelVersion' | 'queryNumber' | 'question' | 'fullResponse' | 'isRealAPI'> {
    const lowerResponse = response.toLowerCase();
    const lowerBrand = brandName.toLowerCase();
    const brandMentioned = lowerResponse.includes(lowerBrand);

    let brandPosition: number | null = null;
    let contextExtract: string | null = null;

    if (brandMentioned) {
      const allBrands = [brandName, ...competitors];
      const brandMentions: { brand: string; index: number }[] = [];

      allBrands.forEach((brand) => {
        const regex = new RegExp(`\\b${this.escapeRegex(brand)}\\b`, "gi");
        let match;
        while ((match = regex.exec(response)) !== null) {
          brandMentions.push({ brand: brand.toLowerCase(), index: match.index });
        }
      });

      brandMentions.sort((a, b) => a.index - b.index);
      const brandFirstMention = brandMentions.findIndex(m => m.brand === lowerBrand);
      brandPosition = brandFirstMention >= 0 ? brandFirstMention + 1 : null;

      const brandIndex = lowerResponse.indexOf(lowerBrand);
      if (brandIndex !== -1) {
        const start = Math.max(0, brandIndex - 50);
        const end = Math.min(response.length, brandIndex + brandName.length + 200);
        contextExtract = response.substring(start, end).trim();
        if (start > 0) contextExtract = "..." + contextExtract;
        if (end < response.length) contextExtract = contextExtract + "...";
      }
    }

    const sentiment = this.analyzeSentiment(response, brandName, brandMentioned);
    const competitorsMentioned = competitors.filter(c => lowerResponse.includes(c.toLowerCase()));
    const citedUrls = response.match(/(https?:\/\/[^\s]+)/g) || [];

    return {
      brandMentioned,
      brandPosition,
      contextExtract,
      sentiment,
      recommendationType: brandMentioned ? "listed" : null,
      competitorsMentioned,
      citedUrls,
    };
  }

  private analyzeSentiment(response: string, brandName: string, brandMentioned: boolean): "positive" | "neutral" | "negative" {
    if (!brandMentioned) return "neutral";

    const sentences = response.split(/[.!?]+/).filter(s => s.toLowerCase().includes(brandName.toLowerCase()));
    if (sentences.length === 0) return "neutral";

    const positiveWords = ["best", "excellent", "great", "recommended", "top", "leading", "popular", "trusted", "quality", "innovative"];
    const negativeWords = ["expensive", "overpriced", "avoid", "poor", "disappointing", "concerns", "issues", "problems"];

    let positiveScore = 0, negativeScore = 0;
    sentences.forEach(s => {
      const lower = s.toLowerCase();
      positiveWords.forEach(w => { if (lower.includes(w)) positiveScore++; });
      negativeWords.forEach(w => { if (lower.includes(w)) negativeScore++; });
    });

    if (positiveScore > negativeScore) return "positive";
    if (negativeScore > positiveScore) return "negative";
    return "neutral";
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private calculateAggregatedStats(responses: AIResponse[], competitors: string[]): QuestionAnalysis["aggregated"] {
    const total = responses.length;
    const mentioned = responses.filter(r => r.brandMentioned).length;
    const mentionRate = total > 0 ? (mentioned / total) * 100 : 0;

    const positions = responses.filter(r => r.brandPosition !== null).map(r => r.brandPosition as number);
    const avgPosition = positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : null;

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    responses.forEach(r => { sentimentCounts[r.sentiment]++; });

    const sentimentTotal = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);
    let dominant: "positive" | "neutral" | "negative" = "neutral";
    const positivePct = sentimentTotal > 0 ? Math.round((sentimentCounts.positive / sentimentTotal) * 1000) / 10 : 0;
    const neutralPct = sentimentTotal > 0 ? Math.round((sentimentCounts.neutral / sentimentTotal) * 1000) / 10 : 0;
    const negativePct = sentimentTotal > 0 ? Math.round((sentimentCounts.negative / sentimentTotal) * 1000) / 10 : 0;

    if (positivePct > neutralPct && positivePct > negativePct) {
      dominant = "positive";
    } else if (negativePct > neutralPct) {
      dominant = "negative";
    }

    const sentimentBreakdown = {
      positive: positivePct,
      neutral: neutralPct,
      negative: negativePct,
      dominant,
    };

    const competitorMentions: { [c: string]: number } = {};
    competitors.forEach(c => { competitorMentions[c] = responses.filter(r => r.competitorsMentioned.includes(c)).length; });

    const platforms: AIPlatform[] = ["ChatGPT", "Gemini", "Copilot", "Perplexity"];
    const platformBreakdown = platforms.map(platform => {
      const pr = responses.filter(r => r.platform === platform);
      const pm = pr.filter(r => r.brandMentioned).length;
      const pp = pr.filter(r => r.brandPosition !== null).map(r => r.brandPosition as number);
      return {
        platform,
        totalTests: pr.length,
        mentionCount: pm,
        mentionRate: pr.length > 0 ? Math.round((pm / pr.length) * 1000) / 10 : 0,
        avgPosition: pp.length > 0 ? Math.round((pp.reduce((a, b) => a + b, 0) / pp.length) * 10) / 10 : null,
        sentimentCounts: {
          positive: pr.filter(r => r.sentiment === "positive").length,
          neutral: pr.filter(r => r.sentiment === "neutral").length,
          negative: pr.filter(r => r.sentiment === "negative").length,
        },
      };
    });

    return {
      mentionRate: Math.round(mentionRate * 10) / 10,
      avgPosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
      sentimentBreakdown,
      competitorMentions,
      platformBreakdown,
    };
  }
}
