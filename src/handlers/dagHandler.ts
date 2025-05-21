import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractHashOrdinal, extractPagination } from "../request-params";
import { isRight } from "fp-ts/Either";
import {
  balanceResponse,
  dagBlockResponse,
  dagTransactionsResponse,
  globalSnapshotResponse,
  globalSnapshotsResponse,
  handleError,
  notFoundResponse,
  respond,
  rewardsResponse,
  transactionResponse,
} from "../response";
import {
  fromCreatedAtOrdinalCursor,
  paginatedQuery,
  toCreatedAtOrdinalCursor,
} from "../pagination";
import * as OpenSearch from "../opensearch/opensearch";

import { toNumber, isFinite } from "lodash";

const prisma = new PrismaClient();

const globalSnapshotExists = async (term) => {
  return prisma.global_snapshots.findUnique({
    where: extractHashOrdinal(term),
    select: { hash: true },
  });
};

export const latestGlobalSnapshot = async () => {
  return prisma.global_snapshots.findFirst({
    select: { hash: true, ordinal: true },
    orderBy: { ordinal: "desc" },
  });
};

const globalSnapshotWhere = async (term) => {
  if (term == "latest") {
    const hash = (await latestGlobalSnapshot())?.hash;
    return { hash };
  } else {
    return extractHashOrdinal(term);
  }
};

export const globalSnapshots = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return await paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    {
      include: { dag_blocks: true },
      orderBy: { ordinal: "desc" },
    },
    prisma.global_snapshots.findMany,
    globalSnapshotsResponse
  );
};

export const globalSnapshot = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { term } = event.pathParameters || {};

    let snapshot;
    if (term == "latest") {
      snapshot = await prisma.global_snapshots.findFirst({
        include: { dag_blocks: true },
        orderBy: { ordinal: "desc" },
      });
    } else {
      const filter = extractHashOrdinal(term);

      snapshot = await prisma.global_snapshots.findUnique({
        where: filter,
        include: { dag_blocks: true },
      });
    }

    return respond(snapshot, globalSnapshotResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const globalSnapshotRewards = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { term } = event.pathParameters || {};

    if (term != "latest" && !(await globalSnapshotExists(term))) {
      return notFoundResponse("global snapshot");
    }

    const gsWhere = await globalSnapshotWhere(term);

    const toCursor = (row) => ({
      global_snapshot_hash_destination_addr: {
        global_snapshot_hash: row.global_snapshot_hash,
        destination_addr: row.destination_addr,
      },
    });
    const fromCursor = (row) => ({
      global_snapshot_hash: row.global_snapshot_hash,
      destination_addr: row.destination_addr,
    });

    return await paginatedQuery(
      extractPagination(event),
      toCursor,
      fromCursor,
      {
        where: { global_snapshot: { ...gsWhere } },
        orderBy: [{ destination_addr: "asc" }],
      },
      prisma.dag_reward_transactions.findMany,
      rewardsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const globalSnapshotTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { term } = event.pathParameters || {};

    if (term != "latest" && !(await globalSnapshotExists(term))) {
      return notFoundResponse();
    }

    const gsWhere = await globalSnapshotWhere(term);

    const query = {
      where: {
        global_snapshot: { ...gsWhere },
      },
      include: {
        global_snapshot: { select: { hash: true, ordinal: true } },
      },
      orderBy: { created_at: "desc" },
    };

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      query,
      prisma.dag_transactions.findMany,
      dagTransactionsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const dagBlock = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash } = event.pathParameters || {};

    const block = await prisma.dag_blocks.findUnique({
      where: { hash },
      include: {
        dag_transactions: { select: { hash: true } },
        global_snapshot: true,
        super: { include: { block_parents: true } },
      },
    });
    return respond(block, dagBlockResponse);
  } catch (error) {
    return handleError(error);
  }
};

const dagTransactionsQuery = async (
  where,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const query = {
      ...where,
      include: {
        global_snapshot: { select: { hash: true, ordinal: true } },
      },
      orderBy: [{ created_at: "desc" }],
    };

    const toCursor = (row) => ({
      ...toCreatedAtOrdinalCursor(row),
      hash: row.hash,
    });

    const fromCursor = (row) => ({
      ...fromCreatedAtOrdinalCursor(row),
      hash: row.hash,
    });

    return await paginatedQuery(
      extractPagination(event),
      toCursor,
      fromCursor,
      query,
      prisma.dag_transactions.findMany,
      dagTransactionsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const dagTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return dagTransactionsQuery({}, event);
};

export const dagTransaction = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash } = event.pathParameters || {};

    const transaction = await prisma.dag_transactions.findUnique({
      where: { hash },
      include: {
        global_snapshot: { select: { hash: true, ordinal: true } },
      },
    });

    return respond(transaction, transactionResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const dagTransactionsByAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    const where = {
      where: { OR: [{ source_addr: address }, { destination_addr: address }] },
    };

    return dagTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const dagTransactionsBySource = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    const where = { where: { source_addr: address } };

    return dagTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const dagTransactionsByDestination = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    const where = { where: { destination_addr: address } };

    return dagTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

const balanceOrZeroFn = async (balance, address, ordinal) => {
  if (balance === null) {
    const snapshot_ordinal = isFinite(ordinal)
      ? ordinal
      : (await latestGlobalSnapshot())?.ordinal;
    return { balance: 0, address, snapshot_ordinal };
  }
  return balance;
};

const osClient = OpenSearch.getClient();

export const dagBalanceByAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    const { ordinal } = event.queryStringParameters || {};

    const ordinalNbr = toNumber(ordinal);

    const ordinalCondition = isFinite(ordinalNbr)
      ? { snapshot_ordinal: { lte: ordinalNbr } }
      : {};

    const dbBalance = await prisma.dag_balance_changes.findFirst({
      where: { address, ...ordinalCondition },
      orderBy: { snapshot_ordinal: "desc" },
    });

    const eitherOsBalance = await OpenSearch.findBalanceByAddress(osClient)(
      address!,
      null,
      ordinal !== undefined ? ordinalNbr : undefined
    )();
    const osBalance = isRight(eitherOsBalance)
      ? eitherOsBalance.right.data
      : null;

    let balance: {} | null = null;
    if (dbBalance === null) {
      if (osBalance === null) {
        balance = await balanceOrZeroFn(balance, address, ordinalNbr);
      } else {
        balance = { ...osBalance, snapshot_ordinal: ordinalNbr };
      }
    } else {
      if (osBalance != null && osBalance.ordinal > dbBalance.snapshot_ordinal) {
        balance = { ...osBalance, snapshot_ordinal: ordinalNbr };
      } else {
        balance = dbBalance;
      }
    }

    return respond(balance, balanceResponse);
  } catch (error) {
    return handleError(error);
  }
};
