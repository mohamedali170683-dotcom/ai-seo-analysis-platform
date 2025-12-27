import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import {
  apiHandler,
  apiSuccess,
  apiError,
  parseJsonBody,
  isValidId,
} from '@/lib/api/utils';
import { HTTP_STATUS } from '@/lib/constants';

type IdParams = { id: string };

// PATCH /api/integrations/[id] - Update integration
export const PATCH = apiHandler<IdParams>(async (request, context) => {
  const { id } = await context.params;

  if (!isValidId(id)) {
    return apiError('Invalid integration ID', HTTP_STATUS.BAD_REQUEST);
  }

  const [body, parseError] = await parseJsonBody<{
    name?: string;
    config?: Prisma.InputJsonValue;
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
export const DELETE = apiHandler<IdParams>(async (_request, context) => {
  const { id } = await context.params;

  if (!isValidId(id)) {
    return apiError('Invalid integration ID', HTTP_STATUS.BAD_REQUEST);
  }

  await prisma.integration.delete({
    where: { id },
  });

  return apiSuccess({ message: 'Integration disconnected successfully' });
});
