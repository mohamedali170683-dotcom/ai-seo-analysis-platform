import { NextResponse } from "next/server";
import { DataForSEOService } from "@/lib/services/dataforseo-service";
import { PERSONA_QUERY_MAPPING, FUNNEL_STAGE_PATTERNS } from "@/lib/services/persona-query-engine";
import { BrandDataFetcher, FetchedBrandData } from "@/lib/services/brand-data-fetcher";
import OpenAI from "openai";

/**
 * Brand context used to disambiguate brand names and generate relevant questions.
 * Assembled from website metadata, Wikipedia, and/or user-provided description.
 */
interface BrandContext {
  description?: string;
  industry?: string;
  positioning?: string;
  pricePoint?: string;
  keyAttributes?: string[];
  parentCompany?: string;
  products?: string[];
}

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
      // Brand context enrichment fields
      domain,
      brandDescription,
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

    // ============================================
    // BRAND CONTEXT ENRICHMENT
    // Fetch brand data from website/Wikipedia to disambiguate
    // ambiguous brand names (e.g., "QS" = fashion vs. finance)
    // ============================================
    let brandContext: BrandContext = {};

    // Priority 1: User-provided description (most reliable)
    if (brandDescription) {
      brandContext.description = brandDescription;
      console.log(`📝 [DISCOVER] Using user-provided brand description`);
    }

    // Priority 2: Fetch from domain if provided (automatic enrichment)
    if (domain) {
      try {
        console.log(`🌐 [DISCOVER] Fetching brand context from domain: ${domain}`);
        const fetcher = new BrandDataFetcher();
        const brandData = await fetcher.fetchBrandData(domain);

        if (brandData.description && !brandContext.description) {
          brandContext.description = brandData.description;
        }
        if (brandData.industry) {
          brandContext.industry = brandData.industry;
        }
        if (brandData.positioning?.primary) {
          brandContext.positioning = brandData.positioning.primary;
        }
        if (brandData.positioning?.pricePoint) {
          brandContext.pricePoint = brandData.positioning.pricePoint;
        }
        if (brandData.positioning?.keyAttributes) {
          brandContext.keyAttributes = brandData.positioning.keyAttributes;
        }
        if (brandData.parentCompany) {
          brandContext.parentCompany = brandData.parentCompany;
        }
        if (brandData.products) {
          brandContext.products = brandData.products;
        }
        console.log(`✅ [DISCOVER] Brand context enriched:`, {
          hasDescription: !!brandContext.description,
          industry: brandContext.industry,
          positioning: brandContext.positioning,
          parentCompany: brandContext.parentCompany,
        });
      } catch (err: any) {
        console.warn(`⚠️ [DISCOVER] Brand context fetch failed: ${err.message}`);
      }
    }

    // Build a disambiguation qualifier for DataForSEO queries
    // This ensures "QS" becomes "QS fashion" instead of matching finance results
    const brandQualifier = buildBrandQualifier(brandName, effectiveCategory, brandContext);
    console.log(`🔑 [DISCOVER] Brand qualifier for search: "${brandQualifier}"`);

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
      // Use qualified brand name to disambiguate (e.g., "QS fashion" instead of just "QS")
      console.log(`📡 [DISCOVER] Fetching real brand questions for: "${brandQualifier}"`);
      realBrandQuestions = await dataForSEO.getBrandQuestions(brandQualifier, 20);

      // Fetch REAL category questions from search data
      // Use effectiveCategory (subcategory if available) for more specific results
      console.log(`📡 [DISCOVER] Fetching real category questions for: ${effectiveCategory}`);
      realCategoryQuestions = await dataForSEO.getCategoryQuestions(effectiveCategory, 20);
    }

    // Generate STRATEGIC questions for comprehensive brand positioning analysis
    // Try AI-powered generation first (produces brand-specific questions),
    // fall back to template-based generation if OpenAI fails
    let strategicQuestions: ReturnType<typeof generateStrategicQuestions>;

    const aiQuestions = await generateAIQuestions(brandName, effectiveCategory, competitors || [], buyerPersona, brandContext);
    if (aiQuestions) {
      strategicQuestions = aiQuestions;
      console.log(`🤖 [DISCOVER] Using AI-generated strategic questions`);
    } else {
      strategicQuestions = generateStrategicQuestions(brandName, effectiveCategory, competitors || [], buyerPersona, brandContext);
      console.log(`📋 [DISCOVER] Using template-based strategic questions (AI fallback)`);
    }

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
  buyerPersona?: string,
  brandContext?: BrandContext
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

  // ============================================
  // BRAND-CONTEXT-AWARE QUESTIONS
  // When we know more about the brand (from website/description),
  // generate questions that reflect its actual positioning
  // ============================================
  if (brandContext && (brandContext.description || brandContext.industry || brandContext.positioning)) {
    const contextQuestions = generateContextAwareQuestions(brandName, category, brandContext, mainCompetitor);
    brandQuestions.push(...contextQuestions.brand);
    categoryQuestions.push(...contextQuestions.category);
  }

  return {
    brand: brandQuestions,
    category: categoryQuestions,
  };
}

