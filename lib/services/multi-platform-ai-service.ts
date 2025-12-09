import OpenAI from "openai";
import axios from "axios";

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
  private geminiApiKey: string;
  private testsPerPlatform: number;

  constructor(openaiApiKey: string, geminiApiKey?: string, testsPerPlatform: number = 5) {
    this.openaiClient = new OpenAI({ apiKey: openaiApiKey });
    this.geminiApiKey = geminiApiKey || "";
    this.testsPerPlatform = testsPerPlatform;
  }

  /**
   * Test a question across all AI platforms with multiple queries for statistical significance
   */
  async testQuestion(
    question: string,
    brandName: string,
    competitors: string[] = [],
    testsPerPlatform?: number
  ): Promise<QuestionAnalysis> {
    const numTests = testsPerPlatform || this.testsPerPlatform;
    console.log(`🤖 Testing question across platforms: "${question}" (${numTests} tests per platform)`);

    const allResponses: AIResponse[] = [];

    // Test with ChatGPT
    const chatGPTResponses = await this.testWithChatGPT(question, brandName, competitors, numTests);
    allResponses.push(...chatGPTResponses);

    // Test with Gemini
    const geminiResponses = await this.testWithGemini(question, brandName, competitors, numTests);
    allResponses.push(...geminiResponses);

    // Test with Copilot (simulated via different prompt style)
    const copilotResponses = await this.testWithCopilot(question, brandName, competitors, numTests);
    allResponses.push(...copilotResponses);

    // Calculate aggregated statistics
    const aggregated = this.calculateAggregatedStats(allResponses, competitors);

    return {
      question,
      searchVolume: 0, // Will be set by caller
      category: "awareness", // Will be set by caller
      totalResponses: allResponses.length,
      responses: allResponses,
      aggregated,
    };
  }

  /**
   * Query ChatGPT multiple times
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
        console.log(`  📱 ChatGPT test ${i}/${numTests}...`);
        
        const completion = await this.openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: question }],
          max_tokens: 800,
          temperature: 0.7 + (i * 0.05), // Vary temperature slightly for diversity
        });

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

        // Small delay to avoid rate limiting
        if (i < numTests) {
          await this.delay(200);
        }
      } catch (error: any) {
        console.error(`  ❌ ChatGPT test ${i} failed:`, error.message);
      }
    }

    return responses;
  }

  /**
   * Query Google Gemini multiple times
   */
  private async testWithGemini(
    question: string,
    brandName: string,
    competitors: string[],
    numTests: number
  ): Promise<AIResponse[]> {
    const responses: AIResponse[] = [];

    // If no Gemini API key, use OpenAI with Gemini-like prompting style
    if (!this.geminiApiKey) {
      console.log(`  ⚠️ No Gemini API key - simulating with alternative approach`);
      return this.simulateGeminiWithOpenAI(question, brandName, competitors, numTests);
    }

    for (let i = 1; i <= numTests; i++) {
      try {
        console.log(`  📱 Gemini test ${i}/${numTests}...`);
        
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
          {
            contents: [{ parts: [{ text: question }] }],
            generationConfig: {
              temperature: 0.7 + (i * 0.05),
              maxOutputTokens: 800,
            },
          },
          { timeout: 30000 }
        );

        const fullResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const analysis = this.analyzeResponse(fullResponse, brandName, competitors);

        responses.push({
          platform: "Gemini",
          modelVersion: "gemini-pro",
          queryNumber: i,
          question,
          fullResponse,
          ...analysis,
        });

        if (i < numTests) {
          await this.delay(200);
        }
      } catch (error: any) {
        console.error(`  ❌ Gemini test ${i} failed:`, error.message);
      }
    }

    return responses;
  }

  /**
   * Simulate Gemini using OpenAI with different prompt style
   */
  private async simulateGeminiWithOpenAI(
    question: string,
    brandName: string,
    competitors: string[],
    numTests: number
  ): Promise<AIResponse[]> {
    const responses: AIResponse[] = [];

    for (let i = 1; i <= numTests; i++) {
      try {
        console.log(`  📱 Gemini (simulated) test ${i}/${numTests}...`);
        
        // Use a slightly different system prompt to simulate Gemini's style
        const completion = await this.openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful AI assistant that provides comprehensive, well-researched answers. Be factual and cite specific examples when discussing brands or products.",
            },
            { role: "user", content: question },
          ],
          max_tokens: 800,
          temperature: 0.75 + (i * 0.05),
        });

        const fullResponse = completion.choices[0]?.message?.content || "";
        const analysis = this.analyzeResponse(fullResponse, brandName, competitors);

        responses.push({
          platform: "Gemini",
          modelVersion: "gemini-pro-simulated",
          queryNumber: i,
          question,
          fullResponse,
          ...analysis,
        });

        if (i < numTests) {
          await this.delay(200);
        }
      } catch (error: any) {
        console.error(`  ❌ Gemini (simulated) test ${i} failed:`, error.message);
      }
    }

    return responses;
  }

  /**
   * Query Copilot (simulated via different prompt style)
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
        console.log(`  📱 Copilot (simulated) test ${i}/${numTests}...`);
        
        // Copilot tends to be more conversational and Bing-search focused
        const completion = await this.openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are Microsoft Copilot, an AI assistant powered by the latest AI technology. Provide helpful, balanced answers with a conversational tone. When discussing products or brands, consider recent market trends and user preferences.",
            },
            { role: "user", content: question },
          ],
          max_tokens: 800,
          temperature: 0.8 + (i * 0.03),
        });

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

        if (i < numTests) {
          await this.delay(200);
        }
      } catch (error: any) {
        console.error(`  ❌ Copilot (simulated) test ${i} failed:`, error.message);
      }
    }

    return responses;
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

    // Check if brand is mentioned
    const brandMentioned = lowerResponse.includes(lowerBrand);

    // Find brand position (order among all brand mentions)
    let brandPosition: number | null = null;
    let contextExtract: string | null = null;

    if (brandMentioned) {
      // Find all brand and competitor mentions with their positions
      const allBrands = [brandName, ...competitors];
      const brandMentions: { brand: string; index: number }[] = [];

      allBrands.forEach((brand) => {
        const regex = new RegExp(`\\b${this.escapeRegex(brand)}\\b`, "gi");
        let match;
        while ((match = regex.exec(response)) !== null) {
          brandMentions.push({ brand: brand.toLowerCase(), index: match.index });
        }
      });

      // Sort by position in text
      brandMentions.sort((a, b) => a.index - b.index);

      // Find the position of our brand
      const brandFirstMention = brandMentions.findIndex(
        (m) => m.brand === lowerBrand
      );
      brandPosition = brandFirstMention >= 0 ? brandFirstMention + 1 : null;

      // Extract context around the brand mention
      const brandIndex = lowerResponse.indexOf(lowerBrand);
      if (brandIndex !== -1) {
        const start = Math.max(0, brandIndex - 50);
        const end = Math.min(response.length, brandIndex + brandName.length + 200);
        contextExtract = response.substring(start, end).trim();
        if (start > 0) contextExtract = "..." + contextExtract;
        if (end < response.length) contextExtract = contextExtract + "...";
      }
    }

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(response, brandName, brandMentioned);

    // Determine recommendation type
    const recommendationType = this.analyzeRecommendationType(response, brandName, brandMentioned);

    // Find competitor mentions
    const competitorsMentioned: string[] = [];
    competitors.forEach((competitor) => {
      if (lowerResponse.includes(competitor.toLowerCase())) {
        competitorsMentioned.push(competitor);
      }
    });

    // Extract URLs
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
   * Analyze sentiment of the response regarding the brand
   */
  private analyzeSentiment(
    response: string,
    brandName: string,
    brandMentioned: boolean
  ): "positive" | "neutral" | "negative" {
    if (!brandMentioned) return "neutral";

    const lowerResponse = response.toLowerCase();
    const lowerBrand = brandName.toLowerCase();

    // Find sentences containing the brand
    const sentences = response.split(/[.!?]+/);
    const brandSentences = sentences.filter((s) =>
      s.toLowerCase().includes(lowerBrand)
    );

    if (brandSentences.length === 0) return "neutral";

    const positiveWords = [
      "best", "excellent", "great", "recommended", "top", "leading", "popular",
      "trusted", "reliable", "quality", "innovative", "superior", "outstanding",
      "preferred", "proven", "exceptional", "highly recommend", "worth",
      "favorite", "love", "amazing", "impressive", "wonderful", "fantastic",
    ];

    const negativeWords = [
      "expensive", "overpriced", "not recommended", "avoid", "poor", "disappointing",
      "inferior", "concerns", "issues", "problems", "complaints", "recalled",
      "worse", "lacking", "limited", "controversial", "questionable", "weak",
    ];

    let positiveScore = 0;
    let negativeScore = 0;

    brandSentences.forEach((sentence) => {
      const lowerSentence = sentence.toLowerCase();
      positiveWords.forEach((word) => {
        if (lowerSentence.includes(word)) positiveScore++;
      });
      negativeWords.forEach((word) => {
        if (lowerSentence.includes(word)) negativeScore++;
      });
    });

    if (positiveScore > negativeScore + 1) return "positive";
    if (negativeScore > positiveScore + 1) return "negative";
    if (positiveScore > negativeScore) return "positive";
    if (negativeScore > positiveScore) return "negative";
    return "neutral";
  }

  /**
   * Analyze the type of recommendation given
   */
  private analyzeRecommendationType(
    response: string,
    brandName: string,
    brandMentioned: boolean
  ): "direct" | "conditional" | "listed" | null {
    if (!brandMentioned) return null;

    const lowerResponse = response.toLowerCase();
    const lowerBrand = brandName.toLowerCase();

    // Direct recommendation patterns
    const directPatterns = [
      `i recommend ${lowerBrand}`,
      `recommend ${lowerBrand}`,
      `${lowerBrand} is the best`,
      `${lowerBrand} is excellent`,
      `go with ${lowerBrand}`,
      `choose ${lowerBrand}`,
      `${lowerBrand} would be my`,
      `my top pick is ${lowerBrand}`,
      `${lowerBrand} stands out`,
      `${lowerBrand} is a great choice`,
    ];

    if (directPatterns.some((pattern) => lowerResponse.includes(pattern))) {
      return "direct";
    }

    // Conditional recommendation patterns
    const conditionalPatterns = [
      `if you're looking`,
      `if you prefer`,
      `if you need`,
      `for those who`,
      `when you need`,
      `depending on`,
      `if price is`,
      `if quality is`,
    ];

    const brandIndex = lowerResponse.indexOf(lowerBrand);
    const contextBefore = lowerResponse.substring(
      Math.max(0, brandIndex - 150),
      brandIndex
    );

    if (conditionalPatterns.some((pattern) => contextBefore.includes(pattern))) {
      return "conditional";
    }

    // Listed as an option
    const listedPatterns = [
      "include", "options", "consider", "such as", "along with", "as well as",
      "other brands", "alternatives", "similar to", "like", "competitors",
    ];

    if (listedPatterns.some((pattern) => contextBefore.includes(pattern))) {
      return "listed";
    }

    return "listed"; // Default if mentioned but pattern unclear
  }

  /**
   * Calculate aggregated statistics from all responses
   */
  private calculateAggregatedStats(
    responses: AIResponse[],
    competitors: string[]
  ): QuestionAnalysis["aggregated"] {
    const total = responses.length;
    const mentioned = responses.filter((r) => r.brandMentioned).length;
    const mentionRate = total > 0 ? (mentioned / total) * 100 : 0;

    // Calculate average position
    const positions = responses
      .filter((r) => r.brandPosition !== null)
      .map((r) => r.brandPosition as number);
    const avgPosition = positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : null;

    // Calculate sentiment breakdown
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    responses.forEach((r) => {
      sentimentCounts[r.sentiment]++;
    });

    const totalWithSentiment = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
    const sentimentBreakdown = {
      positive: totalWithSentiment > 0 ? (sentimentCounts.positive / totalWithSentiment) * 100 : 0,
      neutral: totalWithSentiment > 0 ? (sentimentCounts.neutral / totalWithSentiment) * 100 : 0,
      negative: totalWithSentiment > 0 ? (sentimentCounts.negative / totalWithSentiment) * 100 : 0,
      dominant: "neutral" as "positive" | "neutral" | "negative",
    };

    if (sentimentBreakdown.positive > sentimentBreakdown.neutral && 
        sentimentBreakdown.positive > sentimentBreakdown.negative) {
      sentimentBreakdown.dominant = "positive";
    } else if (sentimentBreakdown.negative > sentimentBreakdown.neutral && 
               sentimentBreakdown.negative > sentimentBreakdown.positive) {
      sentimentBreakdown.dominant = "negative";
    }

    // Calculate competitor mentions
    const competitorMentions: { [competitor: string]: number } = {};
    competitors.forEach((comp) => {
      competitorMentions[comp] = responses.filter((r) =>
        r.competitorsMentioned.includes(comp)
      ).length;
    });

    // Calculate platform breakdown
    const platforms: ("ChatGPT" | "Gemini" | "Copilot")[] = ["ChatGPT", "Gemini", "Copilot"];
    const platformBreakdown: PlatformStats[] = platforms.map((platform) => {
      const platformResponses = responses.filter((r) => r.platform === platform);
      const platformMentioned = platformResponses.filter((r) => r.brandMentioned).length;
      const platformPositions = platformResponses
        .filter((r) => r.brandPosition !== null)
        .map((r) => r.brandPosition as number);

      return {
        platform,
        totalTests: platformResponses.length,
        mentionCount: platformMentioned,
        mentionRate: platformResponses.length > 0
          ? (platformMentioned / platformResponses.length) * 100
          : 0,
        avgPosition: platformPositions.length > 0
          ? platformPositions.reduce((a, b) => a + b, 0) / platformPositions.length
          : null,
        sentimentCounts: {
          positive: platformResponses.filter((r) => r.sentiment === "positive").length,
          neutral: platformResponses.filter((r) => r.sentiment === "neutral").length,
          negative: platformResponses.filter((r) => r.sentiment === "negative").length,
        },
      };
    });

    return {
      mentionRate: Math.round(mentionRate * 10) / 10,
      avgPosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
      sentimentBreakdown: {
        positive: Math.round(sentimentBreakdown.positive * 10) / 10,
        neutral: Math.round(sentimentBreakdown.neutral * 10) / 10,
        negative: Math.round(sentimentBreakdown.negative * 10) / 10,
        dominant: sentimentBreakdown.dominant,
      },
      competitorMentions,
      platformBreakdown,
    };
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
