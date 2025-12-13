import { NextResponse } from "next/server";
import { DataForSEOService } from "@/lib/services/dataforseo-service";

export const maxDuration = 60;

interface DiscoveredQuestion {
  id: string;
  question: string;
  searchVolume: number;
  category: "awareness" | "consideration" | "decision";
  type: "brand" | "category";
  source: "real_data" | "strategic"; // NEW: Indicate if from search data or generated
}

interface QuestionGroup {
  stage: "awareness" | "consideration" | "decision";
  stageDescription: string;
  brandQuestions: DiscoveredQuestion[];
  categoryQuestions: DiscoveredQuestion[];
  requiredSelections: number;
}

type UserTier = "free" | "professional" | "partner";

/**
 * Phase 1: Discover questions for user selection
 * Returns questions grouped by funnel stage and type (brand vs category)
 * 
 * For FREE tier: Only strategic questions (no DataForSEO calls)
 * For PROFESSIONAL/PARTNER tier: Real search data + strategic questions
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brandName, category, competitors, tier = "free" } = body;
    
    // Validate tier
    const validTier: UserTier = tier === "professional" || tier === "partner" ? tier : "free";

    if (!brandName) {
      return NextResponse.json(
        { success: false, error: "Brand name is required" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category/vertical is required" },
        { status: 400 }
      );
    }

    // Professional and Partner tiers get real search data
    const useRealSearchData = validTier === "professional" || validTier === "partner";
    console.log(`🔍 [DISCOVER] Starting question discovery for: ${brandName} in ${category}`);
    console.log(`🎯 [TIER] Running as ${validTier} tier - Real search data: ${useRealSearchData ? "Yes" : "No (strategic only)"}`);

    let realBrandQuestions: any[] = [];
    let realCategoryQuestions: any[] = [];

    // Only fetch real search data for paid tier
    if (useRealSearchData) {
      // Initialize DataForSEO service
      const dataForSEOLogin = process.env.DATAFORSEO_LOGIN;
      const dataForSEOPassword = process.env.DATAFORSEO_PASSWORD;

      if (!dataForSEOLogin || !dataForSEOPassword) {
        console.log(`⚠️ [DISCOVER] DataForSEO credentials not configured, falling back to strategic only`);
      } else {
        const dataForSEO = new DataForSEOService(dataForSEOLogin, dataForSEOPassword);

        // Fetch REAL brand questions from search data
        console.log(`📡 [DISCOVER] Fetching real brand questions...`);
        realBrandQuestions = await dataForSEO.getBrandQuestions(brandName, 20);

        // Fetch REAL category questions from search data
        console.log(`📡 [DISCOVER] Fetching real category questions...`);
        realCategoryQuestions = await dataForSEO.getCategoryQuestions(category, 20);
      }
    } else {
      console.log(`🆓 [DISCOVER] Free tier - skipping DataForSEO, using strategic questions only`);
    }

    // Generate STRATEGIC questions for comprehensive brand positioning analysis
    const strategicQuestions = generateStrategicQuestions(brandName, category, competitors || []);

    // Stage descriptions for UI
    const stageDescriptions = {
      awareness: "Questions people ask when first learning about your brand or category",
      consideration: "Questions people ask when evaluating and comparing options",
      decision: "Questions people ask when ready to make a purchase decision",
    };

    // Group questions by funnel stage - 6 per stage (3 real + 3 strategic)
    const stages: ("awareness" | "consideration" | "decision")[] = [
      "awareness",
      "consideration", 
      "decision"
    ];

    const questionGroups: QuestionGroup[] = stages.map(stage => {
      // Get top 3 REAL brand questions for this stage
      const realBrand = realBrandQuestions
        .filter(q => q.category === stage)
        .slice(0, 3)
        .map((q, i) => ({
          id: `brand-real-${stage}-${i}`,
          question: q.question,
          searchVolume: q.searchVolume,
          category: q.category,
          type: "brand" as const,
          source: "real_data" as const,
        }));

      // Get top 3 REAL category questions for this stage
      const realCategory = realCategoryQuestions
        .filter(q => q.category === stage)
        .slice(0, 3)
        .map((q, i) => ({
          id: `category-real-${stage}-${i}`,
          question: q.question,
          searchVolume: q.searchVolume,
          category: q.category,
          type: "category" as const,
          source: "real_data" as const,
        }));

      // Get 3 STRATEGIC brand questions for this stage
      const strategicBrand = strategicQuestions.brand
        .filter(q => q.category === stage)
        .slice(0, 3)
        .map((q, i) => ({
          id: `brand-strategic-${stage}-${i}`,
          question: q.question,
          searchVolume: q.searchVolume,
          category: q.category,
          type: "brand" as const,
          source: "strategic" as const,
        }));

      // Get 3 STRATEGIC category questions for this stage
      const strategicCategory = strategicQuestions.category
        .filter(q => q.category === stage)
        .slice(0, 3)
        .map((q, i) => ({
          id: `category-strategic-${stage}-${i}`,
          question: q.question,
          searchVolume: q.searchVolume,
          category: q.category,
          type: "category" as const,
          source: "strategic" as const,
        }));

      return {
        stage,
        stageDescription: stageDescriptions[stage],
        brandQuestions: [...realBrand, ...strategicBrand],
        categoryQuestions: [...realCategory, ...strategicCategory],
        requiredSelections: 3, // User must select 3 from this stage
      };
    });

    // Calculate totals
    const totalBrandQuestions = questionGroups.reduce(
      (sum, g) => sum + g.brandQuestions.length, 0
    );
    const totalCategoryQuestions = questionGroups.reduce(
      (sum, g) => sum + g.categoryQuestions.length, 0
    );

    console.log(`✅ [DISCOVER] Found ${totalBrandQuestions} brand questions, ${totalCategoryQuestions} category questions`);

    // Determine required selections based on tier
    const requiredSelections = validTier === "free" ? 3 : 9;
    
    // Tier-specific instructions
    const instructions: Record<UserTier, string> = {
      free: "Free tier: Select up to 3 questions from Awareness stage. Upgrade to Professional for full funnel analysis with real search data.",
      professional: "Professional tier: Select up to 18 questions across all 3 funnel stages. Mix real search data questions with strategic ones for comprehensive analysis.",
      partner: "Partner tier: Unlimited question selection. Full access to real search data and all funnel stages.",
    };

    return NextResponse.json({
      success: true,
      brandName,
      category,
      competitors: competitors || [],
      tier: validTier,
      questionGroups,
      summary: {
        totalBrandQuestions,
        totalCategoryQuestions,
        totalQuestions: totalBrandQuestions + totalCategoryQuestions,
        requiredSelections,
        hasRealSearchData: useRealSearchData && (realBrandQuestions.length > 0 || realCategoryQuestions.length > 0),
      },
      instructions: instructions[validTier],
    });

  } catch (error: any) {
    console.error("❌ [DISCOVER] Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate strategic questions for comprehensive brand positioning analysis
 * These questions are designed to understand AI's perception of the brand
 */