/**
 * Build a search qualifier to disambiguate brand names in DataForSEO queries.
 * For well-known brands, the name alone is sufficient.
 * For ambiguous names (e.g., "QS" could be fashion or finance), we append the category.
 */
function buildBrandQualifier(brandName: string, category: string, brandContext: BrandContext): string {
  // Short brand names (1-3 chars) or acronyms are most likely to be ambiguous
  const isShortName = brandName.replace(/\s/g, '').length <= 3;
  const isAcronym = brandName === brandName.toUpperCase() && brandName.length <= 5;
  const hasIndustryContext = !!brandContext.industry || !!brandContext.description;

  // Always qualify short/ambiguous names with category
  if (isShortName || isAcronym) {
    // Use industry from brand context if available, otherwise use category
    const qualifier = brandContext.industry || category;
    return `${brandName} ${qualifier}`;
  }

  // For longer names, use just the brand name (less likely to be ambiguous)
  return brandName;
}

/**
 * Generate additional questions informed by brand context.
 * These questions are specific to the brand's actual positioning, industry, and attributes.
 */
function generateContextAwareQuestions(
  brandName: string,
  category: string,
  brandContext: BrandContext,
  mainCompetitor: string
): {
  brand: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[];
  category: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[];
} {
  const brand: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[] = [];
  const cat: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[] = [];

  // Parent company context (e.g., QS belongs to S.Oliver Group)
  if (brandContext.parentCompany) {
    brand.push(
      { question: `Is ${brandName} part of ${brandContext.parentCompany}`, searchVolume: 0, category: "awareness" },
      { question: `${brandName} vs other ${brandContext.parentCompany} brands`, searchVolume: 0, category: "consideration" },
    );
  }

  // Positioning-aware questions
  const positioning = brandContext.positioning;
  if (positioning === 'sustainable' || brandContext.keyAttributes?.includes('sustainable')) {
    brand.push(
      { question: `Is ${brandName} really sustainable`, searchVolume: 0, category: "consideration" },
      { question: `Most sustainable ${category} brands`, searchVolume: 0, category: "consideration" },
    );
  }
  if (positioning === 'premium' || positioning === 'luxury') {
    brand.push(
      { question: `Is ${brandName} worth the premium price`, searchVolume: 0, category: "decision" },
      { question: `Best premium ${category}`, searchVolume: 0, category: "consideration" },
    );
  }
  if (positioning === 'affordable' || positioning === 'value-oriented') {
    brand.push(
      { question: `Best affordable ${category} like ${brandName}`, searchVolume: 0, category: "consideration" },
      { question: `Is ${brandName} good quality for the price`, searchVolume: 0, category: "decision" },
    );
  }
  if (positioning === 'innovative' || positioning === 'tech-forward') {
    brand.push(
      { question: `What makes ${brandName} innovative`, searchVolume: 0, category: "awareness" },
      { question: `Most innovative ${category} brands`, searchVolume: 0, category: "consideration" },
    );
  }
  if (positioning === 'lifestyle') {
    brand.push(
      { question: `What lifestyle does ${brandName} represent`, searchVolume: 0, category: "awareness" },
    );
    cat.push(
      { question: `Best ${category} for modern lifestyle`, searchVolume: 0, category: "consideration" },
    );
  }

  // Price point-aware questions
  if (brandContext.pricePoint === 'budget') {
    cat.push(
      { question: `Best budget ${category} brands`, searchVolume: 0, category: "consideration" },
    );
  } else if (brandContext.pricePoint === 'mid-range') {
    cat.push(
      { question: `Best mid-range ${category}`, searchVolume: 0, category: "consideration" },
    );
  }

  // Industry-specific awareness questions
  if (brandContext.industry && brandContext.industry.toLowerCase() !== category.toLowerCase()) {
    brand.push(
      { question: `What does ${brandName} do in ${brandContext.industry}`, searchVolume: 0, category: "awareness" },
    );
  }

  return { brand, category: cat };
}

