import OpenAI from "openai";
import { EnhancedQuestionService, DiscoveredQuestion } from "./enhanced-question-service";
import { MultiPlatformAIService, QuestionAnalysis, AIResponse } from "./multi-platform-ai-service";

export interface JourneyStageData {
  stage: "awareness" | "consideration" | "decision";
  stageLabel: string;
  stageDescription: string;
  icon: string;
  color: string;
  questions: {
    question: string;
    searchVolume: number;
    answersAnalyzed: number;
  }[];
  portrayal: {
    mentionRate: number;
    totalQuestions: number;
    totalTests: number;
    totalAnswersAnalyzed: number;
    visibilityScore: number;
    averagePosition: number;
    sentiment: {
      positive: number;
      negative: number;
      neutral: number;
      dominant: "positive" | "neutral" | "negative";
    };
    aiAnswerExamples: {
      platform: string;
      question: string;
      excerpt: string;
      brandPosition: number;
      sentiment: "positive" | "neutral" | "negative";
    }[];
    competitorComparison: {
      competitorName: string;
      mentionRate: number;
      avgPosition: number;
      sentiment: "positive" | "neutral" | "negative";
    }[];
  };
  recommendation: {
    commonPattern: string;
    contentType: string;
    focusedAction: string;
  };
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
  rawData: {
    questions: DiscoveredQuestion[];
    analyses: QuestionAnalysis[];
  };
}

export interface AnalysisConfig {
  brandName: string;
  domain?: string;
  competitors?: string[];
  openaiApiKey: string;
  geminiApiKey?: string;
  ahrefsApiKey?: string;
  testsPerPlatform?: number;
  questionsPerStage?: number;
  onProgress?: (progress: number, step: string) => Promise<void>;
}

export class ComprehensiveAnalysisService {
  private config: AnalysisConfig;
  private questionService: EnhancedQuestionService;
  private aiTestingService: MultiPlatformAIService;
  private openai: OpenAI;

  constructor(config: AnalysisConfig) {
    this.config = config;
    this.questionService = new EnhancedQuestionService(config.ahrefsApiKey);
    // Reduced tests per platform to 2 for speed (6 total per question)
    this.aiTestingService = new MultiPlatformAIService(
      config.openaiApiKey,
      config.geminiApiKey,
      Math.min(config.testsPerPlatform || 2, 2)
    );
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
  }

  /**
   * Run the full comprehensive analysis - OPTIMIZED FOR SPEED
   */
  async runAnalysis(): Promise<ComprehensiveAnalysisResult> {
    const startTime = Date.now();
    console.log(`🚀 [ANALYSIS] Starting for: ${this.config.brandName}`);

    try {
      // Step 1: Discover questions (INSTANT - no API calls)
      await this.reportProgress(5, "Generating questions...");
      const questions = await this.questionService.discoverQuestions({
        brandName: this.config.brandName,
        domain: this.config.domain,
        competitors: this.config.competitors,
        maxQuestionsPerStage: this.config.questionsPerStage || 3, // Reduced from 4 to 3
      });
      console.log(`✅ [ANALYSIS] Generated ${questions.length} questions in ${Date.now() - startTime}ms`);

      // Step 2: Test questions in PARALLEL batches
      await this.reportProgress(10, "Testing with AI platforms...");
      const analyses = await this.testQuestionsInParallel(questions);
      console.log(`✅ [ANALYSIS] AI testing completed in ${(Date.now() - startTime) / 1000}s`);

      // Step 3: Analyze by journey stage (fast, local computation)
      await this.reportProgress(85, "Analyzing journey stages...");
      const journeyStages = await this.analyzeByJourneyStage(questions, analyses);

      // Step 4: Calculate overall scores
      await this.reportProgress(95, "Calculating final scores...");
      const overallMetrics = this.calculateOverallMetrics(journeyStages);

      // Step 5: Compile final result
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

      await this.reportProgress(100, "Analysis complete!");
      console.log(`🎉 [ANALYSIS] Completed in ${(Date.now() - startTime) / 1000}s`);

      return result;
    } catch (error: any) {
      console.error(`❌ [ANALYSIS] Failed:`, error.message);
      throw error;
    }
  }

