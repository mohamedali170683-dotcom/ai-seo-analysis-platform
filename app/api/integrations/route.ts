import { prisma } from '@/lib/db/prisma';
import {
  apiHandler,
  apiSuccess,
  apiError,
  parseJsonBody,
  getUserId,
  getPaginationParams,
  apiPaginated,
  validateRequired,
} from '@/lib/api/utils';
import { HTTP_STATUS } from '@/lib/constants';

// GET /api/integrations - List all integrations
export const GET = apiHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const userId = getUserId(searchParams);
  const { page, limit, skip } = getPaginationParams(searchParams);

  const [integrations, total] = await Promise.all([
    prisma.integration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.integration.count({ where: { userId } }),
  ]);

  return apiPaginated(integrations, { page, limit, total });
});

// POST /api/integrations - Create/Connect new integration
export const POST = apiHandler(async (request: Request) => {
  const [body, parseError] = await parseJsonBody<{
    userId?: string;
    type?: string;
    name?: string;
    config?: Record<string, unknown>;
    enabled?: boolean;
  }>(request);

  if (parseError) return parseError;

  const {
    userId = 'demo-user',
    type,
    name,
    config = {},
    enabled = true,
  } = body!;

  const missingError = validateRequired({ type, name }, ['type', 'name']);
  if (missingError) {
    return apiError(missingError, HTTP_STATUS.BAD_REQUEST);
  }

  const integration = await prisma.integration.create({
    data: {
      userId,
      type: type!,
      name: name!,
      config,
      enabled,
    },
  });

  return apiSuccess({ integration }, HTTP_STATUS.CREATED);
});
