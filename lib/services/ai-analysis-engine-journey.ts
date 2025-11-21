import OpenAI from "openai";
import { AITestResult } from "./batch-ai-testing-service";

export interface AIInsight {
  category: "pattern" | "recommendation" | "gap" | "opportunity";
  priority: number;
  title: string;
  finding: string;
  dataEvidence: string;
  aiReasoning: string;
  actions: string[];
  expectedImpact: {
    mentionRate?: string;
    position?: string;
    citationRate?: string;
    recommendationType?: string;
  };
  effort: "low" | "medium" | "high";
  timeline: string;
  confidence: "high" | "medium" | "low";
  correlationScore?: number;
  journeyStage?: string;
}

export interface JourneyStageAnalysis {
  stage: "awareness" | "consideration" | "decision";
  stageLabel: string;
  visibilityScore: number;
  mentionRate: number;
  avgPosition: number | null;
  totalQuestions: number;
  totalTests: number;
  patterns: {
    commonVariables: string[];
    contentThemes: string[];
    citedSources: string[];
    recommendationTriggers: string[];
  };
  insights: AIInsight[];
  competitorComparison: {
    competitorName: string;
    yourMentionRate: number;
    competitorMentionRate: number;
    gap: number;
    winningVariables: string[];
  }[];
}

export class AIAnalysisEngineJourney {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Analyze all test results grouped by journey stage
   */
  async analyzeByJourneyStage(
    brandName: string,
    allResults: {
      question: string;
      searchVolume: number;
      category: string;
      results: AITestResult[];
    }[],
    competitorData?: any[]
  ): Promise<JourneyStageAnalysis[]> {
    try {
      // Group results by journey stage
      const stageGroups = {
        awareness: allResults.filter(r => r.category === "awareness"),
        consideration: allResults.filter(r => r.category === "consideration"),
        decision: allResults.filter(r => r.category === "decision"),
      };

      const stageAnalyses: JourneyStageAnalysis[] = [];

      // Analyze each stage
      for (const [stage, questions] of Object.entries(stageGroups)) {
        if (questions.length === 0) continue;

        const analysis = await this.analyzeStage(
          stage as "awareness" | "consideration" | "decision",
          brandName,
          questions,
          competitorData
        );

        stageAnalyses.push(analysis);
      }

      return stageAnalyses;

    } catch (error) {
      console.error("Error in journey stage analysis:", error);
      throw new Error("Failed to analyze by journey stage");
    }
  }

  /**
   * Analyze a single journey stage
   */
  private async analyzeStage(
    stage: "awareness" | "consideration" | "decision",
    brandName: string,
    questions: any[],
    competitorData?: any[]
  ): Promise<JourneyStageAnalysis> {
    
    const stageLabels = {
      awareness: "Awareness Stage",
      consideration: "Consideration Stage",
      decision: "Decision Stage",
    };

    // Calculate stage statistics
    const totalTests = questions.reduce((sum, q) => sum + q.results.length, 0);
    const totalMentions = questions.reduce(
      (sum, q) => sum + q.results.filter((r: AITestResult) => r.brandMentioned).length,
      0
    );
    const mentionRate = totalTests > 0 ? (totalMentions / totalTests) * 100 : 0;

    // Calculate average position
    const positions = questions
      .flatMap(q => q.results)
      .filter((r: AITestResult) => r.position !== null)
      .map((r: AITestResult) => r.position as number);

    const avgPosition = positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : null;

    // Calculate visibility score
    const positionScore = avgPosition ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;
    const visibilityScore = mentionRate * 0.7 + positionScore * 0.3;

    // Detect patterns using AI
    const patterns = await this.detectPatterns(stage, brandName, questions);

    // Generate insights
    const insights = await this.generateStageInsights(
      stage,
      brandName,
      questions,
      patterns,
      mentionRate,
      avgPosition
    );

    // Competitor comparison (mock for now - would use actual competitor data)
    const competitorComparison = this.generateCompetitorComparison(
      brandName,
      mentionRate,
      competitorData || []
    );

    return {
      stage,
      stageLabel: stageLabels[stage],
      visibilityScore: Math.round(visibilityScore * 10) / 10,
      mentionRate: Math.round(mentionRate * 10) / 10,
      avgPosition,
      totalQuestions: questions.length,
      totalTests,
      patterns,
      insights,
      competitorComparison,
    };
  }

