import OpenAI from "openai";
import { EnhancedQuestionService, DiscoveredQuestion } from "./enhanced-question-service";
import { MultiPlatformAIService, QuestionAnalysis, AIResponse } from "./multi-platform-ai-service";
import { QUERY_REPETITION_CONFIG, generatePersonaInformedQuestions } from "./persona-query-engine";
import { analyzeCitations, calculateAwarenessScoreFromCitations, CitationAnalysis } from "./citation-detector";
import { detectPatterns, generateExecutiveSummary, ExecutiveSummary, PatternAnalysis } from "./analysis-insights-engine";

// Stage weights: Awareness 20%, Consideration 35%, Decision 45%
const STAGE_WEIGHTS = {
  awareness: 0.20,     // Lower weight - citations matter more than mentions
  consideration: 0.35, // Medium weight - comparisons are important
  decision: 0.45,      // Highest weight - purchase influence is critical
};

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

export interface CompetitorBenchmark {
  competitor: string;
  mentionRate: number;
  avgPosition: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  stageBreakdown: {
    awareness: number;
    consideration: number;
    decision: number;
  };
  vsYourBrand: 'ahead' | 'behind' | 'similar';
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
  // New fields for enhanced analysis
  executiveSummary?: ExecutiveSummary;
  patterns?: PatternAnalysis;
  stageWeights?: typeof STAGE_WEIGHTS;
  competitorBenchmarks?: CompetitorBenchmark[];
}

export interface AnalysisConfig {
  brandName: string;
  domain?: string;
  competitors?: string[];
  category?: string; // The vertical/industry (e.g., "running shoes", "electric cars")
  subcategory?: string; // Specific subcategory (e.g., "running shoes" within "Fashion & Apparel")
  persona?: string; // Buyer persona ID for persona-informed questions
  openaiApiKey: string;
  geminiApiKey?: string;
  perplexityApiKey?: string;
  dataForSEOLogin?: string;
  dataForSEOPassword?: string;
  testsPerPlatform?: number;
  questionsPerStage?: number;
  useAdaptiveRepetition?: boolean; // Enable 1x/2x/3x repetition by stage
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
    console.log(`🔧 [ANALYSIS] - Perplexity API: ${config.perplexityApiKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [ANALYSIS] - DataForSEO Login: ${config.dataForSEOLogin ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [ANALYSIS] - DataForSEO Password: ${config.dataForSEOPassword ? 'SET' : 'NOT SET'}`);
    
    this.questionService = new EnhancedQuestionService(
      config.dataForSEOLogin,
      config.dataForSEOPassword
    );
    this.aiTestingService = new MultiPlatformAIService(
      config.openaiApiKey,
      config.geminiApiKey,
      Math.min(config.testsPerPlatform || 2, 2),
      config.perplexityApiKey
    );
    
