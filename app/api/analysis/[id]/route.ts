import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Analysis ID is required" },
        { status: 400 }
      );
    }

    // Fetch analysis with all related data
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        discoveredQuestions: {
          orderBy: { createdAt: "asc" },
        },
        aiTestResults: {
          orderBy: { createdAt: "asc" },
        },
        detectedCompetitors: {
          orderBy: { createdAt: "asc" },
        },
        aiInsights: {
          orderBy: { priority: "asc" },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    // Extract journey stage data from AI insights
    const journeyStageInsights = analysis.aiInsights.filter(
      (insight) => insight.category === "journey_stage"
    );

    // Format journey stages for the report
    const journeyStages = journeyStageInsights.map((insight) => {
      const expectedImpact = insight.expectedImpact as any;
      if (expectedImpact && typeof expectedImpact === "object") {
        // Ensure all required fields are present with defaults
        const portrayal = expectedImpact.portrayal || {};
        const recommendation = expectedImpact.recommendation || {};
        
        return {
          stage: expectedImpact.stage || "awareness",
          stageLabel: expectedImpact.stageLabel || "Awareness",
          stageDescription: expectedImpact.stageDescription || "User is learning and discovering brands",
          icon: expectedImpact.icon || "Brain",
          color: expectedImpact.color || "from-blue-500 to-blue-600",
          questions: expectedImpact.questions || [],
          portrayal: {
            mentionRate: portrayal.mentionRate || 0,
            totalQuestions: portrayal.totalQuestions || 0,
            totalTests: portrayal.totalTests || 0,
            totalAnswersAnalyzed: portrayal.totalAnswersAnalyzed || 0,
            visibilityScore: portrayal.visibilityScore || 0,
            averagePosition: portrayal.averagePosition || 0,
            sentiment: portrayal.sentiment || {
              positive: 0,
              negative: 0,
              neutral: 100,
              dominant: "neutral" as const,
            },
            aiAnswerExamples: portrayal.aiAnswerExamples || [],
            competitorComparison: portrayal.competitorComparison || [],
          },
          recommendation: {
            commonPattern: recommendation.commonPattern || "Analysis in progress.",
            contentType: recommendation.contentType || "Data pending",
            focusedAction: recommendation.focusedAction || "Generate more stage-specific content.",
          },
        };
      }
      return null;
    }).filter(Boolean);

    // Ensure we have all three stages (create empty ones if missing)
    const stageOrder = ["awareness", "consideration", "decision"];
    const stageLabels = {
      awareness: "Awareness",
      consideration: "Consideration",
      decision: "Decision",
    };
    const stageDescriptions = {
      awareness: "User is learning and discovering brands",
      consideration: "User is comparing brands and evaluating options",
      decision: "User is ready to purchase and looking for where to buy",
    };
    const stageIcons = {
      awareness: "Brain",
      consideration: "Users",
      decision: "ShoppingCart",
    };
    const stageColors = {
      awareness: "from-blue-500 to-blue-600",
      consideration: "from-purple-500 to-purple-600",
      decision: "from-pink-500 to-pink-600",
    };

    const existingStages = new Set(journeyStages.map((s: any) => s.stage));
    stageOrder.forEach((stage) => {
      if (!existingStages.has(stage)) {
        journeyStages.push({
          stage,
          stageLabel: stageLabels[stage as keyof typeof stageLabels],
          stageDescription: stageDescriptions[stage as keyof typeof stageDescriptions],
          icon: stageIcons[stage as keyof typeof stageIcons],
          color: stageColors[stage as keyof typeof stageColors],
          questions: [],
          portrayal: {
            mentionRate: 0,
            totalQuestions: 0,
            totalTests: 0,
            totalAnswersAnalyzed: 0,
            visibilityScore: 0,
            averagePosition: 0,
            sentiment: {
              positive: 0,
              negative: 0,
              neutral: 100,
              dominant: "neutral" as const,
            },
            aiAnswerExamples: [],
            competitorComparison: [],
          },
          recommendation: {
            commonPattern: "Insufficient data to identify patterns.",
            contentType: "N/A",
            focusedAction: `Generate more ${stage}-stage content to improve visibility.`,
          },
        });
      }
    });

    // Sort stages in correct order
    journeyStages.sort((a: any, b: any) => {
      return stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
    });

    // Calculate overall stats
    const totalTests = analysis.aiTestResults.length;
    const totalQuestions = analysis.discoveredQuestions.length;
    
    // Calculate overall visibility score from journey stages
    let overallScore = 0;
    if (journeyStages.length > 0) {
      const avgVisibilityScore = journeyStages.reduce(
        (sum, stage) => sum + (stage.portrayal?.visibilityScore || 0),
        0
      ) / journeyStages.length;
      overallScore = Math.round(avgVisibilityScore);
    }

    // Calculate scoring methodology
    const allMentions = analysis.aiTestResults.filter((r) => r.brandMentioned).length;
    const mentionRate = totalTests > 0 ? (allMentions / totalTests) * 100 : 0;
    
    const positions = analysis.aiTestResults
      .filter((r) => r.position !== null)
      .map((r) => r.position as number);
    const avgPosition = positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : 0;
    const positionScore = avgPosition > 0 ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;

    const sentiments = analysis.aiTestResults
      .filter((r) => r.sentiment !== null)
      .map((r) => r.sentiment!);
    const positiveCount = sentiments.filter((s) => s === "positive").length;
    const negativeCount = sentiments.filter((s) => s === "negative").length;
    const sentimentScore = sentiments.length > 0
      ? Math.max(0, Math.min(100, ((positiveCount - negativeCount) / sentiments.length) * 100 + 50))
      : 50;

    const scoringMethodology = {
      mentionRate: {
        weight: 50,
        description: "How often your brand appears in AI responses",
        yourScore: Math.round(mentionRate),
        calculation: "(Mentions ÷ Total Tests) × 100",
      },
      averagePosition: {
        weight: 30,
        description: "Where your brand is mentioned (1st = 100pts, 5th = 20pts)",
        yourScore: Math.round(positionScore),
        calculation: "100 - ((Avg Position - 1) × 20)",
      },
      sentiment: {
        weight: 20,
        description: "How positively your brand is portrayed",
        yourScore: Math.round(sentimentScore),
        calculation: "(Positive% - Negative%) normalized to 0-100",
      },
    };

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        brandOrKeyword: analysis.brandOrKeyword,
        domain: analysis.domain,
        competitors: analysis.competitors,
        status: analysis.status,
        progress: analysis.progress,
        currentStep: analysis.currentStep,
        createdAt: analysis.createdAt,
        completedAt: analysis.completedAt,
        discoveredQuestions: analysis.discoveredQuestions,
        aiTestResults: analysis.aiTestResults,
        detectedCompetitors: analysis.detectedCompetitors,
        aiInsights: analysis.aiInsights,
        error: analysis.status === "failed" ? analysis.currentStep : null,
        journeyStages,
        stats: {
          totalTests,
          totalQuestions,
          visibilityScore: overallScore,
        },
        scoringMethodology,
      },
    });
  } catch (error: any) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}
