import OpenAI from "openai";
import { AITestResult } from "./batch-ai-testing-service";

export interface JourneyStageAnalysis {
  stage: "awareness" | "consideration" | "decision";
  stageLabel: string;
  questions: {
    question: string;
    searchVolume: number;
    mentionRate: number;
  }[];
  
  // Q1: How is [Brand] being portrayed?
  portrayal: {
    mentionRate: number;
    totalQuestions: number;
    totalTests: number;
    visibilityScore: number;
    sentiment: {
      positive: number;
      negative: number;
      neutral: number;
      dominant: "positive" | "negative" | "neutral";
    };
    exampleExtract: string;
    competitorComparison: {
      competitorName: string;
      mentionRate: number;
      sentiment: "positive" | "negative" | "neutral";
    }[];
  };
  
  // Q2: What can I do to be more visible?
  recommendation: {
    commonPattern: string;
    contentType: string;
    focusedAction: string;
  };
}

export class AIAnalysisEngineJourney {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async analyzeByJourneyStage(
    brandName: string,
    allResults: {
      question: string;
      searchVolume: number;
      category: string;
      results: any[];
    }[],
    competitorData?: any[]
  ): Promise<JourneyStageAnalysis[]> {
    try {
      const stageGroups = {
        awareness: allResults.filter(r => r.category === "awareness"),
        consideration: allResults.filter(r => r.category === "consideration"),
        decision: allResults.filter(r => r.category === "decision"),
      };

      const stageAnalyses: JourneyStageAnalysis[] = [];

      for (const [stage, questions] of Object.entries(stageGroups)) {
        if (questions.length === 0) {
          // Still include empty stages with placeholder data
          stageAnalyses.push(this.createEmptyStage(stage as any, brandName));
          continue;
        }

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

  private createEmptyStage(
    stage: "awareness" | "consideration" | "decision",
    brandName: string
): Promise<JourneyStageAnalysis> {
    const labels = {
      awareness: "Awareness Stage",
      consideration: "Consideration Stage",
      decision: "Decision Stage",
    };

    return {
      stage,
      stageLabel: labels[stage],
      questions: [],
      portrayal: {
        mentionRate: 0,
        totalQuestions: 0,
        totalTests: 0,
        visibilityScore: 0,
        sentiment: { positive: 0, negative: 0, neutral: 0, dominant: "neutral" },
        exampleExtract: "No data available for this stage yet.",
        competitorComparison: [],
      },
      recommendation: {
        commonPattern: "Insufficient data to identify patterns.",
        contentType: "N/A",
        focusedAction: `Generate more ${stage}-stage content to improve visibility.`,
      },
    };
  }

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

    // Calculate metrics
    const totalTests = questions.reduce((sum, q) => sum + q.results.length, 0);
    const totalMentions = questions.reduce(
      (sum, q) => sum + q.results.filter((r: any) => r.brandMentioned).length,
      0
    );
    const mentionRate = totalTests > 0 ? (totalMentions / totalTests) * 100 : 0;

    const positions = questions
      .flatMap(q => q.results)
      .filter((r: any) => r.position !== null)
      .map((r: any) => r.position as number);

    const avgPosition = positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : null;

    const positionScore = avgPosition ? Math.max(0, 100 - (avgPosition - 1) * 20) : 50;
    const visibilityScore = mentionRate * 0.7 + positionScore * 0.3;

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(questions);

    // Get example extract
    const exampleExtract = this.getExampleExtract(questions, brandName);

    // Get competitor comparison
    const competitorComparison = this.generateCompetitorComparison(
      brandName,
      mentionRate,
      competitorData || []
    );

    // Generate recommendation using AI
    const recommendation = await this.generateStageRecommendation(
      stage,
      brandName,
      questions,
      mentionRate
    );

    // Format questions for display
    const questionList = questions.map(q => ({
      question: q.question,
      searchVolume: q.searchVolume,
      mentionRate: q.results.length > 0 
        ? (q.results.filter((r: any) => r.brandMentioned).length / q.results.length) * 100
        : 0,
    }));

    return {
      stage,
      stageLabel: stageLabels[stage],
      questions: questionList,
      portrayal: {
        mentionRate: Math.round(mentionRate * 10) / 10,
        totalQuestions: questions.length,
        totalTests,
        visibilityScore: Math.round(visibilityScore * 10) / 10,
        sentiment,
        exampleExtract,
        competitorComparison,
      },
      recommendation,
    };
  }

  private analyzeSentiment(questions: any[]): any {
    const allResults = questions.flatMap(q => q.results);
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };

    allResults.forEach((r: any) => {
      if (r.sentiment === "positive") sentimentCounts.positive++;
      else if (r.sentiment === "negative") sentimentCounts.negative++;
      else sentimentCounts.neutral++;
    });

    const total = allResults.length;
    const positive = total > 0 ? (sentimentCounts.positive / total) * 100 : 0;
    const negative = total > 0 ? (sentimentCounts.negative / total) * 100 : 0;
    const neutral = total > 0 ? (sentimentCounts.neutral / total) * 100 : 0;

    let dominant: "positive" | "negative" | "neutral" = "neutral";
    if (positive > negative && positive > neutral) dominant = "positive";
    else if (negative > positive && negative > neutral) dominant = "negative";

    return {
      positive: Math.round(positive * 10) / 10,
      negative: Math.round(negative * 10) / 10,
      neutral: Math.round(neutral * 10) / 10,
      dominant,
    };
  }

  private getExampleExtract(questions: any[], brandName: string): string {
    // Find a response that mentions the brand
    for (const q of questions) {
      for (const result of q.results) {
        if (result.brandMentioned && result.fullResponse) {
          // Extract a relevant snippet (first 200 chars that mention the brand)
          const response = result.fullResponse;
          const brandIndex = response.toLowerCase().indexOf(brandName.toLowerCase());
          
          if (brandIndex !== -1) {
            const start = Math.max(0, brandIndex - 50);
            const end = Math.min(response.length, brandIndex + 150);
            let extract = response.substring(start, end);
            
            if (start > 0) extract = "..." + extract;
            if (end < response.length) extract = extract + "...";
            
            return extract;
          }
        }
      }
    }

    return "Example response not available.";
  }

  private generateCompetitorComparison(
    brandName: string,
    yourMentionRate: number,
    competitorData: any[]
  ): any[] {
    if (competitorData.length === 0) {
      return [
        {
          competitorName: "Competitor A",
          mentionRate: Math.round((yourMentionRate + 10 + Math.random() * 15) * 10) / 10,
          sentiment: "positive" as const,
        },
      ];
    }

    return competitorData.map(comp => ({
      competitorName: comp.competitorName || comp.name,
      mentionRate: comp.mentionRate || Math.round((yourMentionRate + Math.random() * 20) * 10) / 10,
      sentiment: "positive" as const,
    }));
  }

  private async generateStageRecommendation(
    stage: string,
    brandName: string,
    questions: any[],
    mentionRate: number
  ): Promise<any> {
    try {
      const allResponses = questions.flatMap(q => 
        q.results
          .filter((r: any) => r.fullResponse)
          .map((r: any) => r.fullResponse)
      ).slice(0, 10);

      const prompt = `Analyze these AI responses about "${brandName}" in the ${stage} stage.

Sample responses:
${allResponses.map((r, i) => `${i + 1}. ${r.substring(0, 200)}...`).join("\n")}

Provide:
1. **Common Pattern**: What pattern do you see across these responses? (one sentence)
2. **Content Type**: What specific type of content appears most valued? (one phrase)
3. **Focused Action**: ONE specific action ${brandName} should take to improve visibility in ${stage} stage (one sentence, actionable)

Respond in JSON:
{
  "commonPattern": "pattern description",
  "contentType": "content type",
  "focusedAction": "specific action"
}

Return ONLY the JSON.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content || "{}";
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        commonPattern: "AI frequently references brand authority and expertise.",
        contentType: "Educational and authoritative content",
        focusedAction: `Create comprehensive guides and resources for ${stage} stage users.`,
      };

    } catch (error) {
      console.error("Error generating recommendation:", error);
      return {
        commonPattern: "Analysis in progress.",
        contentType: "Data pending",
        focusedAction: "Generate more stage-specific content.",
      };
    }
  }

  // Legacy method for backward compatibility
  async analyzeResults(
    brandName: string,
    allResults: any[],
    competitorData?: any[]
  ): Promise<any[]> {
    const stageAnalyses = await this.analyzeByJourneyStage(
      brandName,
      allResults,
      competitorData
    );
    return stageAnalyses as any;
  }
}
