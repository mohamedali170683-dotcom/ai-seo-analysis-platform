import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
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

// Generate secure webhook secret
function generateWebhookSecret(): string {
  return 'whsec_' + crypto.randomBytes(32).toString('hex');
}

// GET /api/webhooks - List all webhooks
export const GET = apiHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const userId = getUserId(searchParams);
  const { page, limit, skip } = getPaginationParams(searchParams);

  const [webhooks, total] = await Promise.all([
    prisma.webhookConfig.findMany({
      where: { userId },
      include: {
        deliveries: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.webhookConfig.count({ where: { userId } }),
  ]);

  return apiPaginated(webhooks, { page, limit, total });
});

// POST /api/webhooks - Create new webhook
export const POST = apiHandler(async (request: Request) => {
  const [body, parseError] = await parseJsonBody<{
    userId?: string;
    name?: string;
    url?: string;
    events?: string[];
    enabled?: boolean;
  }>(request);

  if (parseError) return parseError;

  const {
    userId = 'demo-user',
    name,
    url,
    events = [],
    enabled = true,
  } = body!;

  const missingError = validateRequired({ name, url }, ['name', 'url']);
  if (missingError) {
    return apiError(missingError, HTTP_STATUS.BAD_REQUEST);
  }

  // Generate secure secret
  const secret = generateWebhookSecret();

  const webhook = await prisma.webhookConfig.create({
    data: {
      userId,
      name: name!,
      url: url!,
      secret,
      events,
      enabled,
    },
  });

  return apiSuccess({ webhook }, HTTP_STATUS.CREATED);
});
