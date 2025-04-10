import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractHashOrdinal, extractPagination } from "../request-params";
import {
  balanceResponse,
  handleError,
  metagraphBlockResponse,
  metagraphFeeTransactionResponse,
  metagraphFeeTransactionsResponse,
  metagraphSnapshotResponse,
  metagraphSnapshotsResponse,
  metagraphsResponse,
  metagraphTransactionsResponse,
  metagraphTransactionResponse,
  missingParameterResponse,
  notFoundResponse,
  respond,
  rewardsResponse,
} from "../response";
import {
  fromCreatedAtOrdinalCursor,
  paginatedQuery,
  toCreatedAtOrdinalCursor,
} from "../pagination";
import { toNumber, isFinite } from "lodash";

const prisma = new PrismaClient();

const latestMetagraphSnapshot = async () => {
  return prisma.metagraph_snapshots.findFirst({
    select: { hash: true, ordinal: true },
    orderBy: { ordinal: "desc" },
  });
};

const metagraphSnapshotWhere = async (term) => {
  if (term == "latest") {
    const latestSnapshotHash = (await latestMetagraphSnapshot())?.hash;
    return { hash: latestSnapshotHash };
  } else {
    return extractHashOrdinal(term);
  }
};

const metagraphSnapshotQuery = (metagraph_id, filter) => {
  let where;
  if ("ordinal" in filter) {
    where = { metagraph_id_ordinal: { metagraph_id, ordinal: filter.ordinal } };
  } else {
    where = { metagraph_id_hash: { metagraph_id, hash: filter.hash } };
  }
  return where;
};

const metagraphSnapshotExists = async (metagraph_id, term) => {
  const filter = extractHashOrdinal(term);
  return prisma.metagraph_snapshots.findUnique({
    where: metagraphSnapshotQuery(metagraph_id, filter),
    select: { hash: true },
  });
};

export const currencySnapshots = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier } = event.pathParameters || {};

    const toCursor = (row) => ({
      ...toCreatedAtOrdinalCursor(row),
      metagraph_id: row.metagraph_id,
      hash: row.hash,
    });

    const fromCursor = (row) => ({
      ...fromCreatedAtOrdinalCursor(row),
      metagraph_id: row.metagraph_id,
      hash: row.hash,
    });

    return await paginatedQuery(
      extractPagination(event),
      toCursor,
      fromCursor,
      {
        where: { metagraph_id: identifier },
        include: { metagraph_blocks: true },
        orderBy: { ordinal: "desc" },
      },
      prisma.metagraph_snapshots.findMany,
      metagraphSnapshotsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencySnapshotsByOwnerAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    const toCursor = (row) => ({
      ...toCreatedAtOrdinalCursor(row),
      metagraph_id: row.metagraph_id,
      hash: row.hash,
    });

    const fromCursor = (row) => ({
      ...fromCreatedAtOrdinalCursor(row),
      metagraph_id: row.metagraph_id,
      hash: row.hash,
    });

    return await paginatedQuery(
      extractPagination(event),
      toCursor,
      fromCursor,
      {
        where: { owner_address: address },
        include: { metagraph_blocks: true },
        orderBy: { ordinal: "desc" },
      },
      prisma.metagraph_snapshots.findMany,
      metagraphSnapshotsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencySnapshot = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, term } = event.pathParameters || {};

    const hashOrOrdinalWithLatest = await metagraphSnapshotWhere(term);

    const snapshot = await prisma.metagraph_snapshots.findUnique({
      where: metagraphSnapshotQuery(metagraph_id, hashOrOrdinalWithLatest),
      include: { metagraph_blocks: true },
    });

    return respond(snapshot, metagraphSnapshotResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const currencySnapshotRewards = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, term } = event.pathParameters || {};

    if (
      term != "latest" &&
      !(await metagraphSnapshotExists(metagraph_id, term))
    ) {
      return notFoundResponse();
    }

    const mgSnapshotWhere = await metagraphSnapshotWhere(term);

    const cursor = (row) => ({
      metagraph_id: row.metagraph_id,
      hash: row.hash,
    });

    return await paginatedQuery(
      extractPagination(event),
      cursor,
      cursor,
      {
        where: {
          metagraph_snapshot: {
            metagraph_id,
            ...mgSnapshotWhere,
          },
        },
        orderBy: [
          { metagraph_id: "asc" },
          { metagraph_snapshot_hash: "asc" },
          { destination_addr: "asc" },
        ],
      },
      prisma.metagraph_reward_transactions.findMany,
      rewardsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

const metagraphTransactionsQuery = async (
  baseQuery,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const query = {
      ...baseQuery,
      include: {
        metagraph_blocks: {
          include: {
            metagraph_snapshot: { select: { hash: true, ordinal: true } },
          },
        },
      },
      orderBy: { ordinal: "desc" },
    };

    const cursor = (row) => ({
      metagraph_id: row.metagraph_id,
      hash: row.hash,
    });

    return await paginatedQuery(
      extractPagination(event),
      cursor,
      cursor,
      query,
      prisma.metagraph_transactions.findMany,
      metagraphTransactionsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencySnapshotTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, term } = event.pathParameters || {};

    if (
      term != "latest" &&
      !(await metagraphSnapshotExists(metagraph_id, term))
    )
      return notFoundResponse();

    const mgSnapshotWhere = await metagraphSnapshotWhere(term);

    const where = {
      where: {
        metagraph_blocks: {
          metagraph_snapshot: {
            metagraph_id: metagraph_id,
            ...mgSnapshotWhere,
          },
        },
      },
    };

    return metagraphTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const currencyBlock = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, hash } = event.pathParameters || {};

    const block = await prisma.metagraph_blocks.findUnique({
      where: { metagraph_id, hash },
      include: {
        metagraph_transactions: { select: { hash: true } },
        metagraph_snapshot: true,
        super: { include: { block_parents: true } },
      },
    });

    return respond(block, metagraphBlockResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const currencyTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id } = event.pathParameters || {};

    const where = { where: { metagraph_blocks: { metagraph_id } } };

    return metagraphTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const currencyTransaction = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, hash } = event.pathParameters || {};

    const transaction = await prisma.metagraph_transactions.findUnique({
      where: {
        metagraph_id_hash: {
          metagraph_id: metagraph_id!,
          hash: hash!,
        },
      },
      include: {
        metagraph_blocks: {
          include: {
            metagraph_snapshot: { select: { hash: true, ordinal: true } },
          },
        },
      },
    });

    return respond(transaction, metagraphTransactionResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const currencyTransactionsByAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};

    const where = {
      where: {
        metagraph_id,
        OR: [{ source_addr: address }, { destination_addr: address }],
      },
    };

    return metagraphTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const currencyTransactionsBySource = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};

    const where = { where: { metagraph_id, source_addr: address } };

    return metagraphTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const currencyTransactionsByDestination = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};

    const where = { where: { metagraph_id, destination_addr: address } };

    return metagraphTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

