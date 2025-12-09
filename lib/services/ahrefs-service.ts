/**
 * Ahrefs API Service
 * Gets REAL questions with search volume data
 */

export interface AhrefsQuestion {
  question: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  category: "awareness" | "consideration" | "decision";
  type: "brand" | "category";
}

export class AhrefsService {
  private apiKey: string;
  private baseUrl = "https://api.ahrefs.com/v3";
  private timeout = 10000; // 10 second timeout

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get questions for a brand with search volumes
   */
  async getBrandQuestions(brandName: string, limit: number = 20): Promise<AhrefsQuestion[]> {
    console.log(`🔍 [AHREFS] Fetching brand questions for: ${brandName}`);
    
    try {
      const questions = await this.fetchQuestions(brandName, limit);
      return questions.map(q => ({ ...q, type: "brand" as const }));
    } catch (error: any) {
      console.error(`❌ [AHREFS] Brand questions failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get questions for a category/vertical with search volumes
   */
  async getCategoryQuestions(category: string, limit: number = 20): Promise<AhrefsQuestion[]> {
    console.log(`🔍 [AHREFS] Fetching category questions for: ${category}`);
    
    try {
      const questions = await this.fetchQuestions(category, limit);
      return questions.map(q => ({ ...q, type: "category" as const }));
    } catch (error: any) {
      console.error(`❌ [AHREFS] Category questions failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch questions from Ahrefs API
   */
  private async fetchQuestions(keyword: string, limit: number): Promise<Omit<AhrefsQuestion, 'type'>[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Try the questions endpoint first
      const response = await fetch(
        `${this.baseUrl}/keywords-explorer/questions?` + new URLSearchParams({
          select: 'keyword,volume,keyword_difficulty,cpc',
          target: keyword,
          country: 'us',
          limit: String(limit),
          output: 'json'
        }),
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try alternative endpoint
        return await this.fetchKeywordIdeas(keyword, limit);
      }

      const data = await response.json();
      return this.parseAhrefsResponse(data);
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Ahrefs API timeout');
      }
      
      // Try alternative endpoint on error
      return await this.fetchKeywordIdeas(keyword, limit);
    }
  }

  /**
   * Alternative: Fetch keyword ideas and filter for questions
   */
  private async fetchKeywordIdeas(keyword: string, limit: number): Promise<Omit<AhrefsQuestion, 'type'>[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(
        `${this.baseUrl}/keywords-explorer/keyword-ideas?` + new URLSearchParams({
          select: 'keyword,volume,keyword_difficulty,cpc',
          target: keyword,
          country: 'us',
          limit: String(limit * 2), // Get more to filter
          output: 'json'
        }),
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ahrefs API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const allKeywords = this.parseAhrefsResponse(data);
      
      // Filter for question-like keywords
      return allKeywords.filter(k => this.isQuestion(k.question));
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Parse Ahrefs API response
   */
  private parseAhrefsResponse(data: any): Omit<AhrefsQuestion, 'type'>[] {
    const keywords = data?.keywords || data?.results || data?.items || [];
    
    if (!Array.isArray(keywords)) {
      console.warn('[AHREFS] Unexpected response format:', JSON.stringify(data).substring(0, 200));
      return [];
    }

    return keywords
      .filter((k: any) => k.volume > 0)
      .map((k: any) => ({
        question: k.keyword || k.phrase || k.term || '',
        searchVolume: k.volume || k.search_volume || 0,
        difficulty: k.keyword_difficulty || k.difficulty || k.kd || 50,
        cpc: k.cpc || 0,
        category: this.categorizeQuestion(k.keyword || ''),
      }))
      .filter((q: any) => q.question.length > 0);
  }

  /**
   * Check if a keyword is a question
   */
  private isQuestion(text: string): boolean {
    const lower = text.toLowerCase();
    const questionWords = ['what', 'why', 'how', 'which', 'where', 'when', 'who', 'is', 'are', 'can', 'does', 'do', 'should', 'best', 'top', 'vs', 'versus', 'review', 'compare'];
    return questionWords.some(w => lower.includes(w)) || lower.includes('?');
  }

  /**
   * Categorize question into funnel stage
   */
  private categorizeQuestion(question: string): "awareness" | "consideration" | "decision" {
    const lower = question.toLowerCase();

    // Decision stage keywords
    const decisionKeywords = ['buy', 'price', 'cost', 'discount', 'coupon', 'deal', 'where to', 'shop', 'order', 'purchase', 'cheap', 'affordable', 'sale'];
    if (decisionKeywords.some(k => lower.includes(k))) {
      return 'decision';
    }

    // Consideration stage keywords
    const considerationKeywords = ['vs', 'versus', 'compare', 'comparison', 'review', 'best', 'top', 'alternative', 'pros', 'cons', 'worth', 'better', 'difference'];
    if (considerationKeywords.some(k => lower.includes(k))) {
      return 'consideration';
    }

    // Default to awareness
    return 'awareness';
  }
}
