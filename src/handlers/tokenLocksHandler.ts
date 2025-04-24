import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractHashOrdinal, extractPagination } from "../request-params";
import {
  paginatedQuery,
  fromCreatedAtOrdinalCursor,
  toCreatedAtOrdinalCursor,
} from "../pagination";
import { handleError, respond } from "../response";

const prisma = new PrismaClient();

const commonTokenLockResponse = (transaction) => ({
  currencyId: transaction.currencyId,
  hash: transaction.hash,
  amount: transaction.amount,
  source: transaction.source_addr,
  unlockEpoch: transaction.unlock_epoch ?? null,
  parentHash: transaction.parent_hash ?? null,
  ordinal: transaction.ordinal,
  timestamp: transaction.created_at,
});

const dagTokenLockResponse = (transaction) => ({
  ...commonTokenLockResponse(transaction),
  unlockedAtOrdinal:
    transaction.dag_token_unlock?.global_snapshot.ordinal ?? null,
});

const dagTokenLockResponses = (txs) => txs.map(dagTokenLockResponse);

const metagraphTokenLockResponse = (transaction) => ({
  ...commonTokenLockResponse(transaction),
  unlockedAtOrdinal:
    transaction.metagraph_token_unlock?.metagraph_snapshot.ordinal ?? null,
});

const metagraphTokenLockResponses = (txs) =>
  txs.map(metagraphTokenLockResponse);

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

const includeDagGlobalSnapshotOrdinal = {
  global_snapshot: {
    select: { ordinal: true },
  },
};

const includeDagUnlockOrdinal = {
  dag_token_unlock: {
    include: includeDagGlobalSnapshotOrdinal,
  },
};

const includeMetagraphSnapshotOrdinal = {
  metagraph_snapshot: {
    select: { ordinal: true },
  },
};

const includeMetagraphUnlockOrdinal = {
  metagraph_token_unlock: {
    include: includeMetagraphSnapshotOrdinal,
  },
};

const ifActiveDagTokenLock = (event) => {
  const { active } = event.queryStringParameters || {};
  return active === "true"
    ? {
        dag_token_unlock: null,
      }
    : {};
};

const ifActiveMetagraphTokenLock = (event) => {
  const { active } = event.queryStringParameters || {};
  return active === "true"
    ? {
        metagraph_token_unlock: null,
      }
    : {};
};

export const tokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    {
      where: ifActiveDagTokenLock(event),
      include: includeDagUnlockOrdinal,
      orderBy: [{ ordinal: "desc" }, { created_at: "desc" }],
    },
    prisma.dag_token_locks.findMany,
    dagTokenLockResponses
  );
};

export const tokenLock = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash } = event.pathParameters || {};

    const lock = await prisma.dag_token_locks.findUnique({
      where: { hash },
      include: includeDagUnlockOrdinal,
    });

    return respond(lock, dagTokenLockResponse);
  } catch (error) {
    return handleError(error);
  }
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
        include: includeDagUnlockOrdinal,
        orderBy: [{ ordinal: "desc" }, { created_at: "desc" }],
      },
      prisma.dag_token_locks.findMany,
      dagTokenLockResponses
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
      {
        where: { source_addr: address },
        include: includeDagUnlockOrdinal,
        orderBy: [{ ordinal: "desc" }, { created_at: "desc" }],
      },
      prisma.dag_token_locks.findMany,
      dagTokenLockResponses
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
      include: includeDagGlobalSnapshotOrdinal,
      orderBy: [
        { global_snapshot: { ordinal: "desc" } },
        { created_at: "desc" },
      ],
    },
    prisma.dag_token_unlocks.findMany,
    dagTokenUnlockResponses
  );
};

export const tokenUnlock = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash } = event.pathParameters || {};

    const unlock = await prisma.dag_token_unlocks.findUnique({
      where: { hash },
      include: includeDagGlobalSnapshotOrdinal,
    });

    return respond(unlock, dagTokenUnlockResponse);
  } catch (error) {
    return handleError(error);
  }
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
        include: includeDagGlobalSnapshotOrdinal,
        orderBy: [
          { global_snapshot: { ordinal: "desc" } },
          { created_at: "desc" },
        ],
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
        include: includeDagGlobalSnapshotOrdinal,
        orderBy: [
          { global_snapshot: { ordinal: "desc" } },
          { created_at: "desc" },
        ],
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
  const { metagraph_id } = event.pathParameters || {};

  return paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    {
      where: { metagraph_id, ...ifActiveMetagraphTokenLock(event) },
      include: includeMetagraphUnlockOrdinal,
      orderBy: [{ ordinal: "desc" }, { created_at: "desc" }],
    },
    prisma.metagraph_token_locks.findMany,
    metagraphTokenLockResponses
  );
};

export const metagraphTokenLock = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, hash } = event.pathParameters || {};

    const lock = await prisma.metagraph_token_locks.findUnique({
      where: { metagraph_id, hash },
      include: includeMetagraphUnlockOrdinal,
    });

    return respond(lock, metagraphTokenLockResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const metagraphSnapshotTokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, hash_or_ordinal } =
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
        include: includeMetagraphUnlockOrdinal,
        orderBy: [{ ordinal: "desc" }, { created_at: "desc" }],
      },
      prisma.metagraph_token_locks.findMany,
      metagraphTokenLockResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const metagraphAddressTokenLocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, address } = event.pathParameters || {};

    return paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: { metagraph_id, source_addr: address },
        include: includeMetagraphUnlockOrdinal,
        orderBy: [{ ordinal: "desc" }, { created_at: "desc" }],
      },
      prisma.metagraph_token_locks.findMany,
      metagraphTokenLockResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const metagraphTokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { metagraph_id } = event.pathParameters || {};
  return paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    {
      where: { metagraph_id },
      include: includeMetagraphSnapshotOrdinal,
      orderBy: [
        { metagraph_snapshot: { ordinal: "desc" } },
        { created_at: "desc" },
      ],
    },
    prisma.metagraph_token_unlocks.findMany,
    metagraphTokenUnlockResponses
  );
};

export const metagraphTokenUnlock = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, hash } = event.pathParameters || {};

    const unlock = await prisma.metagraph_token_unlocks.findUnique({
      where: { metagraph_id, hash },
      include: includeMetagraphSnapshotOrdinal,
    });

    return respond(unlock, metagraphTokenUnlockResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const metagraphSnapshotTokenUnlocks = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, hash_or_ordinal } =
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
        include: includeMetagraphSnapshotOrdinal,
        orderBy: [
          { metagraph_snapshot: { ordinal: "desc" } },
          { created_at: "desc" },
        ],
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
    const { metagraph_id, address } = event.pathParameters || {};

    return paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: { metagraph_id, source_addr: address },
        include: includeMetagraphSnapshotOrdinal,
        orderBy: [
          { metagraph_snapshot: { ordinal: "desc" } },
          { created_at: "desc" },
        ],
      },
      prisma.metagraph_token_unlocks.findMany,
      metagraphTokenUnlockResponses
    );
  } catch (error) {
    return handleError(error);
  }
};
