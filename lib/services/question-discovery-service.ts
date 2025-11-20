import { DataForSEOService } from "./dataforseo-service";

export interface DiscoveredQuestion {
  question: string;
  searchVolume: number;
  difficulty?: number;
  commercialIntent: "high" | "medium" | "low";
  category?: string;
}

export class QuestionDiscoveryService {
  private dataForSEO: DataForSEOService;

  constructor(login: string, password: string) {
    this.dataForSEO = new DataForSEOService(login, password);
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
      // Step 1: Get related keywords and questions
      const relatedKeywords = await this.dataForSEO.getKeywordSuggestions(
        brandOrKeyword,
        "United States",
        200
      );

      // Step 2: Get "People Also Ask" questions
      const paaQuestions = await this.dataForSEO.getRelatedQuestions(
        brandOrKeyword,
        "United States",
        100
      );

      // Step 3: Get commercial intent questions
      const commercialQuestions = await this.dataForSEO.getCommercialQuestions(
        [brandOrKeyword],
        "United States"
      );

      // Combine all questions
      const allQuestions: DiscoveredQuestion[] = [];

      // Add PAA questions
      paaQuestions.forEach((q) => {
        if (q.volume >= minVolume) {
          allQuestions.push({
            question: q.question,
            searchVolume: q.volume,
            difficulty: q.cpc,
            commercialIntent: this.classifyCommercialIntent(q.question, q.cpc),
            category: this.categorizeQuestion(q.question),
          });
        }
      });

      // Add commercial questions
      commercialQuestions.forEach((q) => {
        if (q.volume >= minVolume) {
          allQuestions.push({
            question: q.question,
            searchVolume: q.volume,
            difficulty: q.cpc,
            commercialIntent: "high",
            category: this.categorizeQuestion(q.question),
          });
        }
      });

      // Remove duplicates
      const uniqueQuestions = this.deduplicateQuestions(allQuestions);

      // Sort by search volume * commercial intent score
      const scored = uniqueQuestions.map((q) => ({
        ...q,
        score: this.calculateQuestionScore(q),
      }));

      scored.sort((a, b) => b.score - a.score);

      // Return top questions
      return scored.slice(0, maxQuestions).map(({ score, ...q }) => q);
    } catch (error) {
      console.error("Error discovering questions:", error);
      throw new Error("Failed to discover questions");
    }
  }

  /**
   * Classify commercial intent based on keywords and CPC
   */
  private classifyCommercialIntent(
    question: string,
    cpc?: number
  ): "high" | "medium" | "low" {
    const highIntentKeywords = [
      "best",
      "top",
      "buy",
      "purchase",
      "price",
      "cost",
      "review",
      "vs",
      "versus",
      "compare",
      "alternative",
      "which",
      "should i",
      "recommend",
    ];

    const lowIntentKeywords = [
      "what is",
      "how to",
      "tutorial",
      "guide",
      "meaning",
      "definition",
      "history",
    ];

    const lowerQuestion = question.toLowerCase();

    // Check high intent
    const hasHighIntent = highIntentKeywords.some((kw) =>
      lowerQuestion.includes(kw)
    );

    // Check low intent
    const hasLowIntent = lowIntentKeywords.some((kw) =>
      lowerQuestion.includes(kw)
    );

    // CPC-based classification
    if (cpc && cpc > 2) return "high";
    if (cpc && cpc > 0.5 && hasHighIntent) return "high";
    if (cpc && cpc > 0.5) return "medium";

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
      price: [
        "price",
        "cost",
        "budget",
        "cheap",
        "affordable",
        "expensive",
        "value",
      ],
      innovation: [
        "innovative",
        "technology",
        "latest",
        "cutting-edge",
        "advanced",
        "new",
      ],
      sustainability: [
        "sustainable",
        "eco",
        "green",
        "environment",
        "recycled",
      ],
      durability: ["durable", "lasting", "quality", "reliable", "lifespan"],
      comfort: ["comfortable", "comfort", "cushion", "support", "fit"],
      professional: [
        "professional",
        "athlete",
        "expert",
        "serious",
        "competitive",
      ],
    };

    const lowerQuestion = question.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((kw) => lowerQuestion.includes(kw))) {
        return category;
      }
    }

    return "general";
  }

  /**
   * Calculate question score (volume * intent multiplier)
   */
  private calculateQuestionScore(question: DiscoveredQuestion): number {
    const intentMultiplier = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return (
      question.searchVolume * intentMultiplier[question.commercialIntent]
    );
  }

  /**
   * Remove duplicate or very similar questions
   */
  private deduplicateQuestions(
    questions: DiscoveredQuestion[]
  ): DiscoveredQuestion[] {
    const seen = new Set<string>();
    const unique: DiscoveredQuestion[] = [];

    for (const q of questions) {
      // Normalize question for comparison
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
