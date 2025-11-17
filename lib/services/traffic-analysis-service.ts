import { prisma } from "@/lib/db/prisma";
import { startOfDay, endOfDay, subDays } from "date-fns";

export interface TrafficImpactAnalysis {
  keyword: string;
  hasAiOverview: boolean;
  aiOverviewAppearanceDate?: Date;
  beforePeriod: {
    startDate: Date;
    endDate: Date;
    avgClicks: number;
    avgImpressions: number;
    avgCtr: number;
    avgPosition: number;
  };
  afterPeriod: {
    startDate: Date;
    endDate: Date;
    avgClicks: number;
    avgImpressions: number;
    avgCtr: number;
    avgPosition: number;
  };
  impact: {
    clicksChange: number;
    clicksChangePercent: number;
    impressionsChange: number;
    impressionsChangePercent: number;
    ctrChange: number;
    positionChange: number;
    overallImpact: "positive" | "negative" | "neutral";
  };
}

export class TrafficAnalysisService {
  async analyzeTrafficImpact(
    projectId: string,
    analysisDate: Date,
    beforeDays: number = 30,
    afterDays: number = 30
  ): Promise<TrafficImpactAnalysis[]> {
    try {
      const aiOverviews = await prisma.aiOverview.findMany({
        where: {
          projectId,
          date: {
            gte: startOfDay(subDays(analysisDate, 7)),
            lte: endOfDay(analysisDate),
          },
          hasAiOverview: true,
        },
        include: {
          keyword: true,
        },
      });

      const results: TrafficImpactAnalysis[] = [];

      for (const overview of aiOverviews) {
        const keyword = overview.keyword;
        const aiAppearanceDate = overview.date;

        const beforeStart = subDays(aiAppearanceDate, beforeDays);
        const beforeEnd = subDays(aiAppearanceDate, 1);
        const afterStart = aiAppearanceDate;
        const afterEnd = subDays(aiAppearanceDate, -afterDays);

        const beforeTraffic = await prisma.trafficData.findMany({
          where: {
            projectId,
            keywordId: keyword.id,
            date: {
              gte: beforeStart,
              lte: beforeEnd,
            },
          },
        });

        const afterTraffic = await prisma.trafficData.findMany({
          where: {
            projectId,
            keywordId: keyword.id,
            date: {
              gte: afterStart,
              lte: afterEnd,
            },
          },
        });

        if (beforeTraffic.length === 0 || afterTraffic.length === 0) {
          continue;
        }

        const beforeMetrics = this.calculateAverageMetrics(beforeTraffic);
        const afterMetrics = this.calculateAverageMetrics(afterTraffic);
        const impact = this.calculateImpact(beforeMetrics, afterMetrics);

        results.push({
          keyword: keyword.keyword,
          hasAiOverview: true,
          aiOverviewAppearanceDate: aiAppearanceDate,
          beforePeriod: {
            startDate: beforeStart,
            endDate: beforeEnd,
            ...beforeMetrics,
          },
          afterPeriod: {
            startDate: afterStart,
            endDate: afterEnd,
            ...afterMetrics,
          },
          impact,
        });
      }

      return results;
    } catch (error) {
      console.error("Error analyzing traffic impact:", error);
      throw new Error("Failed to analyze traffic impact");
    }
  }

  private calculateAverageMetrics(trafficData: any[]) {
    if (trafficData.length === 0) {
      return {
        avgClicks: 0,
        avgImpressions: 0,
        avgCtr: 0,
        avgPosition: 0,
      };
    }

    const totalClicks = trafficData.reduce((sum, d) => sum + d.clicks, 0);
    const totalImpressions = trafficData.reduce(
      (sum, d) => sum + d.impressions,
      0
    );
    const totalCtr = trafficData.reduce((sum, d) => sum + d.ctr, 0);
    const totalPosition = trafficData.reduce((sum, d) => sum + d.position, 0);

    return {
      avgClicks: totalClicks / trafficData.length,
      avgImpressions: totalImpressions / trafficData.length,
      avgCtr: totalCtr / trafficData.length,
      avgPosition: totalPosition / trafficData.length,
    };
  }

  private calculateImpact(beforeMetrics: any, afterMetrics: any) {
    const clicksChange = afterMetrics.avgClicks - beforeMetrics.avgClicks;
    const clicksChangePercent =
      beforeMetrics.avgClicks > 0
        ? (clicksChange / beforeMetrics.avgClicks) * 100
        : 0;

    const impressionsChange =
      afterMetrics.avgImpressions - beforeMetrics.avgImpressions;
    const impressionsChangePercent =
      beforeMetrics.avgImpressions > 0
        ? (impressionsChange / beforeMetrics.avgImpressions) * 100
        : 0;

    const ctrChange = afterMetrics.avgCtr - beforeMetrics.avgCtr;
    const positionChange = afterMetrics.avgPosition - beforeMetrics.avgPosition;

    let overallImpact: "positive" | "negative" | "neutral" = "neutral";
    const impactScore =
      clicksChangePercent * 0.4 +
      impressionsChangePercent * 0.3 -
      (positionChange / beforeMetrics.avgPosition) * 100 * 0.3;

    if (impactScore > 5) {
      overallImpact = "positive";
    } else if (impactScore < -5) {
      overallImpact = "negative";
    }

    return {
      clicksChange,
      clicksChangePercent,
      impressionsChange,
      impressionsChangePercent,
      ctrChange,
      positionChange,
      overallImpact,
    };
  }

  async compareAiOverviewVsNoOverview(
    projectId: string,
    startDate: Date,
    endDate: Date
  ) {
    try {
      const keywordsWithAi = await prisma.aiOverview.findMany({
        where: {
          projectId,
          date: { gte: startDate, lte: endDate },
          hasAiOverview: true,
        },
        distinct: ["keywordId"],
        select: { keywordId: true },
      });

      const aiKeywordIds = keywordsWithAi.map((k) => k.keywordId);

      const trafficWithAi = await prisma.trafficData.findMany({
        where: {
          projectId,
          keywordId: { in: aiKeywordIds },
          date: { gte: startDate, lte: endDate },
        },
      });

      const trafficWithoutAi = await prisma.trafficData.findMany({
        where: {
          projectId,
          keywordId: { notIn: aiKeywordIds },
          date: { gte: startDate, lte: endDate },
        },
      });

      const metricsWithAi = this.calculateAverageMetrics(trafficWithAi);
      const metricsWithoutAi = this.calculateAverageMetrics(trafficWithoutAi);

      return {
        withAiOverview: {
          keywordCount: aiKeywordIds.length,
          metrics: metricsWithAi,
        },
        withoutAiOverview: {
          keywordCount: await prisma.keyword.count({
            where: { projectId, id: { notIn: aiKeywordIds } },
          }),
          metrics: metricsWithoutAi,
        },
        comparison: {
          clicksDifference:
            metricsWithAi.avgClicks - metricsWithoutAi.avgClicks,
          impressionsDifference:
            metricsWithAi.avgImpressions - metricsWithoutAi.avgImpressions,
          ctrDifference: metricsWithAi.avgCtr - metricsWithoutAi.avgCtr,
          positionDifference:
            metricsWithAi.avgPosition - metricsWithoutAi.avgPosition,
        },
      };
    } catch (error) {
      console.error("Error comparing AI Overview vs no overview:", error);
      throw new Error("Failed to compare traffic");
    }
  }
}
