import axios from "axios";

const AHREFS_API_BASE = "https://api.ahrefs.com/v3";

export interface AhrefsKeywordData {
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  parent_keyword?: string;
  traffic_potential?: number;
}

export interface AhrefsQuestion {
  keyword: string;
  volume: number;
  difficulty: number;
  keyword_difficulty: number;
}

export class AhrefsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getKeywordMetrics(
    keywords: string[],
    country: string = "us"
  ): Promise<AhrefsKeywordData[]> {
    try {
      const response = await axios.get(`${AHREFS_API_BASE}/keywords-explorer/v3/keyword-difficulty`, {
        params: {
          select: ["keyword", "volume", "keyword_difficulty", "cpc", "parent_keyword", "traffic_potential"],
          target: keywords.join(","),
          country,
        },
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      return response.data.keywords || [];
    } catch (error) {
      console.error("Error fetching Ahrefs keyword metrics:", error);
      throw new Error("Failed to fetch keyword metrics from Ahrefs");
    }
  }

  async getRelatedQuestions(
    keyword: string,
    country: string = "us",
    limit: number = 100
  ): Promise<AhrefsQuestion[]> {
    try {
      const response = await axios.get(`${AHREFS_API_BASE}/keywords-explorer/v3/related-questions`, {
        params: {
          select: ["keyword", "volume", "keyword_difficulty"],
          target: keyword,
          country,
          limit,
        },
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      return response.data.questions || [];
    } catch (error) {
      console.error("Error fetching Ahrefs questions:", error);
      throw new Error("Failed to fetch related questions from Ahrefs");
    }
  }

  async getDomainMetrics(domain: string) {
    try {
      const response = await axios.get(`${AHREFS_API_BASE}/site-explorer/v1/metrics`, {
        params: {
          select: [
            "domain_rating",
            "ahrefs_rank",
            "organic_keywords",
            "organic_traffic",
            "referring_domains",
            "backlinks",
          ],
          target: domain,
        },
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      return response.data.metrics || {};
    } catch (error) {
      console.error("Error fetching Ahrefs domain metrics:", error);
      throw new Error("Failed to fetch domain metrics from Ahrefs");
    }
  }

  async getCommercialQuestions(
    seedKeywords: string[],
    country: string = "us"
  ): Promise<AhrefsQuestion[]> {
    try {
      const allQuestions: AhrefsQuestion[] = [];

      for (const keyword of seedKeywords) {
        const questions = await this.getRelatedQuestions(keyword, country, 100);
        allQuestions.push(...questions);
      }

      const commercialPatterns = [
        /\b(best|top|vs|versus|review|price|cost|buy|compare|alternative|cheap|affordable)\b/i,
      ];

      const commercialQuestions = allQuestions.filter((q) =>
        commercialPatterns.some((pattern) => pattern.test(q.keyword))
      );

      const uniqueQuestions = Array.from(
        new Map(commercialQuestions.map((q) => [q.keyword, q])).values()
      ).sort((a, b) => b.volume - a.volume);

      return uniqueQuestions.slice(0, 50);
    } catch (error) {
      console.error("Error fetching commercial questions:", error);
      throw new Error("Failed to fetch commercial questions");
    }
  }
}
