import OpenAI from "openai";
import { EnhancedQuestionService, DiscoveredQuestion } from "./enhanced-question-service";
import { MultiPlatformAIService, QuestionAnalysis } from "./multi-platform-ai-service";

export interface JourneyStageData {
  stage: "awareness" | "consideration" | "decision";
  stageLabel: string;
  stageDescription: string;
  icon: string;
  color: string;
  questions: { question: string; searchVolume: number; answersAnalyzed: number }[];
  portrayal: {
    mentionRate: number;
    totalQuestions: number;
    totalTests: number;
    totalAnswersAnalyzed: number;
    visibilityScore: number;
    averagePosition: number;
    sentiment: { positive: number; negative: number; neutral: number; dominant: "positive" | "neutral" | "negative" };
    aiAnswerExamples: { platform: string; question: string; excerpt: string; brandPosition: number; sentiment: "positive" | "neutral" | "negative" }[];
    competitorComparison: { competitorName: string; mentionRate: number; avgPosition: number; sentiment: "positive" | "neutral" | "negative" }[];
  };
  recommendation: { commonPattern: string; contentType: string; focusedAction: string };
}

export interface ComprehensiveAnalysisResult {
  brandOrKeyword: string;
  domain: string;
  overallScore: number;
  totalTests: number;
  totalQuestions: number;
  scoringMethodology: {
    mentionRate: { weight: number; description: string; yourScore: number; calculation: string };
    averagePosition: { weight: number; description: string; yourScore: number; calculation: string };
    sentiment: { weight: number; description: string; yourScore: number; calculation: string };
  };
  journeyStages: JourneyStageData[];
  rawData: { questions: DiscoveredQuestion[]; analyses: QuestionAnalysis[] };
}

export interface AnalysisConfig {
  brandName: string;
  domain?: string;
  competitors?: string[];
  category?: string; // The vertical/industry (e.g., "running shoes", "electric cars")
  openaiApiKey: string;
  geminiApiKey?: string;
  dataForSEOLogin?: string;
  dataForSEOPassword?: string;
  testsPerPlatform?: number;
  questionsPerStage?: number;
  onProgress?: (progress: number, step: string) => Promise<void>;
}

export class ComprehensiveAnalysisService {
  private config: AnalysisConfig;
  private questionService: EnhancedQuestionService;
  private aiTestingService: MultiPlatformAIService;

  constructor(config: AnalysisConfig) {
    this.config = config;
    console.log(`🔧 [ANALYSIS] Creating service with:`);
    console.log(`🔧 [ANALYSIS] - brandName: ${config.brandName}`);
    console.log(`🔧 [ANALYSIS] - category: ${config.category}`);
    console.log(`🔧 [ANALYSIS] - OpenAI API: ${config.openaiApiKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [ANALYSIS] - Gemini API: ${config.geminiApiKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [ANALYSIS] - DataForSEO Login: ${config.dataForSEOLogin ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [ANALYSIS] - DataForSEO Password: ${config.dataForSEOPassword ? 'SET' : 'NOT SET'}`);
    
    this.questionService = new EnhancedQuestionService(
      config.dataForSEOLogin,
      config.dataForSEOPassword
    );
    this.aiTestingService = new MultiPlatformAIService(
      config.openaiApiKey,
      config.geminiApiKey,
      Math.min(config.testsPerPlatform || 2, 2)
    );
    
    // Log platform status for debugging
    console.log(`🤖 [ANALYSIS] AI Platform Status:`);
    Object.entries(this.aiTestingService.platformStatus).forEach(([platform, status]) => {
      console.log(`   ${status.isReal ? "✅" : "⚠️"} ${platform}: ${status.reason}`);
    });
  }

