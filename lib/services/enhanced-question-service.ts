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
  constructor(_ahrefsApiKey?: string) {}

  async discoverQuestions(config: QuestionDiscoveryConfig): Promise<DiscoveredQuestion[]> {
    const { brandName, domain, competitors = [], maxQuestionsPerStage = 2 } = config;
    console.log(`🔍 [QUESTIONS] Generating for: ${brandName}`);
    
    const questions = this.generateSmartQuestions(brandName, domain, competitors);
    const balanced = this.balanceAcrossStages(questions, maxQuestionsPerStage);
    
    console.log(`✅ [QUESTIONS] Generated ${balanced.length} questions`);
    return balanced;
  }

  private generateSmartQuestions(brandName: string, _domain?: string, competitors: string[] = []): DiscoveredQuestion[] {
    const questions: DiscoveredQuestion[] = [];

    // AWARENESS (2 questions)
    questions.push(
      { question: `What is ${brandName}?`, searchVolume: 12000, difficulty: 25, intent: "informational", category: "awareness", score: 95, source: "generated" },
      { question: `Is ${brandName} a good brand?`, searchVolume: 9200, difficulty: 30, intent: "informational", category: "awareness", score: 90, source: "generated" }
    );

    // CONSIDERATION (2 questions)
    questions.push(
      { question: `${brandName} reviews`, searchVolume: 15000, difficulty: 45, intent: "commercial", category: "consideration", score: 92, source: "generated" },
      { question: competitors.length > 0 ? `${brandName} vs ${competitors[0]}` : `Is ${brandName} worth it?`, searchVolume: 7500, difficulty: 45, intent: "commercial", category: "consideration", score: 85, source: "generated" }
    );

    // DECISION (2 questions)
    questions.push(
      { question: `Where to buy ${brandName}?`, searchVolume: 8900, difficulty: 30, intent: "commercial", category: "decision", score: 88, source: "generated" },
      { question: `${brandName} price`, searchVolume: 12500, difficulty: 25, intent: "commercial", category: "decision", score: 90, source: "generated" }
    );

    return questions;
  }

  private balanceAcrossStages(questions: DiscoveredQuestion[], perStage: number): DiscoveredQuestion[] {
    const awareness = questions.filter(q => q.category === "awareness").slice(0, perStage);
    const consideration = questions.filter(q => q.category === "consideration").slice(0, perStage);
    const decision = questions.filter(q => q.category === "decision").slice(0, perStage);
    return [...awareness, ...consideration, ...decision];
  }
}
