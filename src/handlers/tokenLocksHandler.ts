import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractHashOrdinal, extractPagination } from "../request-params";
import {
  paginatedQuery,
  fromCreatedAtOrdinalCursor,
  toCreatedAtOrdinalCursor,
} from "../pagination";
import { handleError } from "../response";

const prisma = new PrismaClient();

const tokenLockResponse = (transaction) => ({
  currencyId: transaction.currencyId,
  hash: transaction.hash,
  amount: transaction.amount,
  source: transaction.source_addr,
  destination: transaction.destination_addr,
  unlockEpoch: transaction.unlock_epoch,
  parentHash: transaction.lock_reference_hash,
  timestamp: transaction.created_at,
});

const tokenLockResponses = (txs) => (txs.map(tokenLockResponse))

const tokenUnlockResponse = (transaction) => ({
  currencyId: transaction.currencyId,
  hash: transaction.hash,
  amount: transaction.amount,
  source: transaction.source_addr,
  timestamp: transaction.created_at,
  lockOrdinal: transaction.lock_reference_ordinal
});


const tokenUnlockResponses = (txs) => (txs.map(tokenUnlockResponse))

export const tokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  
  return paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    { orderBy: { created_at: "desc" } },
    prisma.dag_token_locks.findMany,
    tokenLockResponses
  );
};

export const globalSnapshotTokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { global_snapshot: filter }, orderBy: { created_at: "desc" } },
      prisma.dag_token_locks.findMany,
      tokenLockResponses
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

    return paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { source_addr: address }, orderBy: { created_at: "desc" } },
      prisma.dag_token_locks.findMany,
      tokenLockResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const tokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    { orderBy: { created_at: "desc" } },
    prisma.dag_token_unlocks.findMany,
    tokenUnlockResponses
  );
};

export const globalSnapshotTokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { token_lock: {global_snapshot: filter} }, orderBy: { created_at: "desc" } },
      prisma.dag_token_unlocks.findMany,
      tokenUnlockResponses
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

    return paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { source_addr: address }, orderBy: { created_at: "desc" } },
      prisma.dag_token_unlocks.findMany,
      tokenUnlockResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const metagraphTokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  
  const { identifier: metagraph_id} = event.pathParameters || {};

  return paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    { where: { metagraph_id }, orderBy: { created_at: "desc" } },
    prisma.metagraph_token_locks.findMany,
    tokenLockResponses
  );
};

export const metagraphSnapshotTokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { metagraph_id, metagraph_snapshot: filter }, orderBy: { created_at: "desc" } },
      prisma.metagraph_token_locks.findMany,
      tokenLockResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const metagraphAddressTokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};

    return paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { metagraph_id, source_addr: address }, orderBy: { created_at: "desc" } },
      prisma.metagraph_token_locks.findMany,
      tokenLockResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const metagraphTokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { identifier: metagraph_id } = event.pathParameters || {};
  return paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    { where: { metagraph_id}, orderBy: { created_at: "desc" } },
    prisma.metagraph_token_unlocks.findMany,
    tokenUnlockResponses
  );
};

export const metagraphSnapshotTokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { metagraph_id, token_lock: {metagraph_snapshot: filter} }, orderBy: { created_at: "desc" } },
      prisma.metagraph_token_unlocks.findMany,
      tokenUnlockResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const metagraphAddressTokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};

    return paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { metagraph_id, source_addr: address }, orderBy: { created_at: "desc" } },
      prisma.metagraph_token_unlocks.findMany,
      tokenUnlockResponses
    );
  } catch (error) {
    return handleError(error);
  }
};
