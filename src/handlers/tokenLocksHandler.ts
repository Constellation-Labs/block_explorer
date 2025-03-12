import { PrismaClient } from '@prisma/client';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractHashOrdinal, extractPagination } from '../request-params';
import { paginatedQuery, fromCreatedAtOrdinalCursor, toCreatedAtOrdinalCursor } from '../pagination';
import { respond, handleError, notFoundResponse } from '../response';

const prisma = new PrismaClient();

export const handleTokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return await paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    { orderBy: { created_at: 'desc' } },
    prisma.dag_token_locks.findMany,
    respond
  );
};

export const handleGlobalSnapshotTokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { global_snapshot: filter }, orderBy: { created_at: 'desc' } },
      prisma.dag_token_locks.findMany,
      respond
    );
  } catch (error) {
    return handleError(error);
  }
};

export const handleAddressTokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { address }, orderBy: { created_at: 'desc' } },
      prisma.dag_token_locks.findMany,
      respond
    );
  } catch (error) {
    return handleError(error);
  }
};

export const handleTokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return await paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    { orderBy: { created_at: 'desc' } },
    prisma.dag_token_unlocks.findMany,
    respond
  );
};

export const handleGlobalSnapshotTokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { global_snapshot: filter }, orderBy: { created_at: 'desc' } },
      prisma.dag_token_unlocks.findMany,
      respond
    );
  } catch (error) {
    return handleError(error);
  }
};

export const handleAddressTokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { address }, orderBy: { created_at: 'desc' } },
      prisma.dag_token_unlocks.findMany,
      respond
    );
  } catch (error) {
    return handleError(error);
  }
};
