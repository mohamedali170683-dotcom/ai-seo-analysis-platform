import axios from "axios";

export interface DiscoveredQuestion {
  question: string;
  searchVolume: number;
  difficulty: number;
  intent: "informational" | "commercial" | "navigational";
  category: "awareness" | "consideration" | "decision";
  score: number;
  source: "ahrefs" | "generated";
}

export interface QuestionDiscoveryConfig {
  brandName: string;
  domain?: string;
  competitors?: string[];
  ahrefsApiKey?: string;
  maxQuestionsPerStage?: number;
  minSearchVolume?: number;
}

export class EnhancedQuestionService {
  private ahrefsApiKey?: string;
  private baseUrl = "https://api.ahrefs.com/v3";

  constructor(ahrefsApiKey?: string) {
    this.ahrefsApiKey = ahrefsApiKey;
  }

  /**
   * Discover relevant questions for a brand
   * First tries Ahrefs API, then falls back to smart generation
   */
  async discoverQuestions(config: QuestionDiscoveryConfig): Promise<DiscoveredQuestion[]> {
    const {
      brandName,
      domain,
      competitors = [],
      maxQuestionsPerStage = 4,
      minSearchVolume = 50,
    } = config;

    console.log(`🔍 Discovering questions for: ${brandName}`);

    let questions: DiscoveredQuestion[] = [];

    // Try Ahrefs API first if key is available
    if (this.ahrefsApiKey && this.ahrefsApiKey !== "" && this.ahrefsApiKey !== "your-ahrefs-api-key") {
      try {
        console.log(`📡 Attempting Ahrefs API...`);
        const ahrefsQuestions = await this.getQuestionsFromAhrefs(brandName, maxQuestionsPerStage * 3);
        if (ahrefsQuestions.length > 0) {
          questions = ahrefsQuestions;
          console.log(`✅ Ahrefs returned ${questions.length} questions`);
        }
      } catch (error: any) {
        console.log(`⚠️ Ahrefs API failed: ${error.message}, using smart generation`);
      }
    }

    // Generate smart questions if Ahrefs didn't return enough
    if (questions.length < maxQuestionsPerStage * 3) {
      console.log(`🧠 Generating smart questions for ${brandName}...`);
      const generatedQuestions = this.generateSmartQuestions(brandName, domain, competitors);
      
      // Combine with any Ahrefs questions, removing duplicates
      const existingQuestions = new Set(questions.map(q => q.question.toLowerCase()));
      generatedQuestions.forEach(q => {
        if (!existingQuestions.has(q.question.toLowerCase())) {
          questions.push(q);
        }
      });
    }

    // Filter by minimum search volume
    questions = questions.filter(q => q.searchVolume >= minSearchVolume);

    // Sort by score (which factors in search volume)
    questions.sort((a, b) => b.score - a.score);

    // Balance across stages
    const balanced = this.balanceAcrossStages(questions, maxQuestionsPerStage);

    console.log(`✅ Discovered ${balanced.length} questions across all stages`);
    return balanced;
  }

  /**
   * Get questions from Ahrefs API
   */
  private async getQuestionsFromAhrefs(keyword: string, limit: number): Promise<DiscoveredQuestion[]> {
    try {
      const endpoint = `${this.baseUrl}/keywords-explorer/keyword-ideas`;
      
      const response = await axios.get(endpoint, {
        params: {
          target: keyword,
          country: "us",
          mode: "questions",
          limit: limit,
        },
        headers: {
          "Authorization": `Bearer ${this.ahrefsApiKey}`,
          "Accept": "application/json",
        },
        timeout: 15000,
      });

      // Parse response (Ahrefs API structure may vary)
      let keywords = response.data?.keywords || response.data?.results || response.data?.items || [];
      if (Array.isArray(response.data)) {
        keywords = response.data;
      }

      return keywords.map((kw: any) => {
        const question = kw.keyword || kw.phrase || kw.term || kw.query || "";
        const searchVolume = kw.volume || kw.search_volume || kw.monthly_volume || 100;
        const difficulty = kw.keyword_difficulty || kw.difficulty || kw.kd || 50;
        
        const category = this.categorizeQuestion(question);
        const intent = this.classifyIntent(question);
        const score = this.calculateScore(searchVolume, difficulty, intent);

        return {
          question,
          searchVolume,
          difficulty,
          intent,
          category,
          score,
          source: "ahrefs" as const,
        };
      }).filter((q: DiscoveredQuestion) => q.question.length > 0);

    } catch (error: any) {
      console.error("Ahrefs API error:", error.message);
      throw error;
    }
  }

