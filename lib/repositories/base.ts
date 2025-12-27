/**
 * Base repository pattern for database access.
 *
 * Provides a consistent interface for CRUD operations across different models.
 * This abstracts Prisma calls and makes testing easier through dependency injection.
 *
 * Usage:
 * import { AnalysisRepository } from '@/lib/repositories/analysis';
 *
 * const repo = new AnalysisRepository();
 * const analysis = await repo.findById('123');
 */

import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/utils/errors';

// =============================================================================
// TYPES
// =============================================================================

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FindOptions<TOrderBy = Record<string, 'asc' | 'desc'>> {
  pagination?: PaginationOptions;
  orderBy?: TOrderBy;
}

// =============================================================================
// BASE REPOSITORY
// =============================================================================

/**
 * Base repository class with common CRUD operations.
 * Extend this class for specific model repositories.
 */
export abstract class BaseRepository<
  TModel,
  TCreateInput,
  TUpdateInput,
  TWhereUnique = { id: string }
> {
  protected prisma = prisma;
  protected abstract modelName: string;

  /**
   * Get the Prisma model delegate
   * Subclasses must implement this to return the correct delegate
   */
  protected abstract getDelegate(): {
    findUnique: (args: { where: TWhereUnique }) => Promise<TModel | null>;
    findMany: (args: {
      where?: Partial<TModel>;
      skip?: number;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
    }) => Promise<TModel[]>;
    count: (args: { where?: Partial<TModel> }) => Promise<number>;
    create: (args: { data: TCreateInput }) => Promise<TModel>;
    update: (args: { where: TWhereUnique; data: TUpdateInput }) => Promise<TModel>;
    delete: (args: { where: TWhereUnique }) => Promise<TModel>;
  };

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<TModel | null> {
    return this.getDelegate().findUnique({
      where: { id } as unknown as TWhereUnique,
    });
  }

  /**
   * Find a record by ID or throw NotFoundError
   */
  async findByIdOrFail(id: string): Promise<TModel> {
    const record = await this.findById(id);
    if (!record) {
      throw new NotFoundError(this.modelName, id);
    }
    return record;
  }

  /**
   * Find all records with optional pagination
   */
  async findAll(
    where?: Partial<TModel>,
    options?: FindOptions
  ): Promise<PaginatedResult<TModel>> {
    const page = options?.pagination?.page ?? 1;
    const limit = options?.pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.getDelegate().findMany({
        where,
        skip,
        take: limit,
        orderBy: options?.orderBy,
      }),
      this.getDelegate().count({ where }),
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
   * Create a new record
   */
  async create(data: TCreateInput): Promise<TModel> {
    return this.getDelegate().create({ data });
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: TUpdateInput): Promise<TModel> {
    return this.getDelegate().update({
      where: { id } as unknown as TWhereUnique,
      data,
    });
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<TModel> {
    return this.getDelegate().delete({
      where: { id } as unknown as TWhereUnique,
    });
  }

  /**
   * Check if a record exists
   */
  async exists(id: string): Promise<boolean> {
    const record = await this.findById(id);
    return record !== null;
  }

  /**
   * Count records matching criteria
   */
  async count(where?: Partial<TModel>): Promise<number> {
    return this.getDelegate().count({ where });
  }
}
