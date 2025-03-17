import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractHashOrdinal, extractPagination } from "../request-params";
import {
  paginatedQuery,
  fromCreatedAtOrdinalCursor,
  toCreatedAtOrdinalCursor,
} from "../pagination";
import { respond, handleError, notFoundResponse } from "../response";

const prisma = new PrismaClient();

const tokenLockResponse = (transaction) => ({
  type: transaction.table_name,
  currencyId: transaction.currencyId,
  hash: transaction.hash,
  amount: transaction.amount,
  source: transaction.source_addr,
  destination: transaction.destination_addr,
  unlockEpoch: transaction.unlock_epoch,
  parentHash: transaction.lock_reference_hash,
  timestamp: transaction.created_at,
});

export const tokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return await paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    { orderBy: { created_at: "desc" } },
    prisma.dag_token_locks.findMany,
    respond
  );
};

export const globalSnapshotTokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { global_snapshot: filter }, orderBy: { created_at: "desc" } },
      prisma.dag_token_locks.findMany,
      respond
    );
  } catch (error) {
    return handleError(error);
  }
};

export const addressTokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { address }, orderBy: { created_at: "desc" } },
      prisma.dag_token_locks.findMany,
      respond
    );
  } catch (error) {
    return handleError(error);
  }
};

export const tokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return await paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    { orderBy: { created_at: "desc" } },
    prisma.dag_token_unlocks.findMany,
    respond
  );
};

export const globalSnapshotTokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { global_snapshot: filter }, orderBy: { created_at: "desc" } },
      prisma.dag_token_unlocks.findMany,
      respond
    );
  } catch (error) {
    return handleError(error);
  }
};

export const addressTokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { address }, orderBy: { created_at: "desc" } },
      prisma.dag_token_unlocks.findMany,
      respond
    );
  } catch (error) {
    return handleError(error);
  }
};
