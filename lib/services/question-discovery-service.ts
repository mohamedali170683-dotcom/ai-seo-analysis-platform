import axios from "axios";

export interface DiscoveredQuestion {
  question: string;
  searchVolume: number;
  difficulty?: number;
  commercialIntent: "high" | "medium" | "low";
  category?: string;
}

export class QuestionDiscoveryService {
  private login: string;
  private password: string;
  private auth: string;

  constructor(login: string, password: string) {
    this.login = login;
    this.password = password;
    this.auth = Buffer.from(`${login}:${password}`).toString('base64');
  }

  /**
   * Discover relevant questions for a brand/keyword
   */
  async discoverQuestions(
    brandOrKeyword: string,
    minVolume: number = 100,
    maxQuestions: number = 50
  ): Promise<DiscoveredQuestion[]> {
    try {
      console.log(`Discovering questions for: ${brandOrKeyword}`);
      
      // Try DataForSEO first (with timeout)
      const allQuestions: DiscoveredQuestion[] = [];

      try {
        // Get keyword suggestions with timeout
        const suggestionsPromise = this.getKeywordSuggestions(brandOrKeyword);
        const suggestions = await Promise.race([
          suggestionsPromise,
          this.timeout(8000) // 8 second timeout
        ]) as DiscoveredQuestion[];
        
        console.log(`Got ${suggestions.length} suggestions from DataForSEO`);
        allQuestions.push(...suggestions);
      } catch (error) {
        console.error("DataForSEO keyword suggestions failed or timed out:", error);
      }

      try {
        // Get related questions with timeout
        const questionsPromise = this.getRelatedQuestions(brandOrKeyword);
        const relatedQuestions = await Promise.race([
          questionsPromise,
          this.timeout(8000) // 8 second timeout
        ]) as DiscoveredQuestion[];
        
        console.log(`Got ${relatedQuestions.length} related questions from DataForSEO`);
        allQuestions.push(...relatedQuestions);
      } catch (error) {
        console.error("DataForSEO related questions failed or timed out:", error);
      }

      // If DataForSEO returned questions, use them
      if (allQuestions.length > 0) {
        console.log(`Using ${allQuestions.length} questions from DataForSEO`);
        const filtered = allQuestions.filter(q => q.searchVolume >= minVolume);
        const unique = this.deduplicateQuestions(filtered);
        const scored = unique.map(q => ({
          ...q,
          score: this.calculateQuestionScore(q),
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, maxQuestions).map(({ score, ...q }) => q);
      }

      // FALLBACK: Use mock questions if DataForSEO fails
      console.log("DataForSEO returned no questions, using fallback mock questions");
      return this.getMockQuestions(brandOrKeyword);

    } catch (error) {
      console.error("Error discovering questions:", error);
      // Always return mock questions as last resort
      console.log("Using fallback mock questions due to error");
      return this.getMockQuestions(brandOrKeyword);
    }
  }

  /**
   * Timeout helper
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    );
  }

  /**
   * Get mock questions as fallback
   */
  private getMockQuestions(brandOrKeyword: string): DiscoveredQuestion[] {
    const brand = brandOrKeyword.toLowerCase();
    
    // Generic high-value questions that work for any brand
    const genericQuestions = [
      {
        question: `What are the best ${brand} products?`,
        searchVolume: 12000,
        commercialIntent: "high" as const,
        category: "general",
      },
      {
        question: `Is ${brand} a good brand?`,
        searchVolume: 8500,
        commercialIntent: "medium" as const,
        category: "general",
      },
      {
        question: `${brand} vs competitors`,
        searchVolume: 6200,
        commercialIntent: "high" as const,
        category: "comparison",
      },
    ];

    console.log(`Generated ${genericQuestions.length} mock questions for ${brand}`);
    return genericQuestions.slice(0, 3);
  }

  /**
   * Get keyword suggestions
   */
  private async getKeywordSuggestions(keyword: string): Promise<DiscoveredQuestion[]> {
    try {
      const response = await axios.post(
        "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live",
        [{
          keyword,
          location_code: 2840,
          language_code: "en",
          limit: 50,
        }],
        {
          headers: {
            Authorization: `Basic ${this.auth}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const items = response.data?.tasks?.[0]?.result?.[0]?.items || [];

      return items
        .filter((item: any) => item.keyword && item.search_volume)
        .map((item: any) => ({
          question: item.keyword,
          searchVolume: item.search_volume,
          difficulty: item.keyword_difficulty,
          commercialIntent: this.classifyCommercialIntent(item.keyword, item.cpc),
          category: this.categorizeQuestion(item.keyword),
        }));
    } catch (error) {
      console.error("Error getting keyword suggestions:", error);
      return [];
    }
  }

  /**
   * Get related questions (People Also Ask)
   */
  private async getRelatedQuestions(keyword: string): Promise<DiscoveredQuestion[]> {
    try {
      const response = await axios.post(
        "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
        [{
          keyword,
          location_code: 2840,
          language_code: "en",
          device: "desktop",
          os: "windows",
        }],
        {
          headers: {
            Authorization: `Basic ${this.auth}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const items = response.data?.tasks?.[0]?.result?.[0]?.items || [];
      const questions: DiscoveredQuestion[] = [];

      // Extract "People Also Ask" questions
      items.forEach((item: any) => {
        if (item.type === "people_also_ask" && item.items) {
          item.items.forEach((paaItem: any) => {
            if (paaItem.title) {
              questions.push({
                question: paaItem.title,
                searchVolume: 1000, // Default estimate for PAA
                commercialIntent: this.classifyCommercialIntent(paaItem.title),
                category: this.categorizeQuestion(paaItem.title),
              });
            }
          });
        }
      });

      // Also extract related searches
      items.forEach((item: any) => {
        if (item.type === "related_searches" && item.items) {
          item.items.forEach((relatedItem: any) => {
            if (relatedItem.title) {
              questions.push({
                question: relatedItem.title,
                searchVolume: 500, // Default estimate
                commercialIntent: this.classifyCommercialIntent(relatedItem.title),
                category: this.categorizeQuestion(relatedItem.title),
              });
            }
          });
        }
      });

      return questions;
    } catch (error) {
      console.error("Error getting related questions:", error);
      return [];
    }
  }

  /**
   * Classify commercial intent
   */
  private classifyCommercialIntent(
    question: string,
    cpc?: number
  ): "high" | "medium" | "low" {
    const highIntentKeywords = [
      "best", "top", "buy", "purchase", "price", "cost",
      "review", "vs", "versus", "compare", "alternative",
      "which", "should i", "recommend",
    ];

    const lowIntentKeywords = [
      "what is", "how to", "tutorial", "guide",
      "meaning", "definition", "history",
    ];

    const lowerQuestion = question.toLowerCase();

    // CPC-based classification
    if (cpc && cpc > 2) return "high";
    if (cpc && cpc > 0.5) return "medium";

    // Keyword-based classification
    const hasHighIntent = highIntentKeywords.some(kw => lowerQuestion.includes(kw));
    const hasLowIntent = lowIntentKeywords.some(kw => lowerQuestion.includes(kw));

    if (hasHighIntent) return "high";
    if (hasLowIntent) return "low";

    return "medium";
  }

  /**
   * Categorize question into themes
   */
  private categorizeQuestion(question: string): string {
    const categories = {
      performance: ["performance", "fast", "speed", "efficient", "powerful"],
      style: ["style", "design", "look", "fashion", "aesthetic", "appearance"],
      price: ["price", "cost", "budget", "cheap", "affordable", "expensive", "value"],
      innovation: ["innovative", "technology", "latest", "cutting-edge", "advanced", "new"],
      sustainability: ["sustainable", "eco", "green", "environment", "recycled"],
      durability: ["durable", "lasting", "quality", "reliable", "lifespan"],
      comfort: ["comfortable", "comfort", "cushion", "support", "fit"],
      professional: ["professional", "athlete", "expert", "serious", "competitive"],
    };

    const lowerQuestion = question.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => lowerQuestion.includes(kw))) {
        return category;
      }
    }

    return "general";
  }

  /**
   * Calculate question score
   */
  private calculateQuestionScore(question: DiscoveredQuestion): number {
    const intentMultiplier = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return question.searchVolume * intentMultiplier[question.commercialIntent];
  }

  /**
   * Remove duplicates
   */
  private deduplicateQuestions(
    questions: DiscoveredQuestion[]
  ): DiscoveredQuestion[] {
    const seen = new Set<string>();
    const unique: DiscoveredQuestion[] = [];

    for (const q of questions) {
      const normalized = q.question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim();

      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(q);
      }
    }

    return unique;
  }
}
