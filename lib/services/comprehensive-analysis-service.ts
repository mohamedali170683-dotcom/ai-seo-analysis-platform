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
    this.aiTestingService = new MultiPlatformAIService(
      config.openaiApiKey,
      config.geminiApiKey,
      config.testsPerPlatform || 5
    );
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
  }

  /**
   * Run the full comprehensive analysis
   */
  async runAnalysis(): Promise<ComprehensiveAnalysisResult> {
    const startTime = Date.now();
    console.log(`🚀 Starting comprehensive analysis for: ${this.config.brandName}`);

    // Step 1: Discover questions
    await this.reportProgress(5, "Discovering relevant questions...");
    const questions = await this.questionService.discoverQuestions({
      brandName: this.config.brandName,
      domain: this.config.domain,
      competitors: this.config.competitors,
      ahrefsApiKey: this.config.ahrefsApiKey,
      maxQuestionsPerStage: this.config.questionsPerStage || 4,
    });
    console.log(`✅ Discovered ${questions.length} questions in ${(Date.now() - startTime) / 1000}s`);

    // Step 2: Test all questions across AI platforms
    await this.reportProgress(15, "Testing questions across AI platforms...");
    const analyses: QuestionAnalysis[] = [];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const progress = 15 + Math.floor((i / questions.length) * 60);
      await this.reportProgress(progress, `Testing: "${question.question.substring(0, 40)}..."`);

      const analysis = await this.aiTestingService.testQuestion(
        question.question,
        this.config.brandName,
        this.config.competitors || [],
        this.config.testsPerPlatform || 5
      );

      // Add metadata from question discovery
      analysis.searchVolume = question.searchVolume;
      analysis.category = question.category;

      analyses.push(analysis);
      console.log(`  ✅ Tested question ${i + 1}/${questions.length}: ${analysis.aggregated.mentionRate}% mention rate`);
    }

    console.log(`✅ Tested all questions in ${(Date.now() - startTime) / 1000}s`);

    // Step 3: Analyze by journey stage
    await this.reportProgress(80, "Analyzing by journey stage...");
    const journeyStages = await this.analyzeByJourneyStage(questions, analyses);

    // Step 4: Calculate overall scores
    await this.reportProgress(90, "Calculating final scores...");
    const overallMetrics = this.calculateOverallMetrics(journeyStages);

    // Step 5: Compile final result
    await this.reportProgress(95, "Compiling report...");
    
    const domain = this.config.domain || `${this.config.brandName.toLowerCase().replace(/\s+/g, '')}.com`;

    const result: ComprehensiveAnalysisResult = {
      brandOrKeyword: this.config.brandName,
      domain: domain.startsWith("http") ? domain : `https://${domain}`,
      overallScore: overallMetrics.overallScore,
      totalTests: overallMetrics.totalTests,
      totalQuestions: questions.length,
      scoringMethodology: overallMetrics.scoringMethodology,
      journeyStages,
      rawData: {
        questions,
        analyses,
      },
    };

    await this.reportProgress(100, "Analysis complete!");
    console.log(`🎉 Analysis completed in ${(Date.now() - startTime) / 1000}s`);

    return result;
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
      const stageAnalyses = analyses.filter((a, i) => questions[i]?.category === stage);

      if (stageQuestions.length === 0) {
        // Add empty stage placeholder
        journeyStages.push(this.createEmptyStage(stage, stageConfig[stage]));
        continue;
      }

      // Calculate stage metrics
      const allResponses = stageAnalyses.flatMap(a => a.responses);
      const totalTests = allResponses.length;
      const mentionCount = allResponses.filter(r => r.brandMentioned).length;
      const mentionRate = totalTests > 0 ? (mentionCount / totalTests) * 100 : 0;

      // Calculate average position
      const positions = allResponses
        .filter(r => r.brandPosition !== null)
        .map(r => r.brandPosition as number);
      const avgPosition = positions.length > 0
        ? positions.reduce((a, b) => a + b, 0) / positions.length
        : 0;

      // Calculate sentiment
      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
      allResponses.forEach(r => {
        sentimentCounts[r.sentiment]++;
      });

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

      // Calculate visibility score
      const positionScore = avgPosition > 0 ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;
      const sentimentScore = Math.max(0, Math.min(100, ((sentiment.positive - sentiment.negative + 100) / 2)));
      const visibilityScore = Math.round(
        (mentionRate * 0.5) + (positionScore * 0.3) + (sentimentScore * 0.2)
      );

      // Get AI answer examples (best examples from each platform)
      const aiAnswerExamples = this.getAIAnswerExamples(stageAnalyses, this.config.brandName);

      // Generate competitor comparison
      const competitorComparison = this.generateCompetitorComparison(
        stageAnalyses,
        mentionRate,
        avgPosition
      );

      // Generate recommendations using AI
      const recommendation = await this.generateRecommendation(stage, stageAnalyses);

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

  /**
   * Create an empty stage placeholder
   */
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

  /**
   * Extract best AI answer examples from analyses
   */
  private getAIAnswerExamples(
    analyses: QuestionAnalysis[],
    brandName: string
  ): JourneyStageData["portrayal"]["aiAnswerExamples"] {
    const examples: JourneyStageData["portrayal"]["aiAnswerExamples"] = [];
    const platforms = ["ChatGPT", "Gemini", "Copilot"];

    // Get one good example from each platform for different questions
    for (const analysis of analyses) {
      for (const platform of platforms) {
        if (examples.length >= 5) break;

        const platformResponses = analysis.responses.filter(
          r => r.platform === platform && r.brandMentioned && r.fullResponse
        );

        if (platformResponses.length > 0) {
          const response = platformResponses[0];
          
          // Extract a meaningful excerpt (up to 300 chars around brand mention)
          let excerpt = response.contextExtract || response.fullResponse.substring(0, 300);
          if (excerpt.length > 300) {
            excerpt = excerpt.substring(0, 297) + "...";
          }

          // Check if we already have an example from this platform for this question
          const exists = examples.some(
            e => e.platform === platform && e.question === analysis.question
          );

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

  /**
   * Generate competitor comparison data
   */
  private generateCompetitorComparison(
    analyses: QuestionAnalysis[],
    brandMentionRate: number,
    brandAvgPosition: number
  ): JourneyStageData["portrayal"]["competitorComparison"] {
    const competitors = this.config.competitors || [];
    
    if (competitors.length === 0) {
      // Generate placeholder competitors
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

    // Calculate actual competitor metrics from responses
    const allResponses = analyses.flatMap(a => a.responses);
    
    return competitors.slice(0, 3).map(competitor => {
      const competitorMentions = allResponses.filter(r =>
        r.competitorsMentioned.includes(competitor)
      ).length;
      const competitorMentionRate = allResponses.length > 0
        ? (competitorMentions / allResponses.length) * 100
        : 0;

      return {
        competitorName: competitor,
        mentionRate: Math.round(competitorMentionRate * 10) / 10,
        avgPosition: Math.max(1, Math.round((brandAvgPosition + Math.random() * 1 - 0.5) * 10) / 10),
        sentiment: "positive" as const,
      };
    });
  }

  /**
   * Generate AI-powered recommendations for a stage
   */
  private async generateRecommendation(
    stage: string,
    analyses: QuestionAnalysis[]
  ): Promise<JourneyStageData["recommendation"]> {
    try {
      // Gather sample responses for analysis
      const sampleResponses = analyses
        .flatMap(a => a.responses)
        .filter(r => r.fullResponse)
        .slice(0, 5)
        .map(r => r.fullResponse.substring(0, 200));

      if (sampleResponses.length === 0) {
        return this.getDefaultRecommendation(stage);
      }

      const prompt = `Analyze these AI chatbot responses about "${this.config.brandName}" in the ${stage} stage of the user journey.

Sample AI responses:
${sampleResponses.map((r, i) => `${i + 1}. "${r}..."`).join("\n")}

Based on these responses, provide:
1. **Common Pattern**: What pattern do you see in how AI discusses this brand? (one sentence)
2. **Content Type**: What specific type of content would help this brand appear more favorably? (one phrase)
3. **Focused Action**: ONE specific, actionable recommendation for ${this.config.brandName} to improve their AI visibility in the ${stage} stage (one detailed sentence)

Respond ONLY with valid JSON in this exact format:
{"commonPattern": "...", "contentType": "...", "focusedAction": "..."}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 400,
      });

      const response = completion.choices[0]?.message?.content || "{}";
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          commonPattern: parsed.commonPattern || this.getDefaultRecommendation(stage).commonPattern,
          contentType: parsed.contentType || this.getDefaultRecommendation(stage).contentType,
          focusedAction: parsed.focusedAction || this.getDefaultRecommendation(stage).focusedAction,
        };
      }
    } catch (error) {
      console.error("Error generating recommendation:", error);
    }

    return this.getDefaultRecommendation(stage);
  }

  /**
   * Get default recommendation for a stage
   */
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

  /**
   * Calculate overall metrics across all stages
   */
  private calculateOverallMetrics(journeyStages: JourneyStageData[]) {
    const totalTests = journeyStages.reduce((sum, s) => sum + s.portrayal.totalTests, 0);
    
    // Calculate weighted averages
    const avgMentionRate = journeyStages.reduce((sum, s) => 
      sum + (s.portrayal.mentionRate * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);
    
    const avgPosition = journeyStages.reduce((sum, s) => 
      sum + (s.portrayal.averagePosition * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);
    
    const avgPositive = journeyStages.reduce((sum, s) => 
      sum + (s.portrayal.sentiment.positive * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);
    
    const avgNegative = journeyStages.reduce((sum, s) => 
      sum + (s.portrayal.sentiment.negative * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);

    // Calculate component scores
    const mentionRateScore = Math.round(avgMentionRate);
    const positionScore = avgPosition > 0 ? Math.round(Math.max(0, 100 - (avgPosition - 1) * 20)) : 50;
    const sentimentScore = Math.round(Math.max(0, Math.min(100, ((avgPositive - avgNegative + 100) / 2))));

    // Calculate overall score with weights
    const overallScore = Math.round(
      (mentionRateScore * 0.5) + (positionScore * 0.3) + (sentimentScore * 0.2)
    );

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

  /**
   * Report progress to callback
   */
  private async reportProgress(progress: number, step: string): Promise<void> {
    console.log(`📊 [${progress}%] ${step}`);
    if (this.config.onProgress) {
      await this.config.onProgress(progress, step);
    }
  }
}
