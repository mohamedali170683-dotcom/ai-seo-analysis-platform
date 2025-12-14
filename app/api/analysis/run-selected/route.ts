import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { prisma } from "@/lib/db/prisma";
import { MultiPlatformAIService } from "@/lib/services/multi-platform-ai-service";
import { WebsiteAuditService, WebsiteAuditResult } from "@/lib/services/website-audit-service";

export const maxDuration = 300; // 5 minutes for longer analyses

interface SelectedQuestion {
  question: string;
  searchVolume: number;
  category: "awareness" | "consideration" | "decision";
  type: "brand" | "category";
}

type AIPlatform = "ChatGPT" | "Gemini" | "Copilot" | "Perplexity";
type UserTier = "free" | "professional" | "partner";

interface AnalysisRequest {
  brandName: string;
  domain?: string;
  competitors?: string[];
  category: string;
  selectedQuestions: SelectedQuestion[];
  selectedPlatforms: AIPlatform[];
  testsPerPlatform?: number; // Default 3 for faster analysis
  tier?: UserTier; // User tier for validation
}

// 3-Tier limits for backend validation
// NEW MODEL: Free tier gets ALL platforms but limited stages/recommendations
const TIER_LIMITS: Record<UserTier, {
  maxQuestions: number;
  allowedStages: string[];
  allowedPlatforms: AIPlatform[];
  testsPerQuestion: number;
  maxCompetitors: number;
}> = {
  free: {
    maxQuestions: 3,
    allowedStages: ["awareness"], // Only awareness stage
    allowedPlatforms: ["ChatGPT", "Gemini", "Copilot", "Perplexity"], // ALL platforms now!
    testsPerQuestion: 1,
    maxCompetitors: 1,
  },
  professional: {
    maxQuestions: Infinity, // Unlimited questions
    allowedStages: ["awareness", "consideration", "decision"],
    allowedPlatforms: ["ChatGPT", "Gemini", "Copilot", "Perplexity"],
    testsPerQuestion: 3,
    maxCompetitors: 10, // Up to 10 competitors
  },
  partner: {
    maxQuestions: Infinity,
    allowedStages: ["awareness", "consideration", "decision"],
    allowedPlatforms: ["ChatGPT", "Gemini", "Copilot", "Perplexity"],
    testsPerQuestion: 3,
    maxCompetitors: Infinity, // Unlimited competitors
  },
};

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
      tier = "free", // Default to free tier
    } = body;

    // Get tier limits (default to free if invalid tier)
    const validTier: UserTier = tier === "professional" || tier === "partner" ? tier : "free";
    const limits = TIER_LIMITS[validTier];
    
    // Enforce tier-based limits
    const maxQ = limits.maxQuestions === Infinity ? 1000 : limits.maxQuestions;
    const enforcedQuestions = selectedQuestions.slice(0, maxQ);
    const enforcedPlatforms = selectedPlatforms.filter(p => 
      limits.allowedPlatforms.includes(p)
    ) as AIPlatform[];
    const enforcedCompetitors = competitors.slice(0, limits.maxCompetitors);
    const enforcedTestsPerPlatform = Math.min(testsPerPlatform, limits.testsPerQuestion);
    
    // Filter questions by allowed stages for free tier
    const stageFilteredQuestions = enforcedQuestions.filter(q => 
      limits.allowedStages.includes(q.category)
    );

    // Basic Validation
    if (!brandName) {
      return NextResponse.json(
        { success: false, error: "Brand name is required" },
        { status: 400 }
      );
    }

    if (!stageFilteredQuestions || stageFilteredQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least 1 question must be selected from allowed stages" },
        { status: 400 }
      );
    }

    if (stageFilteredQuestions.length > limits.maxQuestions) {
      return NextResponse.json(
        { success: false, error: `Maximum ${limits.maxQuestions} questions allowed for ${tier} tier` },
        { status: 400 }
      );
    }

    if (!enforcedPlatforms || enforcedPlatforms.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least 1 allowed platform must be selected" },
        { status: 400 }
      );
    }

    // Validate platforms
    const validPlatforms: AIPlatform[] = ["ChatGPT", "Gemini", "Copilot", "Perplexity"];
    for (const platform of enforcedPlatforms) {
      if (!validPlatforms.includes(platform)) {
        return NextResponse.json(
          { success: false, error: `Invalid platform: ${platform}` },
          { status: 400 }
        );
      }
    }

    console.log(`🎯 [TIER] Running as ${validTier} tier`);
    console.log(`   Enforced questions: ${stageFilteredQuestions.length} (max: ${limits.maxQuestions})`);
    console.log(`   Enforced platforms: ${enforcedPlatforms.join(", ")}`);
    console.log(`   Enforced tests/platform: ${enforcedTestsPerPlatform}`);
    console.log(`   Competitors: ${enforcedCompetitors.length > 0 ? enforcedCompetitors.join(", ") : "none (free tier)"}`);
    
    // Use enforced values for the rest of the function
    const finalQuestions = stageFilteredQuestions;
    const finalPlatforms = enforcedPlatforms;
    const finalCompetitors = enforcedCompetitors;
    const finalTestsPerPlatform = enforcedTestsPerPlatform;

    console.log(`🚀 [RUN-SELECTED] Starting analysis:`);
    console.log(`   Brand: ${brandName}`);
    console.log(`   Questions: ${finalQuestions.length}`);
    console.log(`   Platforms: ${finalPlatforms.join(", ")}`);
    console.log(`   Tests per platform: ${finalTestsPerPlatform}`);

    // Calculate total API calls
    const totalCalls = finalQuestions.length * finalPlatforms.length * finalTestsPerPlatform;
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
        competitors: finalCompetitors,
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
        domain,
        finalCompetitors,
        category,
        finalQuestions,
        finalPlatforms,
        finalTestsPerPlatform,
        envVars
      )
    );

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      message: "Analysis started",
      tier: validTier,
      config: {
        questions: finalQuestions.length,
        platforms: finalPlatforms.length,
        testsPerPlatform: finalTestsPerPlatform,
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
  domain: string | undefined,
  competitors: string[],
  category: string,
  selectedQuestions: SelectedQuestion[],
  selectedPlatforms: AIPlatform[],
  testsPerPlatform: number,
  envVars: { openaiApiKey: string; geminiApiKey?: string }
) {
  const startTime = Date.now();
  console.log(`🔄 [EXEC] Starting execution for ${analysisId}`);

  try {
    // Initialize services
    const aiService = new MultiPlatformAIService(
      envVars.openaiApiKey,
      envVars.geminiApiKey,
      testsPerPlatform
    );
    const auditService = new WebsiteAuditService(30000);

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

    await updateProgress(3, "Initializing...");

    // Start website audit in parallel (if domain provided) with timeout
    let websiteAuditPromise: Promise<WebsiteAuditResult | null> = Promise.resolve(null);
    if (domain) {
      console.log(`🔍 [EXEC] Starting website audit for: ${domain}`);
      
      // Create a timeout promise (45 seconds max for audit)
      const auditTimeout = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn(`⚠️ [EXEC] Website audit timed out after 45s`);
          resolve(null);
        }, 45000);
      });
      
      // Race between audit and timeout
      websiteAuditPromise = Promise.race([
        auditService.auditWebsite(domain).catch(err => {
          console.error(`⚠️ [EXEC] Website audit failed: ${err.message}`);
          return null;
        }),
        auditTimeout
      ]);
    }

    // Test each question - using simple async/await (AI service handles timeouts internally)
    const allResults: any[] = [];
    const totalQuestions = selectedQuestions.length;

    for (let i = 0; i < totalQuestions; i++) {
      const question = selectedQuestions[i];
      const progress = 5 + Math.floor(((i + 1) / totalQuestions) * 80);
      
      await updateProgress(progress, `Testing Q${i + 1}/${totalQuestions}: "${question.question.substring(0, 25)}..."`);
      
      console.log(`🤖 [EXEC] Q${i + 1}/${totalQuestions}: "${question.question.substring(0, 35)}..."`);

      try {
        // Simple async/await - AI service handles its own timeouts with AbortController
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
        console.log(`✅ Q${i + 1} done: ${analysis.totalResponses} responses`);

      } catch (error: any) {
        console.error(`⚠️ [EXEC] Q${i + 1} failed: ${error.message}`);
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

      // Add delay between questions to avoid rate limiting (1 second)
      if (i < totalQuestions - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
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

      // Get AI answer examples - ONE PER PLATFORM with varied sentiment
      const allResponses = stageResults.flatMap((r: any) => 
        r.responses?.filter((resp: any) => resp.brandMentioned).map((resp: any) => ({
          platform: resp.platform,
          question: r.questionText,
          excerpt: resp.contextExtract || resp.fullResponse?.substring(0, 400) + "...",
          fullResponse: resp.fullResponse || "",
          sentiment: resp.sentiment,
          brandPosition: resp.brandPosition || 0,
        })) || []
      );

      // Select diverse examples: one per platform, varied sentiment
      const aiAnswerExamples: any[] = [];
      const platforms: AIPlatform[] = ["ChatGPT", "Gemini", "Copilot", "Perplexity"];
      const targetSentiments = ["positive", "neutral", "negative"];
      
      for (const platform of platforms) {
        const platformResponses = allResponses.filter((r: any) => r.platform === platform);
        if (platformResponses.length > 0) {
          // Try to find a sentiment we haven't used yet
          const usedSentiments = aiAnswerExamples.map((e: any) => e.sentiment);
          const preferredSentiment = targetSentiments.find(s => !usedSentiments.includes(s));
          
          let selected = platformResponses.find((r: any) => r.sentiment === preferredSentiment);
          if (!selected) {
            selected = platformResponses[0]; // Fallback to first available
          }
          aiAnswerExamples.push(selected);
        }
      }

      // Analyze response content for patterns
      const responseAnalysis = analyzeResponsePatterns(allResponses, brandName, competitors);

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

      // Generate data-driven recommendations
      const recommendation = generateStrategicRecommendation(
        stage,
        brandName,
        mentionRate,
        avgPosition,
        sentimentBreakdown,
        responseAnalysis,
        competitorComparison
      );

      // Create journey_stage insight (THIS IS WHAT THE RESULTS PAGE EXPECTS)
      const priorityMap: Record<string, number> = { awareness: 1, consideration: 2, decision: 3 };
      
      await prisma.aIInsight.create({
        data: {
          analysisId,
          category: "journey_stage",
          priority: priorityMap[stage] || 1,
          title: `${stageLabels[stage]} Stage`,
          finding: `${mentionRate}% mention rate in ${stageLabels[stage].toLowerCase()} stage`,
          dataEvidence: JSON.stringify({ stageResults: stageResults.length, patterns: responseAnalysis }),
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
            recommendation,
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

    // Wait for website audit to complete (with safety timeout)
    await updateProgress(92, "Completing website technical audit...");
    let websiteAudit: WebsiteAuditResult | null = null;
    try {
      // Additional safety timeout in case the race didn't work
      const safetyTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000));
      websiteAudit = await Promise.race([websiteAuditPromise, safetyTimeout]);
    } catch (auditError: any) {
      console.error(`⚠️ [EXEC] Website audit error: ${auditError.message}`);
      websiteAudit = null;
    }
    
    if (websiteAudit) {
      console.log(`📊 [EXEC] Website audit complete - Score: ${websiteAudit.technicalScore}/100`);
      
      // Save website audit as an insight
      await prisma.aIInsight.create({
        data: {
          analysisId,
          category: "website_audit",
          priority: 0, // Show first
          title: "Website Technical Audit",
          finding: `Technical SEO Score: ${websiteAudit.technicalScore}/100`,
          dataEvidence: JSON.stringify({
            url: websiteAudit.url,
            schemas: websiteAudit.schemas,
            contentStats: {
              h1Count: websiteAudit.h1Count,
              h2Count: websiteAudit.h2Count,
              wordCount: websiteAudit.wordCount,
            },
            faq: {
              hasFAQSection: websiteAudit.hasFAQSection,
              faqQuestions: websiteAudit.faqQuestions,
            },
            robots: {
              accessible: websiteAudit.robotsTxtAccessible,
              allowsAIBots: websiteAudit.allowsAIBots,
            },
          }),
          aiReasoning: `Analyzed ${websiteAudit.url} for technical SEO factors affecting AI visibility`,
          actions: websiteAudit.issues.map(i => `${i.severity.toUpperCase()}: ${i.issue}`),
          expectedImpact: JSON.parse(JSON.stringify({
            technicalScore: websiteAudit.technicalScore,
            issues: websiteAudit.issues,
            recommendations: websiteAudit.recommendations,
            schemas: {
              hasOrganization: websiteAudit.hasOrganizationSchema,
              hasProduct: websiteAudit.hasProductSchema,
              hasFAQ: websiteAudit.hasFAQSchema,
              hasReview: websiteAudit.hasReviewSchema,
            },
            content: {
              title: websiteAudit.title,
              description: websiteAudit.description,
              h1Text: websiteAudit.h1Text,
              wordCount: websiteAudit.wordCount,
            },
            faqContent: {
              hasFAQSection: websiteAudit.hasFAQSection,
              questions: websiteAudit.faqQuestions,
            },
            robotsAllowsAI: websiteAudit.allowsAIBots,
          })),
          effort: websiteAudit.technicalScore < 50 ? "high" : "medium",
          timeline: "1-2 weeks",
          confidence: "high",
        },
      });
    }

    // Update final status
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: "completed",
        progress: 100,
        currentStep: `Analysis complete! Visibility: ${avgMentionRate}%${websiteAudit ? ` | Tech Score: ${websiteAudit.technicalScore}/100` : ""}`,
        completedAt: new Date(),
      },
    });

    console.log(`✅ [EXEC] Analysis completed in ${duration}s`);
    console.log(`   Overall Visibility: ${avgMentionRate}%`);
    console.log(`   Total Responses: ${totalStageResponses}`);
    if (websiteAudit) {
      console.log(`   Technical Score: ${websiteAudit.technicalScore}/100`);
    }

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

/**
 * Analyze AI response content to identify patterns
 */
function analyzeResponsePatterns(
  responses: any[],
  brandName: string,
  competitors: string[]
): {
  positiveKeywords: string[];
  negativeKeywords: string[];
  commonThemes: string[];
  brandDescriptors: string[];
  competitorAdvantages: string[];
  contentGaps: string[];
} {
  const positiveKeywords: string[] = [];
  const negativeKeywords: string[] = [];
  const brandDescriptors: string[] = [];
  const competitorAdvantages: string[] = [];
  
  // Positive indicators
  const positivePatterns = [
    "recommend", "trusted", "reliable", "quality", "excellent", "best", 
    "popular", "leading", "innovative", "premium", "top-rated", "well-known",
    "established", "reputable", "highly rated", "preferred"
  ];
  
  // Negative indicators  
  const negativePatterns = [
    "concerns", "issues", "expensive", "controversy", "complaints", "limited",
    "problems", "alternatives", "better options", "downsides", "drawbacks"
  ];

  // Theme patterns
  const themePatterns = {
    quality: ["quality", "premium", "craftsmanship", "materials", "durable"],
    value: ["value", "price", "affordable", "cost", "budget", "expensive"],
    innovation: ["innovative", "technology", "advanced", "modern", "cutting-edge"],
    trust: ["trusted", "reliable", "established", "reputation", "heritage"],
    service: ["service", "support", "customer", "experience", "satisfaction"],
  };

  const themeCounts: Record<string, number> = {};
  
  responses.forEach(resp => {
    const text = (resp.fullResponse || resp.excerpt || "").toLowerCase();
    
    // Find positive keywords
    positivePatterns.forEach(pattern => {
      if (text.includes(pattern) && !positiveKeywords.includes(pattern)) {
        positiveKeywords.push(pattern);
      }
    });
    
    // Find negative keywords
    negativePatterns.forEach(pattern => {
      if (text.includes(pattern) && !negativeKeywords.includes(pattern)) {
        negativeKeywords.push(pattern);
      }
    });

    // Count themes
    Object.entries(themePatterns).forEach(([theme, patterns]) => {
      patterns.forEach(pattern => {
        if (text.includes(pattern)) {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        }
      });
    });

    // Extract brand descriptors (words near brand name)
    const brandLower = brandName.toLowerCase();
    const brandIndex = text.indexOf(brandLower);
    if (brandIndex > -1) {
      const surrounding = text.substring(Math.max(0, brandIndex - 50), brandIndex + brandLower.length + 50);
      const descriptorPatterns = ["is a", "is an", "is the", "known for", "offers", "provides", "specializes"];
      descriptorPatterns.forEach(dp => {
        if (surrounding.includes(dp)) {
          const afterPattern = surrounding.split(dp)[1]?.split(/[.,!?]/)[0]?.trim();
          if (afterPattern && afterPattern.length > 3 && afterPattern.length < 50 && !brandDescriptors.includes(afterPattern)) {
            brandDescriptors.push(afterPattern);
          }
        }
      });
    }

    // Check competitor advantages mentioned
    competitors.forEach(comp => {
      const compLower = comp.toLowerCase();
      if (text.includes(compLower)) {
        const compIndex = text.indexOf(compLower);
        const afterComp = text.substring(compIndex, compIndex + 100);
        const advantages = ["better", "cheaper", "more", "superior", "preferred", "leading"];
        advantages.forEach(adv => {
          if (afterComp.includes(adv) && !competitorAdvantages.includes(`${comp}: ${adv}`)) {
            competitorAdvantages.push(`${comp}: ${adv}`);
          }
        });
      }
    });
  });

  // Sort themes by frequency
  const commonThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme]) => theme);

  // Identify content gaps (themes not well represented)
  const contentGaps = Object.keys(themePatterns)
    .filter(theme => !commonThemes.includes(theme))
    .slice(0, 2);

  return {
    positiveKeywords: positiveKeywords.slice(0, 5),
    negativeKeywords: negativeKeywords.slice(0, 3),
    commonThemes,
    brandDescriptors: brandDescriptors.slice(0, 3),
    competitorAdvantages: competitorAdvantages.slice(0, 3),
    contentGaps,
  };
}