/**
 * AI-powered question generation using OpenAI.
 * Generates brand-specific, context-aware questions instead of generic templates.
 * Returns null if OpenAI is unavailable or fails (caller should fall back to templates).
 */
async function generateAIQuestions(
  brandName: string,
  category: string,
  competitors: string[],
  buyerPersona?: string,
  brandContext?: BrandContext
): Promise<{
  brand: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[];
  category: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[];
} | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log(`⚠️ [AI-QUESTIONS] OpenAI API key not configured, skipping AI generation`);
    return null;
  }

  try {
    const openai = new OpenAI({ apiKey, timeout: 15000, maxRetries: 1 });

    // Build context block for the prompt
    const contextLines: string[] = [];
    contextLines.push(`Brand: ${brandName}`);
    contextLines.push(`Category: ${category}`);
    if (competitors.length > 0) {
      contextLines.push(`Competitors: ${competitors.join(", ")}`);
    }
    if (buyerPersona) {
      contextLines.push(`Buyer Persona: ${buyerPersona}`);
    }
    if (brandContext?.description) {
      contextLines.push(`Brand Description: ${brandContext.description}`);
    }
    if (brandContext?.industry) {
      contextLines.push(`Industry: ${brandContext.industry}`);
    }
    if (brandContext?.positioning) {
      contextLines.push(`Positioning: ${brandContext.positioning}`);
    }
    if (brandContext?.pricePoint) {
      contextLines.push(`Price Point: ${brandContext.pricePoint}`);
    }
    if (brandContext?.parentCompany) {
      contextLines.push(`Parent Company: ${brandContext.parentCompany}`);
    }
    if (brandContext?.keyAttributes && brandContext.keyAttributes.length > 0) {
      contextLines.push(`Key Attributes: ${brandContext.keyAttributes.join(", ")}`);
    }

    const prompt = `You are an AI visibility strategist specializing in Generative Engine Optimization (GEO). Generate search questions that real users would type into AI chatbots (ChatGPT, Gemini, Perplexity) when researching "${category}" — specifically relevant to "${brandName}".

${contextLines.join("\n")}

Generate exactly 18 questions total: 3 brand + 3 category for each of 3 funnel stages.

FUNNEL STAGES:
- awareness: Discovery questions. Users learning about the category or brand for the first time.
  Examples: "What is ${brandName}", "How does ${category} work", "Who are the main ${category} brands"
- consideration: Comparison questions. Users actively evaluating options and comparing.
  Examples: "Best ${category} 2025", "${brandName} vs [competitor]", "Is ${brandName} worth it", "Top brands for ${category}"
- decision: Purchase-intent questions. Users ready to buy or take action.
  Examples: "Should I buy ${brandName}", "Where to buy ${category}", "Is ${brandName} recommended for [use case]"

CRITICAL RULES:
- Brand questions MUST mention "${brandName}" by name
- Category questions must NOT mention "${brandName}" — use the category "${category}" or general phrasing
- Questions must sound conversational and natural — like real people typing into ChatGPT
- Questions MUST be directly relevant to this specific brand and industry
- DO NOT generate generic marketing/business questions (e.g., "What marketing strategies does X use")
- DO NOT generate questions about the company's internal operations, stock price, or corporate structure
- Focus on what a potential CUSTOMER would ask, not an investor or journalist
- If competitors are provided, use at least one real competitor name in a consideration question
- Each question should cover a genuinely different angle — no rephrasing the same question
- Do NOT include question marks in the output

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{"brand":{"awareness":["q1","q2","q3"],"consideration":["q1","q2","q3"],"decision":["q1","q2","q3"]},"category":{"awareness":["q1","q2","q3"],"consideration":["q1","q2","q3"],"decision":["q1","q2","q3"]}}`;

    console.log(`🤖 [AI-QUESTIONS] Calling OpenAI to generate strategic questions...`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      console.warn(`⚠️ [AI-QUESTIONS] Empty response from OpenAI`);
      return null;
    }

    // Parse JSON — handle potential markdown wrapping
    const jsonStr = content.replace(/^```json?\s*/, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed.brand || !parsed.category) {
      console.warn(`⚠️ [AI-QUESTIONS] Invalid response structure`);
      return null;
    }

    // Convert to internal format
    const stages: ("awareness" | "consideration" | "decision")[] = ["awareness", "consideration", "decision"];
    const brandQuestions: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[] = [];
    const categoryQuestions: { question: string; searchVolume: number; category: "awareness" | "consideration" | "decision" }[] = [];

    for (const stage of stages) {
      const brandStageQs = parsed.brand[stage];
      const catStageQs = parsed.category[stage];

      if (Array.isArray(brandStageQs)) {
        for (const q of brandStageQs.slice(0, 3)) {
          if (typeof q === "string" && q.length > 5) {
            brandQuestions.push({ question: q, searchVolume: 0, category: stage });
          }
        }
      }
      if (Array.isArray(catStageQs)) {
        for (const q of catStageQs.slice(0, 3)) {
          if (typeof q === "string" && q.length > 5) {
            categoryQuestions.push({ question: q, searchVolume: 0, category: stage });
          }
        }
      }
    }

    // Post-generation relevance filter — remove questions about internal operations, stock, HR, etc.
    const irrelevantPatterns = [
      /\b(stock price|share price|market cap|IPO|investor|shareholder|quarterly earnings)\b/i,
      /\b(CEO|CFO|CTO|board of directors|corporate governance|annual report)\b/i,
      /\b(marketing strateg|advertising campaign|brand ambassador|sponsorship deal)\b/i,
      /\b(employee|hiring|salary|work culture|glassdoor|job opening)\b/i,
      /\b(lawsuit|legal issue|controversy|scandal)\b/i,
    ];
    const isRelevant = (q: string) => !irrelevantPatterns.some(p => p.test(q));

    const filteredBrand = brandQuestions.filter(q => {
      if (!isRelevant(q.question)) {
        console.log(`🔍 [AI-QUESTIONS] Filtered irrelevant brand question: "${q.question}"`);
        return false;
      }
      return true;
    });
    const filteredCategory = categoryQuestions.filter(q => {
      if (!isRelevant(q.question)) {
        console.log(`🔍 [AI-QUESTIONS] Filtered irrelevant category question: "${q.question}"`);
        return false;
      }
      return true;
    });

    // Use filtered lists going forward
    const finalBrand = filteredBrand;
    const finalCategory = filteredCategory;

    console.log(`✅ [AI-QUESTIONS] Generated ${finalBrand.length} brand + ${finalCategory.length} category questions (after relevance filter)`);

    // Validate total count (use filtered lists)
    if (finalBrand.length < 6 || finalCategory.length < 6) {
      console.warn(`⚠️ [AI-QUESTIONS] Too few questions after filtering (${finalBrand.length} brand, ${finalCategory.length} category), falling back`);
      return null;
    }

    // Validate per-stage minimums — each stage must have at least 1 question per type
    const hasAllStages = stages.every(stage => {
      const brandCount = finalBrand.filter(q => q.category === stage).length;
      const catCount = finalCategory.filter(q => q.category === stage).length;
      if (brandCount === 0 || catCount === 0) {
        console.warn(`⚠️ [AI-QUESTIONS] Stage "${stage}" missing questions (brand: ${brandCount}, category: ${catCount}), falling back`);
        return false;
      }
      return true;
    });

    if (!hasAllStages) {
      return null;
    }

    return { brand: finalBrand, category: finalCategory };
  } catch (err: any) {
    console.warn(`⚠️ [AI-QUESTIONS] OpenAI generation failed: ${err.message}`);
    return null;
  }
}
