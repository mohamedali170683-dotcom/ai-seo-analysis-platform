import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { prisma } from "@/lib/db/prisma";
import { MultiPlatformAIService } from "@/lib/services/multi-platform-ai-service";

export const maxDuration = 300; // 5 minutes for longer analyses

interface SelectedQuestion {
  question: string;
  searchVolume: number;
  category: "awareness" | "consideration" | "decision";
  type: "brand" | "category";
}

interface AnalysisRequest {
  brandName: string;
  domain?: string;
  competitors?: string[];
  category: string;
  selectedQuestions: SelectedQuestion[];
  selectedPlatforms: ("ChatGPT" | "Gemini" | "Copilot")[];
  testsPerPlatform?: number; // Default 3 for statistical significance
}

/**
 * Phase 2: Run analysis on user-selected questions and platforms
 */
export async function POST(request: Request) {
  try {
    const body: AnalysisRequest = await request.json();
    const {
      brandName,
      domain,
      competitors = [],
      category,
      selectedQuestions,
      selectedPlatforms,
      testsPerPlatform = 3,
    } = body;

    // Validation
    if (!brandName) {
      return NextResponse.json(
        { success: false, error: "Brand name is required" },
        { status: 400 }
      );
    }

    if (!selectedQuestions || selectedQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least 1 question must be selected" },
        { status: 400 }
      );
    }

    if (selectedQuestions.length > 10) {
      return NextResponse.json(
        { success: false, error: "Maximum 10 questions allowed" },
        { status: 400 }
      );
    }

    if (!selectedPlatforms || selectedPlatforms.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least 1 platform must be selected" },
        { status: 400 }
      );
    }

    // Validate platforms
    const validPlatforms = ["ChatGPT", "Gemini", "Copilot"];
    for (const platform of selectedPlatforms) {
      if (!validPlatforms.includes(platform)) {
        return NextResponse.json(
          { success: false, error: `Invalid platform: ${platform}` },
          { status: 400 }
        );
      }
    }

    console.log(`🚀 [RUN-SELECTED] Starting analysis:`);
    console.log(`   Brand: ${brandName}`);
    console.log(`   Questions: ${selectedQuestions.length}`);
    console.log(`   Platforms: ${selectedPlatforms.join(", ")}`);
    console.log(`   Tests per platform: ${testsPerPlatform}`);

    // Calculate total API calls
    const totalCalls = selectedQuestions.length * selectedPlatforms.length * testsPerPlatform;
    console.log(`   Total AI calls: ${totalCalls}`);

    // Get or create anonymous user for unauthenticated requests
    let user = await prisma.user.findFirst({
      where: { email: "anonymous@ai-seo-analysis.com" }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "anonymous@ai-seo-analysis.com",
          name: "Anonymous User",
        }
      });
    }
    
    // Create analysis record
    const analysis = await prisma.analysis.create({
      data: {
        userId: user.id,
        brandOrKeyword: brandName,
        domain: domain || "",
        competitors: competitors,
        status: "running",
        progress: 0,
        currentStep: "Starting analysis...",
      },
    });

    console.log(`✅ [RUN-SELECTED] Created analysis ${analysis.id}`);

    // Capture env vars for waitUntil
    const envVars = {
      openaiApiKey: process.env.OPENAI_API_KEY!,
      geminiApiKey: process.env.GEMINI_API_KEY,
    };

    // Run analysis in background
    waitUntil(
      executeSelectedAnalysis(
        analysis.id,
        brandName,
        competitors,
        category,
        selectedQuestions,
        selectedPlatforms,
        testsPerPlatform,
        envVars
      )
    );

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      message: "Analysis started",
      config: {
        questions: selectedQuestions.length,
        platforms: selectedPlatforms.length,
        testsPerPlatform,
        totalAICalls: totalCalls,
        estimatedTime: `${Math.ceil(totalCalls * 3 / 60)} minutes`,
      },
    });

  } catch (error: any) {
    console.error("❌ [RUN-SELECTED] Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function executeSelectedAnalysis(
  analysisId: string,
  brandName: string,
  competitors: string[],
  category: string,
  selectedQuestions: SelectedQuestion[],
  selectedPlatforms: ("ChatGPT" | "Gemini" | "Copilot")[],
  testsPerPlatform: number,
  envVars: { openaiApiKey: string; geminiApiKey?: string }
) {
  const startTime = Date.now();
  console.log(`🔄 [EXEC] Starting execution for ${analysisId}`);

  try {
    // Initialize AI service
    const aiService = new MultiPlatformAIService(
      envVars.openaiApiKey,
      envVars.geminiApiKey,
      testsPerPlatform
    );

    // Progress tracking
    const updateProgress = async (progress: number, step: string) => {
      try {
        await prisma.analysis.update({
          where: { id: analysisId },
          data: { progress, currentStep: step },
        });
      } catch (e) {
        console.error(`⚠️ [EXEC] Progress update failed: ${e}`);
      }
    };

    await updateProgress(5, "Initializing...");

    // Test each question
    const allResults: any[] = [];
    const totalQuestions = selectedQuestions.length;

    for (let i = 0; i < totalQuestions; i++) {
      const question = selectedQuestions[i];
      const progress = 5 + Math.floor(((i + 1) / totalQuestions) * 80);
      
      await updateProgress(progress, `Testing question ${i + 1}/${totalQuestions}: "${question.question.substring(0, 30)}..."`);
      
      console.log(`🤖 [EXEC] Testing: "${question.question}"`);

      try {
        // Test on selected platforms only
        const analysis = await aiService.testQuestionOnPlatforms(
          question.question,
          brandName,
          competitors,
          selectedPlatforms,
          testsPerPlatform
        );

        allResults.push({
          questionText: question.question,
          questionSearchVolume: question.searchVolume,
          questionCategory: question.category,
          questionType: question.type,
          ...analysis,
        });

      } catch (error: any) {
        console.error(`⚠️ [EXEC] Question failed: ${error.message}`);
        allResults.push({
          questionText: question.question,
          questionSearchVolume: question.searchVolume,
          questionCategory: question.category,
          questionType: question.type,
          error: error.message,
          responses: [],
          totalResponses: 0,
        });
      }
    }

    await updateProgress(90, "Calculating results...");

    // Calculate aggregate metrics
    const successfulResults = allResults.filter(r => !r.error);
    const totalResponses = successfulResults.reduce((sum, r) => sum + (r.totalResponses || 0), 0);
    const totalMentions = successfulResults.reduce((sum, r) => {
      return sum + (r.responses?.filter((resp: any) => resp.brandMentioned)?.length || 0);
    }, 0);

    const overallMentionRate = totalResponses > 0 ? (totalMentions / totalResponses) * 100 : 0;

    // Calculate sentiment
    let positiveCount = 0, neutralCount = 0, negativeCount = 0;
    successfulResults.forEach(r => {
      r.responses?.forEach((resp: any) => {
        if (resp.sentiment === "positive") positiveCount++;
        else if (resp.sentiment === "negative") negativeCount++;
        else neutralCount++;
      });
    });

    const totalSentiment = positiveCount + neutralCount + negativeCount;
    const sentimentBreakdown = {
      positive: totalSentiment > 0 ? Math.round((positiveCount / totalSentiment) * 100) : 0,
      neutral: totalSentiment > 0 ? Math.round((neutralCount / totalSentiment) * 100) : 0,
      negative: totalSentiment > 0 ? Math.round((negativeCount / totalSentiment) * 100) : 0,
    };

    // Build report
    const report = {
      overallVisibility: Math.round(overallMentionRate),
      mentionRate: Math.round(overallMentionRate),
      totalQuestionsAnalyzed: selectedQuestions.length,
      totalAIResponses: totalResponses,
      platformsTested: selectedPlatforms,
      sentimentSummary: {
        ...sentimentBreakdown,
        dominant: positiveCount >= neutralCount && positiveCount >= negativeCount ? "positive" :
                  negativeCount >= neutralCount ? "negative" : "neutral",
      },
      questionResults: allResults,
    };

    // Save to database
    await updateProgress(95, "Saving results...");

    // Save questions
    for (const q of selectedQuestions) {
      await prisma.discoveredQuestion.create({
        data: {
          analysisId,
          question: q.question,
          searchVolume: q.searchVolume,
          difficulty: 50,
          intent: q.category === "decision" ? "commercial" : "informational",
          category: q.category,
          score: Math.min(100, Math.floor(Math.log10(q.searchVolume + 1) * 20)),
        },
      });
    }

    // Save AI results
    for (const result of successfulResults) {
      for (const response of (result.responses || [])) {
        await prisma.aITestResult.create({
          data: {
            analysisId,
            question: result.question,
            platform: response.platform,
            brandMentioned: response.brandMentioned,
            position: response.brandPosition,
            sentiment: response.sentiment,
            context: response.contextExtract,
            fullResponse: response.fullResponse?.substring(0, 5000) || "",
            citations: response.citedUrls || [],
          },
        });
      }
    }

    // Update final status
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: "completed",
        progress: 100,
        currentStep: `Analysis complete! Visibility: ${report.overallVisibility}%`,
        completedAt: new Date(),
      },
    });
    
    // Store report as an insight
    await prisma.aIInsight.create({
      data: {
        analysisId,
        category: "overall",
        priority: 1,
        title: "Analysis Report",
        finding: `Overall AI Visibility: ${report.overallVisibility}%`,
        dataEvidence: JSON.stringify(report),
        aiReasoning: `Analyzed ${report.totalQuestionsAnalyzed} questions across ${report.platformsTested.join(", ")}`,
        actions: ["Review individual question results", "Address low-visibility areas"],
        expectedImpact: { visibility: report.overallVisibility },
        effort: "medium",
        timeline: "ongoing",
        confidence: report.totalAIResponses > 10 ? "high" : "medium",
      },
    });

    console.log(`✅ [EXEC] Analysis completed in ${duration}s`);
    console.log(`   Visibility: ${report.overallVisibility}%`);
    console.log(`   Mention Rate: ${report.mentionRate}%`);

  } catch (error: any) {
    console.error(`❌ [EXEC] Analysis failed: ${error.message}`);
    
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: "failed",
        currentStep: `Error: ${error.message}`,
      },
    });
  }
}
