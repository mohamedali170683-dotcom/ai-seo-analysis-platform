/**
 * Zod validation schemas for API requests.
 *
 * Usage:
 * import { analysisRunSchema, alertCreateSchema } from '@/lib/validations/schemas';
 *
 * const result = analysisRunSchema.safeParse(body);
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
 * }
 */

import { z } from 'zod';
import { VALIDATION, ALERT_TYPE, PLATFORMS } from '@/lib/constants';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

/** URL validation schema */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(VALIDATION.MAX_URL_LENGTH, `URL must be ${VALIDATION.MAX_URL_LENGTH} characters or less`);

/** Domain validation schema */
export const domainSchema = z
  .string()
  .min(1, 'Domain is required')
  .max(255, 'Domain must be 255 characters or less')
  .regex(
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    'Invalid domain format'
  );

/** Brand name validation schema */
export const brandSchema = z
  .string()
  .min(VALIDATION.MIN_BRAND_LENGTH, 'Brand name is required')
  .max(VALIDATION.MAX_BRAND_LENGTH, `Brand name must be ${VALIDATION.MAX_BRAND_LENGTH} characters or less`)
  .refine(
    (val) => !val.includes('\n') && !val.includes('\r'),
    'Brand name cannot contain newlines'
  );

/** Competitor name validation schema */
export const competitorSchema = z
  .string()
  .min(1, 'Competitor name is required')
  .max(VALIDATION.MAX_COMPETITOR_LENGTH, `Competitor name must be ${VALIDATION.MAX_COMPETITOR_LENGTH} characters or less`);

// =============================================================================
// ANALYSIS SCHEMAS
// =============================================================================

/** Schema for POST /api/analysis/run */
export const analysisRunSchema = z.object({
  brandOrKeyword: brandSchema,
  domain: z
    .string()
    .max(255, 'Domain must be 255 characters or less')
    .optional()
    .nullable(),
  competitors: z
    .union([
      z.string().transform((val) =>
        val
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c.length > 0)
      ),
      z.array(competitorSchema),
    ])
    .optional()
    .default([])
    .transform((val) => {
      const arr = Array.isArray(val) ? val : [];
      return arr.slice(0, VALIDATION.MAX_COMPETITORS);
    }),
  category: z.string().max(100).optional().nullable(),
  subcategory: z.string().max(100).optional().nullable(),
  buyerPersona: z.string().max(500).optional().nullable(),
  industryCategory: z.string().max(100).optional().nullable(),
});

export type AnalysisRunInput = z.infer<typeof analysisRunSchema>;

/** Schema for GET /api/analysis/list */
export const analysisListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['running', 'completed', 'failed']).optional(),
});

export type AnalysisListQuery = z.infer<typeof analysisListQuerySchema>;

// =============================================================================
// ALERT SCHEMAS
// =============================================================================

/** Alert condition schema */
const alertConditionSchema = z.object({
  field: z.string().min(1).max(100),
  operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains']),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

/** Alert channel schema */
const alertChannelSchema = z.object({
  type: z.enum(['email', 'webhook', 'slack']),
  target: z.string().min(1).max(500),
  enabled: z.boolean().default(true),
});

/** Schema for POST /api/alerts */
export const alertCreateSchema = z.object({
  userId: z.string().max(100).default('demo-user'),
  name: z
    .string()
    .min(1, 'Alert name is required')
    .max(255, 'Alert name must be 255 characters or less'),
  type: z.enum([
    ALERT_TYPE.VISIBILITY_DROP,
    ALERT_TYPE.COMPETITOR_TAKEOVER,
    ALERT_TYPE.HALLUCINATION_DETECTED,
    ALERT_TYPE.SENTIMENT_SHIFT,
    ALERT_TYPE.CITATION_LOST,
  ]),
  conditions: z.array(alertConditionSchema).default([]),
  channels: z.array(alertChannelSchema).default([]),
  throttleEnabled: z.boolean().default(false),
  throttleWindow: z.number().int().positive().optional().nullable(),
  maxAlertsPerWindow: z.number().int().positive().optional().nullable(),
  enabled: z.boolean().default(true),
});

export type AlertCreateInput = z.infer<typeof alertCreateSchema>;

/** Schema for PATCH /api/alerts/[id] */
export const alertUpdateSchema = alertCreateSchema.partial().omit({ userId: true });

export type AlertUpdateInput = z.infer<typeof alertUpdateSchema>;

// =============================================================================
// WEBHOOK SCHEMAS
// =============================================================================

/** Schema for POST /api/webhooks */
export const webhookCreateSchema = z.object({
  userId: z.string().max(100).default('demo-user'),
  name: z.string().min(1).max(255),
  url: urlSchema,
  secret: z.string().max(500).optional().nullable(),
  events: z.array(z.string().min(1).max(100)).min(1, 'At least one event is required'),
  enabled: z.boolean().default(true),
});

export type WebhookCreateInput = z.infer<typeof webhookCreateSchema>;

// =============================================================================
// INTEGRATION SCHEMAS
// =============================================================================

/** Schema for POST /api/integrations */
export const integrationCreateSchema = z.object({
  userId: z.string().max(100).default('demo-user'),
  type: z.enum(['google_search_console', 'ahrefs', 'dataforseo']),
  name: z.string().min(1).max(255),
  credentials: z.record(z.string()).optional().default({}),
  settings: z.record(z.unknown()).optional().default({}),
  enabled: z.boolean().default(true),
});

export type IntegrationCreateInput = z.infer<typeof integrationCreateSchema>;

// =============================================================================
// GROUND TRUTH SCHEMAS
// =============================================================================

/** Schema for POST /api/ground-truth */
export const groundTruthCreateSchema = z.object({
  userId: z.string().max(100).default('demo-user'),
  brandName: brandSchema,
  domain: z.string().max(255).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  statements: z
    .array(
      z.object({
        statement: z.string().min(1).max(2000),
        isTrue: z.boolean(),
        source: z.string().max(500).optional().nullable(),
        category: z.string().max(100).optional().nullable(),
      })
    )
    .min(1, 'At least one statement is required')
    .max(100, 'Maximum 100 statements allowed'),
});

export type GroundTruthCreateInput = z.infer<typeof groundTruthCreateSchema>;

// =============================================================================
// HALLUCINATION SCAN SCHEMAS
// =============================================================================

/** Schema for POST /api/hallucination-detection/scan */
export const hallucinationScanSchema = z.object({
  analysisId: z.string().min(1, 'Analysis ID is required'),
  groundTruthId: z.string().optional().nullable(),
  platforms: z
    .array(z.enum([PLATFORMS.CHATGPT, PLATFORMS.GEMINI, PLATFORMS.PERPLEXITY, PLATFORMS.COPILOT]))
    .optional()
    .default([PLATFORMS.CHATGPT, PLATFORMS.GEMINI]),
});

export type HallucinationScanInput = z.infer<typeof hallucinationScanSchema>;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validate request body against a schema
 * @returns Tuple of [validatedData, errorResponse]
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<[T, null] | [null, { success: false; error: string; details?: unknown }]> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten();
      return [
        null,
        {
          success: false,
          error: 'Validation failed',
          details: errors,
        },
      ];
    }

    return [result.data, null];
  } catch {
    return [
      null,
      {
        success: false,
        error: 'Invalid JSON body',
      },
    ];
  }
}

/**
 * Validate query parameters against a schema
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): [T, null] | [null, { success: false; error: string; details?: unknown }] {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    const errors = result.error.flatten();
    return [
      null,
      {
        success: false,
        error: 'Invalid query parameters',
        details: errors,
      },
    ];
  }

  return [result.data, null];
}
