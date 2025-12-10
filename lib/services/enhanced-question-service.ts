import { DataForSEOService, DataForSEOQuestion } from "./dataforseo-service";
import { GoogleAutocompleteService } from "./google-autocomplete-service";

export interface DiscoveredQuestion {
  question: string;
  searchVolume: number;
  difficulty: number;
  intent: "informational" | "commercial" | "navigational";
  category: "awareness" | "consideration" | "decision";
  questionType: "brand" | "category";
  score: number;
  source: "dataforseo" | "ahrefs" | "google_autocomplete" | "generated";
}

export interface QuestionDiscoveryConfig {
  brandName: string;
  domain?: string;
  competitors?: string[];
  category?: string;
  dataForSEOLogin?: string;
  dataForSEOPassword?: string;
  maxQuestionsPerStage?: number;
  minSearchVolume?: number;
}

export class EnhancedQuestionService {
  private dataForSEOService: DataForSEOService | null = null;
  private googleService: GoogleAutocompleteService;

  constructor(dataForSEOLogin?: string, dataForSEOPassword?: string) {
    // Try passed credentials first, then fall back to env vars
    const login = dataForSEOLogin || process.env.DATAFORSEO_LOGIN;
    const password = dataForSEOPassword || process.env.DATAFORSEO_PASSWORD;
    
    if (login && password) {
      this.dataForSEOService = new DataForSEOService(login, password);
    }
    this.googleService = new GoogleAutocompleteService();
  }

  /**
   * Discover questions with REAL volume data
   */
  async discoverQuestions(config: QuestionDiscoveryConfig): Promise<DiscoveredQuestion[]> {
    const { 
      brandName, 
      competitors = [], 
      category,
      maxQuestionsPerStage = 2,
      minSearchVolume = 50 
    } = config;

    console.log(`🔍 [QUESTIONS] Discovering questions for: ${brandName}`);
    if (category) {
      console.log(`📁 [QUESTIONS] Category: ${category}`);
    }

    const startTime = Date.now();
    let allQuestions: DiscoveredQuestion[] = [];

    // PRIORITY 1: DataForSEO (real questions with volumes)
    if (this.dataForSEOService) {
      // Get BRAND questions (questions users ask about the brand)
      try {
        const brandQuestions = await this.dataForSEOService.getBrandQuestions(brandName, 15);
        
        if (brandQuestions.length > 0) {
          const converted = brandQuestions
            .filter(q => q.searchVolume >= minSearchVolume)
            .map(q => this.convertDataForSEOQuestion(q, "brand"));
          allQuestions.push(...converted);
          console.log(`✅ [QUESTIONS] Got ${converted.length} brand questions from DataForSEO`);
        }
      } catch (error: any) {
        console.warn(`⚠️ [QUESTIONS] DataForSEO brand questions failed: ${error.message}`);
      }
      
      // Get CATEGORY questions (questions about the industry/vertical)
      if (category) {
        try {
          const categoryQuestions = await this.dataForSEOService.getCategoryQuestions(category, 15);
          
          if (categoryQuestions.length > 0) {
            const existing = new Set(allQuestions.map(q => q.question.toLowerCase()));
            const converted = categoryQuestions
              .filter(q => q.searchVolume >= minSearchVolume)
              .filter(q => !existing.has(q.question.toLowerCase()))
              .map(q => this.convertDataForSEOQuestion(q, "category"));
            allQuestions.push(...converted);
            console.log(`✅ [QUESTIONS] Got ${converted.length} category questions from DataForSEO`);
          }
        } catch (error: any) {
          console.warn(`⚠️ [QUESTIONS] DataForSEO category questions failed: ${error.message}`);
        }
      }

      // Get CATEGORY keywords (if category provided)
      if (category) {
        try {
          console.log(`📡 [QUESTIONS] Fetching category keywords from DataForSEO...`);
          let categoryQuestions = await this.dataForSEOService.getCategoryQuestions(category, 20, true);
          
          if (categoryQuestions.length < 6) {
            categoryQuestions = await this.dataForSEOService.getCategoryQuestions(category, 20, false);
          }
          
          if (categoryQuestions.length > 0) {
            const converted = categoryQuestions
              .filter(q => q.searchVolume >= minSearchVolume)
              .map(q => this.convertDataForSEOQuestion(q, "category"));
            
            const existing = new Set(allQuestions.map(q => q.question.toLowerCase()));
            for (const q of converted) {
              if (!existing.has(q.question.toLowerCase())) {
                allQuestions.push(q);
              }
            }
            console.log(`✅ [QUESTIONS] Got ${converted.length} category keywords from DataForSEO`);
          }
        } catch (error: any) {
          console.error(`⚠️ [QUESTIONS] DataForSEO category questions failed: ${error.message}`);
        }
      }
    }

    // PRIORITY 2: Google Autocomplete (fallback - free but no volumes)
    if (allQuestions.length < maxQuestionsPerStage * 3) {
      console.log(`📝 [QUESTIONS] Using Google Autocomplete as fallback...`);
      try {
        const googleSuggestions = await this.googleService.getQuestions(brandName, competitors[0]);
        const googleQuestions = googleSuggestions.map((s, i) => ({
          question: this.formatAsQuestion(s.query),
          searchVolume: Math.max(100, 5000 - (i * 200)), // Estimated
          difficulty: 35,
          intent: s.type === "decision" ? "commercial" as const : "informational" as const,
          category: s.type,
          questionType: "brand" as const,
          score: 70 - i,
          source: "google_autocomplete" as const,
        }));
        
        const existing = new Set(allQuestions.map(q => q.question.toLowerCase()));
        for (const q of googleQuestions) {
          if (!existing.has(q.question.toLowerCase())) {
            allQuestions.push(q);
          }
        }
        console.log(`✅ [QUESTIONS] Added questions from Google Autocomplete`);
      } catch (error: any) {
        console.error(`⚠️ [QUESTIONS] Google Autocomplete failed: ${error.message}`);
      }
    }

    // PRIORITY 3: Generated questions (final fallback)
    if (allQuestions.length < maxQuestionsPerStage * 3) {
      console.log(`📝 [QUESTIONS] Adding generated questions as final fallback...`);
      const generated = this.generateFallbackQuestions(brandName, competitors, category);
      const existing = new Set(allQuestions.map(q => q.question.toLowerCase()));
      for (const q of generated) {
        if (!existing.has(q.question.toLowerCase())) {
          allQuestions.push(q);
        }
      }
    }

    // Sort by search volume (highest first)
    allQuestions.sort((a, b) => b.searchVolume - a.searchVolume);

    // Balance across stages
    const balanced = this.balanceAcrossStages(allQuestions, maxQuestionsPerStage);

    console.log(`✅ [QUESTIONS] Final: ${balanced.length} questions in ${Date.now() - startTime}ms`);
    console.log(`   📊 Sources: ${[...new Set(balanced.map(q => q.source))].join(', ')}`);
    console.log(`   📊 Volumes: ${balanced.map(q => q.searchVolume).join(', ')}`);
    
    return balanced;
  }

