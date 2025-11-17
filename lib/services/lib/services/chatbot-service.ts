import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatbotQueryConfig {
  question: string;
  platform: "chatgpt" | "gemini";
  repetitions: number;
  brandName: string;
  domain: string;
  competitors?: string[];
}

export interface ChatbotAnalysisResult {
  question: string;
  platform: "chatgpt" | "gemini";
  responses: {
    text: string;
    hasBrandMention: boolean;
    brandPosition?: number;
    citedUrls: string[];
    competitors: string[];
    sentiment?: "positive" | "neutral" | "negative";
  }[];
  aggregated: {
    mentionRate: number;
    avgPosition?: number;
    citationRate: number;
    competitorMentions: { [key: string]: number };
  };
}

export class ChatbotService {
  async queryChatGPT(
    question: string,
    repetitions: number = 5
  ): Promise<string[]> {
    const responses: string[] = [];

    for (let i = 0; i < repetitions; i++) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "user",
              content: question,
            },
          ],
          temperature: 0.7,
        });

        const response = completion.choices[0]?.message?.content || "";
        responses.push(response);

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error querying ChatGPT (attempt ${i + 1}):`, error);
      }
    }

    return responses;
  }

  async queryGemini(
    question: string,
    repetitions: number = 5
  ): Promise<string[]> {
    // Placeholder for Gemini API integration
    console.log("Gemini query:", question, "repetitions:", repetitions);
    return Array(repetitions).fill("Gemini response placeholder");
  }

  analyzeSingleResponse(
    responseText: string,
    brandName: string,
    domain: string,
    competitors: string[] = []
  ) {
    const brandRegex = new RegExp(`\\b${brandName}\\b`, "gi");
    const brandMatches = responseText.match(brandRegex);
    const hasBrandMention = brandMatches !== null && brandMatches.length > 0;

    let brandPosition: number | undefined;
    if (hasBrandMention) {
      const allBrands = [brandName, ...competitors];
      const brandMentions: { brand: string; index: number }[] = [];

      allBrands.forEach((brand) => {
        const regex = new RegExp(`\\b${brand}\\b`, "gi");
        let match;
        while ((match = regex.exec(responseText)) !== null) {
          brandMentions.push({ brand, index: match.index });
        }
      });

      brandMentions.sort((a, b) => a.index - b.index);
      const position = brandMentions.findIndex((m) => m.brand === brandName);
      brandPosition = position >= 0 ? position + 1 : undefined;
    }

    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = responseText.match(urlRegex) || [];
    const citedUrls = urls.filter((url) => url.includes(domain));

    const competitorMentions: string[] = [];
    competitors.forEach((competitor) => {
      const regex = new RegExp(`\\b${competitor}\\b`, "gi");
      if (regex.test(responseText)) {
        competitorMentions.push(competitor);
      }
    });

    const sentiment = this.analyzeSentiment(responseText, brandName);

    return {
      hasBrandMention,
      brandPosition,
      citedUrls,
      competitors: competitorMentions,
      sentiment,
    };
  }

  private analyzeSentiment(
    text: string,
    brandName: string
  ): "positive" | "neutral" | "negative" {
    const sentences = text.split(/[.!?]+/);
    const brandSentences = sentences.filter((s) =>
      new RegExp(`\\b${brandName}\\b`, "i").test(s)
    );

    if (brandSentences.length === 0) return "neutral";

    const positiveWords = [
      "best",
      "great",
      "excellent",
      "top",
      "leading",
      "recommended",
      "popular",
      "trusted",
      "reliable",
      "quality",
    ];
    const negativeWords = [
      "worst",
      "poor",
      "bad",
      "avoid",
      "limited",
      "expensive",
      "disappointing",
      "issue",
      "problem",
    ];

    let positiveScore = 0;
    let negativeScore = 0;

    brandSentences.forEach((sentence) => {
      const lowerSentence = sentence.toLowerCase();
      positiveWords.forEach((word) => {
        if (lowerSentence.includes(word)) positiveScore++;
      });
      negativeWords.forEach((word) => {
        if (lowerSentence.includes(word)) negativeScore++;
      });
    });

    if (positiveScore > negativeScore) return "positive";
    if (negativeScore > positiveScore) return "negative";
    return "neutral";
  }

  async analyzeQuestion(
    config: ChatbotQueryConfig
  ): Promise<ChatbotAnalysisResult> {
    const rawResponses =
      config.platform === "chatgpt"
        ? await this.queryChatGPT(config.question, config.repetitions)
        : await this.queryGemini(config.question, config.repetitions);

    const analyzedResponses = rawResponses.map((text) => {
      const analysis = this.analyzeSingleResponse(
        text,
        config.brandName,
        config.domain,
        config.competitors
      );

      return {
        text,
        ...analysis,
      };
    });

    const totalResponses = analyzedResponses.length;
    const mentionCount = analyzedResponses.filter(
      (r) => r.hasBrandMention
    ).length;
    const citationCount = analyzedResponses.filter(
      (r) => r.citedUrls.length > 0
    ).length;

    const positions = analyzedResponses
      .map((r) => r.brandPosition)
      .filter((p) => p !== undefined) as number[];
    const avgPosition =
      positions.length > 0
        ? positions.reduce((a, b) => a + b, 0) / positions.length
        : undefined;

    const competitorMentions: { [key: string]: number } = {};
    analyzedResponses.forEach((r) => {
      r.competitors.forEach((comp) => {
        competitorMentions[comp] = (competitorMentions[comp] || 0) + 1;
      });
    });

    return {
      question: config.question,
      platform: config.platform,
      responses: analyzedResponses,
      aggregated: {
        mentionRate: (mentionCount / totalResponses) * 100,
        avgPosition,
        citationRate: (citationCount / totalResponses) * 100,
        competitorMentions,
      },
    };
  }
}
