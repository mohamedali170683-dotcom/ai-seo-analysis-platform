import axios from "axios";

export interface DiscoveredQuestion {
  question: string;
  searchVolume: number;
  difficulty: number;
  intent: "informational" | "commercial" | "navigational";
  category: "awareness" | "consideration" | "decision";
  score: number;
  relatedTerms: string[];
}

export class QuestionDiscoveryService {
  private dataForSEOUsername: string;
  private dataForSEOPassword: string;
  private timeout: number = 8000;

  constructor(dataForSEOUsername: string, dataForSEOPassword: string) {
    this.dataForSEOUsername = dataForSEOUsername;
    this.dataForSEOPassword = dataForSEOPassword;
  }

  async discoverQuestions(
    brandOrKeyword: string,
    minVolume: number = 100,
    maxQuestions: number = 50
  ): Promise<DiscoveredQuestion[]> {
    try {
      console.log(`🔍 Starting question discovery for: ${brandOrKeyword}`);

      const allQuestions: DiscoveredQuestion[] = [];

      // Try DataForSEO first
      try {
        const keywordSuggestions = await this.getKeywordSuggestions(brandOrKeyword);
        allQuestions.push(...keywordSuggestions);

        const relatedQuestions = await this.getRelatedQuestions(brandOrKeyword);
        allQuestions.push(...relatedQuestions);

        console.log(`✅ DataForSEO returned ${allQuestions.length} questions`);
      } catch (error) {
        console.log("⚠️ DataForSEO failed, will use fallback");
      }

      if (allQuestions.length > 0) {
        const uniqueQuestions = this.deduplicateQuestions(allQuestions);
        const scoredQuestions = this.scoreQuestions(uniqueQuestions);
        const topQuestions = scoredQuestions
          .filter((q) => q.searchVolume >= minVolume)
          .slice(0, maxQuestions);

        console.log(`✅ Returning ${topQuestions.length} unique questions`);
        return topQuestions;
      }

      console.log("⚠️ DataForSEO returned no questions, using fallback mock questions");
      return this.getMockQuestions(brandOrKeyword);

    } catch (error: any) {
      console.error("❌ Question discovery error:", error.message);
      return this.getMockQuestions(brandOrKeyword);
    }
  }

  private getMockQuestions(brandOrKeyword: string): DiscoveredQuestion[] {
    return [
      {
        question: `What is ${brandOrKeyword}?`,
        searchVolume: 1200,
        difficulty: 35,
        intent: "informational",
        category: "awareness",
        score: 85,
        relatedTerms: [brandOrKeyword, "overview", "information"],
      },
      {
        question: `What are the best alternatives to ${brandOrKeyword}?`,
        searchVolume: 800,
        difficulty: 45,
        intent: "commercial",
        category: "consideration",
        score: 90,
        relatedTerms: [brandOrKeyword, "alternatives", "competitors", "comparison"],
      },
      {
        question: `How much does ${brandOrKeyword} cost?`,
        searchVolume: 600,
        difficulty: 30,
        intent: "commercial",
        category: "decision",
        score: 80,
        relatedTerms: [brandOrKeyword, "pricing", "cost", "price"],
      },
    ];
  }

  private async getKeywordSuggestions(keyword: string): Promise<DiscoveredQuestion[]> {
    const apiUrl = "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live";

    const requestBody = [
      {
        keyword: keyword,
        language_code: "en",
        location_code: 2840,
        include_seed_keyword: true,
        limit: 100,
        filters: ["keyword_data.keyword_info.search_volume", ">", 50],
      },
    ];

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DataForSEO timeout")), this.timeout)
      );

      const apiCallPromise = axios.post(apiUrl, requestBody, {
        auth: {
          username: this.dataForSEOUsername,
          password: this.dataForSEOPassword,
        },
        headers: { "Content-Type": "application/json" },
      });

      const response: any = await Promise.race([apiCallPromise, timeoutPromise]);

      if (response.data?.tasks?.[0]?.result?.[0]?.items) {
        const items = response.data.tasks[0].result[0].items;

        return items
          .filter((item: any) => this.isQuestionKeyword(item.keyword))
          .map((item: any) => ({
            question: item.keyword,
            searchVolume: item.keyword_data?.keyword_info?.search_volume || 0,
            difficulty: item.keyword_data?.keyword_properties?.keyword_difficulty || 50,
            intent: this.classifyIntent(item.keyword),
            category: this.categorizeQuestion(item.keyword),
            score: 0,
            relatedTerms: [],
          }));
      }

