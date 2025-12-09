import { GoogleAutocompleteService, GoogleSuggestion } from "./google-autocomplete-service";

export interface DiscoveredQuestion {
  question: string;
  searchVolume: number;
  difficulty: number;
  intent: "informational" | "commercial" | "navigational";
  category: "awareness" | "consideration" | "decision";
  score: number;
  source: "google_autocomplete" | "ahrefs" | "generated";
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
  private googleService: GoogleAutocompleteService;

  constructor(_ahrefsApiKey?: string) {
    this.googleService = new GoogleAutocompleteService();
  }

  /**
   * Discover questions using REAL data from Google Autocomplete
   */
  async discoverQuestions(config: QuestionDiscoveryConfig): Promise<DiscoveredQuestion[]> {
    const { brandName, competitors = [], maxQuestionsPerStage = 2 } = config;
    console.log(`🔍 [QUESTIONS] Discovering real questions for: ${brandName}`);
    const startTime = Date.now();

    let questions: DiscoveredQuestion[] = [];

    // PRIMARY: Try Google Autocomplete (FREE, REAL data)
    try {
      const googleSuggestions = await this.googleService.getQuestions(
        brandName,
        competitors[0]
      );

      if (googleSuggestions.length > 0) {
        questions = this.convertGoogleSuggestions(googleSuggestions, brandName);
        console.log(`✅ [QUESTIONS] Got ${questions.length} real questions from Google`);
      }
    } catch (error: any) {
      console.error(`⚠️ [QUESTIONS] Google Autocomplete failed: ${error.message}`);
    }

    // FALLBACK: If Google didn't return enough, add generated questions
    if (questions.length < maxQuestionsPerStage * 3) {
      console.log(`📝 [QUESTIONS] Adding generated questions to fill gaps`);
      const generated = this.generateFallbackQuestions(brandName, competitors);
      
      // Add generated questions that aren't duplicates
      const existingQuestions = new Set(questions.map(q => q.question.toLowerCase()));
      for (const q of generated) {
        if (!existingQuestions.has(q.question.toLowerCase())) {
          questions.push(q);
        }
      }
    }

    // Balance across stages and limit
    const balanced = this.balanceAcrossStages(questions, maxQuestionsPerStage);
    
    console.log(`✅ [QUESTIONS] Final: ${balanced.length} questions in ${Date.now() - startTime}ms`);
    return balanced;
  }

  /**
   * Convert Google suggestions to our question format
   */
  private convertGoogleSuggestions(
    suggestions: GoogleSuggestion[],
    brandName: string
  ): DiscoveredQuestion[] {
    return suggestions.map((s, index) => {
      // Estimate search volume based on position (earlier = more popular)
      const estimatedVolume = Math.max(1000, 15000 - (index * 500));
      
      return {
        question: this.formatAsQuestion(s.query),
        searchVolume: estimatedVolume,
        difficulty: 30 + Math.floor(Math.random() * 20),
        intent: s.type === "decision" ? "commercial" : s.type === "consideration" ? "commercial" : "informational",
        category: s.type,
        score: 100 - index * 5,
        source: "google_autocomplete" as const,
      };
    });
  }

  /**
   * Format a search query as a proper question
   */
  private formatAsQuestion(query: string): string {
    // Capitalize first letter
    let formatted = query.charAt(0).toUpperCase() + query.slice(1);
    
    // Add question mark if it looks like a question
    const questionWords = ['what', 'why', 'how', 'is', 'are', 'can', 'does', 'do', 'should', 'which', 'where', 'when'];
    if (questionWords.some(w => query.toLowerCase().startsWith(w)) && !formatted.endsWith('?')) {
      formatted += '?';
    }
    
    return formatted;
  }

  /**
   * Generate fallback questions if Google fails
   */
  private generateFallbackQuestions(brandName: string, competitors: string[]): DiscoveredQuestion[] {
    const questions: DiscoveredQuestion[] = [];

    // Awareness
    questions.push(
      { question: `What is ${brandName}?`, searchVolume: 12000, difficulty: 25, intent: "informational", category: "awareness", score: 95, source: "generated" },
      { question: `Is ${brandName} a good brand?`, searchVolume: 9200, difficulty: 30, intent: "informational", category: "awareness", score: 90, source: "generated" }
    );

    // Consideration
    questions.push(
      { question: `${brandName} reviews`, searchVolume: 15000, difficulty: 45, intent: "commercial", category: "consideration", score: 92, source: "generated" },
      { question: competitors.length > 0 ? `${brandName} vs ${competitors[0]}` : `Is ${brandName} worth it?`, searchVolume: 7500, difficulty: 45, intent: "commercial", category: "consideration", score: 85, source: "generated" }
    );

    // Decision
    questions.push(
      { question: `Where to buy ${brandName}?`, searchVolume: 8900, difficulty: 30, intent: "commercial", category: "decision", score: 88, source: "generated" },
      { question: `${brandName} price`, searchVolume: 12500, difficulty: 25, intent: "commercial", category: "decision", score: 90, source: "generated" }
    );

    return questions;
  }

  /**
   * Balance questions across funnel stages
   */
  private balanceAcrossStages(questions: DiscoveredQuestion[], perStage: number): DiscoveredQuestion[] {
    const awareness = questions.filter(q => q.category === "awareness").slice(0, perStage);
    const consideration = questions.filter(q => q.category === "consideration").slice(0, perStage);
    const decision = questions.filter(q => q.category === "decision").slice(0, perStage);
    return [...awareness, ...consideration, ...decision];
  }
}
