import { prisma } from "@/lib/db/prisma";
import { AhrefsQuestionService } from "./ahrefs-question-service";
import { BatchAITestingService } from "./batch-ai-testing-service";
import { AIAnalysisEngineJourney } from "./ai-analysis-engine-journey";

export interface AnalysisPipelineConfig {
  analysisId: string;
  brandOrKeyword: string;
  domain?: string;
  competitors?: string[];
  openaiApiKey: string;
  geminiApiKey?: string;
  ahrefsApiKey: string;
}

export class AnalysisPipeline {
  private config: AnalysisPipelineConfig;

  constructor(config: AnalysisPipelineConfig) {
    this.config = config;
  }

  async execute() {
    try {
      console.log(`🚀 Starting analysis pipeline for: ${this.config.brandOrKeyword}`);

      await prisma.analysis.update({
        where: { id: this.config.analysisId },
        data: { status: "running", progress: 5 },
      });

      await this.updateProgress(10, "Discovering relevant questions");
      const questions = await this.discoverQuestions();
      console.log(`✅ Discovered ${questions.length} questions`);

      await this.updateProgress(20, "Detecting competitors");
      const competitors = await this.detectCompetitors();
      console.log(`✅ Detected ${competitors.length} competitors`);

      await this.updateProgress(40, "Testing with ChatGPT & Gemini");
      await this.batchTestQuestions(questions);
      console.log(`✅ Batch testing complete`);

      await this.updateProgress(70, "Analyzing patterns by user journey stage");
      await this.runJourneyStageAnalysis(questions, competitors);
      console.log(`✅ Journey stage analysis complete`);

      await this.updateProgress(100, "Analysis complete");
      await prisma.analysis.update({
        where: { id: this.config.analysisId },
        data: { 
          status: "completed",
          completedAt: new Date(),
        },
      });

      console.log(`🎉 Analysis pipeline completed for: ${this.config.brandOrKeyword}`);

    } catch (error: any) {
      console.error("❌ Pipeline execution failed:", error);
      await prisma.analysis.update({
        where: { id: this.config.analysisId },
        data: {
          status: "failed",
          progress: 0,
          currentStep: `Failed: ${error.message}`,
        },
      });
      throw error;
    }
  }

  private async updateProgress(progress: number, currentStep: string) {
    await prisma.analysis.update({
      where: { id: this.config.analysisId },
      data: { progress, currentStep },
    });
  }

  private async discoverQuestions() {
    try {
      console.log(`🔍 Starting question discovery for: ${this.config.brandOrKeyword}`);
      
      if (!this.config.ahrefsApiKey) {
        throw new Error("AHREFS_API_KEY is required but not provided");
      }

      const discoveryService = new AhrefsQuestionService(this.config.ahrefsApiKey);

      // Use Ahrefs for fast discovery - get 12 questions (4 per stage)
      const questions = await discoveryService.discoverQuestions(
        this.config.brandOrKeyword,
        50, // min volume
        12  // max questions (faster!)
      );

      console.log(`✅ Got ${questions.length} questions, saving to database...`);

      // Save to database in parallel
      await Promise.all(
        questions.map(q =>
          prisma.discoveredQuestion.create({
            data: {
              analysisId: this.config.analysisId,
              question: q.question,
              searchVolume: q.searchVolume,
              difficulty: q.difficulty,
              intent: q.intent,
              category: q.category,
              score: q.score,
            },
          })
        )
      );

      console.log(`✅ Questions saved to database`);
      return questions;
      
    } catch (error: any) {
      console.error("❌ Question discovery failed:", error.message);
      throw new Error(`Question discovery failed: ${error.message}`);
    }
  }

  private async detectCompetitors() {
    let competitors: string[] = [];

    if (this.config.competitors && this.config.competitors.length > 0) {
      competitors = this.config.competitors;
    } else {
      competitors = ["Competitor A", "Competitor B"];
    }

    for (const comp of competitors) {
      await prisma.detectedCompetitor.create({
        data: {
          analysisId: this.config.analysisId,
          competitorName: comp,
          domain: comp,
          overlapScore: 0,
        },
      });
    }

    return competitors;
  }

  private async batchTestQuestions(questions: any[]) {
    const testingService = new BatchAITestingService(
      this.config.openaiApiKey,
      this.config.geminiApiKey
    );

    // Test all questions (already limited to 12)
    const questionsToTest = questions;
    const totalQuestions = questionsToTest.length;

    for (let i = 0; i < totalQuestions; i++) {
      const question = questionsToTest[i];
      const progress = 30 + Math.floor((i / totalQuestions) * 50);
      
      await this.updateProgress(
        progress,
        `Testing question ${i + 1}/${totalQuestions}: ${question.question.substring(0, 40)}...`
      );

      // Reduced from 5 to 3 tests per platform for speed
      const results = await testingService.testQuestion(
        question.question,
        this.config.brandOrKeyword,
        3  // Faster! Was 5, now 3
      );

      // Save results in parallel
      await Promise.all(
        results.map(result =>
          prisma.aITestResult.create({
            data: {
              analysisId: this.config.analysisId,
              questionId: null,
              question: question.question,
              platform: result.platform,
              brandMentioned: result.brandMentioned,
              position: result.position,
              sentiment: result.sentiment,
              context: null,
              fullResponse: result.fullResponse,
              citations: [],
            },
          })
        )
      );
    }
  }

  private async runJourneyStageAnalysis(questions: any[], competitors: string[]) {
    const analysisEngine = new AIAnalysisEngineJourney(this.config.openaiApiKey);

    const analysis = await prisma.analysis.findUnique({
      where: { id: this.config.analysisId },
      include: {
        discoveredQuestions: true,
        aiTestResults: true,
      },
    });

    if (!analysis) {
      throw new Error("Analysis not found");
    }

    const questionResults = analysis.discoveredQuestions.map((q) => ({
      question: q.question,
      searchVolume: q.searchVolume,
      category: q.category,
      results: analysis.aiTestResults.filter((r) => r.question === q.question) as any,
    }));

    const stageAnalyses = await analysisEngine.analyzeByJourneyStage(
      this.config.brandOrKeyword,
      questionResults,
      competitors.map(name => ({ competitorName: name }))
    );

    // Save each journey stage analysis as structured insights
    for (const stageAnalysis of stageAnalyses) {
      // Save the full stage data as a single "journey_stage" insight
      await prisma.aIInsight.create({
        data: {
          analysisId: this.config.analysisId,
          category: "journey_stage",
          priority: stageAnalysis.stage === "awareness" ? 1 : stageAnalysis.stage === "consideration" ? 2 : 3,
          title: `${stageAnalysis.stageLabel} Analysis`,
          finding: stageAnalysis.recommendation.commonPattern,
          dataEvidence: `${stageAnalysis.portrayal.totalTests} tests, ${stageAnalysis.portrayal.mentionRate}% mention rate`,
          aiReasoning: stageAnalysis.recommendation.contentType,
          actions: [stageAnalysis.recommendation.focusedAction],
          expectedImpact: {
            stage: stageAnalysis.stage,
            stageLabel: stageAnalysis.stageLabel,
            questions: stageAnalysis.questions,
            portrayal: stageAnalysis.portrayal,
            recommendation: stageAnalysis.recommendation,
          },
          effort: "medium",
          timeline: "4-8 weeks",
          confidence: "high",
        },
      });
    }

    console.log(`✅ Saved ${stageAnalyses.length} journey stage analyses`);
  }
}