/**
 * Generate strategic, data-driven recommendations
 */
function generateStrategicRecommendation(
  stage: string,
  brandName: string,
  mentionRate: number,
  avgPosition: number,
  sentiment: { positive: number; neutral: number; negative: number; dominant: string },
  patterns: ReturnType<typeof analyzeResponsePatterns>,
  competitors: { competitorName: string; mentionRate: number; avgPosition: number }[]
): {
  commonPattern: string;
  contentType: string;
  focusedAction: string;
} {
  const stageLabels: Record<string, string> = {
    awareness: "Awareness",
    consideration: "Consideration",
    decision: "Decision",
  };

  // Build pattern analysis
  let commonPattern = "";
  
  if (patterns.positiveKeywords.length > 0 && sentiment.positive > 40) {
    commonPattern = `AI platforms consistently associate ${brandName} with positive attributes: "${patterns.positiveKeywords.slice(0, 3).join('", "')}". `;
    if (patterns.brandDescriptors.length > 0) {
      commonPattern += `The brand is commonly described as "${patterns.brandDescriptors[0]}". `;
    }
  } else if (patterns.negativeKeywords.length > 0 && sentiment.negative > 20) {
    commonPattern = `AI responses reveal concerns about ${brandName}, frequently mentioning: "${patterns.negativeKeywords.join('", "')}". `;
    commonPattern += `This suggests a perception gap that needs addressing through authoritative content. `;
  } else if (mentionRate < 50) {
    commonPattern = `${brandName} has limited presence (${mentionRate}%) in AI-generated ${stageLabels[stage].toLowerCase()} content. `;
    if (competitors.length > 0 && competitors[0].mentionRate > mentionRate) {
      commonPattern += `Competitor ${competitors[0].competitorName} dominates with ${competitors[0].mentionRate}% mention rate. `;
    }
    commonPattern += `AI models lack sufficient authoritative data to consistently recommend ${brandName}. `;
  } else {
    commonPattern = `${brandName} maintains solid ${stageLabels[stage].toLowerCase()}-stage visibility at ${mentionRate}%. `;
    if (patterns.commonThemes.length > 0) {
      commonPattern += `AI responses emphasize ${patterns.commonThemes.join(", ")} themes when discussing the brand. `;
    }
    if (avgPosition > 0) {
      commonPattern += `Average position #${avgPosition} indicates ${avgPosition <= 2 ? "strong" : "moderate"} competitive standing. `;
    }
  }

  // Build content recommendation with justification
  let contentType = "";
  
  if (stage === "awareness") {
    contentType = `Educational content focusing on ${brandName}'s unique value proposition and brand story. `;
    if (patterns.contentGaps.length > 0) {
      contentType += `Gap analysis reveals opportunity to strengthen "${patterns.contentGaps.join('", "')}" messaging. `;
    }
    contentType += `AI models prioritize authoritative, frequently-cited sources when answering awareness queries—investing in thought leadership content (industry reports, expert interviews, comprehensive guides) increases the likelihood of AI citation.`;
  } else if (stage === "consideration") {
    contentType = `Comparison-focused content with detailed feature analysis and third-party validation. `;
    if (competitors.length > 0) {
      contentType += `Direct comparison content against ${competitors.map(c => c.competitorName).join(", ")} is essential. `;
    }
    contentType += `AI models weigh review aggregation, expert opinions, and structured comparison data heavily in consideration queries—ensure this content exists on authoritative platforms (industry sites, review aggregators, expert blogs).`;
  } else {
    contentType = `Transaction-enabling content with clear purchase pathways and trust signals. `;
    contentType += `Include pricing transparency, availability information, and customer testimonials. `;
    contentType += `AI models look for purchase intent signals and retailer/availability data when answering decision-stage queries—structured data markup and presence on shopping platforms directly impacts visibility.`;
  }

  // Build focused action with correlation
  let focusedAction = "";
  
  if (mentionRate < 40) {
    focusedAction = `PRIORITY: Increase content volume and authority. Current ${mentionRate}% visibility indicates AI models lack sufficient training data featuring ${brandName}. `;
    focusedAction += `Action: Publish 10+ authoritative articles on high-domain-authority sites within 60 days. `;
    focusedAction += `Correlation: Research shows brands with 3x more indexed content see 40-60% higher AI mention rates within 90 days of publication.`;
  } else if (sentiment.negative > 25) {
    focusedAction = `PRIORITY: Address negative perception. ${sentiment.negative}% negative sentiment indicates reputation concerns surfacing in AI responses. `;
    focusedAction += `Action: Create counter-narrative content addressing specific concerns (${patterns.negativeKeywords.slice(0, 2).join(", ") || "identified issues"}) with factual rebuttals and positive case studies. `;
    focusedAction += `Correlation: Brands that proactively address negative narratives see sentiment shift from negative to neutral within 60-90 days as AI models ingest updated content.`;
  } else if (avgPosition > 3) {
    focusedAction = `PRIORITY: Improve competitive positioning. Average position #${avgPosition} means ${brandName} is mentioned but not as a top recommendation. `;
    focusedAction += `Action: Strengthen unique differentiators in content—AI models rank brands higher when clear, consistent USPs are present across multiple authoritative sources. `;
    focusedAction += `Correlation: Brands with strong differentiation messaging typically achieve positions #1-2 in 70% of relevant queries.`;
  } else if (competitors.some(c => c.mentionRate > mentionRate)) {
    const topComp = competitors.find(c => c.mentionRate > mentionRate);
    focusedAction = `PRIORITY: Close competitive gap. ${topComp?.competitorName || "A competitor"} leads with ${topComp?.mentionRate || 0}% vs your ${mentionRate}%. `;
    focusedAction += `Action: Analyze ${topComp?.competitorName || "competitor"}'s content strategy and create superior, more comprehensive content on overlapping topics. `;
    focusedAction += `Correlation: AI models favor the most comprehensive, authoritative source—outperforming competitor content directly correlates with improved mention rates.`;
  } else {
    focusedAction = `MAINTAIN: Strong ${stageLabels[stage].toLowerCase()}-stage performance. ${mentionRate}% visibility with ${sentiment.positive}% positive sentiment indicates healthy AI presence. `;
    focusedAction += `Action: Continue content freshness strategy—update key pages quarterly and publish new thought leadership monthly. `;
    focusedAction += `Correlation: Brands maintaining consistent content updates see 15-20% higher retention of AI visibility vs those with static content.`;
  }

  return {
    commonPattern: commonPattern.trim(),
    contentType: contentType.trim(),
    focusedAction: focusedAction.trim(),
  };
}
