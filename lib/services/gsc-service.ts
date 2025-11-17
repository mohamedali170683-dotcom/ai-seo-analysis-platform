import { google } from "googleapis";

const searchconsole = google.searchconsole("v1");

export interface GscQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export class GoogleSearchConsoleService {
  private auth;

  constructor(accessToken: string) {
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    this.auth.setCredentials({ access_token: accessToken });
  }

  async getQueryData(
    siteUrl: string,
    startDate: string,
    endDate: string,
    dimensions: string[] = ["query"],
    filters?: any[]
  ): Promise<GscQuery[]> {
    try {
      const response = await searchconsole.searchanalytics.query({
        siteUrl,
        auth: this.auth,
        requestBody: {
          startDate,
          endDate,
          dimensions,
          rowLimit: 25000,
          ...(filters && { dimensionFilterGroups: [{ filters }] }),
        },
      });

      return (response.data.rows || []).map((row: any) => ({
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
    } catch (error) {
      console.error("Error fetching GSC query data:", error);
      throw new Error("Failed to fetch Google Search Console data");
    }
  }

  async getTrafficComparison(
    siteUrl: string,
    beforeStart: string,
    beforeEnd: string,
    afterStart: string,
    afterEnd: string,
    keywords?: string[]
  ) {
    try {
      const filters = keywords
        ? [
            {
              dimension: "query",
              operator: "includingRegex",
              expression: keywords.join("|"),
            },
          ]
        : undefined;

      const beforeData = await this.getQueryData(
        siteUrl,
        beforeStart,
        beforeEnd,
        ["query"],
        filters
      );

      const afterData = await this.getQueryData(
        siteUrl,
        afterStart,
        afterEnd,
        ["query"],
        filters
      );

      const comparison = beforeData.map((before) => {
        const after = afterData.find((a) => a.query === before.query) || {
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
        };

        return {
          query: before.query,
          before: {
            clicks: before.clicks,
            impressions: before.impressions,
            ctr: before.ctr,
            position: before.position,
          },
          after: {
            clicks: after.clicks,
            impressions: after.impressions,
            ctr: after.ctr,
            position: after.position,
          },
          change: {
            clicks: after.clicks - before.clicks,
            impressions: after.impressions - before.impressions,
            ctr: after.ctr - before.ctr,
            position: after.position - before.position,
            clicksPercent:
              before.clicks > 0
                ? ((after.clicks - before.clicks) / before.clicks) * 100
                : 0,
            impressionsPercent:
              before.impressions > 0
                ? ((after.impressions - before.impressions) / before.impressions) * 100
                : 0,
          },
        };
      });

      return comparison;
    } catch (error) {
      console.error("Error fetching traffic comparison:", error);
      throw new Error("Failed to fetch traffic comparison");
    }
  }

  static getAuthUrl(): string {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      "https://www.googleapis.com/auth/webmasters.readonly",
    ];

    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });
  }

  static async getTokens(code: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }
}
