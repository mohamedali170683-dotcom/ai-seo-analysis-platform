import { NextResponse } from "next/server";
import { DataForSEOService } from "@/lib/services/dataforseo-service";
import { PERSONA_QUERY_MAPPING, FUNNEL_STAGE_PATTERNS } from "@/lib/services/persona-query-engine";

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
 * NEW MODEL: ALL tiers get real search data from DataForSEO
 * Free tier sees the FULL problem but can't access detailed recommendations
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      brandName, 
      category, // This should be the SUBCATEGORY (specific, e.g., "running shoes")
      competitors, 
      tier = "free",
      // Persona context for question generation
      industryCategory,
      subcategory,
      buyerPersona,
    } = body;
    
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

    // Use subcategory if provided (more specific), otherwise fall back to category
    const effectiveCategory = subcategory || category;

    // ALL tiers now get real search data (Free tier sees the problem, not the solution)
    console.log(`🔍 [DISCOVER] Starting question discovery for: ${brandName} in ${effectiveCategory}`);
    console.log(`🎯 [TIER] Running as ${validTier} tier - Real search data: YES (all tiers)`);
    if (buyerPersona) {
      console.log(`👤 [PERSONA] Buyer persona selected: ${buyerPersona}`);
    }

    let realBrandQuestions: any[] = [];
    let realCategoryQuestions: any[] = [];

    // Fetch real search data for ALL tiers
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
      // Use effectiveCategory (subcategory if available) for more specific results
      console.log(`📡 [DISCOVER] Fetching real category questions for: ${effectiveCategory}`);
      realCategoryQuestions = await dataForSEO.getCategoryQuestions(effectiveCategory, 20);
    }

    // Generate STRATEGIC questions for comprehensive brand positioning analysis
    // Uses persona-informed question generation when persona is provided
    const strategicQuestions = generateStrategicQuestions(brandName, effectiveCategory, competitors || [], buyerPersona);

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
    const requiredSelections = validTier === "free" ? 3 : 3; // Min 3 for all tiers
    
    // Tier-specific instructions - now all tiers get real search data
    const instructions: Record<UserTier, string> = {
      free: "Free tier: Select up to 3 questions from Awareness stage. All 4 AI platforms included. Real search data included. Upgrade to Professional for detailed recommendations and full funnel analysis.",
      professional: "Professional tier: Unlimited questions across all 3 funnel stages. Full recommendations with implementation code.",
      partner: "Partner tier: Unlimited question selection. Full access to all features plus strategy calls and implementation support.",
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
        hasRealSearchData: realBrandQuestions.length > 0 || realCategoryQuestions.length > 0,
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
 * Uses persona-informed question generation when persona is provided
 * 
 * CRITICAL: Persona names are NEVER included in generated questions.
 * Persona only influences the framing, intent, and context.
 */
function generateStrategicQuestions(
  brandName: string, 
  category: string, // This is the SUBCATEGORY (specific, e.g., "running shoes")
  competitors: string[],
  buyerPersona?: string
): {
  brand: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[];
  category: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[];
} {
  const mainCompetitor = competitors[0] || "alternatives";
  const currentYear = new Date().getFullYear();
  
  // Get persona-specific patterns if persona is selected
  const personaConfig = buyerPersona ? PERSONA_QUERY_MAPPING[buyerPersona] : null;
  
  // Generate questions using funnel stage patterns + persona influence
  const brandQuestions: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[] = [];
  const categoryQuestions: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[] = [];
  
  // ============================================
  // AWARENESS STAGE
  // Persona has LOW influence - educational questions
  // Primary metric: content_citation_rate
  // ============================================
  const awarenessPatterns = FUNNEL_STAGE_PATTERNS.awareness.patterns;
  
  // Category questions (no brand mention expected)
  categoryQuestions.push(
    { question: `What is ${category}`, searchVolume: 0, category: "awareness" },
    { question: `How does ${category} work`, searchVolume: 0, category: "awareness" },
    { question: `Types of ${category}`, searchVolume: 0, category: "awareness" },
    { question: `${category} guide for beginners`, searchVolume: 0, category: "awareness" },
  );
  
  // Brand questions (awareness level)
  brandQuestions.push(
    { question: `What is ${brandName} known for`, searchVolume: 0, category: "awareness" },
    { question: `${brandName} company overview`, searchVolume: 0, category: "awareness" },
    { question: `What does ${brandName} specialize in`, searchVolume: 0, category: "awareness" },
  );
  
  // ============================================
  // CONSIDERATION STAGE
  // Persona has MEDIUM influence - comparison questions
  // Primary metric: mention_rate_and_position
  // ============================================
  
  // Base consideration questions
  categoryQuestions.push(
    { question: `Best ${category} ${currentYear}`, searchVolume: 0, category: "consideration" },
    { question: `Top ${category} brands`, searchVolume: 0, category: "consideration" },
    { question: `${category} comparison`, searchVolume: 0, category: "consideration" },
    { question: `How to choose ${category}`, searchVolume: 0, category: "consideration" },
  );
  
  // Add persona-influenced consideration questions
  if (personaConfig) {
    const intentType = personaConfig.intentType;
    
    if (intentType === 'price_sensitive') {
      categoryQuestions.push(
        { question: `Best budget ${category}`, searchVolume: 0, category: "consideration" },
        { question: `${category} best value for money`, searchVolume: 0, category: "consideration" },
      );
    } else if (intentType === 'sustainability_focused' || intentType === 'ethical_consumption') {
      categoryQuestions.push(
        { question: `Most sustainable ${category}`, searchVolume: 0, category: "consideration" },
        { question: `Eco-friendly ${category} brands`, searchVolume: 0, category: "consideration" },
      );
    } else if (intentType === 'technical_research' || intentType === 'evidence_seeking') {
      categoryQuestions.push(
        { question: `${category} with best technology`, searchVolume: 0, category: "consideration" },
        { question: `Most advanced ${category}`, searchVolume: 0, category: "consideration" },
      );
    } else if (intentType === 'longevity_focused') {
      categoryQuestions.push(
        { question: `Most durable ${category}`, searchVolume: 0, category: "consideration" },
        { question: `Highest quality ${category}`, searchVolume: 0, category: "consideration" },
      );
    } else if (intentType === 'experience_focused') {
      categoryQuestions.push(
        { question: `Best ${category} experience`, searchVolume: 0, category: "consideration" },
        { question: `Premium ${category} worth it`, searchVolume: 0, category: "consideration" },
      );
    }
  }
  
  // Brand consideration questions
  brandQuestions.push(
    { question: `${brandName} vs ${mainCompetitor}`, searchVolume: 0, category: "consideration" },
    { question: `Is ${brandName} worth the price`, searchVolume: 0, category: "consideration" },
    { question: `${brandName} ${category} reviews`, searchVolume: 0, category: "consideration" },
    { question: `Pros and cons of ${brandName}`, searchVolume: 0, category: "consideration" },
  );
  
  // ============================================
  // DECISION STAGE
  // Persona has HIGH influence - purchase intent questions
  // Primary metric: sentiment_and_recommendation_strength
  // ============================================
  
  // Base decision questions
  categoryQuestions.push(
    { question: `Best ${category} to buy right now`, searchVolume: 0, category: "decision" },
    { question: `Top rated ${category} recommendations`, searchVolume: 0, category: "decision" },
    { question: `Which ${category} should I buy`, searchVolume: 0, category: "decision" },
  );
  
  // Add persona-influenced decision questions
  if (personaConfig) {
    const intentType = personaConfig.intentType;
    
    if (intentType === 'immediate_purchase') {
      categoryQuestions.push(
        { question: `${category} deals today`, searchVolume: 0, category: "decision" },
        { question: `${category} with fast delivery`, searchVolume: 0, category: "decision" },
      );
    } else if (intentType === 'price_sensitive') {
      const price = personaConfig.pricePoints?.[0] || '€100';
      categoryQuestions.push(
        { question: `Best ${category} under ${price}`, searchVolume: 0, category: "decision" },
        { question: `Affordable ${category} worth buying`, searchVolume: 0, category: "decision" },
      );
    } else if (intentType === 'roi_focused') {
      categoryQuestions.push(
        { question: `Best ${category} for long-term use`, searchVolume: 0, category: "decision" },
        { question: `${category} worth the investment`, searchVolume: 0, category: "decision" },
      );
    }
  }
  
  // Brand decision questions
  brandQuestions.push(
    { question: `Should I buy ${brandName} ${category}`, searchVolume: 0, category: "decision" },
    { question: `Best ${brandName} ${category} to buy`, searchVolume: 0, category: "decision" },
    { question: `Where to buy ${brandName} ${category}`, searchVolume: 0, category: "decision" },
    { question: `Is ${brandName} recommended by experts`, searchVolume: 0, category: "decision" },
  );
  
  return {
    brand: brandQuestions,
    category: categoryQuestions,
  };
}
