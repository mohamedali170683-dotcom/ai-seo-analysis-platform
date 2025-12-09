/**
 * Ahrefs API Service
 * Gets REAL questions with search volume data
 * 
 * API Docs: https://docs.ahrefs.com/docs/api
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
    console.log(`🔑 [AHREFS] Initialized with key: ${apiKey.substring(0, 15)}...`);
  }

  /**
   * Get questions for a brand with search volumes
   */
  async getBrandQuestions(brandName: string, limit: number = 20): Promise<AhrefsQuestion[]> {
    console.log(`🔍 [AHREFS] Fetching brand questions for: ${brandName}`);
    
    try {
      const questions = await this.fetchKeywordData(brandName, limit);
      console.log(`✅ [AHREFS] Got ${questions.length} brand questions`);
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
      const questions = await this.fetchKeywordData(category, limit);
      console.log(`✅ [AHREFS] Got ${questions.length} category questions`);
      return questions.map(q => ({ ...q, type: "category" as const }));
    } catch (error: any) {
      console.error(`❌ [AHREFS] Category questions failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch keyword data from Ahrefs Keywords Explorer API
   * Docs: https://docs.ahrefs.com/docs/keywords-explorer-overview
   */
  private async fetchKeywordData(keyword: string, limit: number): Promise<Omit<AhrefsQuestion, 'type'>[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Try keyword suggestions endpoint
    const params = new URLSearchParams({
      target: keyword,
      country: 'us',
      select: 'keyword,volume,keyword_difficulty,cpc',
      limit: String(limit),
      output: 'json',
    });

    const url = `${this.baseUrl}/keywords-explorer/related-terms?${params}`;
    console.log(`📡 [AHREFS] Calling: ${url.replace(this.apiKey, '***')}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📡 [AHREFS] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [AHREFS] Error response: ${errorText.substring(0, 500)}`);
        throw new Error(`Ahrefs API error ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      console.log(`📡 [AHREFS] Response data keys: ${Object.keys(data || {}).join(', ')}`);

      return this.parseResponse(data);
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error(`❌ [AHREFS] Request timed out after ${this.timeout}ms`);
        throw new Error('Ahrefs API timeout');
      }
      throw error;
    }
  }

  /**
   * Parse Ahrefs API response
   */
  private parseResponse(data: any): Omit<AhrefsQuestion, 'type'>[] {
    // Ahrefs v3 response structure
    // Could be: { keywords: [...] } or { terms: [...] } or just [...]
    let keywords: any[] = [];

    if (Array.isArray(data)) {
      keywords = data;
    } else if (data?.keywords) {
      keywords = data.keywords;
    } else if (data?.terms) {
      keywords = data.terms;
    } else if (data?.results) {
      keywords = data.results;
    } else if (data?.items) {
      keywords = data.items;
    }

    console.log(`📡 [AHREFS] Parsing ${keywords.length} keywords`);

    if (!Array.isArray(keywords) || keywords.length === 0) {
      console.warn(`⚠️ [AHREFS] No keywords found in response`);
      return [];
    }

    // Filter for question-like keywords
    const questions = keywords
      .filter((k: any) => {
        const kw = (k.keyword || k.phrase || k.term || '').toLowerCase();
        return this.isQuestion(kw) && (k.volume || k.search_volume || 0) > 0;
      })
      .map((k: any) => ({
        question: k.keyword || k.phrase || k.term || '',
        searchVolume: k.volume || k.search_volume || 0,
        difficulty: k.keyword_difficulty || k.difficulty || k.kd || 50,
        cpc: k.cpc || 0,
        category: this.categorizeQuestion(k.keyword || ''),
      }))
      .sort((a: any, b: any) => b.searchVolume - a.searchVolume);

    console.log(`📡 [AHREFS] Found ${questions.length} questions after filtering`);
    return questions;
  }

  /**
   * Check if a keyword is a question
   */
  private isQuestion(text: string): boolean {
    const lower = text.toLowerCase();
    const questionWords = ['what', 'why', 'how', 'which', 'where', 'when', 'who', 'is', 'are', 'can', 'does', 'do', 'should', 'best', 'top', 'vs', 'versus', 'review', 'compare', 'difference'];
    return questionWords.some(w => lower.includes(w)) || lower.includes('?');
  }

  /**
   * Categorize question into funnel stage
   */
  private categorizeQuestion(question: string): "awareness" | "consideration" | "decision" {
    const lower = question.toLowerCase();

    // Decision stage keywords
    const decisionKeywords = ['buy', 'price', 'cost', 'discount', 'coupon', 'deal', 'where to', 'shop', 'order', 'purchase', 'cheap', 'affordable', 'sale', 'near me'];
    if (decisionKeywords.some(k => lower.includes(k))) {
      return 'decision';
    }

    // Consideration stage keywords  
    const considerationKeywords = ['vs', 'versus', 'compare', 'comparison', 'review', 'best', 'top', 'alternative', 'pros', 'cons', 'worth', 'better', 'difference', 'rating'];
    if (considerationKeywords.some(k => lower.includes(k))) {
      return 'consideration';
    }

    // Default to awareness
    return 'awareness';
  }
}