      return [];
    } catch (error: any) {
      console.error("DataForSEO keyword suggestions error:", error.message);
      return [];
    }
  }

  private async getRelatedQuestions(keyword: string): Promise<DiscoveredQuestion[]> {
    const apiUrl = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced";

    const requestBody = [
      {
        keyword: `${keyword} questions`,
        language_code: "en",
        location_code: 2840,
        device: "desktop",
        os: "windows",
      },
    ];

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DataForSEO timeout")), this.timeout)
      );

      const apiCallPromise = axios.post(apiUrl, requestBody, {
        auth: {
          username: this.dataForSEOUsername,
          password: this.dataForSEOPassword,
        },
        headers: { "Content-Type": "application/json" },
      });

      const response: any = await Promise.race([apiCallPromise, timeoutPromise]);

      const questions: DiscoveredQuestion[] = [];

      if (response.data?.tasks?.[0]?.result?.[0]?.items) {
        const items = response.data.tasks[0].result[0].items;

        items.forEach((item: any) => {
          if (item.type === "people_also_ask" && item.items) {
            item.items.forEach((paaItem: any) => {
              if (paaItem.title) {
                questions.push({
                  question: paaItem.title,
                  searchVolume: 100,
                  difficulty: 40,
                  intent: "informational",
                  category: this.categorizeQuestion(paaItem.title),
                  score: 0,
                  relatedTerms: [],
                });
              }
            });
          }
        });
      }

      return questions;
    } catch (error: any) {
      console.error("DataForSEO related questions error:", error.message);
      return [];
    }
  }

  private isQuestionKeyword(keyword: string): boolean {
    const questionWords = [
      "what", "how", "why", "when", "where", "who", "which",
      "best", "vs", "versus", "compare", "difference",
      "should", "can", "do", "does", "is", "are",
    ];
    const lowerKeyword = keyword.toLowerCase();
    return questionWords.some((word) => lowerKeyword.includes(word));
  }

  private classifyIntent(keyword: string): "informational" | "commercial" | "navigational" {
    const lowerKeyword = keyword.toLowerCase();

    const commercialKeywords = [
      "buy", "price", "cost", "purchase", "shop", "deal",
      "best", "top", "review", "vs", "compare", "alternative",
    ];
    const navigationalKeywords = ["login", "sign in", "website", "official"];

    if (commercialKeywords.some((word) => lowerKeyword.includes(word))) {
      return "commercial";
    }
    if (navigationalKeywords.some((word) => lowerKeyword.includes(word))) {
      return "navigational";
    }
    return "informational";
  }

  private categorizeQuestion(question: string): "awareness" | "consideration" | "decision" {
    const lowerQuestion = question.toLowerCase();

    // DECISION STAGE: High commercial intent, ready to buy
    const decisionKeywords = [
      "price", "cost", "pricing", "buy", "purchase", "shop",
      "where to buy", "cheapest", "discount", "coupon", "deal",
      "shipping", "delivery", "warranty", "guarantee", "return policy",
    ];

    // CONSIDERATION STAGE: Comparing options, seeking recommendations
    const considerationKeywords = [
      "best", "top", "vs", "versus", "compare", "comparison",
      "alternative", "competitor", "difference between", "which",
      "should i", "recommend", "review", "pros and cons",
      "better than", "worth it", "good", "bad",
    ];

    // AWARENESS STAGE: Learning, discovering (default)
    // Keywords: what, why, how, who, when, where, guide, tutorial, beginner

    // Check decision first (highest intent)
    if (decisionKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return "decision";
    }

    // Then consideration
    if (considerationKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return "consideration";
    }

    // Default to awareness
    return "awareness";
  }

  private deduplicateQuestions(questions: DiscoveredQuestion[]): DiscoveredQuestion[] {
    const seen = new Set<string>();
    return questions.filter((q) => {
      const normalized = q.question.toLowerCase().trim();
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }

  private scoreQuestions(questions: DiscoveredQuestion[]): DiscoveredQuestion[] {
    return questions.map((q) => {
      let score = 50;

      // Search volume scoring
      if (q.searchVolume > 1000) score += 30;
      else if (q.searchVolume > 500) score += 20;
      else if (q.searchVolume > 100) score += 10;

      // Difficulty scoring (lower is better)
      if (q.difficulty < 30) score += 15;
      else if (q.difficulty < 50) score += 10;
      else score += 5;

      // Intent scoring
      if (q.intent === "commercial") score += 15;
      else if (q.intent === "informational") score += 10;

      return { ...q, score };
    });
  }
}