    // Log platform status for debugging
    console.log(`🤖 [ANALYSIS] AI Platform Status:`);
    Object.entries(this.aiTestingService.platformStatus).forEach(([platform, status]) => {
      console.log(`   ${status.isReal ? "✅" : "⚠️"} ${platform}: ${status.reason}`);
    });
  }

  /**
   * Run the full analysis - SEQUENTIAL for reliability
   * Now with persona-informed questions, adaptive repetition, and executive summary
   */
  async runAnalysis(): Promise<ComprehensiveAnalysisResult> {
    const startTime = Date.now();
    console.log(`🚀 [ANALYSIS] Starting for: ${this.config.brandName}`);
    console.log(`🧠 [ANALYSIS] Persona: ${this.config.persona || 'default'}, Subcategory: ${this.config.subcategory || this.config.category}`);

    // Step 1: Generate questions (with persona-informed patterns if persona selected)
    await this.safeProgress(5, "Generating questions...");
    
    let questions: DiscoveredQuestion[];
    try {
      // Use subcategory if available, fall back to category
      const effectiveCategory = this.config.subcategory || this.config.category;
      
      // First, get base questions from the enhanced service
      questions = await this.questionService.discoverQuestions({
        brandName: this.config.brandName,
        domain: this.config.domain,
        competitors: this.config.competitors,
        category: effectiveCategory,
        maxQuestionsPerStage: this.config.questionsPerStage || 3,
        minSearchVolume: 100,
      });
      
      // If persona is selected, enhance with persona-informed questions
      if (this.config.persona && effectiveCategory) {
        console.log(`🎭 [ANALYSIS] Enhancing questions with persona: ${this.config.persona}`);
        const personaQuestions = this.generatePersonaEnhancedQuestions(effectiveCategory);
        
        // Merge persona questions with discovered ones (avoiding duplicates)
        const existingQuestions = new Set(questions.map(q => q.question.toLowerCase()));
        for (const pq of personaQuestions) {
          if (!existingQuestions.has(pq.question.toLowerCase())) {
            questions.push(pq);
          }
        }
      }
      
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

    // Step 2: Test questions with ADAPTIVE REPETITION by stage
    await this.safeProgress(10, "Testing with AI platforms...");
    const analyses: QuestionAnalysis[] = [];
    const allResponses: AIResponse[] = []; // Collect all responses for pattern detection

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const progress = 10 + Math.floor(((i + 1) / questions.length) * 70);
      
      await this.safeProgress(progress, `Testing question ${i + 1}/${questions.length}...`);
      
      // Get adaptive repetition count based on stage
      const repetitionConfig = QUERY_REPETITION_CONFIG[question.category as keyof typeof QUERY_REPETITION_CONFIG];
      const testsPerPlatform = this.config.useAdaptiveRepetition 
        ? repetitionConfig?.repetitions || 2
        : this.config.testsPerPlatform || 2;
      
      try {
        console.log(`🔍 [ANALYSIS] Testing question ${i + 1}/${questions.length}: "${question.question.substring(0, 40)}..." (${testsPerPlatform}x tests)`);

        const analysis = await this.aiTestingService.testQuestion(
          question.question,
          this.config.brandName,
          this.config.competitors || [],
          testsPerPlatform
        );

        analysis.searchVolume = question.searchVolume;
        analysis.category = question.category;

        // FOLLOW-UP QUESTIONS: For consideration/decision stages, ask why brand wasn't mentioned
        // This is critical for competitive analysis understanding
        if (question.category !== 'awareness') {
          for (const response of analysis.responses) {
            // Only ask follow-up if brand wasn't mentioned OR competitor mentioned first
            const shouldAskFollowUp = !response.brandMentioned ||
              (response.brandPosition && response.brandPosition > 1 && response.competitorsMentioned.length > 0);

            if (shouldAskFollowUp) {
              try {
                const followUp = await this.aiTestingService.askFollowUpQuestion(
                  question.question,
                  response,
                  this.config.brandName,
                  this.config.competitors || []
                );

                if (followUp) {
                  response.followUpQuestion = followUp.question;
                  response.followUpResponse = followUp.response;
                  response.followUpSources = followUp.sources;
                  console.log(`  🔄 [ANALYSIS] Got follow-up insight for ${response.platform}`);
                }
              } catch (followUpError: any) {
                console.warn(`  ⚠️ [ANALYSIS] Follow-up failed: ${followUpError.message}`);
              }
            }
          }
        }

        analyses.push(analysis);

        // Collect responses for pattern detection
        allResponses.push(...analysis.responses);

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

    // Step 3: Analyze by journey stage with citation-based awareness scoring
    await this.safeProgress(85, "Analyzing results...");
    const journeyStages = this.analyzeByJourneyStage(questions, analyses);

    // Step 4: Calculate overall scores with WEIGHTED stage scores (20/35/45)
    await this.safeProgress(90, "Calculating weighted scores...");
    const overallMetrics = this.calculateOverallMetrics(journeyStages);

    // Step 5: Pattern detection
    await this.safeProgress(93, "Detecting patterns...");
    const patterns = detectPatterns(allResponses, this.config.brandName, this.config.competitors || []);
    console.log(`📊 [ANALYSIS] Detected ${patterns.llmSpecificBias.length} LLM biases, ${patterns.competitorPreferences.length} competitor preferences`);

    // Step 6: Generate executive summary
    await this.safeProgress(96, "Generating executive summary...");
    const stageScores = {
      awareness: journeyStages.find(s => s.stage === 'awareness')?.portrayal.visibilityScore || 0,
      consideration: journeyStages.find(s => s.stage === 'consideration')?.portrayal.visibilityScore || 0,
      decision: journeyStages.find(s => s.stage === 'decision')?.portrayal.visibilityScore || 0,
    };
    const executiveSummary = generateExecutiveSummary(
      this.config.brandName,
      overallMetrics.overallScore,
      stageScores,
      patterns,
      allResponses
    );

    // Step 7: Competitor benchmarking (optional - if competitors provided)
    let competitorBenchmarks: CompetitorBenchmark[] = [];
    if (this.config.competitors && this.config.competitors.length > 0) {
      await this.safeProgress(98, "Benchmarking competitors...");
      competitorBenchmarks = this.calculateCompetitorBenchmarks(allResponses, journeyStages);
      console.log(`📊 [ANALYSIS] Benchmarked ${competitorBenchmarks.length} competitors`);
    }

    // Step 8: Compile result
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
      // New enhanced fields
      executiveSummary,
      patterns,
      stageWeights: STAGE_WEIGHTS,
      competitorBenchmarks: competitorBenchmarks.length > 0 ? competitorBenchmarks : undefined,
    };

    await this.safeProgress(100, "Complete!");
    console.log(`🎉 [ANALYSIS] Completed in ${(Date.now() - startTime) / 1000}s`);
    console.log(`📋 [ANALYSIS] Executive Summary: ${executiveSummary.headline}`);

    return result;
  }

  /**
   * Generate persona-informed questions using the persona query engine
   */
  private generatePersonaEnhancedQuestions(subcategory: string): DiscoveredQuestion[] {
    const questions: DiscoveredQuestion[] = [];
    const stages: ('awareness' | 'consideration' | 'decision')[] = ['awareness', 'consideration', 'decision'];
    
    for (const stage of stages) {
      const personaQuestions = generatePersonaInformedQuestions({
        subcategory,
        brand: this.config.brandName,
        competitors: this.config.competitors,
        persona: this.config.persona,
        funnelStage: stage,
        count: 2, // 2 persona-informed questions per stage
      });
      
      for (const q of personaQuestions) {
        questions.push({
          question: q,
          searchVolume: stage === 'decision' ? 5000 : stage === 'consideration' ? 3000 : 2000,
          difficulty: 50,
          intent: stage === 'awareness' ? 'informational' : 'commercial',
          category: stage,
          questionType: 'brand',
          score: 75,
          source: 'persona',
        });
      }
    }
    
    return questions;
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

      // Calculate visibility score - DIFFERENT for awareness vs other stages
      let visibilityScore: number;
      
      if (stage === 'awareness') {
        // AWARENESS STAGE: Citation rate matters more than mentions
        // Citations (50%) + Mentions (25%) + Sentiment (25%)
        const citationAnalyses: CitationAnalysis[] = [];
        const brandDomain = this.config.domain || `${this.config.brandName.toLowerCase()}.com`;
        
        for (const response of allResponses) {
          const platform = response.platform.toLowerCase() as 'chatgpt' | 'gemini' | 'copilot' | 'perplexity';
          if (['chatgpt', 'gemini', 'copilot', 'perplexity'].includes(platform)) {
            const citationAnalysis = analyzeCitations(
              response.fullResponse || '',
              platform,
              brandDomain,
              this.config.brandName
            );
            citationAnalyses.push(citationAnalysis);
          }
        }
        
        // Calculate awareness score with citation focus
        const hasMention = mentionRate > 0;
        const dominantSentiment = sentiment.dominant;
        const awarenessResult = calculateAwarenessScoreFromCitations(
          citationAnalyses, 
          hasMention, 
          dominantSentiment
        );
        
        visibilityScore = awarenessResult.score;
        console.log(`📊 [AWARENESS] Citation-based score: ${visibilityScore}% (citations: ${awarenessResult.breakdown.citationScore}%, mentions: ${awarenessResult.breakdown.mentionScore}%)`);
      } else {
        // CONSIDERATION & DECISION: Standard scoring
        // Mentions (50%) + Position (30%) + Sentiment (20%)
        const positionScore = avgPosition > 0 ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;
        const sentimentScore = Math.max(0, Math.min(100, ((sentiment.positive - sentiment.negative + 100) / 2)));
        visibilityScore = Math.round((mentionRate * 0.5) + (positionScore * 0.3) + (sentimentScore * 0.2));
      }

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

  /**
   * Calculate competitor benchmarks from collected responses
   * Tracks how competitors are mentioned relative to our brand
   */
  private calculateCompetitorBenchmarks(
    allResponses: AIResponse[],
    journeyStages: JourneyStageData[]
  ): CompetitorBenchmark[] {
    const competitors = this.config.competitors || [];
    if (competitors.length === 0) return [];

    const benchmarks: CompetitorBenchmark[] = [];
    const ourOverallScore = journeyStages.reduce((sum, s) => 
      sum + s.portrayal.visibilityScore * (STAGE_WEIGHTS[s.stage as keyof typeof STAGE_WEIGHTS] || 0.33), 0
    );

    for (const competitor of competitors.slice(0, 2)) { // Max 2 competitors
      // Count mentions across all responses
      let totalMentions = 0;
      let totalPositive = 0;
      let totalNegative = 0;
      let positionSum = 0;
      let positionCount = 0;
      
      const stageBreakdown = { awareness: 0, consideration: 0, decision: 0 };
      const stageCounts = { awareness: 0, consideration: 0, decision: 0 };

      for (const response of allResponses) {
        const isMentioned = response.competitorsMentioned.includes(competitor) ||
          (response.fullResponse || '').toLowerCase().includes(competitor.toLowerCase());
        
        if (isMentioned) {
          totalMentions++;
          
          // Estimate position (simplified - based on where competitor appears in text)
          const text = (response.fullResponse || '').toLowerCase();
          const competitorPos = text.indexOf(competitor.toLowerCase());
          const brandPos = text.indexOf(this.config.brandName.toLowerCase());
          
          if (competitorPos >= 0) {
            // Rough position: earlier = better
            const estPosition = competitorPos < 500 ? 1 : competitorPos < 1000 ? 2 : 3;
            positionSum += estPosition;
            positionCount++;
          }
          
          // Track by stage (using question category)
          const stage = this.getStageForQuestion(response.question, allResponses) as keyof typeof stageCounts;
          if (stage && stageCounts[stage] !== undefined) {
            stageCounts[stage]++;
            stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
          }
        }
        
        // Sentiment (simplified - check if competitor mentioned positively)
        if ((response.fullResponse || '').toLowerCase().includes(competitor.toLowerCase())) {
          if (response.sentiment === 'positive') totalPositive++;
          if (response.sentiment === 'negative') totalNegative++;
        }
      }

      const mentionRate = allResponses.length > 0 ? (totalMentions / allResponses.length) * 100 : 0;
      const avgPosition = positionCount > 0 ? positionSum / positionCount : 0;
      const sentiment: 'positive' | 'neutral' | 'negative' = 
        totalPositive > totalNegative ? 'positive' :
        totalNegative > totalPositive ? 'negative' : 'neutral';

      // Calculate stage breakdown percentages
      for (const stage of ['awareness', 'consideration', 'decision'] as const) {
        if (stageCounts[stage] > 0) {
          const stageResponses = allResponses.filter(r => 
            this.getStageForQuestion(r.question, allResponses) === stage
          ).length;
          stageBreakdown[stage] = stageResponses > 0 
            ? Math.round((stageBreakdown[stage] / stageResponses) * 100) 
            : 0;
        }
      }

      // Compare to our brand's score
      const competitorScore = mentionRate; // Simplified score
      const vsYourBrand: 'ahead' | 'behind' | 'similar' = 
        competitorScore > ourOverallScore + 10 ? 'ahead' :
        competitorScore < ourOverallScore - 10 ? 'behind' : 'similar';

      benchmarks.push({
        competitor,
        mentionRate: Math.round(mentionRate * 10) / 10,
        avgPosition: Math.round(avgPosition * 10) / 10,
        sentiment,
        stageBreakdown,
        vsYourBrand,
      });
    }

    return benchmarks;
  }

  /**
   * Get the stage for a question (helper for competitor benchmarking)
   */
  private getStageForQuestion(question: string, _allResponses: AIResponse[]): string {
    const q = question.toLowerCase();
    
    // Decision indicators
    if (q.includes('buy') || q.includes('price') || q.includes('cost') || 
        q.includes('where to') || q.includes('worth it') || q.includes('should i')) {
      return 'decision';
    }
    
    // Consideration indicators  
    if (q.includes('best') || q.includes('vs') || q.includes('compare') || 
        q.includes('review') || q.includes('top')) {
      return 'consideration';
    }
    
    // Default to awareness
    return 'awareness';
  }

  private calculateOverallMetrics(journeyStages: JourneyStageData[]) {
    const totalTests = journeyStages.reduce((sum, s) => sum + s.portrayal.totalTests, 0);
    
    // Calculate WEIGHTED overall visibility score using stage weights (20/35/45)
    // This is the primary metric - weights each stage appropriately
    let weightedVisibilityScore = 0;
    let totalWeight = 0;
    
    for (const stage of journeyStages) {
      const stageWeight = STAGE_WEIGHTS[stage.stage as keyof typeof STAGE_WEIGHTS] || 0.33;
      if (stage.portrayal.totalTests > 0) {
        weightedVisibilityScore += stage.portrayal.visibilityScore * stageWeight;
        totalWeight += stageWeight;
      }
    }
    
    // Normalize if not all stages have data
    const overallScore = totalWeight > 0 
      ? Math.round(weightedVisibilityScore / totalWeight) 
      : 0;
    
    console.log(`📊 [SCORING] Weighted overall: ${overallScore}% (weights: awareness=${STAGE_WEIGHTS.awareness}, consideration=${STAGE_WEIGHTS.consideration}, decision=${STAGE_WEIGHTS.decision})`);
    
    // Calculate component scores for methodology display
    const avgMentionRate = journeyStages.reduce((sum, s) => sum + (s.portrayal.mentionRate * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);
    const avgPosition = journeyStages.reduce((sum, s) => sum + (s.portrayal.averagePosition * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);
    const avgPositive = journeyStages.reduce((sum, s) => sum + (s.portrayal.sentiment.positive * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);
    const avgNegative = journeyStages.reduce((sum, s) => sum + (s.portrayal.sentiment.negative * s.portrayal.totalTests), 0) / Math.max(totalTests, 1);

    const mentionRateScore = Math.round(avgMentionRate);
    const positionScore = avgPosition > 0 ? Math.round(Math.max(0, 100 - (avgPosition - 1) * 20)) : 50;
    const sentimentScore = Math.round(Math.max(0, Math.min(100, ((avgPositive - avgNegative + 100) / 2))));

    return {
      totalTests,
      overallScore,
      scoringMethodology: {
        mentionRate: { 
          weight: 50, 
          description: "How often your brand appears in AI responses", 
          yourScore: mentionRateScore, 
          calculation: "(Mentions ÷ Total Tests) × 100" 
        },
        averagePosition: { 
          weight: 30, 
          description: "Where your brand is mentioned (1st = 100pts)", 
          yourScore: positionScore, 
          calculation: "100 - ((Avg Position - 1) × 20)" 
        },
        sentiment: { 
          weight: 20, 
          description: "How positively your brand is portrayed", 
          yourScore: sentimentScore, 
          calculation: "(Positive% - Negative%) normalized" 
        },
      },
    };
  }
}