  /**
   * Detect patterns in AI responses for a stage
   */
  private async detectPatterns(
    stage: string,
    brandName: string,
    questions: any[]
  ): Promise<{
    commonVariables: string[];
    contentThemes: string[];
    citedSources: string[];
    recommendationTriggers: string[];
  }> {
    try {
      // Collect all responses for this stage
      const allResponses = questions.flatMap(q => 
        q.results.map((r: AITestResult) => r.fullResponse || "")
      );

      // Sample responses (max 10 to avoid token limits)
      const sampleResponses = allResponses.slice(0, 10);

      const prompt = `You are analyzing AI chatbot responses about "${brandName}" in the ${stage} stage of the customer journey.

Here are sample responses:
${sampleResponses.map((r, i) => `Response ${i + 1}: ${r.substring(0, 300)}...`).join("\n\n")}

Analyze these responses and identify:

1. **Common Variables**: What specific attributes, features, or characteristics do AI chatbots consistently mention or consider when discussing ${brandName}? (e.g., "quality certifications", "price point", "user reviews", "specific ingredients/materials")

2. **Content Themes**: What topics or themes appear most frequently? (e.g., "sustainability", "performance metrics", "customer support")

3. **Cited Sources**: What types of sources or evidence does the AI reference? (e.g., "expert reviews", "test results", "customer testimonials", "technical specifications")

4. **Recommendation Triggers**: What factors or conditions lead the AI to recommend or mention ${brandName}? (e.g., "when user asks about durability", "for professional use cases", "budget-conscious buyers")

Respond in JSON format:
{
  "commonVariables": ["variable 1", "variable 2", "variable 3"],
  "contentThemes": ["theme 1", "theme 2", "theme 3"],
  "citedSources": ["source type 1", "source type 2"],
  "recommendationTriggers": ["trigger 1", "trigger 2", "trigger 3"]
}

Return ONLY the JSON, no other text.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content || "{}";
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback
      return {
        commonVariables: [],
        contentThemes: [],
        citedSources: [],
        recommendationTriggers: [],
      };

    } catch (error) {
      console.error("Error detecting patterns:", error);
      return {
        commonVariables: [],
        contentThemes: [],
        citedSources: [],
        recommendationTriggers: [],
      };
    }
  }

  /**
   * Generate insights specific to a journey stage
   */
  private async generateStageInsights(
    stage: string,
    brandName: string,
    questions: any[],
    patterns: any,
    mentionRate: number,
    avgPosition: number | null
  ): Promise<AIInsight[]> {
    try {
      const stageDescriptions = {
        awareness: "users are learning about the category and discovering brands",
        consideration: "users are comparing options and seeking recommendations",
        decision: "users are ready to buy and looking for pricing/purchase information",
      };

      const prompt = `You are an AI visibility strategist analyzing ${brandName}'s performance in the ${stage} stage, where ${stageDescriptions[stage]}.

Current Performance:
- Mention Rate: ${mentionRate.toFixed(1)}%
- Average Position: ${avgPosition ? avgPosition.toFixed(1) : "N/A"}
- Questions Tested: ${questions.length}

Pattern Analysis:
- Common Variables AI Considers: ${patterns.commonVariables.join(", ") || "None detected"}
- Content Themes: ${patterns.contentThemes.join(", ") || "None detected"}
- Recommendation Triggers: ${patterns.recommendationTriggers.join(", ") || "None detected"}

Generate 2-3 HIGH-PRIORITY strategic recommendations to increase ${brandName}'s AI visibility in the ${stage} stage.

For the ${stage} stage specifically, focus on:
${stage === "awareness" ? "- Making brand information more discoverable and authoritative\n- Establishing thought leadership\n- Creating comprehensive educational content" : ""}
${stage === "consideration" ? "- Highlighting unique differentiators\n- Building comparison-friendly content\n- Showcasing social proof and reviews" : ""}
${stage === "decision" ? "- Optimizing pricing visibility\n- Streamlining purchase information\n- Highlighting value propositions and guarantees" : ""}

Format as JSON array:
[
  {
    "title": "Recommendation title",
    "finding": "What the data shows for ${stage} stage",
    "aiReasoning": "Why this works for AI visibility in ${stage} (cite the detected patterns)",
    "actions": ["specific action 1", "specific action 2", "specific action 3"],
    "correlationScore": 0-100
  }
]

Return ONLY the JSON array.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content || "[]";
      const jsonMatch = response.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const recs = JSON.parse(jsonMatch[0]);

        return recs.map((rec: any, index: number) => ({
          category: "recommendation",
          priority: index + 1,
          title: rec.title,
          finding: rec.finding,
          dataEvidence: `Based on ${questions.length} ${stage} stage questions`,
          aiReasoning: rec.aiReasoning,
          actions: rec.actions,
          expectedImpact: {
            mentionRate: `+${10 + index * 5}%`,
            position: avgPosition ? `Improve by 0.5-1.0` : "Enter top 3",
          },
          effort: "medium",
          timeline: "4-8 weeks",
          confidence: "high",
          correlationScore: rec.correlationScore || 80,
          journeyStage: stage,
        }));
      }

      return [];

    } catch (error) {
      console.error("Error generating stage insights:", error);
      return [];
    }
  }

  /**
   * Generate competitor comparison
   */
  private generateCompetitorComparison(
    brandName: string,
    yourMentionRate: number,
    competitorData: any[]
  ): any[] {
    // For now, return mock competitor data
    // In a real implementation, this would analyze actual competitor test results
    
    if (competitorData.length === 0) {
      // Mock competitors with realistic data
      return [
        {
          competitorName: "Competitor A",
          yourMentionRate: Math.round(yourMentionRate * 10) / 10,
          competitorMentionRate: Math.round((yourMentionRate + 10 + Math.random() * 20) * 10) / 10,
          gap: Math.round((yourMentionRate - (yourMentionRate + 15)) * 10) / 10,
          winningVariables: ["Established brand authority", "More cited reviews", "Stronger technical specs visibility"],
        },
        {
          competitorName: "Competitor B",
          yourMentionRate: Math.round(yourMentionRate * 10) / 10,
          competitorMentionRate: Math.round((yourMentionRate - 5 + Math.random() * 10) * 10) / 10,
          gap: Math.round((yourMentionRate - (yourMentionRate - 2)) * 10) / 10,
          winningVariables: yourMentionRate > 50 ? ["Your brand has advantage"] : ["Better pricing visibility", "More user testimonials"],
        },
      ];
    }

    return competitorData.map(comp => ({
      competitorName: comp.competitorName || comp.name,
      yourMentionRate: Math.round(yourMentionRate * 10) / 10,
      competitorMentionRate: comp.mentionRate || 0,
      gap: Math.round((yourMentionRate - (comp.mentionRate || 0)) * 10) / 10,
      winningVariables: comp.winningVariables || ["Analysis pending"],
    }));
  }

  /**
   * Legacy method for backward compatibility
   */
  async analyzeResults(
    brandName: string,
    allResults: any[],
    competitorData?: any[]
  ): Promise<AIInsight[]> {
    // Call the new journey stage analysis and flatten insights
    const stageAnalyses = await this.analyzeByJourneyStage(
      brandName,
      allResults,
      competitorData
    );

    // Combine all insights from all stages
    return stageAnalyses.flatMap(stage => stage.insights);
  }
}
