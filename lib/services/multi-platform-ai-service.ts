import OpenAI from "openai";

export interface AIResponse {
  platform: "ChatGPT" | "Gemini" | "Copilot";
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
}

export interface PlatformStats {
  platform: "ChatGPT" | "Gemini" | "Copilot";
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
  private testsPerPlatform: number;

  constructor(openaiApiKey: string, _geminiApiKey?: string, testsPerPlatform: number = 3) {
    this.openaiClient = new OpenAI({ 
      apiKey: openaiApiKey,
      timeout: 15000, // 15 second timeout (reduced from 30)
      maxRetries: 1,  // Only 1 retry (reduced from 2)
    });
    // Allow up to 10 tests per platform for statistical significance
    this.testsPerPlatform = Math.min(testsPerPlatform, 10);
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
    console.log(`🤖 [AI] Testing: "${question.substring(0, 50)}..." (${numTests} tests × 3 platforms)`);
    const startTime = Date.now();

    // Run all 3 platforms in PARALLEL using Promise.allSettled
    // Each platform will run numTests times for statistical significance
    const results = await Promise.allSettled([
      this.testSinglePlatform("ChatGPT", question, brandName, competitors, numTests),
      this.testSinglePlatform("Gemini", question, brandName, competitors, numTests),
      this.testSinglePlatform("Copilot", question, brandName, competitors, numTests),
    ]);

    // Collect successful responses
    const allResponses: AIResponse[] = [];
    results.forEach((result, index) => {
      const platform = ["ChatGPT", "Gemini", "Copilot"][index];
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
   * Test a question on SELECTED platforms only
   * Uses simple async/await with proper error handling
   */
  async testQuestionOnPlatforms(
    question: string,
    brandName: string,
    competitors: string[] = [],
    platforms: ("ChatGPT" | "Gemini" | "Copilot")[],
    testsPerPlatform?: number
  ): Promise<QuestionAnalysis> {
    const numTests = testsPerPlatform || this.testsPerPlatform;
    console.log(`🤖 [AI] Q: "${question.substring(0, 35)}..." (${numTests}×${platforms.length})`);
    const startTime = Date.now();

    const allResponses: AIResponse[] = [];
    
    // Process each platform sequentially with simple async/await
    for (const platform of platforms) {
      try {
        const responses = await this.testSinglePlatform(
          platform, 
          question, 
          brandName, 
          competitors, 
          numTests
        );
        
        allResponses.push(...responses);
        console.log(`  ✓ ${platform}: ${responses.length}/${numTests}`);
      } catch (error: any) {
        console.warn(`  ✗ ${platform}: ${error.message}`);
      }
      
      // 300ms delay between platforms
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const aggregated = this.calculateAggregatedStats(allResponses, competitors);
    const elapsed = Date.now() - startTime;
    console.log(`✅ Done: ${allResponses.length} responses in ${elapsed}ms`);

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
   * Parallel version (not used - kept for future optimization)
   */
  private async testQuestionOnPlatformsParallel(
    question: string,
    brandName: string,
    competitors: string[] = [],
    platforms: ("ChatGPT" | "Gemini" | "Copilot")[],
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
    platform: "ChatGPT" | "Gemini" | "Copilot",
    question: string,
    brandName: string,
    competitors: string[],
    numTests: number
  ): Promise<AIResponse[]> {
    const responses: AIResponse[] = [];
    
    const systemPrompts: Record<string, string> = {
      "ChatGPT": "",
      "Gemini": "You are Google Gemini. Provide comprehensive answers.",
      "Copilot": "You are Microsoft Copilot. Provide helpful, balanced answers.",
    };

    for (let i = 1; i <= numTests; i++) {
      try {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
        if (systemPrompts[platform]) {
          messages.push({ role: "system", content: systemPrompts[platform] });
        }
        messages.push({ role: "user", content: question });

        // Use AbortController for proper request cancellation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 10000); // 10 second timeout

        try {
          const completion = await this.openaiClient.chat.completions.create(
            {
              model: "gpt-4o-mini",
              messages,
              max_tokens: 300,
              temperature: 0.7,
            },
            {
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          const fullResponse = completion?.choices?.[0]?.message?.content || "";
          
          if (fullResponse) {
            const analysis = this.analyzeResponse(fullResponse, brandName, competitors);
            responses.push({
              platform,
              modelVersion: platform === "ChatGPT" ? "gpt-4o-mini" : `${platform.toLowerCase()}-sim`,
              queryNumber: i,
              question,
              fullResponse,
              ...analysis,
            });
          }
        } catch (apiError: any) {
          clearTimeout(timeoutId);
          if (apiError.name === 'AbortError') {
            console.warn(`⚠️ [AI] ${platform} test ${i} aborted (timeout)`);
          } else {
            console.warn(`⚠️ [AI] ${platform} test ${i} API error: ${apiError.message}`);
          }
        }
      } catch (error: any) {
        console.warn(`⚠️ [AI] ${platform} test ${i} failed: ${error.message}`);
      }
      
      // Small delay between tests to avoid rate limiting
      if (i < numTests) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return responses;
  }

  private analyzeResponse(
    response: string,
    brandName: string,
    competitors: string[]
  ): Omit<AIResponse, 'platform' | 'modelVersion' | 'queryNumber' | 'question' | 'fullResponse'> {
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

    const platforms: ("ChatGPT" | "Gemini" | "Copilot")[] = ["ChatGPT", "Gemini", "Copilot"];
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