  /**
   * Convert DataForSEO question to our format
   */
  private convertDataForSEOQuestion(q: DataForSEOQuestion, questionType: "brand" | "category"): DiscoveredQuestion {
    return {
      question: this.formatAsQuestion(q.question),
      searchVolume: q.searchVolume,
      difficulty: q.difficulty,
      intent: q.category === "decision" ? "commercial" : q.category === "consideration" ? "commercial" : "informational",
      category: q.category,
      questionType,
      score: Math.min(100, Math.floor(Math.log10(q.searchVolume + 1) * 20) + (100 - q.difficulty)),
      source: "dataforseo",
    };
  }

  /**
   * Format a search query as a proper question
   */
  private formatAsQuestion(query: string): string {
    let formatted = query.charAt(0).toUpperCase() + query.slice(1);
    const questionWords = ['what', 'why', 'how', 'is', 'are', 'can', 'does', 'which', 'where', 'when', 'who', 'should'];
    if (questionWords.some(w => query.toLowerCase().startsWith(w)) && !formatted.endsWith('?')) {
      formatted += '?';
    }
    return formatted;
  }

  /**
   * Generate fallback questions
   */
  private generateFallbackQuestions(brandName: string, competitors: string[], category?: string): DiscoveredQuestion[] {
    const questions: DiscoveredQuestion[] = [];

    // Brand questions
    questions.push(
      { question: `What is ${brandName}?`, searchVolume: 5000, difficulty: 25, intent: "informational", category: "awareness", questionType: "brand", score: 80, source: "generated" },
      { question: `Is ${brandName} good?`, searchVolume: 4000, difficulty: 30, intent: "informational", category: "awareness", questionType: "brand", score: 75, source: "generated" },
      { question: `${brandName} reviews`, searchVolume: 8000, difficulty: 45, intent: "commercial", category: "consideration", questionType: "brand", score: 85, source: "generated" },
      { question: competitors[0] ? `${brandName} vs ${competitors[0]}` : `${brandName} alternatives`, searchVolume: 3000, difficulty: 40, intent: "commercial", category: "consideration", questionType: "brand", score: 70, source: "generated" },
      { question: `Where to buy ${brandName}?`, searchVolume: 6000, difficulty: 30, intent: "commercial", category: "decision", questionType: "brand", score: 78, source: "generated" },
      { question: `${brandName} price`, searchVolume: 7000, difficulty: 25, intent: "commercial", category: "decision", questionType: "brand", score: 82, source: "generated" },
    );

    // Category questions
    if (category) {
      questions.push(
        { question: `Best ${category}`, searchVolume: 12000, difficulty: 50, intent: "commercial", category: "awareness", questionType: "category", score: 90, source: "generated" },
        { question: `Top ${category} ${new Date().getFullYear()}`, searchVolume: 8000, difficulty: 45, intent: "commercial", category: "consideration", questionType: "category", score: 85, source: "generated" },
        { question: `${category} comparison`, searchVolume: 5000, difficulty: 40, intent: "commercial", category: "consideration", questionType: "category", score: 75, source: "generated" },
        { question: `Where to buy ${category}?`, searchVolume: 4000, difficulty: 35, intent: "commercial", category: "decision", questionType: "category", score: 72, source: "generated" },
      );
    }

    return questions;
  }

  /**
   * Balance questions across funnel stages
   */
  private balanceAcrossStages(questions: DiscoveredQuestion[], perStage: number): DiscoveredQuestion[] {
    const result: DiscoveredQuestion[] = [];

    for (const stage of ["awareness", "consideration", "decision"] as const) {
      const stageQuestions = questions.filter(q => q.category === stage);
      
      // Prioritize: mix of brand and category questions
      const brandQs = stageQuestions.filter(q => q.questionType === "brand");
      const categoryQs = stageQuestions.filter(q => q.questionType === "category");

      // Add highest volume questions first
      const combined = [...brandQs, ...categoryQs]
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, perStage);
      
      result.push(...combined);
    }

    return result;
  }
}
