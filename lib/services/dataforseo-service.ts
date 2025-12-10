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
   * Get QUESTIONS for a brand with search volumes
   * Uses question-focused seed keywords to find actual questions users ask
   */
  async getBrandQuestions(brandName: string, limit: number = 20): Promise<DataForSEOQuestion[]> {
    console.log(`🔍 [DATAFORSEO] Fetching brand QUESTIONS for: ${brandName}`);
    
    try {
      // Use question-focused seed keywords to get actual questions
      const questionSeeds = [
        `what is ${brandName}`,
        `is ${brandName}`,
        `how ${brandName}`,
        `why ${brandName}`,
        `${brandName} vs`,
        `best ${brandName}`,
        `${brandName} review`,
      ];
      
      const allQuestions: Omit<DataForSEOQuestion, 'type'>[] = [];
      
      // Fetch from multiple question-focused seeds
      for (const seed of questionSeeds.slice(0, 3)) { // Limit API calls
        const questions = await this.fetchKeywordIdeas(seed, Math.ceil(limit / 2), true);
        allQuestions.push(...questions);
      }
      
      // Deduplicate and sort by volume
      const seen = new Set<string>();
      const unique = allQuestions
        .filter(q => {
          const key = q.question.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, limit);
      
      console.log(`✅ [DATAFORSEO] Got ${unique.length} brand questions`);
      return unique.map(q => ({ ...q, type: "brand" as const }));
    } catch (error: any) {
      console.error(`❌ [DATAFORSEO] Brand questions failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get QUESTIONS for a category/vertical with search volumes
   * These are questions users ask about the industry (brand-agnostic)
   */
  async getCategoryQuestions(category: string, limit: number = 20): Promise<DataForSEOQuestion[]> {
    console.log(`🔍 [DATAFORSEO] Fetching category QUESTIONS for: ${category}`);
    
    try {
      // Use question-focused seed keywords for the category
      const questionSeeds = [
        `what is the best ${category}`,
        `how to choose ${category}`,
        `${category} recommendations`,
        `best ${category} for`,
        `${category} comparison`,
        `which ${category}`,
      ];
      
      const allQuestions: Omit<DataForSEOQuestion, 'type'>[] = [];
      
      // Fetch from multiple question-focused seeds
      for (const seed of questionSeeds.slice(0, 3)) { // Limit API calls
        const questions = await this.fetchKeywordIdeas(seed, Math.ceil(limit / 2), true);
        allQuestions.push(...questions);
      }
      
      // Deduplicate and sort by volume
      const seen = new Set<string>();
      const unique = allQuestions
        .filter(q => {
          const key = q.question.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, limit);
      
      console.log(`✅ [DATAFORSEO] Got ${unique.length} category questions`);
      return unique.map(q => ({ ...q, type: "category" as const }));
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

    // Prepare request body - DataForSEO requires 'keywords' as an array
    const requestBody = [{
      keywords: [keyword], // Must be an array
      location_code: 2840, // United States
      language_code: "en",
      include_seed_keyword: true,
      limit: limit * 3, // Get more to filter for questions
    }];

    const auth = Buffer.from(`${this.login}:${this.password}`).toString('base64');
    // Use the google_ads/keywords_for_keywords endpoint (this is the working one!)
    const url = `${this.baseUrl}/keywords_data/google_ads/keywords_for_keywords/live`;
    
    console.log(`📡 [DATAFORSEO] Calling keywords_for_keywords API for: ${keyword}`);

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
        if (response.status === 402) {
          console.warn(`⚠️ [DATAFORSEO] Payment Required (HTTP 402) - account needs credits. Falling back to Google Autocomplete.`);
          return [];
        }
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
   * For keywords_for_keywords endpoint, the result array IS the keywords
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

    // The result array directly contains the keywords
    let keywords = tasks[0]?.result || [];
    console.log(`📡 [DATAFORSEO] Found ${keywords.length} total keywords`);

    // Filter for questions if needed
    if (questionsOnly) {
      keywords = keywords.filter((k: any) => this.isQuestion(k.keyword || ''));
      console.log(`📡 [DATAFORSEO] Filtered to ${keywords.length} questions`);
    }

    // Parse, filter for questions, and sort by volume
    const questions = keywords
      .filter((k: any) => (k.search_volume || 0) > 0)
      .map((k: any) => {
        const keyword = k.keyword || '';
        // Convert to proper question format
        const questionText = this.isQuestion(keyword) 
          ? (keyword.charAt(0).toUpperCase() + keyword.slice(1) + (keyword.endsWith('?') ? '' : '?'))
          : this.convertToQuestion(keyword);
        
        return {
          question: questionText,
          originalKeyword: keyword,
          searchVolume: k.search_volume || 0,
          difficulty: k.competition_index || 50,
          cpc: k.cpc || 0,
          competition: k.competition || 0,
          category: this.categorizeQuestion(keyword),
          isNativeQuestion: this.isQuestion(keyword),
        };
      })
      // Prioritize native questions (actual question format in search data)
      .sort((a: any, b: any) => {
        // Native questions first
        if (a.isNativeQuestion && !b.isNativeQuestion) return -1;
        if (!a.isNativeQuestion && b.isNativeQuestion) return 1;
        // Then by volume
        return b.searchVolume - a.searchVolume;
      })
      .slice(0, limit)
      .map(({ question, searchVolume, difficulty, cpc, competition, category }) => ({
        question, searchVolume, difficulty, cpc, competition, category
      }));

    console.log(`📡 [DATAFORSEO] Returning ${questions.length} questions with volumes`);
    if (questions.length > 0) {
      console.log(`📡 [DATAFORSEO] Top: "${questions[0].question}" (${questions[0].searchVolume} vol)`);
    }

    return questions;
  }

  /**
   * Check if a keyword is a proper question that can be asked to an AI chatbot
   * We want actual questions users would type into ChatGPT/Gemini
   */
  private isQuestion(text: string): boolean {
    const lower = text.toLowerCase().trim();
    
    // Must start with a question word
    const startsWithQuestion = [
      'what ', 'why ', 'how ', 'which ', 'where ', 'when ', 'who ',
      'is ', 'are ', 'can ', 'does ', 'do ', 'should ', 'will ', 'would ',
      'could ', 'has ', 'have ', 'was ', 'were '
    ].some(w => lower.startsWith(w));
    
    // Or contains comparison patterns
    const isComparison = [
      ' vs ', ' versus ', ' compared to ', ' or better',
      'difference between', 'pros and cons'
    ].some(w => lower.includes(w));
    
    // Or ends with a question mark
    const endsWithQuestion = lower.endsWith('?');
    
    // Or is a "best" recommendation query (these are implicitly questions)
    const isBestQuery = lower.startsWith('best ') && lower.split(' ').length >= 3;
    
    // Minimum length
    const hasMinLength = lower.split(' ').length >= 3;
    
    return (startsWithQuestion || isComparison || endsWithQuestion || isBestQuery) && hasMinLength;
  }
  
  /**
   * Convert a keyword to question format for AI prompting
   */
  private convertToQuestion(keyword: string): string {
    const lower = keyword.toLowerCase().trim();
    
    // Already a question
    if (this.isQuestion(keyword)) {
      let q = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      if (!q.endsWith('?')) q += '?';
      return q;
    }
    
    // Convert keyword to question format
    if (lower.includes(' vs ') || lower.includes(' versus ')) {
      return `Which is better: ${keyword}?`;
    }
    if (lower.startsWith('best ')) {
      return `What are the ${keyword}?`;
    }
    if (lower.includes(' review')) {
      return `What are the ${keyword}?`;
    }
    
    // Generic conversion for brand keywords
    return `What is ${keyword}?`;
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