function generateStrategicQuestions(
  brandName: string, 
  category: string, 
  competitors: string[]
): {
  brand: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[];
  category: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[];
} {
  const mainCompetitor = competitors[0] || "competitors";
  
  return {
    brand: [
      // Awareness - Understanding brand perception
      { question: `What is ${brandName} known for?`, searchVolume: 0, category: "awareness" },
      { question: `Is ${brandName} a premium brand?`, searchVolume: 0, category: "awareness" },
      { question: `What makes ${brandName} unique?`, searchVolume: 0, category: "awareness" },
      { question: `Who is ${brandName}'s target audience?`, searchVolume: 0, category: "awareness" },
      
      // Consideration - Comparison and evaluation
      { question: `Is ${brandName} better than ${mainCompetitor}?`, searchVolume: 0, category: "consideration" },
      { question: `What are the pros and cons of ${brandName}?`, searchVolume: 0, category: "consideration" },
      { question: `Is ${brandName} worth the price?`, searchVolume: 0, category: "consideration" },
      { question: `How does ${brandName} compare to alternatives?`, searchVolume: 0, category: "consideration" },
      
      // Decision - Purchase intent
      { question: `Should I buy ${brandName}?`, searchVolume: 0, category: "decision" },
      { question: `What is the best ${brandName} product to buy?`, searchVolume: 0, category: "decision" },
      { question: `Where can I buy ${brandName}?`, searchVolume: 0, category: "decision" },
      { question: `Is ${brandName} recommended by experts?`, searchVolume: 0, category: "decision" },
    ],
    category: [
      // Awareness - Category understanding
      { question: `What should I know about ${category}?`, searchVolume: 0, category: "awareness" },
      { question: `What are the different types of ${category}?`, searchVolume: 0, category: "awareness" },
      { question: `How do I choose ${category}?`, searchVolume: 0, category: "awareness" },
      { question: `What features matter most in ${category}?`, searchVolume: 0, category: "awareness" },
      
      // Consideration - Category evaluation
      { question: `What is the best ${category} brand?`, searchVolume: 0, category: "consideration" },
      { question: `What ${category} do experts recommend?`, searchVolume: 0, category: "consideration" },
      { question: `What is the best value ${category}?`, searchVolume: 0, category: "consideration" },
      { question: `${category} comparison: which brand is best?`, searchVolume: 0, category: "consideration" },
      
      // Decision - Category purchase
      { question: `Best ${category} to buy right now?`, searchVolume: 0, category: "decision" },
      { question: `Top rated ${category} recommendations?`, searchVolume: 0, category: "decision" },
      { question: `Where to buy quality ${category}?`, searchVolume: 0, category: "decision" },
      { question: `Is it worth investing in premium ${category}?`, searchVolume: 0, category: "decision" },
    ],
  };
}
