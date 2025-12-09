import { AhrefsService, AhrefsQuestion } from "./ahrefs-service";
import { GoogleAutocompleteService } from "./google-autocomplete-service";

export interface DiscoveredQuestion {
  question: string;
  searchVolume: number;
  difficulty: number;
  intent: "informational" | "commercial" | "navigational";
  category: "awareness" | "consideration" | "decision";
  questionType: "brand" | "category"; // NEW: Is this about the brand or its category?
  score: number;
  source: "ahrefs" | "google_autocomplete" | "generated";
}

export interface QuestionDiscoveryConfig {
  brandName: string;
  domain?: string;
  competitors?: string[];
  category?: string; // NEW: The vertical/industry (e.g., "running shoes", "electric cars")
  ahrefsApiKey?: string;
  maxQuestionsPerStage?: number;
  minSearchVolume?: number;
}

export class EnhancedQuestionService {
  private ahrefsService: AhrefsService | null;
  private googleService: GoogleAutocompleteService;

  constructor(ahrefsApiKey?: string) {
    this.ahrefsService = ahrefsApiKey ? new AhrefsService(ahrefsApiKey) : null;
    this.googleService = new GoogleAutocompleteService();
  }

  /**
   * Discover questions with REAL volume data
   * Returns both brand questions AND category questions
   */
  async discoverQuestions(config: QuestionDiscoveryConfig): Promise<DiscoveredQuestion[]> {
    const { 
      brandName, 
      competitors = [], 
      category,
      maxQuestionsPerStage = 2,
      minSearchVolume = 100 
    } = config;

    console.log(`🔍 [QUESTIONS] Discovering questions for: ${brandName}`);
    if (category) {
      console.log(`📁 [QUESTIONS] Category: ${category}`);
    }

    const startTime = Date.now();
    let allQuestions: DiscoveredQuestion[] = [];

    // STEP 1: Try Ahrefs for BRAND questions (with real volumes)
    if (this.ahrefsService) {
      try {
        console.log(`📡 [QUESTIONS] Fetching brand questions from Ahrefs...`);
        const brandQuestions = await this.ahrefsService.getBrandQuestions(brandName, 15);
        
        if (brandQuestions.length > 0) {
          const converted = brandQuestions
            .filter(q => q.searchVolume >= minSearchVolume)
            .map(q => this.convertAhrefsQuestion(q, "brand"));
          allQuestions.push(...converted);
          console.log(`✅ [QUESTIONS] Got ${converted.length} brand questions from Ahrefs`);
        }
      } catch (error: any) {
        console.error(`⚠️ [QUESTIONS] Ahrefs brand questions failed: ${error.message}`);
      }
    }

    // STEP 2: Try Ahrefs for CATEGORY questions (with real volumes)
    if (this.ahrefsService && category) {
      try {
        console.log(`📡 [QUESTIONS] Fetching category questions from Ahrefs...`);
        const categoryQuestions = await this.ahrefsService.getCategoryQuestions(category, 15);
        
        if (categoryQuestions.length > 0) {
          const converted = categoryQuestions
            .filter(q => q.searchVolume >= minSearchVolume)
            .map(q => this.convertAhrefsQuestion(q, "category"));
          allQuestions.push(...converted);
          console.log(`✅ [QUESTIONS] Got ${converted.length} category questions from Ahrefs`);
        }
      } catch (error: any) {
        console.error(`⚠️ [QUESTIONS] Ahrefs category questions failed: ${error.message}`);
      }
    }

    // STEP 3: Fallback to Google Autocomplete if Ahrefs didn't return enough
    if (allQuestions.length < maxQuestionsPerStage * 3) {
      console.log(`📝 [QUESTIONS] Using Google Autocomplete as fallback...`);
      try {
        const googleSuggestions = await this.googleService.getQuestions(brandName, competitors[0]);
        const googleQuestions = googleSuggestions.map((s, i) => ({
          question: this.formatAsQuestion(s.query),
          searchVolume: Math.max(500, 10000 - (i * 300)), // Estimated
          difficulty: 35,
          intent: s.type === "decision" ? "commercial" as const : "informational" as const,
          category: s.type,
          questionType: "brand" as const,
          score: 80 - i,
          source: "google_autocomplete" as const,
        }));
        
        // Add only non-duplicate questions
        const existing = new Set(allQuestions.map(q => q.question.toLowerCase()));
        for (const q of googleQuestions) {
          if (!existing.has(q.question.toLowerCase())) {
            allQuestions.push(q);
          }
        }
        console.log(`✅ [QUESTIONS] Added ${googleQuestions.length} questions from Google`);
      } catch (error: any) {
        console.error(`⚠️ [QUESTIONS] Google Autocomplete failed: ${error.message}`);
      }
    }

    // STEP 4: Final fallback - generate questions
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
    console.log(`   📊 By volume: ${balanced.map(q => `${q.searchVolume}`).join(', ')}`);
    
    return balanced;
  }

  /**
   * Convert Ahrefs question to our format
   */
  private convertAhrefsQuestion(q: AhrefsQuestion, questionType: "brand" | "category"): DiscoveredQuestion {
    return {
      question: this.formatAsQuestion(q.question),
      searchVolume: q.searchVolume,
      difficulty: q.difficulty,
      intent: q.category === "decision" ? "commercial" : q.category === "consideration" ? "commercial" : "informational",
      category: q.category,
      questionType,
      score: Math.min(100, Math.floor(q.searchVolume / 100) + (100 - q.difficulty)),
      source: "ahrefs",
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

    // Category questions (if category provided)
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
   * Ensures mix of brand AND category questions at each stage
   */
  private balanceAcrossStages(questions: DiscoveredQuestion[], perStage: number): DiscoveredQuestion[] {
    const result: DiscoveredQuestion[] = [];

    for (const stage of ["awareness", "consideration", "decision"] as const) {
      const stageQuestions = questions.filter(q => q.category === stage);
      
      // Prioritize: 1 brand question + 1 category question per stage (if available)
      const brandQs = stageQuestions.filter(q => q.questionType === "brand");
      const categoryQs = stageQuestions.filter(q => q.questionType === "category");

      // Add brand questions first (up to half of perStage)
      const brandToAdd = Math.min(Math.ceil(perStage / 2), brandQs.length);
      result.push(...brandQs.slice(0, brandToAdd));

      // Fill rest with category questions
      const remaining = perStage - brandToAdd;
      result.push(...categoryQs.slice(0, remaining));

      // If still need more, add more brand questions
      if (result.filter(q => q.category === stage).length < perStage) {
        const stillNeeded = perStage - result.filter(q => q.category === stage).length;
        result.push(...brandQs.slice(brandToAdd, brandToAdd + stillNeeded));
      }
    }

    return result;
  }
}