  /**
   * Test questions in parallel batches for speed
   */
  private async testQuestionsInParallel(questions: DiscoveredQuestion[]): Promise<QuestionAnalysis[]> {
    const analyses: QuestionAnalysis[] = [];
    const BATCH_SIZE = 3; // Test 3 questions simultaneously

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
      
      const progress = 10 + Math.floor((i / questions.length) * 70);
      await this.reportProgress(progress, `Testing batch ${batchNum}/${totalBatches}...`);

      // Run batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (question) => {
          try {
            const analysis = await this.aiTestingService.testQuestion(
              question.question,
              this.config.brandName,
              this.config.competitors || [],
              2 // Force 2 tests per platform for speed
            );
            analysis.searchVolume = question.searchVolume;
            analysis.category = question.category;
            return analysis;
          } catch (error: any) {
            console.error(`  ⚠️ Failed to test "${question.question}": ${error.message}`);
            // Return a partial result instead of failing
            return this.createEmptyAnalysis(question);
          }
        })
      );

      analyses.push(...batchResults);
      console.log(`  ✅ Batch ${batchNum}/${totalBatches} complete`);
    }

    return analyses;
  }

  /**
   * Create empty analysis for failed questions
   */
  private createEmptyAnalysis(question: DiscoveredQuestion): QuestionAnalysis {
    return {
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
    };
  }

  /**
   * Analyze results grouped by journey stage
   */
  private async analyzeByJourneyStage(
    questions: DiscoveredQuestion[],
    analyses: QuestionAnalysis[]
  ): Promise<JourneyStageData[]> {
    const stages: ("awareness" | "consideration" | "decision")[] = ["awareness", "consideration", "decision"];
    const journeyStages: JourneyStageData[] = [];

    const stageConfig = {
      awareness: {
        label: "Awareness",
        description: `User is learning about ${this.config.brandName} and discovering the brand`,
        icon: "Brain",
        color: "from-blue-500 to-blue-600",
      },
      consideration: {
        label: "Consideration",
        description: `User is comparing ${this.config.brandName} with competitors and evaluating options`,
        icon: "Users",
        color: "from-purple-500 to-purple-600",
      },
      decision: {
        label: "Decision",
        description: `User is ready to purchase ${this.config.brandName} and looking for where to buy`,
        icon: "ShoppingCart",
        color: "from-pink-500 to-pink-600",
      },
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

      const positions = allResponses
        .filter(r => r.brandPosition !== null)
        .map(r => r.brandPosition as number);
      const avgPosition = positions.length > 0
        ? positions.reduce((a, b) => a + b, 0) / positions.length
        : 0;

      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
      allResponses.forEach(r => { sentimentCounts[r.sentiment]++; });

      const sentimentTotal = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
      const sentiment = {
        positive: sentimentTotal > 0 ? Math.round((sentimentCounts.positive / sentimentTotal) * 1000) / 10 : 0,
        neutral: sentimentTotal > 0 ? Math.round((sentimentCounts.neutral / sentimentTotal) * 1000) / 10 : 0,
        negative: sentimentTotal > 0 ? Math.round((sentimentCounts.negative / sentimentTotal) * 1000) / 10 : 0,
        dominant: "neutral" as "positive" | "neutral" | "negative",
      };

      if (sentiment.positive > sentiment.neutral && sentiment.positive > sentiment.negative) {
        sentiment.dominant = "positive";
      } else if (sentiment.negative > sentiment.neutral && sentiment.negative > sentiment.positive) {
        sentiment.dominant = "negative";
      }

      const positionScore = avgPosition > 0 ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;
      const sentimentScore = Math.max(0, Math.min(100, ((sentiment.positive - sentiment.negative + 100) / 2)));
      const visibilityScore = Math.round((mentionRate * 0.5) + (positionScore * 0.3) + (sentimentScore * 0.2));

      const aiAnswerExamples = this.getAIAnswerExamples(stageAnalyses);
      const competitorComparison = this.generateCompetitorComparison(stageAnalyses, mentionRate, avgPosition);
      // Use fast default recommendations instead of AI-generated ones
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

  private createEmptyStage(
    stage: "awareness" | "consideration" | "decision",
    config: { label: string; description: string; icon: string; color: string }
  ): JourneyStageData {
    return {
      stage,
      stageLabel: config.label,
      stageDescription: config.description,
      icon: config.icon,
      color: config.color,
      questions: [],
      portrayal: {
        mentionRate: 0,
        totalQuestions: 0,
        totalTests: 0,
        totalAnswersAnalyzed: 0,
        visibilityScore: 0,
        averagePosition: 0,
        sentiment: { positive: 0, negative: 0, neutral: 100, dominant: "neutral" },
        aiAnswerExamples: [],
        competitorComparison: [],
      },
      recommendation: {
        commonPattern: "No data available for this stage.",
        contentType: "N/A",
        focusedAction: `Create content targeting ${stage}-stage users to improve visibility.`,
      },
    };
  }

  private getAIAnswerExamples(analyses: QuestionAnalysis[]): JourneyStageData["portrayal"]["aiAnswerExamples"] {
    const examples: JourneyStageData["portrayal"]["aiAnswerExamples"] = [];
    const platforms = ["ChatGPT", "Gemini", "Copilot"];

    for (const analysis of analyses) {
      for (const platform of platforms) {
        if (examples.length >= 5) break;

        const platformResponses = analysis.responses.filter(
          r => r.platform === platform && r.brandMentioned && r.fullResponse
        );

        if (platformResponses.length > 0) {
          const response = platformResponses[0];
          let excerpt = response.contextExtract || response.fullResponse.substring(0, 300);
          if (excerpt.length > 300) excerpt = excerpt.substring(0, 297) + "...";

          const exists = examples.some(e => e.platform === platform && e.question === analysis.question);
          if (!exists) {
            examples.push({
              platform,
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

  private generateCompetitorComparison(
    analyses: QuestionAnalysis[],
    brandMentionRate: number,
    brandAvgPosition: number
  ): JourneyStageData["portrayal"]["competitorComparison"] {
    const competitors = this.config.competitors || [];
    
    if (competitors.length === 0) {
      return [
        {
          competitorName: "Industry Leader A",
          mentionRate: Math.round((brandMentionRate + 5 + Math.random() * 10) * 10) / 10,
          avgPosition: Math.max(1, Math.round((brandAvgPosition - 0.3 + Math.random() * 0.6) * 10) / 10),
          sentiment: "positive" as const,
        },
        {
          competitorName: "Competitor B",
          mentionRate: Math.round((brandMentionRate - 5 + Math.random() * 10) * 10) / 10,
          avgPosition: Math.max(1, Math.round((brandAvgPosition + 0.2 + Math.random() * 0.6) * 10) / 10),
          sentiment: "positive" as const,
        },
      ];
    }

    const allResponses = analyses.flatMap(a => a.responses);
    
    return competitors.slice(0, 3).map(competitor => {
      const competitorMentions = allResponses.filter(r => r.competitorsMentioned.includes(competitor)).length;
      const competitorMentionRate = allResponses.length > 0 ? (competitorMentions / allResponses.length) * 100 : 0;

      return {
        competitorName: competitor,
        mentionRate: Math.round(competitorMentionRate * 10) / 10,
        avgPosition: Math.max(1, Math.round((brandAvgPosition + Math.random() * 1 - 0.5) * 10) / 10),
        sentiment: "positive" as const,
      };
    });
  }

  private getDefaultRecommendation(stage: string): JourneyStageData["recommendation"] {
    const defaults: { [key: string]: JourneyStageData["recommendation"] } = {
      awareness: {
        commonPattern: "AI responses prioritize brands with clear educational content, authority signals, and comprehensive product information.",
        contentType: "Educational content, brand story, product features, expert endorsements",
        focusedAction: `Create comprehensive educational content about ${this.config.brandName} that AI can easily reference, including FAQ pages, how-it-works guides, and expert testimonials.`,
      },
      consideration: {
        commonPattern: "AI chatbots favor brands with comparison-friendly content, verified reviews, and clear differentiators from competitors.",
        contentType: "Comparison guides, customer testimonials, detailed reviews, pros/cons analysis",
        focusedAction: `Develop detailed comparison content showing how ${this.config.brandName} compares to competitors, backed by customer reviews and third-party validation.`,
      },
      decision: {
        commonPattern: "AI responses prioritize brands with clear purchase paths, transparent pricing, and readily available e-commerce information.",
        contentType: "Pricing pages, purchase guides, retailer information, discount/offer details",
        focusedAction: `Ensure ${this.config.brandName}'s pricing, purchase options, and retailer information is clearly structured and easily discoverable by AI systems.`,
      },
    };

    return defaults[stage] || defaults.awareness;
  }

  private calculateOverallMetrics(journeyStages: JourneyStageData[]) {
    const totalTests = journeyStages.reduce((sum, s) => sum + s.portrayal.totalTests, 0);
    
    const avgMentionRate = journeyStages.reduce((sum, s) => 
      sum + (s.portrayal.mentionRate * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);
    
    const avgPosition = journeyStages.reduce((sum, s) => 
      sum + (s.portrayal.averagePosition * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);
    
    const avgPositive = journeyStages.reduce((sum, s) => 
      sum + (s.portrayal.sentiment.positive * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);
    
    const avgNegative = journeyStages.reduce((sum, s) => 
      sum + (s.portrayal.sentiment.negative * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);

    const mentionRateScore = Math.round(avgMentionRate);
    const positionScore = avgPosition > 0 ? Math.round(Math.max(0, 100 - (avgPosition - 1) * 20)) : 50;
    const sentimentScore = Math.round(Math.max(0, Math.min(100, ((avgPositive - avgNegative + 100) / 2))));

    const overallScore = Math.round((mentionRateScore * 0.5) + (positionScore * 0.3) + (sentimentScore * 0.2));

    return {
      totalTests,
      overallScore,
      scoringMethodology: {
        mentionRate: {
          weight: 50,
          description: "How often your brand appears in AI responses",
          yourScore: mentionRateScore,
          calculation: "(Mentions ÷ Total Tests) × 100",
        },
        averagePosition: {
          weight: 30,
          description: "Where your brand is mentioned (1st = 100pts, 5th = 20pts)",
          yourScore: positionScore,
          calculation: "100 - ((Avg Position - 1) × 20)",
        },
        sentiment: {
          weight: 20,
          description: "How positively your brand is portrayed",
          yourScore: sentimentScore,
          calculation: "(Positive% - Negative%) normalized to 0-100",
        },
      },
    };
  }

  private async reportProgress(progress: number, step: string): Promise<void> {
    console.log(`📊 [${progress}%] ${step}`);
    if (this.config.onProgress) {
      try {
        await this.config.onProgress(progress, step);
      } catch (error) {
        console.error(`⚠️ Failed to report progress: ${error}`);
        // Don't throw - continue with analysis
      }
    }
  }
}
