import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { category, brandName } = await request.json();

    if (!category) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are a marketing expert. Given the category/vertical "${category}"${brandName ? ` and brand "${brandName}"` : ''}, suggest 3-4 distinct buyer personas that would be searching for products/services in this space.

For each persona, provide:
1. A short descriptive name (e.g., "Budget-Conscious Parent", "Tech-Savvy Professional")
2. Their primary motivation/intent when searching
3. Key characteristics that influence their search behavior

Return as JSON array with this format:
[
  {
    "id": "persona-id-slug",
    "name": "Persona Name",
    "motivation": "What drives their search",
    "characteristics": ["trait1", "trait2"]
  }
]

Focus on personas that represent different stages of the buyer journey (awareness, consideration, decision).
Be specific to the "${category}" category.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || "[]";
    
    // Parse JSON from response
    let personas = [];
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        personas = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse personas:", parseError);
      // Fallback to generic personas
      personas = [
        { id: "value-seeker", name: "Value-Conscious Buyer", motivation: "Finding the best value", characteristics: ["Price-sensitive", "Comparison shopper"] },
        { id: "quality-focused", name: "Quality-First Buyer", motivation: "Getting the best quality", characteristics: ["Research-driven", "Brand-aware"] },
        { id: "convenience-driven", name: "Convenience Seeker", motivation: "Quick and easy solutions", characteristics: ["Time-constrained", "Decisive"] },
      ];
    }

    return NextResponse.json({
      success: true,
      personas,
      category,
    });

  } catch (error: any) {
    console.error("Persona suggestion error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to generate persona suggestions",
      // Fallback personas
      personas: [
        { id: "general-buyer", name: "General Buyer", motivation: "Finding the right product", characteristics: ["Research-oriented"] },
      ],
    }, { status: 500 });
  }
}