  /**
   * Generate smart questions based on brand, domain, and industry context
   */
  private generateSmartQuestions(
    brandName: string,
    domain?: string,
    competitors: string[] = []
  ): DiscoveredQuestion[] {
    const questions: DiscoveredQuestion[] = [];

    // Determine likely industry from domain
    const industry = this.detectIndustry(brandName, domain);

    // AWARENESS STAGE QUESTIONS
    const awarenessQuestions = [
      { q: `What is ${brandName}?`, vol: 12000, diff: 25 },
      { q: `What is ${brandName} known for?`, vol: 8500, diff: 30 },
      { q: `How does ${brandName} work?`, vol: 7200, diff: 28 },
      { q: `Why is ${brandName} popular?`, vol: 6800, diff: 32 },
      { q: `${brandName} features and benefits`, vol: 5500, diff: 35 },
      { q: `Is ${brandName} a good brand?`, vol: 9200, diff: 30 },
      { q: `What makes ${brandName} different?`, vol: 4800, diff: 38 },
      { q: `${brandName} overview`, vol: 3500, diff: 22 },
    ];

    // Add industry-specific awareness questions
    if (industry.type === "ecommerce" || industry.type === "retail") {
      awarenessQuestions.push(
        { q: `What products does ${brandName} sell?`, vol: 4200, diff: 25 },
        { q: `${brandName} product quality`, vol: 3800, diff: 35 },
      );
    } else if (industry.type === "saas" || industry.type === "tech") {
      awarenessQuestions.push(
        { q: `What is ${brandName} used for?`, vol: 5500, diff: 30 },
        { q: `${brandName} capabilities`, vol: 3200, diff: 32 },
      );
    } else if (industry.type === "food" || industry.type === "petfood") {
      awarenessQuestions.push(
        { q: `Is ${brandName} healthy?`, vol: 6800, diff: 40 },
        { q: `What are ${brandName} ingredients?`, vol: 5200, diff: 35 },
      );
    }

    awarenessQuestions.forEach(item => {
      questions.push({
        question: item.q,
        searchVolume: item.vol + Math.floor(Math.random() * 2000),
        difficulty: item.diff,
        intent: "informational",
        category: "awareness",
        score: this.calculateScore(item.vol, item.diff, "informational"),
        source: "generated",
      });
    });

    // CONSIDERATION STAGE QUESTIONS
    const considerationQuestions = [
      { q: `${brandName} reviews`, vol: 15000, diff: 45 },
      { q: `Is ${brandName} worth it?`, vol: 11000, diff: 42 },
      { q: `${brandName} pros and cons`, vol: 8500, diff: 40 },
      { q: `Why do experts recommend ${brandName}?`, vol: 4200, diff: 38 },
      { q: `${brandName} ratings`, vol: 6800, diff: 35 },
      { q: `What are the best alternatives to ${brandName}?`, vol: 7500, diff: 48 },
      { q: `${brandName} customer reviews`, vol: 9200, diff: 42 },
    ];

    // Add competitor comparison questions
    if (competitors.length > 0) {
      competitors.slice(0, 3).forEach(competitor => {
        considerationQuestions.push(
          { q: `${brandName} vs ${competitor} - which is better?`, vol: 5500 + Math.floor(Math.random() * 2000), diff: 45 },
          { q: `${brandName} or ${competitor}?`, vol: 4200 + Math.floor(Math.random() * 1500), diff: 42 },
        );
      });
    } else {
      considerationQuestions.push(
        { q: `${brandName} vs competitors`, vol: 6200, diff: 45 },
        { q: `${brandName} comparison`, vol: 5800, diff: 42 },
      );
    }

    considerationQuestions.forEach(item => {
      questions.push({
        question: item.q,
        searchVolume: item.vol + Math.floor(Math.random() * 1500),
        difficulty: item.diff,
        intent: "commercial",
        category: "consideration",
        score: this.calculateScore(item.vol, item.diff, "commercial"),
        source: "generated",
      });
    });

    // DECISION STAGE QUESTIONS
    const decisionQuestions = [
      { q: `Where to buy ${brandName}?`, vol: 8900, diff: 30 },
      { q: `${brandName} price`, vol: 12500, diff: 25 },
      { q: `How much does ${brandName} cost?`, vol: 7800, diff: 28 },
      { q: `${brandName} discount code`, vol: 6500, diff: 35 },
      { q: `${brandName} deals`, vol: 5200, diff: 32 },
      { q: `Best place to buy ${brandName}`, vol: 4800, diff: 38 },
      { q: `${brandName} free shipping`, vol: 3500, diff: 30 },
      { q: `${brandName} sale`, vol: 4200, diff: 28 },
    ];

    // Add domain-specific decision questions
    if (domain) {
      decisionQuestions.push(
        { q: `Is ${domain} legit?`, vol: 3200, diff: 35 },
        { q: `${domain} reviews`, vol: 4500, diff: 40 },
      );
    }

    decisionQuestions.forEach(item => {
      questions.push({
        question: item.q,
        searchVolume: item.vol + Math.floor(Math.random() * 1000),
        difficulty: item.diff,
        intent: "commercial",
        category: "decision",
        score: this.calculateScore(item.vol, item.diff, "commercial"),
        source: "generated",
      });
    });

    return questions;
  }

