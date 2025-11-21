import { prisma } from "@/lib/db/prisma";
import { QuestionDiscoveryService } from "./question-discovery-service";
import { CompetitorDetectionService } from "./competitor-detection-service";
import { BatchAITestingService } from "./batch-ai-testing-service";
import { AIAnalysisEngine } from "./ai-analysis-engine";

export interface AnalysisPipelineConfig {
  analysisId: string;
  brandOrKeyword: string;
  domain: string;
  competitors?: string;
  userId: string;
}

export class AnalysisPipeline {
  private config: AnalysisPipelineConfig;

  constructor(config: AnalysisPipelineConfig) {
    this.config = config;
  }

  /**
   * Run the complete analysis pipeline
   */
  async execute() {
    try {
      // Step 1: Update status to discovering
      await this.updateProgress("discovering", 10);

      // Step 2: Discover questions
      const questions = await this.discoverQuestions();
      await this.updateProgress("discovering", 25);

      // Step 3: Detect competitors
      const competitors = await this.detectCompetitors();
      await this.updateProgress("discovering", 35);

      // Step 4: Batch AI testing
      await this.updateProgress("testing", 40);
      const testResults = await this.batchTestQuestions(questions);
      await this.updateProgress("testing", 75);

      // Step 5: AI Analysis
      await this.updateProgress("analyzing", 80);
      const insights = await this.analyzeResults(testResults, competitors);
      await this.updateProgress("analyzing", 90);

      // Step 6: Calculate overall score
      const overallScore = this.calculateOverallScore(testResults);
      await this.updateProgress("analyzing", 95);

      // Step 7: Mark as completed
      await prisma.analysis.update({
        where: { id: this.config.analysisId },
        data: {
          status: "completed",
          progress: 100,
          overallScore,
          completedAt: new Date(),
        },
      });

      return {
        success: true,
        analysisId: this.config.analysisId,
        overallScore,
      };
    } catch (error: any) {
      console.error("Pipeline execution error:", error);

      // Mark as failed
      await prisma.analysis.update({
        where: { id: this.config.analysisId },
        data: {
          status: "failed",
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Step 1: Discover relevant questions
   */
  private async discoverQuestions() {
    const questionService = new QuestionDiscoveryService(
      process.env.DATAFORSEO_LOGIN!,
      process.env.DATAFORSEO_PASSWORD!
    );

    const discovered = await questionService.discoverQuestions(
      this.config.brandOrKeyword,
      100, // minimum volume
      50 // max questions
    );

    // Save to database
    for (const q of discovered) {
      await prisma.discoveredQuestion.create({
        data: {
          analysisId: this.config.analysisId,
          question: q.question,
          searchVolume: q.searchVolume,
          difficulty: q.difficulty,
          commercialIntent: q.commercialIntent,
          category: q.category,
          source: "dataforseo",
        },
      });
    }

    return discovered;
  }

  /**
   * Step 2: Detect competitors
   */
  private async detectCompetitors() {
    const competitorService = new CompetitorDetectionService(
      process.env.OPENAI_API_KEY!
    );

    const detected = await competitorService.detectCompetitors(
      this.config.brandOrKeyword,
      this.config.domain,
      this.config.competitors
    );

    // Save to database
    for (const comp of detected) {
      await prisma.detectedCompetitor.create({
        data: {
          analysisId: this.config.analysisId,
          competitorName: comp.name,
          domain: comp.domain,
          detectionMethod: comp.reason.includes("User-specified")
            ? "user_provided"
            : "ai_detected",
        },
      });
    }

    return detected;
  }

  /**
   * Step 3: Batch test questions with AI
   */
  private async batchTestQuestions(questions: any[]) {
    const testingService = new BatchAITestingService(
      process.env.OPENAI_API_KEY!,
      process.env.GEMINI_API_KEY
    );

    const allResults: any[] = [];

       // Test each question (limit to 3 for Hobby plan speed - completes in ~30-45 seconds)
    const questionsToTest = questions.slice(0, 3);

    for (let i = 0; i < questionsToTest.length; i++) {
      const question = questionsToTest[i];

      try {
        // Test 3 times per platform for speed (still provides good data)
        const results = await testingService.testQuestion(
          question.question,
          this.config.brandOrKeyword,
          3 // tests per platform (3 ChatGPT + 0 Gemini = 9 total queries)
        );

        // Get question ID from database
        const dbQuestion = await prisma.discoveredQuestion.findFirst({
          where: {
            analysisId: this.config.analysisId,
            question: question.question,
          },
        });

        if (dbQuestion) {
          // Save results to database
          for (const result of results) {
            await prisma.aITestResult.create({
              data: {
                analysisId: this.config.analysisId,
                questionId: dbQuestion.id,
                platform: result.platform,
                modelVersion: result.modelVersion,
                queryNumber: result.queryNumber,
                brandMentioned: result.brandMentioned,
                position: result.position,
                contextExtract: result.contextExtract,
                sentiment: result.sentiment,
                recommendationType: result.recommendationType,
                citedUrls: result.citedUrls.length > 0 ? result.citedUrls : undefined,
                fullResponse: result.fullResponse,
              },
            });
          }

          allResults.push({
            question: question.question,
            searchVolume: question.searchVolume,
            category: question.category || "general",
            results,
          });
        }

        // Update progress
        const progress = 40 + Math.floor((i / questionsToTest.length) * 35);
        await this.updateProgress("testing", progress);

        // Small delay to avoid rate limits
        await this.delay(2000);
      } catch (error) {
        console.error(`Error testing question "${question.question}":`, error);
        // Continue with next question
      }
    }

    return allResults;
  }

  /**
   * Step 4: Analyze results with AI
   */
  private async analyzeResults(testResults: any[], competitors: any[]) {
    const analysisEngine = new AIAnalysisEngine(process.env.OPENAI_API_KEY!);

    const insights = await analysisEngine.analyzeResults(
      this.config.brandOrKeyword,
      testResults,
      competitors
    );

    // Save insights to database
    for (const insight of insights) {
      await prisma.aIInsight.create({
        data: {
          analysisId: this.config.analysisId,
          category: insight.category,
          priority: insight.priority,
          title: insight.title,
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

    return insights;
  }

  /**
   * Calculate overall visibility score
   */
  private calculateOverallScore(testResults: any[]): number {
    if (testResults.length === 0) return 0;

    const totalTests = testResults.reduce((sum, q) => sum + q.results.length, 0);
    const totalMentions = testResults.reduce(
      (sum, q) => sum + q.results.filter((r: any) => r.brandMentioned).length,
      0
    );

    const mentionRate = (totalMentions / totalTests) * 100;

    // Get average position (only for mentions)
    const positions = testResults
      .flatMap((q) => q.results)
      .filter((r: any) => r.position !== null)
      .map((r: any) => r.position);

    const avgPosition =
      positions.length > 0
        ? positions.reduce((a: number, b: number) => a + b, 0) / positions.length
        : 5;

    // Calculate score (0-100)
    // Formula: mention rate * 0.7 + (position score) * 0.3
    const positionScore = Math.max(0, 100 - (avgPosition - 1) * 20);

    const overallScore = mentionRate * 0.7 + positionScore * 0.3;

    return Math.min(100, Math.max(0, overallScore));
  }

  /**
   * Update progress in database
   */
  private async updateProgress(status: string, progress: number) {
    await prisma.analysis.update({
      where: { id: this.config.analysisId },
      data: { status, progress },
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
