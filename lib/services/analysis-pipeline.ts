import { prisma } from "@/lib/db/prisma";
import { QuestionDiscoveryService } from "./question-discovery-service";
import { BatchAITestingService } from "./batch-ai-testing-service";
import { AIAnalysisEngineJourney } from "./ai-analysis-engine-journey";

export interface AnalysisPipelineConfig {
  analysisId: string;
  brandOrKeyword: string;
  domain?: string;
  competitors?: string[];
  openaiApiKey: string;
  geminiApiKey: string;
  dataForSEOUsername: string;
  dataForSEOPassword: string;
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
    const discoveryService = new QuestionDiscoveryService(
      this.config.dataForSEOUsername,
      this.config.dataForSEOPassword
    );

    const questions = await discoveryService.discoverQuestions(
      this.config.brandOrKeyword,
      100,
      20
    );

    for (const q of questions) {
      await prisma.discoveredQuestion.create({
        data: {
          analysisId: this.config.analysisId,
          question: q.question,
          searchVolume: q.searchVolume,
          difficulty: q.difficulty,
          intent: q.intent,
          category: q.category,
          score: q.score,
        },
      });
    }

    return questions;
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

    const questionsToTest = questions.slice(0, 20);

    for (let i = 0; i < questionsToTest.length; i++) {
      const question = questionsToTest[i];
      const progress = 40 + Math.floor((i / questionsToTest.length) * 30);
      
      await this.updateProgress(
        progress,
        `Testing question ${i + 1}/${questionsToTest.length}: ${question.question.substring(0, 50)}...`
      );

      const results = await testingService.testQuestion(
        question.question,
        this.config.brandOrKeyword,
        5
      );

      for (const result of results) {
        await prisma.aITestResult.create({
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
        });
      }
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
      results: analysis.aiTestResults.filter((r) => r.question === q.question),
    }));

    const stageAnalyses = await analysisEngine.analyzeByJourneyStage(
      this.config.brandOrKeyword,
      questionResults,
      competitors.map(name => ({ competitorName: name }))
    );

    for (const stageAnalysis of stageAnalyses) {
      await prisma.aIInsight.create({
        data: {
          analysisId: this.config.analysisId,
          category: "pattern",
          priority: 1,
          title: `${stageAnalysis.stageLabel} - Patterns Detected`,
          finding: `AI considers: ${stageAnalysis.patterns.commonVariables.join(", ")}`,
          dataEvidence: `${stageAnalysis.totalTests} tests, ${stageAnalysis.mentionRate}% mention rate`,
          aiReasoning: `Content themes: ${stageAnalysis.patterns.contentThemes.join(", ")}`,
          actions: stageAnalysis.patterns.recommendationTriggers,
          expectedImpact: {
            stage: stageAnalysis.stage,
            visibilityScore: stageAnalysis.visibilityScore,
            mentionRate: stageAnalysis.mentionRate,
          },
          effort: "medium",
          timeline: "4-8 weeks",
          confidence: "high",
        },
      });

      for (const insight of stageAnalysis.insights) {
        await prisma.aIInsight.create({
          data: {
            analysisId: this.config.analysisId,
            category: insight.category,
            priority: insight.priority,
            title: `${stageAnalysis.stageLabel} - ${insight.title}`,
            finding: insight.finding,
            dataEvidence: insight.dataEvidence,
            aiReasoning: insight.aiReasoning,
            actions: insight.actions,
            expectedImpact: insight.expectedImpact,
            effort: insight.effort,
            timeline: insight.timeline,
            confidence: insight.confidence,
            correlationScore: insight.correlationScore,
          },
        });
      }
    }

    console.log(`✅ Saved insights for ${stageAnalyses.length} journey stages`);
  }
}
