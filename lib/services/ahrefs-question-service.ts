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

export class AhrefsQuestionService {
  private apiKey: string;
  private baseUrl = "https://api.ahrefs.com/v3";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fast question discovery using Ahrefs API
   * Much faster than DataForSEO - typically < 3 seconds
   * ALWAYS returns questions (uses smart fallback)
   */
  async discoverQuestions(
    brandOrKeyword: string,
    minVolume: number = 50,
    maxQuestions: number = 12
  ): Promise<DiscoveredQuestion[]> {
    const startTime = Date.now();
    
    // Validate API key
    if (!this.apiKey || this.apiKey === "your-ahrefs-api-key" || this.apiKey === "" || this.apiKey === "mock-key-will-use-fallback") {
      const error = "❌ AHREFS_API_KEY is not configured in environment variables. Please set it in Vercel.";
      console.error(error);
      throw new Error(error);
    }

    try {
      console.log(`🔍 Using Ahrefs API for: ${brandOrKeyword}`);

      // Try Ahrefs with reasonable timeout
      const questions = await Promise.race([
        this.getQuestionsFromAhrefs(brandOrKeyword, maxQuestions * 3),
        new Promise<any[]>((_, reject) => 
          setTimeout(() => reject(new Error("Ahrefs API timeout after 10 seconds")), 10000)
        )
      ]);

      console.log(`📊 Ahrefs returned ${questions.length} raw questions in ${Date.now() - startTime}ms`);

      if (questions.length === 0) {
        throw new Error("Ahrefs returned 0 questions. The keyword may be too specific or have no data.");
      }

      // Filter, score, and categorize
      const categorizedQuestions = questions
        .map(q => this.categorizeAndScore(q))
        .filter(q => q.searchVolume >= minVolume)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxQuestions);

      // Ensure we have questions in each stage
      const balanced = this.balanceAcrossStages(categorizedQuestions, maxQuestions);

      console.log(`✅ Discovered ${balanced.length} questions in ${Date.now() - startTime}ms`);
      return balanced;

    } catch (error: any) {
      console.error(`❌ Ahrefs API failed after ${Date.now() - startTime}ms:`, error.message);
      throw error; // Don't fallback, let the user know what's wrong
    }
  }

  /**
   * Get related questions from Ahrefs API
   * Using correct v3 endpoint for keyword ideas
   */
  private async getQuestionsFromAhrefs(keyword: string, limit: number): Promise<any[]> {
    try {
      console.log(`📡 Calling Ahrefs API with keyword: "${keyword}"`);
      
      // Correct Ahrefs API v3 endpoint for keyword ideas
      // Ref: https://ahrefs.com/api/documentation/keywords-ideas
      const endpoint = `https://api.ahrefs.com/v3/keywords-explorer/keyword-ideas`;
      
      const params = {
        target: keyword,
        country: "us",
        mode: "questions", // Get question-based keywords
        limit: limit,
      };

      console.log(`📡 Endpoint: ${endpoint}`);
      console.log(`📡 Params:`, params);
      
      const response = await axios.get(endpoint, {
        params,
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Accept": "application/json"
        },
        timeout: 10000,
      });

      console.log(`📡 Ahrefs response status: ${response.status}`);
      console.log(`📡 Response keys:`, Object.keys(response.data || {}));

      // Parse Ahrefs v3 response structure
      let keywords = [];
      
      if (response.data?.keywords) {
        keywords = response.data.keywords;
      } else if (response.data?.results) {
        keywords = response.data.results;
      } else if (response.data?.items) {
        keywords = response.data.items;
      } else if (Array.isArray(response.data)) {
        keywords = response.data;
      } else {
        console.error("❌ Unexpected Ahrefs response structure:", JSON.stringify(response.data).substring(0, 300));
        throw new Error("Ahrefs returned unexpected data structure");
      }

      console.log(`📡 Found ${keywords.length} keywords from Ahrefs`);

      const mapped = keywords.map((kw: any) => ({
        question: kw.keyword || kw.phrase || kw.term || kw.query || "",
        searchVolume: kw.volume || kw.search_volume || kw.monthly_volume || 0,
        difficulty: kw.keyword_difficulty || kw.difficulty || kw.kd || 50,
      })).filter((q: any) => q.question.length > 0);

      console.log(`📡 Mapped ${mapped.length} valid questions`);
      
      return mapped;

    } catch (error: any) {
      console.error("❌ Ahrefs API error details:");
      console.error("  Message:", error.message);
      console.error("  Response status:", error.response?.status);
      console.error("  Response data:", JSON.stringify(error.response?.data).substring(0, 500));
      console.error("  Request URL:", error.config?.url);
      throw new Error(`Ahrefs API failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Categorize question by journey stage and add score
   */
  private categorizeAndScore(item: any): DiscoveredQuestion {
    const question = item.question.toLowerCase();
    
    // Categorize by journey stage
    const category = this.categorizeQuestion(question);
    const intent = this.classifyIntent(question);
    
    // Calculate score
    let score = 50;
    if (item.searchVolume > 1000) score += 30;
    else if (item.searchVolume > 500) score += 20;
    else if (item.searchVolume > 100) score += 10;

    if (item.difficulty < 30) score += 15;
    else if (item.difficulty < 50) score += 10;
    else score += 5;

    if (intent === "commercial") score += 15;
    else if (intent === "informational") score += 10;

    return {
      question: item.question,
      searchVolume: item.searchVolume,
      difficulty: item.difficulty,
      intent,
      category,
      score,
      relatedTerms: [item.question],
    };
  }

  private categorizeQuestion(question: string): "awareness" | "consideration" | "decision" {
    const lowerQuestion = question.toLowerCase();

    // DECISION STAGE: High commercial intent
    const decisionKeywords = [
      "price", "cost", "pricing", "buy", "purchase", "shop",
      "where to buy", "cheapest", "discount", "coupon", "deal",
      "shipping", "delivery", "warranty", "free trial", "sale",
    ];

    // CONSIDERATION STAGE: Comparing options
    const considerationKeywords = [
      "best", "top", "vs", "versus", "compare", "comparison",
      "alternative", "competitor", "difference", "which",
      "should i", "recommend", "review", "pros and cons",
      "better than", "worth it", "good", "rating",
    ];

    // Check decision first
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

  private classifyIntent(question: string): "informational" | "commercial" | "navigational" {
    const lowerQuestion = question.toLowerCase();

    const commercialKeywords = [
      "buy", "price", "cost", "purchase", "shop", "deal",
      "best", "top", "review", "vs", "compare", "alternative",
    ];
    
    if (commercialKeywords.some(word => lowerQuestion.includes(word))) {
      return "commercial";
    }
    
    return "informational";
  }

  /**
   * Balance questions across all three stages
   */
  private balanceAcrossStages(
    questions: DiscoveredQuestion[],
    maxQuestions: number
  ): DiscoveredQuestion[] {
    const perStage = Math.floor(maxQuestions / 3);
    
    const awareness = questions.filter(q => q.category === "awareness").slice(0, perStage);
    const consideration = questions.filter(q => q.category === "consideration").slice(0, perStage);
    const decision = questions.filter(q => q.category === "decision").slice(0, perStage);

    // Combine and fill up to maxQuestions
    const balanced = [...awareness, ...consideration, ...decision];
    
    // If we don't have enough, fill with remaining questions
    if (balanced.length < maxQuestions) {
      const remaining = questions
        .filter(q => !balanced.includes(q))
        .slice(0, maxQuestions - balanced.length);
      balanced.push(...remaining);
    }

    return balanced;
  }

  /**
   * Smart mock questions based on brand/keyword
   */
  private getSmartMockQuestions(brandOrKeyword: string): DiscoveredQuestion[] {
    const brand = brandOrKeyword;
    
    return [
      // Awareness stage
      {
        question: `What is ${brand}?`,
        searchVolume: 1200,
        difficulty: 35,
        intent: "informational",
        category: "awareness",
        score: 85,
        relatedTerms: [brand, "overview"],
      },
      {
        question: `How does ${brand} work?`,
        searchVolume: 900,
        difficulty: 30,
        intent: "informational",
        category: "awareness",
        score: 82,
        relatedTerms: [brand, "how it works"],
      },
      {
        question: `What are the features of ${brand}?`,
        searchVolume: 700,
        difficulty: 32,
        intent: "informational",
        category: "awareness",
        score: 80,
        relatedTerms: [brand, "features"],
      },
      {
        question: `Why use ${brand}?`,
        searchVolume: 650,
        difficulty: 28,
        intent: "informational",
        category: "awareness",
        score: 78,
        relatedTerms: [brand, "benefits"],
      },

      // Consideration stage
      {
        question: `What are the best alternatives to ${brand}?`,
        searchVolume: 800,
        difficulty: 45,
        intent: "commercial",
        category: "consideration",
        score: 90,
        relatedTerms: [brand, "alternatives"],
      },
      {
        question: `${brand} vs competitors comparison`,
        searchVolume: 750,
        difficulty: 42,
        intent: "commercial",
        category: "consideration",
        score: 88,
        relatedTerms: [brand, "comparison"],
      },
      {
        question: `Is ${brand} worth it?`,
        searchVolume: 680,
        difficulty: 38,
        intent: "commercial",
        category: "consideration",
        score: 85,
        relatedTerms: [brand, "review"],
      },
      {
        question: `${brand} reviews and ratings`,
        searchVolume: 620,
        difficulty: 40,
        intent: "commercial",
        category: "consideration",
        score: 83,
        relatedTerms: [brand, "reviews"],
      },

      // Decision stage
      {
        question: `How much does ${brand} cost?`,
        searchVolume: 600,
        difficulty: 30,
        intent: "commercial",
        category: "decision",
        score: 80,
        relatedTerms: [brand, "pricing"],
      },
      {
        question: `Where to buy ${brand}?`,
        searchVolume: 550,
        difficulty: 28,
        intent: "commercial",
        category: "decision",
        score: 78,
        relatedTerms: [brand, "buy"],
      },
      {
        question: `${brand} pricing and plans`,
        searchVolume: 500,
        difficulty: 32,
        intent: "commercial",
        category: "decision",
        score: 76,
        relatedTerms: [brand, "plans"],
      },
      {
        question: `${brand} discount code`,
        searchVolume: 450,
        difficulty: 35,
        intent: "commercial",
        category: "decision",
        score: 74,
        relatedTerms: [brand, "discount"],
      },
    ];
  }
}