const balanceOrZeroFn = async (balance, address, ordinal) => {
  if (balance === null) {
    const snapshot_ordinal = isFinite(ordinal)
      ? ordinal
      : (await latestMetagraphSnapshot())?.ordinal;
    return { balance: 0, address, snapshot_ordinal };
  }
  return balance;
};

export const currencyBalanceByAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};

    const { ordinal } = event.queryStringParameters || {};

    const ordinalNbr = toNumber(ordinal);

    const ordinalCondition = isFinite(ordinalNbr)
      ? { snapshot_ordinal: { lte: ordinalNbr } }
      : {};

    const balance = await prisma.metagraph_balance_changes.findFirst({
      where: {
        metagraph_id,
        address,
        ...ordinalCondition,
      },
      orderBy: { snapshot_ordinal: "desc" },
    });

    const balanceOrZero = await balanceOrZeroFn(balance, address, ordinal);

    return respond(balanceOrZero, balanceResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const currencyFeeTransaction = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, hash } = event.pathParameters || {};

    const transaction = await prisma.metagraph_fee_transactions.findUnique({
      where: {
        metagraph_id: metagraph_id!,
        hash: hash!,
      },
      include: {
        metagraph_snapshot: { select: { hash: true, ordinal: true } },
      },
    });

    return respond(transaction, metagraphFeeTransactionResponse);
  } catch (error) {
    return handleError(error);
  }
};

const metagraphFeeTransactionsQuery = async (
  baseQuery,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const query = {
      ...baseQuery,
      include: {
        metagraph_snapshot: { select: { hash: true, ordinal: true } },
      },
      orderBy: { hash: "asc" },
    };

    const cursor = (row) => ({
      metagraph_id: row.metagraph_id,
      hash: row.hash,
    });

    return await paginatedQuery(
      extractPagination(event),
      cursor,
      cursor,
      query,
      prisma.metagraph_fee_transactions.findMany,
      metagraphFeeTransactionsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencySnapshotFeeTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, term } = event.pathParameters || {};
    if (!metagraph_id || !term)
      return missingParameterResponse("identifier or term");

    const mgSnapshotWhere = await metagraphSnapshotWhere(term);

    const where = {
      where: {
        metagraph_id: metagraph_id,
        ...mgSnapshotWhere,
      },
    };

    return metagraphFeeTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const currencyFeeTransactionsByAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};
    if (!metagraph_id || !address)
      return missingParameterResponse("identifier or address");

    const where = {
      where: {
        metagraph_id: metagraph_id,
        OR: [{ source_addr: address }, { destination_addr: address }],
      },
    };

    return metagraphFeeTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const currencyFeeTransactionsBySource = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};
    if (!metagraph_id || !address)
      return missingParameterResponse("identifier or address");

    const where = {
      where: {
        metagraph_id: metagraph_id,
        source_addr: address,
      },
    };
    return metagraphFeeTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const currencyFeeTransactionsByDestination = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};
    if (!metagraph_id || !address)
      return missingParameterResponse("identifier or address");

    const where = {
      where: {
        metagraph_id: metagraph_id,
        destination_addr: address,
      },
    };
    return metagraphFeeTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const metagraphs = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const cursor = (row) => ({ id: row.id });

    return await paginatedQuery(
      extractPagination(event),
      cursor,
      cursor,
      {},
      prisma.metagraphs.findMany,
      metagraphsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};
