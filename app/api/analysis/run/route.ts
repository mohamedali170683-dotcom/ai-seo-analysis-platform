import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { prisma } from "@/lib/db/prisma";
import { ComprehensiveAnalysisService } from "@/lib/services/comprehensive-analysis-service";

// Allow up to 5 minutes for analysis
export const maxDuration = 300;

export async function POST(request: Request) {
  console.log(`🚀 [API] POST /api/analysis/run called at ${new Date().toISOString()}`);
  
  try {
    // Step 1: Parse request body
    console.log(`📝 [API] Step 1: Parsing request body...`);
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error(`❌ [API] Failed to parse request body:`, parseError.message);
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }
    
    const { 
      brandOrKeyword, 
      domain, 
      competitors, 
      category,
      // New fields for persona-informed analysis
      subcategory,
      buyerPersona,
      industryCategory,
    } = body;
    console.log(`📝 [API] Received: brand="${brandOrKeyword}", domain="${domain}", subcategory="${subcategory}", persona="${buyerPersona}"`);

    if (!brandOrKeyword) {
      return NextResponse.json({ success: false, error: "Brand is required" }, { status: 400 });
    }

    // Step 2: Check environment
    console.log(`🔧 [API] Step 2: Checking environment...`);
    if (!process.env.OPENAI_API_KEY) {
      console.error(`❌ [API] OPENAI_API_KEY not configured`);
      return NextResponse.json({ success: false, error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }
    console.log(`✅ [API] OPENAI_API_KEY is set`);

    // Parse competitors
    let competitorsArray: string[] = [];
    if (competitors) {
      if (typeof competitors === "string") {
        competitorsArray = competitors.split(",").map((c: string) => c.trim()).filter((c: string) => c.length > 0);
      } else if (Array.isArray(competitors)) {
        competitorsArray = competitors;
      }
    }

    console.log(`🚀 [API] Starting analysis for: ${brandOrKeyword}${category ? ` (category: ${category})` : ''}`);

    // Step 3: Database operations
    console.log(`💾 [API] Step 3: Creating database records...`);
    
    let user;
    try {
      user = await prisma.user.upsert({
        where: { email: "demo@example.com" },
        update: {},
        create: { email: "demo@example.com" },
      });
      console.log(`✅ [API] User ready: ${user.id}`);
    } catch (userError: any) {
      console.error(`❌ [API] Failed to create/find user:`, userError.message);
      return NextResponse.json({ 
        success: false, 
        error: `Database error (user): ${userError.message}`,
        hint: "Check POSTGRES_PRISMA_URL and run prisma db push"
      }, { status: 500 });
    }

    let analysis;
    try {
      analysis = await prisma.analysis.create({
        data: {
          userId: user.id,
          brandOrKeyword,
          domain: domain || null,
          competitors: competitorsArray,
          status: "running",
          progress: 1,
          currentStep: "Initializing...",
        },
      });
      console.log(`✅ [API] Created analysis ${analysis.id}`);
    } catch (analysisError: any) {
      console.error(`❌ [API] Failed to create analysis:`, analysisError.message);
      return NextResponse.json({ 
        success: false, 
        error: `Database error (analysis): ${analysisError.message}`,
        hint: "Check database connection and schema"
      }, { status: 500 });
    }

    // Capture env vars
    const envVars = {
      openaiApiKey: process.env.OPENAI_API_KEY!,
      geminiApiKey: process.env.GEMINI_API_KEY,
      perplexityApiKey: process.env.PERPLEXITY_API_KEY,
      dataForSEOLogin: process.env.DATAFORSEO_LOGIN,
      dataForSEOPassword: process.env.DATAFORSEO_PASSWORD,
    };
    
    console.log(`🔧 [API] Captured env vars:`);
    console.log(`🔧 [API] - OPENAI: ${envVars.openaiApiKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [API] - GEMINI: ${envVars.geminiApiKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [API] - PERPLEXITY: ${envVars.perplexityApiKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [API] - DATAFORSEO_LOGIN: ${envVars.dataForSEOLogin ? 'SET' : 'NOT SET'}`);
    
    // Execute analysis in background using Vercel's waitUntil
    console.log(`🔄 [API] Starting background execution with waitUntil`);

    // Immediately update progress to show analysis has started
    await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        progress: 5,
        currentStep: "Background job starting...",
      },
    });
    console.log(`✅ [API] Updated analysis ${analysis.id} to show job starting`);

    waitUntil(
      executeAnalysis(analysis.id, brandOrKeyword, domain, competitorsArray, category, subcategory, buyerPersona, envVars)
        .then(() => {
          console.log(`✅ [API] Background analysis ${analysis.id} completed successfully`);
        })
        .catch((err) => {
          console.error(`❌ [API] Background analysis ${analysis.id} FAILED:`, err.message);
          console.error(`❌ [API] Error stack:`, err.stack);
          // Update the analysis status to failed
          return prisma.analysis.update({
            where: { id: analysis.id },
            data: {
              status: "failed",
              currentStep: `Error: ${err.message?.substring(0, 200) || "Unknown error"}`,
            },
          }).catch((updateErr: Error) => {
            console.error(`❌ [API] Failed to update analysis status:`, updateErr.message);
          });
        })
    );

    console.log(`🎯 [API] Returning response immediately for analysis ${analysis.id}`);

    // Return immediately so frontend can start polling
    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      message: "Analysis started",
      debug: {
        envVarsSet: {
          openai: !!envVars.openaiApiKey,
          gemini: !!envVars.geminiApiKey,
          perplexity: !!envVars.perplexityApiKey,
        }
      }
    });
  } catch (error: any) {
    console.error("❌ [API] Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function executeAnalysis(
  analysisId: string,
  brandOrKeyword: string,
  domain: string | undefined,
  competitors: string[],
  category?: string,
  subcategory?: string,
  buyerPersona?: string,
  envVars?: {
    openaiApiKey: string;
    geminiApiKey?: string;
    perplexityApiKey?: string;
    dataForSEOLogin?: string;
    dataForSEOPassword?: string;
  }
) {
  const startTime = Date.now();
  console.log(`🔄 [EXEC] ===== EXECUTE ANALYSIS FUNCTION CALLED =====`);
  console.log(`🔄 [EXEC] Analysis ID: ${analysisId}`);
  console.log(`🔄 [EXEC] Brand: ${brandOrKeyword}`);
  console.log(`🔄 [EXEC] Timestamp: ${new Date().toISOString()}`);
  console.log(`🔧 [EXEC] envVars passed: DATAFORSEO_LOGIN=${envVars?.dataForSEOLogin ? 'SET' : 'NOT SET'}`);

  // Immediately update progress to confirm function started
  try {
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        progress: 10,
        currentStep: "Execution function started successfully",
      },
    });
    console.log(`✅ [EXEC] Progress updated to 10% - execution confirmed`);
  } catch (updateErr) {
    console.error(`❌ [EXEC] Failed to update initial progress:`, updateErr);
  }

  try {
    // Progress callback
    const onProgress = async (progress: number, step: string) => {
      try {
        await prisma.analysis.update({
          where: { id: analysisId },
          data: { progress, currentStep: step },
        });
        console.log(`📊 [EXEC] Progress: ${progress}% - ${step}`);
      } catch (e) {
        console.error(`⚠️ [EXEC] Progress update failed: ${e}`);
      }
    };

    // Use passed env vars (from closure before waitUntil)
    const apiKey = envVars?.openaiApiKey || process.env.OPENAI_API_KEY!;
    const geminiKey = envVars?.geminiApiKey || process.env.GEMINI_API_KEY;
    const perplexityKey = envVars?.perplexityApiKey || process.env.PERPLEXITY_API_KEY;
    const dataForSEOLogin = envVars?.dataForSEOLogin || process.env.DATAFORSEO_LOGIN;
    const dataForSEOPassword = envVars?.dataForSEOPassword || process.env.DATAFORSEO_PASSWORD;
    
    console.log(`🔧 [EXEC] Using credentials:`);
    console.log(`🔧 [EXEC] - OPENAI: ${apiKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [EXEC] - GEMINI: ${geminiKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [EXEC] - PERPLEXITY: ${perplexityKey ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [EXEC] - DATAFORSEO_LOGIN: ${dataForSEOLogin ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 [EXEC] - DATAFORSEO_PASSWORD: ${dataForSEOPassword ? 'SET' : 'NOT SET'}`);
    
    // Run analysis with statistical significance and persona-informed questions
    // Uses adaptive repetition: 1x awareness, 2x consideration, 3x decision
    // Stage weights: 20% awareness, 35% consideration, 45% decision
    const service = new ComprehensiveAnalysisService({
      brandName: brandOrKeyword,
      domain,
      competitors,
      category: subcategory || category, // Prefer subcategory over broad category
      subcategory,
      persona: buyerPersona, // Persona for informed question generation
      openaiApiKey: apiKey,
      geminiApiKey: geminiKey,
      perplexityApiKey: perplexityKey,
      dataForSEOLogin,
      dataForSEOPassword,
      testsPerPlatform: 2,    // Base tests per platform (adaptive repetition will adjust)
      questionsPerStage: 3,   // 3 questions per funnel stage
      useAdaptiveRepetition: true, // Enable 1x/2x/3x repetition by stage
      onProgress,
    });

    const result = await service.runAnalysis();
    console.log(`✅ [EXEC] Analysis complete, saving results...`);

    // Save questions
    for (const q of result.rawData.questions) {
      await prisma.discoveredQuestion.create({
        data: {
          analysisId,
          question: q.question,
          searchVolume: q.searchVolume,
          difficulty: q.difficulty,
          intent: q.intent,
          category: q.category,
          score: q.score,
        },
      });
    }

    // Save AI results with sources
    for (const a of result.rawData.analyses) {
      for (const response of a.responses) {
        await prisma.aITestResult.create({
          data: {
            analysisId,
            questionId: null,
            question: response.question,
            platform: response.platform,
            brandMentioned: response.brandMentioned,
            position: response.brandPosition,
            sentiment: response.sentiment,
            context: response.contextExtract,
            fullResponse: response.fullResponse || "",  // Store full response - no truncation
            citations: response.citedUrls,
            sources: (response.sources || []) as any,
            hasGrounding: response.hasGrounding || false,
            isRealAPI: response.isRealAPI || false,
          },
        });
      }
    }

    // Save competitors
    for (const comp of competitors) {
      await prisma.detectedCompetitor.create({
        data: { analysisId, competitorName: comp, domain: comp, overlapScore: 0 },
      });
    }

    // Save insights
    for (const stage of result.journeyStages) {
      await prisma.aIInsight.create({
        data: {
          analysisId,
          category: "journey_stage",
          priority: stage.stage === "awareness" ? 1 : stage.stage === "consideration" ? 2 : 3,
          title: `${stage.stageLabel} Analysis`,
          finding: stage.recommendation.commonPattern,
          dataEvidence: `${stage.portrayal.totalTests} tests, ${stage.portrayal.mentionRate}% mention rate`,
          aiReasoning: stage.recommendation.contentType,
          actions: [stage.recommendation.focusedAction],
          expectedImpact: {
            stage: stage.stage,
            stageLabel: stage.stageLabel,
            stageDescription: stage.stageDescription,
            icon: stage.icon,
            color: stage.color,
            questions: stage.questions,
            portrayal: stage.portrayal,
            recommendation: stage.recommendation,
          },
          effort: "medium",
          timeline: "4-8 weeks",
          confidence: "high",
        },
      });
    }

    // Analyze citations for brand presence (scrape cited pages)
    console.log('[Citation Analysis] Starting citation page analysis...');
    try {
      const { analyzeCitations } = await import('@/lib/services/citations/citationPageAnalyzer');

      // Collect all unique citations from the analysis
      const allCitations: any[] = [];
      for (const a of result.rawData.analyses) {
        for (const response of a.responses) {
          if (response.sources && Array.isArray(response.sources)) {
            response.sources.forEach((source: any) => {
              const url = source.url || source;
              if (url && typeof url === 'string' && !allCitations.find(c => c.url === url)) {
                allCitations.push({
                  url,
                  domain: source.domain || url.replace(/^https?:\/\//, '').split('/')[0],
                  platform: response.platform,
                  title: source.title
                });
              }
            });
          }
        }
      }

      if (allCitations.length > 0) {
        console.log(`[Citation Analysis] Analyzing ${allCitations.length} citations...`);

        // Analyze citations in batches
        const citationAnalysisResults = await analyzeCitations(
          allCitations,
          brandOrKeyword,
          domain || '',
          {
            maxConcurrent: 3, // Conservative to avoid rate limiting
            skipBrandDomain: true // Skip brand's own domain
          }
        );

        console.log(`[Citation Analysis] Completed analysis of ${citationAnalysisResults.length} citations`);
        console.log(`[Citation Analysis] Found ${citationAnalysisResults.filter(r => r.brandMentioned || r.hasBacklink).length} citations with brand presence`);

        // Update AITestResult records with citation analysis data
        const testResults = await prisma.aITestResult.findMany({
          where: { analysisId },
          select: { id: true, sources: true }
        });

        for (const testResult of testResults) {
          if (!testResult.sources || !Array.isArray(testResult.sources)) continue;

          // Enhance sources with citation analysis data
          const enhancedSources = (testResult.sources as any[]).map((source: any) => {
            const url = source.url || source;
            const analysis = citationAnalysisResults.find(r => r.url === url);

            if (analysis) {
              return {
                ...source,
                brandMentioned: analysis.brandMentioned,
                brandMentionCount: analysis.brandMentionCount,
                hasBacklink: analysis.hasBacklink,
                backlinkUrls: analysis.backlinkUrls,
                scrapedAt: analysis.scrapedAt
              };
            }

            return source;
          });

          // Update the test result with enhanced sources
          await prisma.aITestResult.update({
            where: { id: testResult.id },
            data: { sources: enhancedSources as any }
          });
        }

        console.log('[Citation Analysis] Successfully updated test results with citation analysis');
      } else {
        console.log('[Citation Analysis] No citations to analyze');
      }
    } catch (error: any) {
      console.error('[Citation Analysis] Error analyzing citations:', error.message);
      // Don't fail the entire analysis if citation scraping fails
    }

    // Mark completed
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: "completed",
        progress: 100,
        currentStep: "Analysis complete!",
        completedAt: new Date(),
      },
    });

    console.log(`🎉 [EXEC] Completed ${analysisId} in ${(Date.now() - startTime) / 1000}s`);
  } catch (error: any) {
    console.error(`❌ [EXEC] Failed ${analysisId}:`, error.message);

    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: "failed",
        progress: 0,
        currentStep: `Failed: ${error.message?.substring(0, 200) || "Unknown error"}`,
      },
    }).catch((e: Error) => console.error(`❌ [EXEC] Failed to update failure status: ${e}`));
  }
}
