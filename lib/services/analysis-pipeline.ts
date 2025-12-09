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
    const startTime = Date.now();
    console.log(`🚀 [PIPELINE] Starting analysis for: ${this.config.brandOrKeyword} (ID: ${this.config.analysisId})`);

    try {
      // Step 1: Update status to running
      console.log(`📊 [PIPELINE] Setting status to 'running', progress to 5%`);
      await prisma.analysis.update({
        where: { id: this.config.analysisId },
        data: { status: "running", progress: 5, currentStep: "Initializing..." },
      });
      console.log(`✅ [PIPELINE] Status updated successfully`);

      // Step 2: Discover questions
      console.log(`📊 [PIPELINE] Step 2/5: Discovering questions`);
      await this.updateProgress(10, "Discovering relevant questions");
      const questions = await this.discoverQuestions();
      console.log(`✅ [PIPELINE] Discovered ${questions.length} questions in ${Date.now() - startTime}ms`);

      // Step 3: Detect competitors
      console.log(`📊 [PIPELINE] Step 3/5: Detecting competitors`);
      await this.updateProgress(20, "Detecting competitors");
      const competitors = await this.detectCompetitors();
      console.log(`✅ [PIPELINE] Detected ${competitors.length} competitors in ${Date.now() - startTime}ms`);

      // Step 4: Batch test questions
      console.log(`📊 [PIPELINE] Step 4/5: Testing with ChatGPT`);
      await this.updateProgress(30, "Testing with ChatGPT");
      await this.batchTestQuestions(questions);
      console.log(`✅ [PIPELINE] Batch testing complete in ${Date.now() - startTime}ms`);

      // Step 5: Journey stage analysis
      console.log(`📊 [PIPELINE] Step 5/5: Analyzing patterns by user journey stage`);
      await this.updateProgress(80, "Analyzing patterns by user journey stage");
      await this.runJourneyStageAnalysis(questions, competitors);
      console.log(`✅ [PIPELINE] Journey stage analysis complete in ${Date.now() - startTime}ms`);

      // Final: Mark as completed
      console.log(`📊 [PIPELINE] Marking as completed`);
      await this.updateProgress(100, "Analysis complete");
      await prisma.analysis.update({
        where: { id: this.config.analysisId },
        data: { 
          status: "completed",
          completedAt: new Date(),
          progress: 100,
          currentStep: "Complete!",
        },
      });

      const totalTime = (Date.now() - startTime) / 1000;
      console.log(`🎉 [PIPELINE] Analysis completed successfully in ${totalTime.toFixed(1)}s for: ${this.config.brandOrKeyword}`);

    } catch (error: any) {
      const totalTime = (Date.now() - startTime) / 1000;
      console.error(`❌ [PIPELINE] Execution failed after ${totalTime.toFixed(1)}s:`, error);
      console.error(`❌ [PIPELINE] Error message:`, error.message);
      console.error(`❌ [PIPELINE] Error stack:`, error.stack);
      
      try {
        await prisma.analysis.update({
          where: { id: this.config.analysisId },
          data: {
            status: "failed",
            progress: 0,
            currentStep: `Failed: ${error.message}`,
          },
        });
        console.log(`✅ [PIPELINE] Error status saved to database`);
      } catch (dbError: any) {
        console.error(`❌ [PIPELINE] Failed to update error status in database:`, dbError);
      }
      
      throw error;
    }
  }

  private async updateProgress(progress: number, currentStep: string) {
    try {
      console.log(`📊 [PROGRESS] ${progress}% - ${currentStep}`);
      await prisma.analysis.update({
        where: { id: this.config.analysisId },
        data: { progress, currentStep },
      });
      console.log(`✅ [PROGRESS] Updated successfully`);
    } catch (error: any) {
      console.error(`❌ [PROGRESS] Failed to update progress:`, error);
      throw error;
    }
  }

  private async discoverQuestions() {
    const stepStart = Date.now();
    try {
      console.log(`🔍 [QUESTIONS] Discovering questions using Ahrefs API for: ${this.config.brandOrKeyword}`);
      
      // Use Ahrefs API to discover questions with search volume
      if (!this.config.ahrefsApiKey || this.config.ahrefsApiKey === "") {
        throw new Error("AHREFS_API_KEY is required. Please set it in your environment variables.");
      }

      const ahrefsService = new AhrefsQuestionService(this.config.ahrefsApiKey);
      
      // Discover questions - get top 12 questions with highest search volume, grouped by stage
      const questions = await ahrefsService.discoverQuestions(
        this.config.brandOrKeyword,
        50, // minVolume
        12  // maxQuestions (4 per stage)
      );

      console.log(`✅ [QUESTIONS] Discovered ${questions.length} questions from Ahrefs in ${Date.now() - stepStart}ms`);

      // Save to database in parallel
      console.log(`📝 [QUESTIONS] Saving to database...`);
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

      const stepTime = Date.now() - stepStart;
      console.log(`✅ [QUESTIONS] Questions saved to database in ${stepTime}ms`);
      return questions;
      
    } catch (error: any) {
      console.error(`❌ [QUESTIONS] Question discovery failed:`, error.message);
      console.error(`❌ [QUESTIONS] Stack:`, error.stack);
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
    const stepStart = Date.now();
    console.log(`🤖 [TESTING] Starting batch testing for ${questions.length} questions`);
    
    const testingService = new BatchAITestingService(
      this.config.openaiApiKey,
      this.config.geminiApiKey
    );

    // Test all 9 questions
    const questionsToTest = questions;
    const totalQuestions = questionsToTest.length;

    for (let i = 0; i < totalQuestions; i++) {
      const question = questionsToTest[i];
      const progress = 30 + Math.floor((i / totalQuestions) * 50);
      
      console.log(`🤖 [TESTING] Testing question ${i + 1}/${totalQuestions}: "${question.question}"`);
      
      await this.updateProgress(
        progress,
        `Testing ${i + 1}/${totalQuestions}: ${question.question.substring(0, 35)}...`
      );

      try {
        // Statistical significance: 15 tests per question across 3 platforms (5 per platform)
        const results = await testingService.testQuestion(
          question.question,
          this.config.brandOrKeyword,
          15  // 15 tests total (5 ChatGPT + 5 Gemini + 5 Copilot)
        );

        console.log(`✅ [TESTING] Got ${results.length} results for question ${i + 1}`);

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

        console.log(`✅ [TESTING] Saved results for question ${i + 1}`);
      } catch (error: any) {
        console.error(`❌ [TESTING] Failed to test question ${i + 1}:`, error.message);
        // Continue with other questions even if one fails
      }
    }

    const stepTime = Date.now() - stepStart;
    console.log(`✅ [TESTING] Batch testing complete in ${stepTime}ms`);
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
            stageDescription: stageAnalysis.stageDescription,
            icon: stageAnalysis.icon,
            color: stageAnalysis.color,
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
