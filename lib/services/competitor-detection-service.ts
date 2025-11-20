import OpenAI from "openai";

export interface DetectedCompetitor {
  name: string;
  domain?: string;
  reason: string;
}

export class CompetitorDetectionService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Detect competitors using AI analysis
   */
  async detectCompetitors(
    brandOrKeyword: string,
    domain: string,
    userProvidedCompetitors?: string
  ): Promise<DetectedCompetitor[]> {
    try {
      const prompt = `You are a competitive intelligence analyst. 

Brand/Product: ${brandOrKeyword}
Domain: ${domain}
${userProvidedCompetitors ? `User mentioned these competitors: ${userProvidedCompetitors}` : ""}

Task: Identify the top 5-7 direct competitors for this brand/product.

For each competitor, provide:
1. Brand name
2. Domain (if known)
3. Brief reason why they're a competitor

Format your response as JSON array:
[
  {
    "name": "Competitor Name",
    "domain": "competitor.com",
    "reason": "Direct competitor because..."
  }
]

Focus on:
- Direct product/service competitors
- Similar market positioning
- Brands users would compare when making decisions
- Well-known alternatives

Return ONLY the JSON array, no other text.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content || "[]";

      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Failed to parse competitor list");
      }

      const competitors: DetectedCompetitor[] = JSON.parse(jsonMatch[0]);

      // Add user-provided competitors if any
      if (userProvidedCompetitors) {
        const userCompetitors = userProvidedCompetitors
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c);

        userCompetitors.forEach((comp) => {
          if (!competitors.find((c) => c.name.toLowerCase() === comp.toLowerCase())) {
            competitors.unshift({
              name: comp,
              domain: undefined,
              reason: "User-specified competitor",
            });
          }
        });
      }

      return competitors.slice(0, 7); // Max 7 competitors
    } catch (error) {
      console.error("Error detecting competitors:", error);

      // Fallback: use user-provided if available
      if (userProvidedCompetitors) {
        return userProvidedCompetitors
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c)
          .map((name) => ({
            name,
            domain: undefined,
            reason: "User-specified competitor (AI detection failed)",
          }));
      }

      return [];
    }
  }

  /**
   * Validate if a mention in AI response is actually about the brand
   */
  async validateBrandMention(
    brandName: string,
    responseText: string
  ): Promise<{
    isMention: boolean;
    context: string;
    confidence: number;
  }> {
    try {
      const prompt = `Brand: ${brandName}

AI Response excerpt:
"${responseText.substring(0, 500)}..."

Question: Is this AI response mentioning or recommending the brand "${brandName}"?

Analyze:
1. Is the brand explicitly mentioned?
2. What's the context (positive, neutral, negative)?
3. Confidence level (0-100)

Respond in JSON:
{
  "isMention": true/false,
  "context": "brief context description",
  "confidence": 0-100
}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content || "{}";
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: simple string matching
      const isMention = responseText
        .toLowerCase()
        .includes(brandName.toLowerCase());

      return {
        isMention,
        context: isMention ? "Brand name found in response" : "Brand not found",
        confidence: isMention ? 70 : 30,
      };
    } catch (error) {
      console.error("Error validating brand mention:", error);

      // Simple fallback
      const isMention = responseText
        .toLowerCase()
        .includes(brandName.toLowerCase());

      return {
        isMention,
        context: "Fallback validation",
        confidence: 50,
      };
    }
  }
}
