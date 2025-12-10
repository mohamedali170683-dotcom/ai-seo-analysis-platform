import { NextResponse } from "next/server";
import { DataForSEOService } from "@/lib/services/dataforseo-service";

export const maxDuration = 60;

interface DiscoveredQuestion {
  id: string;
  question: string;
  searchVolume: number;
  category: "awareness" | "consideration" | "decision";
  type: "brand" | "category";
}

interface QuestionGroup {
  stage: "awareness" | "consideration" | "decision";
  brandQuestions: DiscoveredQuestion[];
  categoryQuestions: DiscoveredQuestion[];
}

/**
 * Phase 1: Discover questions for user selection
 * Returns questions grouped by funnel stage and type (brand vs category)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brandName, category, competitors } = body;

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

    console.log(`🔍 [DISCOVER] Starting question discovery for: ${brandName} in ${category}`);

    // Initialize DataForSEO service
    const dataForSEOLogin = process.env.DATAFORSEO_LOGIN;
    const dataForSEOPassword = process.env.DATAFORSEO_PASSWORD;

    if (!dataForSEOLogin || !dataForSEOPassword) {
      return NextResponse.json(
        { success: false, error: "DataForSEO credentials not configured" },
        { status: 500 }
      );
    }

    const dataForSEO = new DataForSEOService(dataForSEOLogin, dataForSEOPassword);

    // Fetch brand questions (questions that include the brand name)
    console.log(`📡 [DISCOVER] Fetching brand questions...`);
    const brandQuestions = await dataForSEO.getBrandQuestions(brandName, 30);

    // Fetch category questions (questions about the vertical/industry)
    console.log(`📡 [DISCOVER] Fetching category questions...`);
    const categoryQuestions = await dataForSEO.getCategoryQuestions(category, 30);

    // Group questions by funnel stage
    const stages: ("awareness" | "consideration" | "decision")[] = [
      "awareness",
      "consideration", 
      "decision"
    ];

    const questionGroups: QuestionGroup[] = stages.map(stage => ({
      stage,
      brandQuestions: brandQuestions
        .filter(q => q.category === stage)
        .slice(0, 5) // Top 5 per stage
        .map((q, i) => ({
          id: `brand-${stage}-${i}`,
          question: q.question,
          searchVolume: q.searchVolume,
          category: q.category,
          type: "brand" as const,
        })),
      categoryQuestions: categoryQuestions
        .filter(q => q.category === stage)
        .slice(0, 5) // Top 5 per stage
        .map((q, i) => ({
          id: `category-${stage}-${i}`,
          question: q.question,
          searchVolume: q.searchVolume,
          category: q.category,
          type: "category" as const,
        })),
    }));

    // Calculate totals
    const totalBrandQuestions = questionGroups.reduce(
      (sum, g) => sum + g.brandQuestions.length, 0
    );
    const totalCategoryQuestions = questionGroups.reduce(
      (sum, g) => sum + g.categoryQuestions.length, 0
    );

    console.log(`✅ [DISCOVER] Found ${totalBrandQuestions} brand questions, ${totalCategoryQuestions} category questions`);

    return NextResponse.json({
      success: true,
      brandName,
      category,
      competitors: competitors || [],
      questionGroups,
      summary: {
        totalBrandQuestions,
        totalCategoryQuestions,
        totalQuestions: totalBrandQuestions + totalCategoryQuestions,
      },
      instructions: "Select up to 4 questions to test on AI chatbots. Mix of brand and category questions recommended.",
    });

  } catch (error: any) {
    console.error("❌ [DISCOVER] Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
