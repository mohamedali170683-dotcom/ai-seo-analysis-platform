/**
 * DataForSEO API Service
 * Gets REAL questions with search volume data
 * 
 * API Docs: https://docs.dataforseo.com/v3/keywords_data/google/keyword_ideas/live/
 * Pricing: ~$0.0006 per keyword (very affordable)
 */

export interface DataForSEOQuestion {
  question: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  category: "awareness" | "consideration" | "decision";
  type: "brand" | "category";
}

export class DataForSEOService {
  private login: string;
  private password: string;
  private baseUrl = "https://api.dataforseo.com/v3";
  private timeout = 15000; // 15 second timeout

  constructor(login: string, password: string) {
    this.login = login;
    this.password = password;
    console.log(`🔑 [DATAFORSEO] Initialized with login: ${login}`);
  }

  /**
   * Get questions for a brand with search volumes
   * Set questionsOnly=false to get all keywords (useful for debugging)
   */
  async getBrandQuestions(brandName: string, limit: number = 20, questionsOnly: boolean = false): Promise<DataForSEOQuestion[]> {
    console.log(`🔍 [DATAFORSEO] Fetching brand keywords for: ${brandName} (questionsOnly=${questionsOnly})`);
    
    try {
      const questions = await this.fetchKeywordIdeas(brandName, limit, questionsOnly);
      console.log(`✅ [DATAFORSEO] Got ${questions.length} keywords`);
      return questions.map(q => ({ ...q, type: "brand" as const }));
    } catch (error: any) {
      console.error(`❌ [DATAFORSEO] Brand questions failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get questions for a category/vertical with search volumes
   */
  async getCategoryQuestions(category: string, limit: number = 20): Promise<DataForSEOQuestion[]> {
    console.log(`🔍 [DATAFORSEO] Fetching category questions for: ${category}`);
    
    try {
      const questions = await this.fetchKeywordIdeas(category, limit, true);
      console.log(`✅ [DATAFORSEO] Got ${questions.length} category questions`);
      return questions.map(q => ({ ...q, type: "category" as const }));
    } catch (error: any) {
      console.error(`❌ [DATAFORSEO] Category questions failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch keyword ideas from DataForSEO
   * Docs: https://docs.dataforseo.com/v3/keywords_data/google/keyword_ideas/live/
   */
  private async fetchKeywordIdeas(
    keyword: string, 
    limit: number,
    questionsOnly: boolean = true
  ): Promise<Omit<DataForSEOQuestion, 'type'>[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Prepare request body
    const requestBody = [{
      keyword: keyword,
      location_code: 2840, // United States
      language_code: "en",
      include_serp_info: false,
      include_seed_keyword: true,
      limit: limit * 2, // Get more to filter
    }];

    const auth = Buffer.from(`${this.login}:${this.password}`).toString('base64');
    const url = `${this.baseUrl}/keywords_data/google/keyword_ideas/live`;
    
    console.log(`📡 [DATAFORSEO] Calling keyword ideas API for: ${keyword}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📡 [DATAFORSEO] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [DATAFORSEO] Error: ${errorText.substring(0, 500)}`);
        throw new Error(`DataForSEO API error ${response.status}`);
      }

      const data = await response.json();
      
      // Log the full response structure for debugging
      console.log(`📡 [DATAFORSEO] Response status_code: ${data.status_code}`);
      console.log(`📡 [DATAFORSEO] Response status_message: ${data.status_message}`);
      console.log(`📡 [DATAFORSEO] Tasks count: ${data.tasks?.length || 0}`);
      
      if (data.status_code !== 20000) {
        console.error(`❌ [DATAFORSEO] API error: ${data.status_message}`);
        // Log the full response for debugging
        console.error(`❌ [DATAFORSEO] Full response: ${JSON.stringify(data).substring(0, 1000)}`);
        throw new Error(data.status_message || 'DataForSEO API error');
      }

      if (data.tasks && data.tasks.length > 0) {
        const task = data.tasks[0];
        console.log(`📡 [DATAFORSEO] Task status: ${task.status_code} - ${task.status_message}`);
        console.log(`📡 [DATAFORSEO] Task result count: ${task.result?.length || 0}`);
        if (task.result && task.result.length > 0) {
          console.log(`📡 [DATAFORSEO] Items count: ${task.result[0]?.items?.length || 0}`);
        }
      }

      return this.parseResponse(data, questionsOnly, limit);
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error(`❌ [DATAFORSEO] Request timed out after ${this.timeout}ms`);
        throw new Error('DataForSEO API timeout');
      }
      throw error;
    }
  }

