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
  unlockEpoch: transaction.unlock_epoch ?? null,
  parentHash: transaction.parent_hash ?? null,
  timestamp: transaction.created_at,
});

const tokenLockResponses = (txs) => txs.map(tokenLockResponse);

const commonTokenUnlockResponse = (transaction) => ({
  currencyId: transaction.currencyId,
  hash: transaction.hash,
  amount: transaction.amount,
  source: transaction.source_addr,
  tokenLockRef: transaction.lock_reference_hash,
  timestamp: transaction.created_at,
});

const dagTokenUnlockResponse = (transaction) => ({
  ...commonTokenUnlockResponse(transaction),
  globalSnapshotOrdinal: transaction.global_snapshot.ordinal,
});

const dagTokenUnlockResponses = (txs) => txs.map(dagTokenUnlockResponse);

const metagraphTokenUnlockResponse = (transaction) => ({
  ...commonTokenUnlockResponse(transaction),
  metagraphSnapshotOrdinal: transaction.metagraph_snapshot.ordinal,
});

const metagraphTokenUnlockResponses = (txs) =>
  txs.map(metagraphTokenUnlockResponse);

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
      {
        where: {
          global_snapshot: filter,
        },
        orderBy: { created_at: "desc" },
      },
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
    {
      include: { global_snapshot: { select: { ordinal: true } } },
      orderBy: { created_at: "desc" },
    },
    prisma.dag_token_unlocks.findMany,
    dagTokenUnlockResponses
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
      {
        where: {
          global_snapshot: filter,
        },
        include: { global_snapshot: { select: { ordinal: true } } },
        orderBy: { created_at: "desc" },
      },
      prisma.dag_token_unlocks.findMany,
      dagTokenUnlockResponses
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
      {
        where: { source_addr: address },
        include: { global_snapshot: { select: { ordinal: true } } },
        orderBy: { created_at: "desc" },
      },
      prisma.dag_token_unlocks.findMany,
      dagTokenUnlockResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const metagraphTokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { identifier: metagraph_id } = event.pathParameters || {};

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
    const { identifier: metagraph_id, hash_or_ordinal } =
      event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: {
          metagraph_id,
          metagraph_snapshot: filter,
        },
        orderBy: { created_at: "desc" },
      },
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
      {
        where: { metagraph_id, source_addr: address },
        orderBy: { created_at: "desc" },
      },
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
    {
      where: { metagraph_id },
      include: { metagraph_snapshot: { select: { ordinal: true } } },
      orderBy: { created_at: "desc" },
    },
    prisma.metagraph_token_unlocks.findMany,
    metagraphTokenUnlockResponses
  );
};

export const metagraphSnapshotTokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, hash_or_ordinal } =
      event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: {
          metagraph_id,
          metagraph_snapshot: filter,
        },
        include: { metagraph_snapshot: { select: { ordinal: true } } },
        orderBy: { created_at: "desc" },
      },
      prisma.metagraph_token_unlocks.findMany,
      metagraphTokenUnlockResponses
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
      {
        where: { metagraph_id, source_addr: address },
        include: { metagraph_snapshot: { select: { ordinal: true } } },
        orderBy: { created_at: "desc" },
      },
      prisma.metagraph_token_unlocks.findMany,
      metagraphTokenUnlockResponses
    );
  } catch (error) {
    return handleError(error);
  }
};