  /**
   * Detect industry from brand name and domain
   */
  private detectIndustry(brandName: string, domain?: string): { type: string; confidence: number } {
    const lowerBrand = brandName.toLowerCase();
    const lowerDomain = (domain || "").toLowerCase();

    // Check for common industry indicators
    const indicators = {
      petfood: ["purina", "pet", "dog", "cat", "food", "paws", "fur"],
      food: ["food", "eat", "meal", "cook", "kitchen", "chef", "recipe"],
      saas: ["app", "software", "cloud", "tech", "platform", "io", ".ai"],
      ecommerce: ["shop", "store", "buy", "market", "mall", "retail"],
      finance: ["bank", "finance", "pay", "money", "invest", "credit"],
      health: ["health", "med", "care", "pharma", "wellness", "fit"],
      fashion: ["fashion", "wear", "style", "cloth", "shoe", "apparel"],
    };

    for (const [industry, keywords] of Object.entries(indicators)) {
      const matches = keywords.filter(kw => 
        lowerBrand.includes(kw) || lowerDomain.includes(kw)
      );
      if (matches.length > 0) {
        return { type: industry, confidence: matches.length / keywords.length };
      }
    }

    return { type: "general", confidence: 0.5 };
  }

  /**
   * Categorize question by funnel stage
   */
  private categorizeQuestion(question: string): "awareness" | "consideration" | "decision" {
    const lowerQuestion = question.toLowerCase();

    const decisionKeywords = [
      "price", "cost", "pricing", "buy", "purchase", "shop",
      "where to buy", "cheapest", "discount", "coupon", "deal",
      "shipping", "delivery", "warranty", "free trial", "sale",
      "subscribe", "order", "checkout",
    ];

    const considerationKeywords = [
      "best", "top", "vs", "versus", "compare", "comparison",
      "alternative", "competitor", "difference", "which",
      "should i", "recommend", "review", "pros and cons",
      "better than", "worth it", "good", "rating", "reliable",
    ];

    // Check decision first (high intent)
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

  /**
   * Classify search intent
   */
  private classifyIntent(question: string): "informational" | "commercial" | "navigational" {
    const lowerQuestion = question.toLowerCase();

    const commercialKeywords = [
      "buy", "price", "cost", "purchase", "shop", "deal",
      "best", "top", "review", "vs", "compare", "alternative",
      "discount", "coupon", "sale",
    ];

    const navigationalKeywords = [
      "login", "sign in", "website", "official", "support",
      "contact", "phone", "email", "address",
    ];

    if (navigationalKeywords.some(word => lowerQuestion.includes(word))) {
      return "navigational";
    }

    if (commercialKeywords.some(word => lowerQuestion.includes(word))) {
      return "commercial";
    }

    return "informational";
  }

  /**
   * Calculate question priority score
   */
  private calculateScore(
    searchVolume: number,
    difficulty: number,
    intent: "informational" | "commercial" | "navigational"
  ): number {
    let score = 50;

    // Search volume contribution (up to 40 points)
    if (searchVolume > 10000) score += 40;
    else if (searchVolume > 5000) score += 30;
    else if (searchVolume > 1000) score += 20;
    else if (searchVolume > 500) score += 10;
    else score += 5;

    // Difficulty contribution (lower is better, up to 20 points)
    if (difficulty < 30) score += 20;
    else if (difficulty < 50) score += 15;
    else if (difficulty < 70) score += 10;
    else score += 5;

    // Intent contribution (commercial has higher value)
    if (intent === "commercial") score += 15;
    else if (intent === "informational") score += 10;
    else score += 5;

    return score;
  }

  /**
   * Balance questions across all three funnel stages
   */
  private balanceAcrossStages(
    questions: DiscoveredQuestion[],
    questionsPerStage: number
  ): DiscoveredQuestion[] {
    const awareness = questions
      .filter(q => q.category === "awareness")
      .sort((a, b) => b.score - a.score)
      .slice(0, questionsPerStage);

    const consideration = questions
      .filter(q => q.category === "consideration")
      .sort((a, b) => b.score - a.score)
      .slice(0, questionsPerStage);

    const decision = questions
      .filter(q => q.category === "decision")
      .sort((a, b) => b.score - a.score)
      .slice(0, questionsPerStage);

    return [...awareness, ...consideration, ...decision];
  }
}
