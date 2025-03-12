import { PrismaClient } from '@prisma/client';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractHashOrdinal, extractPagination } from '../request-params';
import { paginatedQuery, fromCreatedAtOrdinalCursor, toCreatedAtOrdinalCursor } from '../pagination';
import { respond, handleError } from '../response';

const prisma = new PrismaClient();

export const handleAllowSpends = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return await paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    { orderBy: { created_at: 'desc' } },
    prisma.dag_allow_spends.findMany,
    respond
  );
};

export const handleGlobalSnapshotAllowSpends = async (
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
      prisma.dag_allow_spends.findMany,
      respond
    );
  } catch (error) {
    return handleError(error);
  }
};

export const handleAddressAllowSpends = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { address }, orderBy: { created_at: 'desc' } },
      prisma.dag_allow_spends.findMany,
      respond
    );
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencyAllowSpends = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { metagraph_id }, orderBy: { created_at: 'desc' } },
      prisma.metagraph_allow_spends.findMany,
      respond
    );
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencySnapshotAllowSpends = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { metagraph_id, snapshot: filter }, orderBy: { created_at: 'desc' } },
      prisma.metagraph_allow_spends.findMany,
      respond
    );
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencyAddressAllowSpends = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { metagraph_id, address }, orderBy: { created_at: 'desc' } },
      prisma.metagraph_allow_spends.findMany,
      respond
    );
  } catch (error) {
    return handleError(error);
  }
};
