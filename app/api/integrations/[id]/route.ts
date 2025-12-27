import { prisma } from '@/lib/db/prisma';
import {
  apiHandler,
  apiSuccess,
  apiError,
  parseJsonBody,
  isValidId,
} from '@/lib/api/utils';
import { HTTP_STATUS } from '@/lib/constants';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/integrations/[id] - Update integration
export const PATCH = apiHandler(async (request: Request, context?: { params?: Record<string, string> }) => {
  const { id } = await (context as RouteContext).params;

  if (!isValidId(id)) {
    return apiError('Invalid integration ID', HTTP_STATUS.BAD_REQUEST);
  }

  const [body, parseError] = await parseJsonBody<{
    name?: string;
    config?: Record<string, unknown>;
    enabled?: boolean;
  }>(request);

  if (parseError) return parseError;

  const integration = await prisma.integration.update({
    where: { id },
    data: body!,
  });

  return apiSuccess({ integration });
});

// DELETE /api/integrations/[id] - Disconnect/Delete integration
export const DELETE = apiHandler(async (_request: Request, context?: { params?: Record<string, string> }) => {
  const { id } = await (context as RouteContext).params;

  if (!isValidId(id)) {
    return apiError('Invalid integration ID', HTTP_STATUS.BAD_REQUEST);
  }

  await prisma.integration.delete({
    where: { id },
  });

  return apiSuccess({ message: 'Integration disconnected successfully' });
});
