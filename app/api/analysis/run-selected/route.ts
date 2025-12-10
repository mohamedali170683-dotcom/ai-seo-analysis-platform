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

    // Get or create user for analysis
    const user = await prisma.user.upsert({
      where: { email: "demo@example.com" },
      update: {},
      create: { email: "demo@example.com" },
    });
    
    // Create analysis record
    const analysis = await prisma.analysis.create({
      data: {
        userId: user.id,
        brandOrKeyword: brandName,
        domain: domain || null,
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

    // Group results by journey stage
    const stageGroups: Record<string, typeof allResults> = {
      awareness: [],
      consideration: [],
      decision: [],
    };

    allResults.forEach(result => {
      const stage = result.questionCategory || "awareness";
      if (stageGroups[stage]) {
        stageGroups[stage].push(result);
      }
    });

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

    // Create journey stage insights (REQUIRED for results page)
    const stageLabels: Record<string, string> = {
      awareness: "Awareness",
      consideration: "Consideration", 
      decision: "Decision",
    };

    const stageDescriptions: Record<string, string> = {
      awareness: "How users first discover and learn about your brand through AI",
      consideration: "How AI compares your brand against alternatives",
      decision: "How AI influences final purchase decisions",
    };

    let overallMentionRate = 0;
    let totalStageResponses = 0;

    for (const [stage, results] of Object.entries(stageGroups)) {
      const stageResults = results.filter((r: any) => !r.error);
      const stageResponses = stageResults.reduce((sum: number, r: any) => sum + (r.totalResponses || 0), 0);
      const stageMentions = stageResults.reduce((sum: number, r: any) => {
        return sum + (r.responses?.filter((resp: any) => resp.brandMentioned)?.length || 0);
      }, 0);

      const mentionRate = stageResponses > 0 ? Math.round((stageMentions / stageResponses) * 100) : 0;
      totalStageResponses += stageResponses;
      overallMentionRate += mentionRate;

      // Calculate stage sentiment
      let positive = 0, neutral = 0, negative = 0;
      stageResults.forEach((r: any) => {
        r.responses?.forEach((resp: any) => {
          if (resp.sentiment === "positive") positive++;
          else if (resp.sentiment === "negative") negative++;
          else neutral++;
        });
      });
      const totalSent = positive + neutral + negative;
      const sentimentBreakdown = {
        positive: totalSent > 0 ? Math.round((positive / totalSent) * 100) : 0,
        neutral: totalSent > 0 ? Math.round((neutral / totalSent) * 100) : 0,
        negative: totalSent > 0 ? Math.round((negative / totalSent) * 100) : 0,
        dominant: positive >= neutral && positive >= negative ? "positive" :
                  negative >= neutral ? "negative" : "neutral",
      };

      // Calculate average position
      const positions = stageResults.flatMap((r: any) => 
        r.responses?.filter((resp: any) => resp.brandMentioned && resp.brandPosition > 0)
          .map((resp: any) => resp.brandPosition) || []
      );
      const avgPosition = positions.length > 0 
        ? Math.round(positions.reduce((a: number, b: number) => a + b, 0) / positions.length) 
        : 0;

      // Calculate visibility score (weighted)
      const positionScore = avgPosition > 0 ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;
      const sentimentScore = Math.max(0, Math.min(100, ((sentimentBreakdown.positive - sentimentBreakdown.negative + 100) / 2)));
      const visibilityScore = Math.round((mentionRate * 0.5) + (positionScore * 0.3) + (sentimentScore * 0.2));

      // Get AI answer examples
      const aiAnswerExamples = stageResults.flatMap((r: any) => 
        r.responses?.filter((resp: any) => resp.brandMentioned).slice(0, 2).map((resp: any) => ({
          platform: resp.platform,
          question: r.questionText,
          excerpt: resp.contextExtract || resp.fullResponse?.substring(0, 300) + "...",
          sentiment: resp.sentiment,
          brandPosition: resp.brandPosition || 0,
        })) || []
      ).slice(0, 4);

      // Get competitor data
      const competitorMentions: Record<string, { count: number; positions: number[] }> = {};
      stageResults.forEach((r: any) => {
        r.responses?.forEach((resp: any) => {
          const competitorsMentioned = resp.competitorsMentioned || [];
          competitorsMentioned.forEach((comp: any) => {
            if (!competitorMentions[comp.name]) {
              competitorMentions[comp.name] = { count: 0, positions: [] };
            }
            competitorMentions[comp.name].count++;
            if (comp.position > 0) {
              competitorMentions[comp.name].positions.push(comp.position);
            }
          });
        });
      });

      const competitorComparison = Object.entries(competitorMentions).map(([name, data]) => ({
        competitorName: name,
        mentionRate: stageResponses > 0 ? Math.round((data.count / stageResponses) * 100) : 0,
        avgPosition: data.positions.length > 0 
          ? Math.round(data.positions.reduce((a, b) => a + b, 0) / data.positions.length)
          : 0,
      })).slice(0, 3);

      // Build questions for this stage
      const stageQuestions = stageResults.map((r: any) => ({
        question: r.questionText,
        searchVolume: r.questionSearchVolume || 0,
        answersAnalyzed: r.totalResponses || 0,
      }));

      // Create journey_stage insight (THIS IS WHAT THE RESULTS PAGE EXPECTS)
      const priorityMap: Record<string, number> = { awareness: 1, consideration: 2, decision: 3 };
      
      await prisma.aIInsight.create({
        data: {
          analysisId,
          category: "journey_stage",
          priority: priorityMap[stage] || 1,
          title: `${stageLabels[stage]} Stage`,
          finding: `${mentionRate}% mention rate in ${stageLabels[stage].toLowerCase()} stage`,
          dataEvidence: JSON.stringify({ stageResults: stageResults.length }),
          aiReasoning: `Analyzed ${stageResponses} AI responses for ${stageResults.length} questions`,
          actions: [
            mentionRate < 50 ? `Improve ${stageLabels[stage].toLowerCase()} stage visibility` : `Maintain ${stageLabels[stage].toLowerCase()} stage presence`,
            sentimentBreakdown.negative > 20 ? "Address negative sentiment in AI responses" : "Continue positive engagement",
          ],
          expectedImpact: {
            stage,
            stageLabel: stageLabels[stage],
            stageDescription: stageDescriptions[stage],
            questions: stageQuestions,
            portrayal: {
              mentionRate,
              totalQuestions: stageResults.length,
              totalTests: stageResponses,
              totalAnswersAnalyzed: stageResponses,
              visibilityScore,
              averagePosition: avgPosition,
              sentiment: sentimentBreakdown,
              aiAnswerExamples,
              competitorComparison,
            },
            recommendation: {
              commonPattern: mentionRate > 50 
                ? `${brandName} is well-represented in ${stageLabels[stage].toLowerCase()} queries with ${mentionRate}% visibility.`
                : `${brandName} has limited visibility (${mentionRate}%) in ${stageLabels[stage].toLowerCase()} queries - opportunity for improvement.`,
              contentType: stage === "awareness" 
                ? "Educational content, brand story, unique value propositions"
                : stage === "consideration"
                ? "Comparison guides, reviews, feature highlights, expert endorsements"
                : "Purchase guides, pricing information, availability, trust signals",
              focusedAction: mentionRate < 50
                ? `Create authoritative content targeting ${stageLabels[stage].toLowerCase()}-stage queries to improve AI visibility from ${mentionRate}% to 70%+`
                : `Maintain and optimize current content strategy for ${stageLabels[stage].toLowerCase()} stage`,
            },
          },
          effort: mentionRate < 50 ? "high" : "low",
          timeline: mentionRate < 50 ? "3-6 months" : "ongoing",
          confidence: stageResponses > 10 ? "high" : "medium",
        },
      });
    }

    // Calculate overall score
    const avgMentionRate = Object.keys(stageGroups).length > 0 
      ? Math.round(overallMentionRate / Object.keys(stageGroups).length) 
      : 0;

    // Update final status
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: "completed",
        progress: 100,
        currentStep: `Analysis complete! Visibility: ${avgMentionRate}%`,
        completedAt: new Date(),
      },
    });

    console.log(`✅ [EXEC] Analysis completed in ${duration}s`);
    console.log(`   Overall Visibility: ${avgMentionRate}%`);
    console.log(`   Total Responses: ${totalStageResponses}`);

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
