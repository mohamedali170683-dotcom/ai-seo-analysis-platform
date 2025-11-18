import axios from "axios";

const DATAFORSEO_API_BASE = "https://api.dataforseo.com/v3";

export interface KeywordData {
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  competition?: number;
  trend?: number[];
}

export interface RelatedQuestion {
  question: string;
  volume: number;
  cpc?: number;
}

export class DataForSEOService {
  private login: string;
  private password: string;
  private auth: string;

  constructor(login: string, password: string) {
    this.login = login;
    this.password = password;
    this.auth = Buffer.from(`${login}:${password}`).toString("base64");
  }

  private async makeRequest(endpoint: string, data: any) {
    try {
      const response = await axios.post(
        `${DATAFORSEO_API_BASE}${endpoint}`,
        data,
        {
          headers: {
            Authorization: `Basic ${this.auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status_code === 20000) {
        return response.data.tasks?.[0]?.result || [];
      } else {
        throw new Error(
          response.data.status_message || "DataForSEO API error"
        );
      }
    } catch (error: any) {
      console.error("DataForSEO API Error:", error.message);
      throw new Error(`Failed to fetch data from DataForSEO: ${error.message}`);
    }
  }

  /**
   * Get keyword metrics (search volume, difficulty, CPC)
   */
  async getKeywordMetrics(
    keywords: string[],
    location: string = "United States"
  ): Promise<KeywordData[]> {
    try {
      const results = await this.makeRequest(
        "/keywords_data/google_ads/search_volume/live",
        [
          {
            keywords: keywords,
            location_name: location,
            language_name: "English",
          },
        ]
      );

      return results.map((item: any) => ({
        keyword: item.keyword,
        volume: item.search_volume || 0,
        cpc: item.cpc || 0,
        competition: item.competition || 0,
        trend: item.monthly_searches?.map((m: any) => m.search_volume) || [],
      }));
    } catch (error) {
      console.error("Error fetching keyword metrics:", error);
      throw new Error("Failed to fetch keyword metrics");
    }
  }

  /**
   * Get keyword difficulty and SEO metrics
   */
  async getKeywordDifficulty(
    keyword: string,
    location: string = "United States"
  ): Promise<number> {
    try {
      const results = await this.makeRequest(
        "/keywords_data/google/keyword_difficulty/live",
        [
          {
            keyword: keyword,
            location_name: location,
            language_name: "English",
          },
        ]
      );

      return results[0]?.keyword_difficulty || 0;
    } catch (error) {
      console.error("Error fetching keyword difficulty:", error);
      return 0;
    }
  }

  /**
   * Get "People Also Ask" questions with search volume
   */
  async getRelatedQuestions(
    keyword: string,
    location: string = "United States",
    limit: number = 100
  ): Promise<RelatedQuestion[]> {
    try {
      // Get SERP data to extract People Also Ask
      const serpResults = await this.makeRequest(
        "/serp/google/organic/live/advanced",
        [
          {
            keyword: keyword,
            location_name: location,
            language_name: "English",
            device: "desktop",
            os: "windows",
          },
        ]
      );

      // Extract People Also Ask questions
      const paaItems = serpResults[0]?.items?.filter(
        (item: any) => item.type === "people_also_ask"
      );

      const questions: string[] = [];
      paaItems?.forEach((item: any) => {
        if (item.items) {
          item.items.forEach((q: any) => {
            if (q.title) {
              questions.push(q.title);
            }
          });
        }
      });

      // Get search volume for questions
      if (questions.length > 0) {
        const volumeData = await this.getKeywordMetrics(
          questions.slice(0, limit),
          location
        );

        return volumeData
          .map((data) => ({
            question: data.keyword,
            volume: data.volume || 0,
            cpc: data.cpc,
          }))
          .filter((q) => q.volume > 0)
          .sort((a, b) => b.volume - a.volume);
      }

      return [];
    } catch (error) {
      console.error("Error fetching related questions:", error);
      throw new Error("Failed to fetch related questions");
    }
  }

  /**
   * Get keyword suggestions (related keywords)
   */
  async getKeywordSuggestions(
    keyword: string,
    location: string = "United States",
    limit: number = 50
  ): Promise<KeywordData[]> {
    try {
      const results = await this.makeRequest(
        "/keywords_data/google_ads/keywords_for_keywords/live",
        [
          {
            keywords: [keyword],
            location_name: location,
            language_name: "English",
            include_adult_keywords: false,
          },
        ]
      );

      const suggestions = results
        .slice(0, limit)
        .map((item: any) => ({
          keyword: item.keyword,
          volume: item.search_volume || 0,
          cpc: item.cpc || 0,
          competition: item.competition || 0,
        }))
        .sort((a: any, b: any) => b.volume - a.volume);

      return suggestions;
    } catch (error) {
      console.error("Error fetching keyword suggestions:", error);
      throw new Error("Failed to fetch keyword suggestions");
    }
  }

  /**
   * Get commercial intent questions (best, top, vs, review, etc.)
   */
  async getCommercialQuestions(
    seedKeywords: string[],
    location: string = "United States"
  ): Promise<RelatedQuestion[]> {
    try {
      const allQuestions: RelatedQuestion[] = [];

      for (const keyword of seedKeywords) {
        const questions = await this.getRelatedQuestions(
          keyword,
          location,
          50
        );
        allQuestions.push(...questions);
      }

      // Filter for commercial intent
      const commercialPatterns = [
        /\b(best|top|vs|versus|review|price|cost|buy|compare|alternative|cheap|affordable|how to choose|which)\b/i,
      ];

      const commercialQuestions = allQuestions.filter((q) =>
        commercialPatterns.some((pattern) => pattern.test(q.question))
      );

      // Remove duplicates and sort by volume
      const uniqueQuestions = Array.from(
        new Map(commercialQuestions.map((q) => [q.question, q])).values()
      ).sort((a, b) => b.volume - a.volume);

      return uniqueQuestions.slice(0, 50);
    } catch (error) {
      console.error("Error fetching commercial questions:", error);
      throw new Error("Failed to fetch commercial questions");
    }
  }

  /**
   * Check if keyword has AI Overview in SERP
   */
  async checkAIOverview(
    keyword: string,
    location: string = "United States"
  ): Promise<{
    hasAIOverview: boolean;
    position?: number;
    contentLength?: number;
  }> {
    try {
      const results = await this.makeRequest(
        "/serp/google/organic/live/advanced",
        [
          {
            keyword: keyword,
            location_name: location,
            language_name: "English",
            device: "desktop",
            os: "windows",
          },
        ]
      );

      // Look for AI Overview / SGE (Search Generative Experience)
      const aiOverview = results[0]?.items?.find(
        (item: any) =>
          item.type === "ai_overview" ||
          item.type === "generative_ai" ||
          item.type === "featured_snippet"
      );

      if (aiOverview) {
        return {
          hasAIOverview: true,
          position: aiOverview.rank_group || 0,
          contentLength: aiOverview.description?.length || 0,
        };
      }

      return { hasAIOverview: false };
    } catch (error) {
      console.error("Error checking AI Overview:", error);
      return { hasAIOverview: false };
    }
  }

  /**
   * Get domain metrics (backlinks, referring domains, etc.)
   */
  async getDomainMetrics(domain: string): Promise<{
    backlinks?: number;
    referringDomains?: number;
    organicKeywords?: number;
    organicTraffic?: number;
  }> {
    try {
      const results = await this.makeRequest(
        "/backlinks/summary/live",
        [
          {
            target: domain,
            internal_list_limit: 10,
            backlinks_status_type: "live",
          },
        ]
      );

      const summary = results[0];

      return {
        backlinks: summary?.backlinks || 0,
        referringDomains: summary?.referring_domains || 0,
        organicKeywords: summary?.rank?.keywords || 0,
        organicTraffic: summary?.rank?.etv || 0,
      };
    } catch (error) {
      console.error("Error fetching domain metrics:", error);
      return {};
    }
  }
}
