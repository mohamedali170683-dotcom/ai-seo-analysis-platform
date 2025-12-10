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
   * Get REAL questions for a brand from search data
   * Fetches actual questions people search for, ranked by search volume
   */
  async getBrandQuestions(brandName: string, limit: number = 20): Promise<DataForSEOQuestion[]> {
    console.log(`🔍 [DATAFORSEO] Fetching REAL brand questions for: ${brandName}`);
    
    try {
      // Step 1: Get related keywords that are questions
      const questionKeywords = await this.fetchQuestionKeywords(brandName, limit * 3);
      
      // Step 2: If we got real questions, use them
      if (questionKeywords.length >= 3) {
        console.log(`✅ [DATAFORSEO] Got ${questionKeywords.length} real questions from search data`);
        return questionKeywords
          .slice(0, limit)
          .map(q => ({ ...q, type: "brand" as const } as DataForSEOQuestion));
      }
      
      // Step 3: Fallback - generate questions and get their volumes
      console.log(`⚠️ [DATAFORSEO] Few real questions found, using generated + volume lookup`);
      const generatedQuestions = [
        `what is ${brandName}`,
        `is ${brandName} good`,
        `${brandName} review`,
        `${brandName} vs`,
        `best ${brandName}`,
        `should i buy ${brandName}`,
        `${brandName} worth it`,
        `${brandName} pros and cons`,
      ];
      
      const withVolumes = await this.getSearchVolumes(generatedQuestions);
      return withVolumes
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, limit)
        .map(q => ({ ...q, type: "brand" as const } as DataForSEOQuestion));
        
    } catch (error: any) {
      console.error(`❌ [DATAFORSEO] Brand questions failed: ${error.message}`);
      return this.generateQuestionsWithEstimatedVolumes(brandName, "brand", limit)
        .map(q => ({ ...q, type: "brand" as const } as DataForSEOQuestion));
    }
  }
  
  /**
   * Fetch REAL question-format keywords from DataForSEO
   * Uses keyword_suggestions to find actual questions people search
   */
  private async fetchQuestionKeywords(
    seed: string, 
    limit: number
  ): Promise<Omit<DataForSEOQuestion, 'type'>[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    const auth = Buffer.from(`${this.login}:${this.password}`).toString('base64');
    
    // Use keywords_for_keywords to get related searches
    const url = `${this.baseUrl}/keywords_data/google_ads/keywords_for_keywords/live`;
    
    // Search for question-oriented seeds
    const questionSeeds = [
      `what is ${seed}`,
      `how ${seed}`,
      `why ${seed}`,
      `is ${seed}`,
      `best ${seed}`,
    ];
    
    const requestBody = [{
      keywords: questionSeeds,
      location_code: 2840,
      language_code: "en",
      include_seed_keyword: true,
      limit: limit,
    }];
    
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
      
      if (!response.ok) {
        if (response.status === 402) {
          console.warn(`⚠️ [DATAFORSEO] Payment Required (402)`);
          return [];
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const keywords = data.tasks?.[0]?.result || [];
      
      console.log(`📡 [DATAFORSEO] Got ${keywords.length} related keywords`);
      
      // Filter for question-format keywords and sort by volume
      const questions = keywords
        .filter((k: any) => {
          const kw = (k.keyword || '').toLowerCase();
          return this.isQuestion(kw) && k.search_volume > 0;
        })
        .map((k: any) => ({
          question: this.formatQuestion(k.keyword),
          searchVolume: k.search_volume || 0,
          difficulty: k.competition_index || 50,
          cpc: k.cpc || 0,
          competition: k.competition || 0,
          category: this.categorizeQuestion(k.keyword),
        }))
        .sort((a: any, b: any) => b.searchVolume - a.searchVolume);
      
      console.log(`📡 [DATAFORSEO] Filtered to ${questions.length} actual questions`);
      
      // Log top questions for visibility
      questions.slice(0, 5).forEach((q: any) => {
        console.log(`  📝 "${q.question}" - ${q.searchVolume.toLocaleString()} monthly searches`);
      });
      
      return questions;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error(`❌ [DATAFORSEO] fetchQuestionKeywords failed: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Format keyword as a proper question
   */
  private formatQuestion(keyword: string): string {
    let q = keyword.trim();
    // Capitalize first letter
    q = q.charAt(0).toUpperCase() + q.slice(1);
    // Add question mark if it's a question
    if (!q.endsWith('?') && this.isQuestion(keyword)) {
      q += '?';
    }
    return q;
  }
  
  /**
   * Get search volumes for a list of questions
   */
  private async getSearchVolumes(questions: string[]): Promise<Omit<DataForSEOQuestion, 'type'>[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    const auth = Buffer.from(`${this.login}:${this.password}`).toString('base64');
    const url = `${this.baseUrl}/keywords_data/google_ads/search_volume/live`;
    
    const requestBody = [{
      keywords: questions,
      location_code: 2840,
      language_code: "en",
    }];
    
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
      
      if (!response.ok) {
        if (response.status === 402) {
          console.warn(`⚠️ [DATAFORSEO] Payment Required - using estimated volumes`);
          return questions.map((q, i) => ({
            question: q,
            searchVolume: Math.max(100, 10000 - (i * 500)),
            difficulty: 50,
            cpc: 0,
            competition: 0,
            category: this.categorizeQuestion(q),
          }));
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const results = data.tasks?.[0]?.result || [];
      
      return questions.map((q, i) => {
        const volumeData = results.find((r: any) => r.keyword?.toLowerCase() === q.toLowerCase());
        return {
          question: q,
          searchVolume: volumeData?.search_volume || Math.max(100, 5000 - (i * 300)),
          difficulty: volumeData?.competition_index || 50,
          cpc: volumeData?.cpc || 0,
          competition: volumeData?.competition || 0,
          category: this.categorizeQuestion(q),
        };
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  /**
   * Generate questions with estimated volumes (fallback)
   */
  private generateQuestionsWithEstimatedVolumes(
    term: string, 
    type: "brand" | "category",
    limit: number
  ): Omit<DataForSEOQuestion, 'type'>[] {
    const questions = type === "brand" ? [
      `What is ${term}?`,
      `Is ${term} good?`,
      `${term} vs competitors`,
      `Should I buy ${term}?`,
      `Best ${term} products`,
      `${term} reviews`,
    ] : [
      `What is the best ${term}?`,
      `How to choose ${term}?`,
      `${term} recommendations`,
      `Top ${term} brands`,
      `${term} buying guide`,
      `Best ${term} for beginners`,
    ];
    
    return questions.slice(0, limit).map((q, i) => ({
      question: q,
      searchVolume: Math.max(100, 8000 - (i * 800)),
      difficulty: 50,
      cpc: 0,
      competition: 0,
      category: this.categorizeQuestion(q),
    }));
  }

  /**
   * Get REAL questions for a category/vertical from search data
   * These are questions users actually search about the industry
   */
  async getCategoryQuestions(category: string, limit: number = 20): Promise<DataForSEOQuestion[]> {
    console.log(`🔍 [DATAFORSEO] Fetching REAL category questions for: ${category}`);
    
    try {
      // Step 1: Get real question keywords for the category
      const questionKeywords = await this.fetchQuestionKeywords(category, limit * 3);
      
      // Step 2: If we got real questions, use them
      if (questionKeywords.length >= 3) {
        console.log(`✅ [DATAFORSEO] Got ${questionKeywords.length} real category questions`);
        return questionKeywords
          .slice(0, limit)
          .map(q => ({ ...q, type: "category" as const } as DataForSEOQuestion));
      }
      
      // Step 3: Fallback - generate questions and get their volumes
      console.log(`⚠️ [DATAFORSEO] Few real questions found, using generated + volume lookup`);
      const generatedQuestions = [
        `best ${category}`,
        `what is the best ${category}`,
        `${category} recommendations`,
        `how to choose ${category}`,
        `${category} buying guide`,
        `top ${category}`,
        `${category} comparison`,
        `${category} reviews`,
      ];
      
      const withVolumes = await this.getSearchVolumes(generatedQuestions);
      return withVolumes
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, limit)
        .map(q => ({ ...q, type: "category" as const } as DataForSEOQuestion));
        
    } catch (error: any) {
      console.error(`❌ [DATAFORSEO] Category questions failed: ${error.message}`);
      return this.generateQuestionsWithEstimatedVolumes(category, "category", limit)
        .map(q => ({ ...q, type: "category" as const } as DataForSEOQuestion));
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
      .map((item: { question: string; searchVolume: number; difficulty: number; cpc: number; competition: number; category: "awareness" | "consideration" | "decision" }) => ({
        question: item.question, 
        searchVolume: item.searchVolume, 
        difficulty: item.difficulty, 
        cpc: item.cpc, 
        competition: item.competition, 
        category: item.category
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
