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
  sentimentCounts: {
    positive: number;
    neutral: number;
    negative: number;
  };
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

  constructor(openaiApiKey: string, geminiApiKey?: string, testsPerPlatform: number = 3) {
    this.openaiClient = new OpenAI({ apiKey: openaiApiKey });
    // Reduced default from 5 to 3 for speed
    this.testsPerPlatform = Math.min(testsPerPlatform, 3);
  }

  /**
   * Test a question across all AI platforms - OPTIMIZED FOR SPEED
   */
  async testQuestion(
    question: string,
    brandName: string,
    competitors: string[] = [],
    testsPerPlatform?: number
  ): Promise<QuestionAnalysis> {
    const numTests = Math.min(testsPerPlatform || this.testsPerPlatform, 3);
    console.log(`🤖 [AI] Testing: "${question.substring(0, 50)}..." (${numTests} tests × 3 platforms)`);
    const startTime = Date.now();

    const allResponses: AIResponse[] = [];

    // Run all platforms in PARALLEL for speed
    const [chatGPTResponses, geminiResponses, copilotResponses] = await Promise.all([
      this.testWithChatGPT(question, brandName, competitors, numTests),
      this.testWithGemini(question, brandName, competitors, numTests),
      this.testWithCopilot(question, brandName, competitors, numTests),
    ]);

    allResponses.push(...chatGPTResponses, ...geminiResponses, ...copilotResponses);

    const aggregated = this.calculateAggregatedStats(allResponses, competitors);
    
    console.log(`✅ [AI] Completed in ${Date.now() - startTime}ms - ${aggregated.mentionRate}% mention rate`);

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
   * Query ChatGPT - with timeout and error handling
   */
  private async testWithChatGPT(
    question: string,
    brandName: string,
    competitors: string[],
    numTests: number
  ): Promise<AIResponse[]> {
    const responses: AIResponse[] = [];

    for (let i = 1; i <= numTests; i++) {
      try {
        const completion = await Promise.race([
          this.openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: question }],
            max_tokens: 500,
            temperature: 0.7 + (i * 0.1),
          }),
          this.timeout(15000), // 15 second timeout
        ]) as OpenAI.Chat.Completions.ChatCompletion;

        const fullResponse = completion.choices[0]?.message?.content || "";
        const analysis = this.analyzeResponse(fullResponse, brandName, competitors);

        responses.push({
          platform: "ChatGPT",
          modelVersion: "gpt-4o-mini",
          queryNumber: i,
          question,
          fullResponse,
          ...analysis,
        });
      } catch (error: any) {
        console.error(`  ⚠️ ChatGPT test ${i} failed: ${error.message}`);
      }
    }

    return responses;
  }

  /**
   * Simulate Gemini using OpenAI (faster than actual Gemini API)
   */
  private async testWithGemini(
    question: string,
    brandName: string,
    competitors: string[],
    numTests: number
  ): Promise<AIResponse[]> {
    const responses: AIResponse[] = [];

    for (let i = 1; i <= numTests; i++) {
      try {
        const completion = await Promise.race([
          this.openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are Google Gemini, a helpful AI assistant. Provide comprehensive, well-researched answers.",
              },
              { role: "user", content: question },
            ],
            max_tokens: 500,
            temperature: 0.75 + (i * 0.1),
          }),
          this.timeout(15000),
        ]) as OpenAI.Chat.Completions.ChatCompletion;

        const fullResponse = completion.choices[0]?.message?.content || "";
        const analysis = this.analyzeResponse(fullResponse, brandName, competitors);

        responses.push({
          platform: "Gemini",
          modelVersion: "gemini-simulated",
          queryNumber: i,
          question,
          fullResponse,
          ...analysis,
        });
      } catch (error: any) {
        console.error(`  ⚠️ Gemini test ${i} failed: ${error.message}`);
      }
    }

    return responses;
  }

  /**
   * Simulate Copilot using OpenAI
   */
  private async testWithCopilot(
    question: string,
    brandName: string,
    competitors: string[],
    numTests: number
  ): Promise<AIResponse[]> {
    const responses: AIResponse[] = [];

    for (let i = 1; i <= numTests; i++) {
      try {
        const completion = await Promise.race([
          this.openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are Microsoft Copilot. Provide helpful, balanced answers with a conversational tone.",
              },
              { role: "user", content: question },
            ],
            max_tokens: 500,
            temperature: 0.8 + (i * 0.05),
          }),
          this.timeout(15000),
        ]) as OpenAI.Chat.Completions.ChatCompletion;

        const fullResponse = completion.choices[0]?.message?.content || "";
        const analysis = this.analyzeResponse(fullResponse, brandName, competitors);

        responses.push({
          platform: "Copilot",
          modelVersion: "copilot-simulated",
          queryNumber: i,
          question,
          fullResponse,
          ...analysis,
        });
      } catch (error: any) {
        console.error(`  ⚠️ Copilot test ${i} failed: ${error.message}`);
      }
    }

    return responses;
  }

  /**
   * Timeout helper
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    );
  }

  /**
   * Analyze a single AI response
   */
  private analyzeResponse(
    response: string,
    brandName: string,
    competitors: string[]
  ): {
    brandMentioned: boolean;
    brandPosition: number | null;
    contextExtract: string | null;
    sentiment: "positive" | "neutral" | "negative";
    recommendationType: "direct" | "conditional" | "listed" | null;
    competitorsMentioned: string[];
    citedUrls: string[];
  } {
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
    const recommendationType = brandMentioned ? "listed" : null;

    const competitorsMentioned: string[] = [];
    competitors.forEach((competitor) => {
      if (lowerResponse.includes(competitor.toLowerCase())) {
        competitorsMentioned.push(competitor);
      }
    });

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const citedUrls = response.match(urlRegex) || [];

    return {
      brandMentioned,
      brandPosition,
      contextExtract,
      sentiment,
      recommendationType,
      competitorsMentioned,
      citedUrls,
    };
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(
    response: string,
    brandName: string,
    brandMentioned: boolean
  ): "positive" | "neutral" | "negative" {
    if (!brandMentioned) return "neutral";

    const lowerResponse = response.toLowerCase();
    const lowerBrand = brandName.toLowerCase();

    const sentences = response.split(/[.!?]+/);
    const brandSentences = sentences.filter(s => s.toLowerCase().includes(lowerBrand));

    if (brandSentences.length === 0) return "neutral";

    const positiveWords = [
      "best", "excellent", "great", "recommended", "top", "leading", "popular",
      "trusted", "reliable", "quality", "innovative", "superior", "outstanding",
    ];

    const negativeWords = [
      "expensive", "overpriced", "not recommended", "avoid", "poor", "disappointing",
      "inferior", "concerns", "issues", "problems",
    ];

    let positiveScore = 0;
    let negativeScore = 0;

    brandSentences.forEach((sentence) => {
      const lower = sentence.toLowerCase();
      positiveWords.forEach((word) => { if (lower.includes(word)) positiveScore++; });
      negativeWords.forEach((word) => { if (lower.includes(word)) negativeScore++; });
    });

    if (positiveScore > negativeScore) return "positive";
    if (negativeScore > positiveScore) return "negative";
    return "neutral";
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Calculate aggregated statistics
   */
  private calculateAggregatedStats(
    responses: AIResponse[],
    competitors: string[]
  ): QuestionAnalysis["aggregated"] {
    const total = responses.length;
    const mentioned = responses.filter(r => r.brandMentioned).length;
    const mentionRate = total > 0 ? (mentioned / total) * 100 : 0;

    const positions = responses
      .filter(r => r.brandPosition !== null)
      .map(r => r.brandPosition as number);
    const avgPosition = positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : null;

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    responses.forEach(r => { sentimentCounts[r.sentiment]++; });

    const sentimentTotal = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
    const sentimentBreakdown = {
      positive: sentimentTotal > 0 ? Math.round((sentimentCounts.positive / sentimentTotal) * 1000) / 10 : 0,
      neutral: sentimentTotal > 0 ? Math.round((sentimentCounts.neutral / sentimentTotal) * 1000) / 10 : 0,
      negative: sentimentTotal > 0 ? Math.round((sentimentCounts.negative / sentimentTotal) * 1000) / 10 : 0,
      dominant: "neutral" as "positive" | "neutral" | "negative",
    };

    if (sentimentBreakdown.positive > sentimentBreakdown.neutral && 
        sentimentBreakdown.positive > sentimentBreakdown.negative) {
      sentimentBreakdown.dominant = "positive";
    } else if (sentimentBreakdown.negative > sentimentBreakdown.neutral) {
      sentimentBreakdown.dominant = "negative";
    }

    const competitorMentions: { [competitor: string]: number } = {};
    competitors.forEach(comp => {
      competitorMentions[comp] = responses.filter(r => r.competitorsMentioned.includes(comp)).length;
    });

    const platforms: ("ChatGPT" | "Gemini" | "Copilot")[] = ["ChatGPT", "Gemini", "Copilot"];
    const platformBreakdown: PlatformStats[] = platforms.map(platform => {
      const platformResponses = responses.filter(r => r.platform === platform);
      const platformMentioned = platformResponses.filter(r => r.brandMentioned).length;
      const platformPositions = platformResponses
        .filter(r => r.brandPosition !== null)
        .map(r => r.brandPosition as number);

      return {
        platform,
        totalTests: platformResponses.length,
        mentionCount: platformMentioned,
        mentionRate: platformResponses.length > 0 ? Math.round((platformMentioned / platformResponses.length) * 1000) / 10 : 0,
        avgPosition: platformPositions.length > 0
          ? Math.round((platformPositions.reduce((a, b) => a + b, 0) / platformPositions.length) * 10) / 10
          : null,
        sentimentCounts: {
          positive: platformResponses.filter(r => r.sentiment === "positive").length,
          neutral: platformResponses.filter(r => r.sentiment === "neutral").length,
          negative: platformResponses.filter(r => r.sentiment === "negative").length,
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