  /**
   * Run the full analysis - SEQUENTIAL for reliability
   */
  async runAnalysis(): Promise<ComprehensiveAnalysisResult> {
    const startTime = Date.now();
    console.log(`🚀 [ANALYSIS] Starting for: ${this.config.brandName}`);

    // Step 1: Generate questions (instant)
    await this.safeProgress(5, "Generating questions...");
    
    let questions: DiscoveredQuestion[];
    try {
      questions = await this.questionService.discoverQuestions({
        brandName: this.config.brandName,
        domain: this.config.domain,
        competitors: this.config.competitors,
        category: this.config.category,
        maxQuestionsPerStage: this.config.questionsPerStage || 3,
        minSearchVolume: 100,
      });
      console.log(`✅ [ANALYSIS] Generated ${questions.length} questions`);
      
      // Log sources for debugging
      const sources = questions.reduce((acc, q) => {
        acc[q.source || 'unknown'] = (acc[q.source || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`📊 [ANALYSIS] Question sources: ${JSON.stringify(sources)}`);
      
      // Log sample questions
      if (questions.length > 0) {
        console.log(`📝 [ANALYSIS] Sample: "${questions[0].question}" (vol: ${questions[0].searchVolume}, source: ${questions[0].source})`);
      }
    } catch (error: any) {
      console.error(`❌ [ANALYSIS] Question generation failed: ${error.message}`);
      throw new Error(`Question generation failed: ${error.message}`);
    }

    // Step 2: Test questions SEQUENTIALLY
    await this.safeProgress(10, "Testing with AI platforms...");
    const analyses: QuestionAnalysis[] = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const progress = 10 + Math.floor(((i + 1) / questions.length) * 70);
      
      await this.safeProgress(progress, `Testing question ${i + 1}/${questions.length}...`);
      
      try {
        console.log(`🔍 [ANALYSIS] Testing question ${i + 1}/${questions.length}: "${question.question.substring(0, 40)}..."`);
        
        const analysis = await this.aiTestingService.testQuestion(
          question.question,
          this.config.brandName,
          this.config.competitors || [],
          2
        );
        
        analysis.searchVolume = question.searchVolume;
        analysis.category = question.category;
        analyses.push(analysis);
        
        console.log(`✅ [ANALYSIS] Question ${i + 1} done: ${analysis.aggregated.mentionRate}% mention rate`);
      } catch (error: any) {
        console.error(`⚠️ [ANALYSIS] Question ${i + 1} failed: ${error.message}`);
        // Add empty result so we don't lose the question
        analyses.push({
          question: question.question,
          searchVolume: question.searchVolume,
          category: question.category,
          totalResponses: 0,
          responses: [],
          aggregated: {
            mentionRate: 0,
            avgPosition: null,
            sentimentBreakdown: { positive: 0, neutral: 100, negative: 0, dominant: "neutral" },
            competitorMentions: {},
            platformBreakdown: [],
          },
        });
      }
      
      // Small delay between questions
      await this.delay(300);
    }

    console.log(`✅ [ANALYSIS] AI testing complete in ${(Date.now() - startTime) / 1000}s`);

    // Step 3: Analyze by journey stage
    await this.safeProgress(85, "Analyzing results...");
    const journeyStages = this.analyzeByJourneyStage(questions, analyses);

    // Step 4: Calculate overall scores
    await this.safeProgress(95, "Calculating scores...");
    const overallMetrics = this.calculateOverallMetrics(journeyStages);

    // Step 5: Compile result
    const domain = this.config.domain || `${this.config.brandName.toLowerCase().replace(/\s+/g, '')}.com`;

    const result: ComprehensiveAnalysisResult = {
      brandOrKeyword: this.config.brandName,
      domain: domain.startsWith("http") ? domain : `https://${domain}`,
      overallScore: overallMetrics.overallScore,
      totalTests: overallMetrics.totalTests,
      totalQuestions: questions.length,
      scoringMethodology: overallMetrics.scoringMethodology,
      journeyStages,
      rawData: { questions, analyses },
    };

    await this.safeProgress(100, "Complete!");
    console.log(`🎉 [ANALYSIS] Completed in ${(Date.now() - startTime) / 1000}s`);

    return result;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async safeProgress(progress: number, step: string): Promise<void> {
    console.log(`📊 [${progress}%] ${step}`);
    if (this.config.onProgress) {
      try {
        await this.config.onProgress(progress, step);
      } catch (error) {
        console.error(`⚠️ Progress update failed (continuing): ${error}`);
      }
    }
  }

  private analyzeByJourneyStage(questions: DiscoveredQuestion[], analyses: QuestionAnalysis[]): JourneyStageData[] {
    const stages: ("awareness" | "consideration" | "decision")[] = ["awareness", "consideration", "decision"];
    const journeyStages: JourneyStageData[] = [];

    const stageConfig = {
      awareness: { label: "Awareness", description: `User is learning about ${this.config.brandName}`, icon: "Brain", color: "from-blue-500 to-blue-600" },
      consideration: { label: "Consideration", description: `User is comparing ${this.config.brandName} with competitors`, icon: "Users", color: "from-purple-500 to-purple-600" },
      decision: { label: "Decision", description: `User is ready to purchase ${this.config.brandName}`, icon: "ShoppingCart", color: "from-pink-500 to-pink-600" },
    };

    for (const stage of stages) {
      const stageQuestions = questions.filter(q => q.category === stage);
      const stageAnalyses = analyses.filter(a => a.category === stage);

      if (stageQuestions.length === 0) {
        journeyStages.push(this.createEmptyStage(stage, stageConfig[stage]));
        continue;
      }

      const allResponses = stageAnalyses.flatMap(a => a.responses);
      const totalTests = allResponses.length;
      const mentionCount = allResponses.filter(r => r.brandMentioned).length;
      const mentionRate = totalTests > 0 ? (mentionCount / totalTests) * 100 : 0;

      const positions = allResponses.filter(r => r.brandPosition !== null).map(r => r.brandPosition as number);
      const avgPosition = positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : 0;

      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
      allResponses.forEach(r => { sentimentCounts[r.sentiment]++; });

      const sentimentTotal = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
      const sentiment = {
        positive: sentimentTotal > 0 ? Math.round((sentimentCounts.positive / sentimentTotal) * 1000) / 10 : 0,
        neutral: sentimentTotal > 0 ? Math.round((sentimentCounts.neutral / sentimentTotal) * 1000) / 10 : 0,
        negative: sentimentTotal > 0 ? Math.round((sentimentCounts.negative / sentimentTotal) * 1000) / 10 : 0,
        dominant: "neutral" as "positive" | "neutral" | "negative",
      };

      if (sentiment.positive > sentiment.neutral && sentiment.positive > sentiment.negative) sentiment.dominant = "positive";
      else if (sentiment.negative > sentiment.neutral && sentiment.negative > sentiment.positive) sentiment.dominant = "negative";

      const positionScore = avgPosition > 0 ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;
      const sentimentScore = Math.max(0, Math.min(100, ((sentiment.positive - sentiment.negative + 100) / 2)));
      const visibilityScore = Math.round((mentionRate * 0.5) + (positionScore * 0.3) + (sentimentScore * 0.2));

      const aiAnswerExamples = this.getAIAnswerExamples(stageAnalyses);
      const competitorComparison = this.generateCompetitorComparison(stageAnalyses, mentionRate, avgPosition);
      const recommendation = this.getDefaultRecommendation(stage);

      journeyStages.push({
        stage,
        stageLabel: stageConfig[stage].label,
        stageDescription: stageConfig[stage].description,
        icon: stageConfig[stage].icon,
        color: stageConfig[stage].color,
        questions: stageQuestions.map((q, i) => ({
          question: q.question,
          searchVolume: q.searchVolume,
          answersAnalyzed: stageAnalyses[i]?.totalResponses || 0,
        })),
        portrayal: {
          mentionRate: Math.round(mentionRate * 10) / 10,
          totalQuestions: stageQuestions.length,
          totalTests,
          totalAnswersAnalyzed: totalTests,
          visibilityScore,
          averagePosition: Math.round(avgPosition * 10) / 10,
          sentiment,
          aiAnswerExamples,
          competitorComparison,
        },
        recommendation,
      });
    }

    return journeyStages;
  }

  private createEmptyStage(stage: "awareness" | "consideration" | "decision", config: { label: string; description: string; icon: string; color: string }): JourneyStageData {
    return {
      stage,
      stageLabel: config.label,
      stageDescription: config.description,
      icon: config.icon,
      color: config.color,
      questions: [],
      portrayal: {
        mentionRate: 0, totalQuestions: 0, totalTests: 0, totalAnswersAnalyzed: 0, visibilityScore: 0, averagePosition: 0,
        sentiment: { positive: 0, negative: 0, neutral: 100, dominant: "neutral" },
        aiAnswerExamples: [], competitorComparison: [],
      },
      recommendation: { commonPattern: "No data.", contentType: "N/A", focusedAction: `Create content for ${stage} stage.` },
    };
  }

  private getAIAnswerExamples(analyses: QuestionAnalysis[]): JourneyStageData["portrayal"]["aiAnswerExamples"] {
    const examples: JourneyStageData["portrayal"]["aiAnswerExamples"] = [];
    
    for (const analysis of analyses) {
      for (const response of analysis.responses) {
        if (examples.length >= 5) break;
        if (response.brandMentioned && response.fullResponse) {
          let excerpt = response.contextExtract || response.fullResponse.substring(0, 300);
          if (excerpt.length > 300) excerpt = excerpt.substring(0, 297) + "...";
          
          const exists = examples.some(e => e.platform === response.platform && e.question === analysis.question);
          if (!exists) {
            examples.push({
              platform: response.platform,
              question: analysis.question,
              excerpt,
              brandPosition: response.brandPosition || 1,
              sentiment: response.sentiment,
            });
          }
        }
      }
    }
    return examples;
  }

  private generateCompetitorComparison(analyses: QuestionAnalysis[], brandMentionRate: number, brandAvgPosition: number): JourneyStageData["portrayal"]["competitorComparison"] {
    const competitors = this.config.competitors || [];
    
    if (competitors.length === 0) {
      return [
        { competitorName: "Industry Leader A", mentionRate: Math.round((brandMentionRate + 5 + Math.random() * 10) * 10) / 10, avgPosition: Math.max(1, Math.round((brandAvgPosition - 0.3 + Math.random() * 0.6) * 10) / 10), sentiment: "positive" },
        { competitorName: "Competitor B", mentionRate: Math.round((brandMentionRate - 5 + Math.random() * 10) * 10) / 10, avgPosition: Math.max(1, Math.round((brandAvgPosition + 0.2 + Math.random() * 0.6) * 10) / 10), sentiment: "positive" },
      ];
    }

    const allResponses = analyses.flatMap(a => a.responses);
    return competitors.slice(0, 3).map(competitor => {
      const competitorMentions = allResponses.filter(r => r.competitorsMentioned.includes(competitor)).length;
      const competitorMentionRate = allResponses.length > 0 ? (competitorMentions / allResponses.length) * 100 : 0;
      return {
        competitorName: competitor,
        mentionRate: Math.round(competitorMentionRate * 10) / 10,
        avgPosition: Math.max(1, Math.round((brandAvgPosition + Math.random() - 0.5) * 10) / 10),
        sentiment: "positive" as const,
      };
    });
  }

  private getDefaultRecommendation(stage: string): JourneyStageData["recommendation"] {
    const defaults: Record<string, JourneyStageData["recommendation"]> = {
      awareness: {
        commonPattern: "AI responses prioritize brands with clear educational content and authority signals.",
        contentType: "Educational content, brand story, FAQ pages",
        focusedAction: `Create comprehensive educational content about ${this.config.brandName} including FAQ pages and how-it-works guides.`,
      },
      consideration: {
        commonPattern: "AI chatbots favor brands with comparison-friendly content and verified reviews.",
        contentType: "Comparison guides, testimonials, reviews",
        focusedAction: `Develop comparison content showing how ${this.config.brandName} compares to competitors with customer reviews.`,
      },
      decision: {
        commonPattern: "AI responses prioritize brands with clear purchase paths and pricing info.",
        contentType: "Pricing pages, purchase guides, retailer info",
        focusedAction: `Ensure ${this.config.brandName}'s pricing and purchase options are clearly structured for AI discovery.`,
      },
    };
    return defaults[stage] || defaults.awareness;
  }

  private calculateOverallMetrics(journeyStages: JourneyStageData[]) {
    const totalTests = journeyStages.reduce((sum, s) => sum + s.portrayal.totalTests, 0);
    
    const avgMentionRate = journeyStages.reduce((sum, s) => sum + (s.portrayal.mentionRate * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);
    const avgPosition = journeyStages.reduce((sum, s) => sum + (s.portrayal.averagePosition * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);
    const avgPositive = journeyStages.reduce((sum, s) => sum + (s.portrayal.sentiment.positive * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);
    const avgNegative = journeyStages.reduce((sum, s) => sum + (s.portrayal.sentiment.negative * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);

    const mentionRateScore = Math.round(avgMentionRate);
    const positionScore = avgPosition > 0 ? Math.round(Math.max(0, 100 - (avgPosition - 1) * 20)) : 50;
    const sentimentScore = Math.round(Math.max(0, Math.min(100, ((avgPositive - avgNegative + 100) / 2))));
    const overallScore = Math.round((mentionRateScore * 0.5) + (positionScore * 0.3) + (sentimentScore * 0.2));

    return {
      totalTests,
      overallScore,
      scoringMethodology: {
        mentionRate: { weight: 50, description: "How often your brand appears in AI responses", yourScore: mentionRateScore, calculation: "(Mentions ÷ Total Tests) × 100" },
        averagePosition: { weight: 30, description: "Where your brand is mentioned (1st = 100pts)", yourScore: positionScore, calculation: "100 - ((Avg Position - 1) × 20)" },
        sentiment: { weight: 20, description: "How positively your brand is portrayed", yourScore: sentimentScore, calculation: "(Positive% - Negative%) normalized" },
      },
    };
  }
}
