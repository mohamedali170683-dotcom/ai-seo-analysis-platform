/**
 * Analysis Repository
 *
 * Handles all database operations for the Analysis model.
 *
 * Usage:
 * import { analysisRepository } from '@/lib/repositories/analysis';
 *
 * const analysis = await analysisRepository.findById('123');
 * const userAnalyses = await analysisRepository.findByUserId('user-id');
 */

import { prisma } from '@/lib/db/prisma';
import { BaseRepository, PaginatedResult, FindOptions } from './base';
import type { Analysis, Prisma } from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================

export type AnalysisCreateInput = Prisma.AnalysisCreateInput;
export type AnalysisUpdateInput = Prisma.AnalysisUpdateInput;
export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AnalysisWithResults extends Analysis {
  aiTestResults?: {
    id: string;
    platform: string;
    brandMentioned: boolean;
    sentiment: string | null;
  }[];
  insights?: {
    id: string;
    category: string;
    title: string;
    priority: number;
  }[];
}

// =============================================================================
// REPOSITORY
// =============================================================================

class AnalysisRepository extends BaseRepository<
  Analysis,
  AnalysisCreateInput,
  AnalysisUpdateInput
> {
  protected modelName = 'Analysis';

  protected getDelegate() {
    return prisma.analysis as unknown as ReturnType<
      BaseRepository<Analysis, AnalysisCreateInput, AnalysisUpdateInput>['getDelegate']
    >;
  }

  /**
   * Find analyses by user ID with pagination
   */
  async findByUserId(
    userId: string,
    options?: FindOptions
  ): Promise<PaginatedResult<Analysis>> {
    const page = options?.pagination?.page ?? 1;
    const limit = options?.pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.analysis.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: options?.orderBy ?? { createdAt: 'desc' },
      }),
      prisma.analysis.count({ where: { userId } }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find analysis with all related data
   */
  async findByIdWithResults(id: string): Promise<AnalysisWithResults | null> {
    return prisma.analysis.findUnique({
      where: { id },
      include: {
        aiTestResults: {
          select: {
            id: true,
            platform: true,
            brandMentioned: true,
            sentiment: true,
            position: true,
            question: true,
            fullResponse: true,
            citations: true,
            sources: true,
          },
        },
        insights: {
          select: {
            id: true,
            category: true,
            title: true,
            priority: true,
            finding: true,
            expectedImpact: true,
          },
          orderBy: { priority: 'asc' },
        },
        discoveredQuestions: {
          select: {
            id: true,
            question: true,
            searchVolume: true,
            category: true,
          },
        },
        competitors: {
          select: {
            id: true,
            competitorName: true,
            domain: true,
            overlapScore: true,
          },
        },
      },
    }) as Promise<AnalysisWithResults | null>;
  }

  /**
   * Update analysis progress
   */
  async updateProgress(
    id: string,
    progress: number,
    currentStep: string
  ): Promise<Analysis> {
    return prisma.analysis.update({
      where: { id },
      data: {
        progress,
        currentStep,
      },
    });
  }

  /**
   * Mark analysis as completed
   */
  async markCompleted(id: string): Promise<Analysis> {
    return prisma.analysis.update({
      where: { id },
      data: {
        status: 'completed',
        progress: 100,
        currentStep: 'Analysis complete!',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Mark analysis as failed
   */
  async markFailed(id: string, errorMessage: string): Promise<Analysis> {
    return prisma.analysis.update({
      where: { id },
      data: {
        status: 'failed',
        progress: 0,
        currentStep: `Failed: ${errorMessage.substring(0, 200)}`,
      },
    });
  }

  /**
   * Find recent analyses by status
   */
  async findByStatus(
    status: AnalysisStatus,
    limit = 10
  ): Promise<Analysis[]> {
    return prisma.analysis.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Find running analyses older than specified minutes (for cleanup)
   */
  async findStaleRunning(olderThanMinutes: number): Promise<Analysis[]> {
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - olderThanMinutes);

    return prisma.analysis.findMany({
      where: {
        status: 'running',
        createdAt: { lt: cutoff },
      },
    });
  }

  /**
   * Get analysis statistics for a user
   */
  async getStats(userId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    running: number;
  }> {
    const [total, completed, failed, running] = await Promise.all([
      prisma.analysis.count({ where: { userId } }),
      prisma.analysis.count({ where: { userId, status: 'completed' } }),
      prisma.analysis.count({ where: { userId, status: 'failed' } }),
      prisma.analysis.count({ where: { userId, status: 'running' } }),
    ]);

    return { total, completed, failed, running };
  }

  /**
   * Delete analysis and all related data
   */
  async deleteWithRelated(id: string): Promise<void> {
    await prisma.$transaction([
      prisma.aITestResult.deleteMany({ where: { analysisId: id } }),
      prisma.aIInsight.deleteMany({ where: { analysisId: id } }),
      prisma.discoveredQuestion.deleteMany({ where: { analysisId: id } }),
      prisma.detectedCompetitor.deleteMany({ where: { analysisId: id } }),
      prisma.analysis.delete({ where: { id } }),
    ]);
  }
}

// Export singleton instance
export const analysisRepository = new AnalysisRepository();

// Export class for testing
export { AnalysisRepository };