  /**
   * Parse DataForSEO API response
   */
  private parseResponse(
    data: any, 
    questionsOnly: boolean,
    limit: number
  ): Omit<DataForSEOQuestion, 'type'>[] {
    const tasks = data?.tasks || [];
    if (tasks.length === 0) {
      console.warn(`⚠️ [DATAFORSEO] No tasks in response`);
      return [];
    }

    const result = tasks[0]?.result || [];
    if (result.length === 0) {
      console.warn(`⚠️ [DATAFORSEO] No results in task`);
      return [];
    }

    // Get keyword ideas
    let keywords = result[0]?.items || [];
    console.log(`📡 [DATAFORSEO] Found ${keywords.length} total keywords`);

    // Filter for questions if needed
    if (questionsOnly) {
      keywords = keywords.filter((k: any) => this.isQuestion(k.keyword || ''));
      console.log(`📡 [DATAFORSEO] Filtered to ${keywords.length} questions`);
    }

    // Parse and sort by volume
    const questions = keywords
      .filter((k: any) => (k.keyword_info?.search_volume || 0) > 0)
      .map((k: any) => ({
        question: k.keyword || '',
        searchVolume: k.keyword_info?.search_volume || 0,
        difficulty: k.keyword_info?.keyword_difficulty || k.keyword_properties?.keyword_difficulty || 50,
        cpc: k.keyword_info?.cpc || 0,
        competition: k.keyword_info?.competition || 0,
        category: this.categorizeQuestion(k.keyword || ''),
      }))
      .sort((a: any, b: any) => b.searchVolume - a.searchVolume)
      .slice(0, limit);

    console.log(`📡 [DATAFORSEO] Returning ${questions.length} questions with volumes`);
    if (questions.length > 0) {
      console.log(`📡 [DATAFORSEO] Top question: "${questions[0].question}" (${questions[0].searchVolume} vol)`);
    }

    return questions;
  }

  /**
   * Check if a keyword is a question
   */
  private isQuestion(text: string): boolean {
    const lower = text.toLowerCase();
    const questionWords = [
      'what', 'why', 'how', 'which', 'where', 'when', 'who', 
      'is', 'are', 'can', 'does', 'do', 'should', 'will', 'would',
      'best', 'top', 'vs', 'versus', 'review', 'compare', 'difference',
      'pros', 'cons', 'worth', 'good', 'bad'
    ];
    return questionWords.some(w => lower.includes(w)) || lower.includes('?');
  }

  /**
   * Categorize question into funnel stage
   */
  private categorizeQuestion(question: string): "awareness" | "consideration" | "decision" {
    const lower = question.toLowerCase();

    // Decision stage keywords
    const decisionKeywords = [
      'buy', 'price', 'cost', 'discount', 'coupon', 'deal', 
      'where to', 'shop', 'order', 'purchase', 'cheap', 'affordable', 
      'sale', 'near me', 'online', 'store', 'subscription'
    ];
    if (decisionKeywords.some(k => lower.includes(k))) {
      return 'decision';
    }

    // Consideration stage keywords
    const considerationKeywords = [
      'vs', 'versus', 'compare', 'comparison', 'review', 'reviews',
      'best', 'top', 'alternative', 'pros', 'cons', 'worth', 
      'better', 'difference', 'rating', 'ratings', 'recommend'
    ];
    if (considerationKeywords.some(k => lower.includes(k))) {
      return 'consideration';
    }

    // Default to awareness
    return 'awareness';
  }
}
