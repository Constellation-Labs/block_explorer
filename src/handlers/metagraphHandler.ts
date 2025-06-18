import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractHashOrdinal, extractPagination } from "../request-params";
import {
  balanceResponse,
  handleError,
  metagraphBlockResponse,
  metagraphFeeTransactionsResponse,
  metagraphSnapshotResponse,
  metagraphSnapshotsResponse,
  metagraphsResponse,
  metagraphTransactionsResponse,
  missingParameterResponse,
  notFoundResponse,
  respond,
  rewardsResponse,
  transactionResponse,
  unsuportedRequest,
} from "../response";
import { paginatedQuery } from "../pagination";
import { toNumber, isFinite } from "lodash";

const prisma = new PrismaClient();

const metagraphIdExists = async (metagraph_id) => {
  return prisma.metagraphs.findFirst({
    where: { id: metagraph_id },
  });
};

const latestMetagraphSnapshot = async (metagraph_id) => {
  return prisma.metagraph_snapshots.findFirst({
    select: { hash: true, ordinal: true },
    where: { metagraph_id },
    orderBy: { ordinal: "desc" },
  });
};

const includeGlobalSnapshotOrdinalFromMetagraph = {
  metagraph_snapshot: {
    select: {
      global_snapshot: {
        select: {
          hash: true,
          ordinal: true,
        },
      },
    },
  },
};

const cursor = (row) => ({
  hash: row.hash,
});

const metagraphSnapshotWhere = async (metagraph_id, term) => {
  if (term == "latest") {
    const latestSnapshotHash = (await latestMetagraphSnapshot(metagraph_id))
      ?.hash;
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

const paginationWithMetagraphId = (metagraph_id, event) => {
  let pagination = extractPagination(event);
  if ("searchSince" in pagination && pagination.searchSince) {
    (pagination.searchSince as any).metagraph_id = metagraph_id;
  }
  return pagination;
};

export const currencySnapshots = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id } = event.pathParameters || {};

    if (!(await metagraphIdExists(metagraph_id))) {
      return notFoundResponse("metagraph");
    }

    return await paginatedQuery(
      paginationWithMetagraphId(metagraph_id, event),
      cursor,
      cursor,
      {
        where: { metagraph_id },
        include: { metagraph_blocks: true },
        orderBy: [{ metagraph_id: "desc" }, { ordinal: "desc" }],
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

    if (
      event.queryStringParameters?.search_before !== undefined ||
      event.queryStringParameters?.search_after !== undefined
    ) {
      return unsuportedRequest("search_before or search_after not supported");
    }

    return await paginatedQuery(
      extractPagination(event),
      cursor,
      cursor,
      {
        where: { owner_address: address },
        include: { metagraph_blocks: true },
        orderBy: [{ metagraph_id: "desc" }, { ordinal: "desc" }],
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

    if (!(await metagraphIdExists(metagraph_id))) {
      return notFoundResponse("metagraph");
    }

    const hashOrOrdinalWithLatest = await metagraphSnapshotWhere(
      metagraph_id,
      term
    );

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
      event.queryStringParameters?.search_before !== undefined ||
      event.queryStringParameters?.search_after !== undefined
    ) {
      return unsuportedRequest("search_before or search_after not supported");
    }

    if (!(await metagraphIdExists(metagraph_id))) {
      return notFoundResponse("metagraph");
    }

    if (
      term != "latest" &&
      !(await metagraphSnapshotExists(metagraph_id, term))
    ) {
      return notFoundResponse();
    }

    const mgSnapshotWhere = await metagraphSnapshotWhere(metagraph_id, term);

    const nextToCursor = (row) => ({
      metagraph_id_metagraph_snapshot_hash_destination_addr: {
        metagraph_id: row.metagraph_id,
        metagraph_snapshot_hash: row.metagraph_snapshot_hash,
        destination_addr: row.destination_addr,
      },
    });
    const cursorToNext = (row) => ({
      metagraph_id: row.metagraph_id,
      metagraph_snapshot_hash: row.metagraph_snapshot_hash,
      destination_addr: row.destination_addr,
    });

    let pagination = extractPagination(event);
    if ("searchSince" in pagination && pagination.searchSince) {
      (pagination.searchSince as any).metagraph_id = metagraph_id;
    }

    return await paginatedQuery(
      pagination,
      nextToCursor,
      cursorToNext,
      {
        where: {
          metagraph_snapshot: {
            metagraph_id,
            ...mgSnapshotWhere,
          },
        },
        orderBy: [
          { metagraph_id: "desc" },
          { metagraph_snapshot_hash: "desc" },
          { destination_addr: "desc" },
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
  metagraph_id,
  baseQuery,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const query = {
      ...baseQuery,
      include: {
        metagraph_snapshot: {
          select: {
            global_snapshot: {
              select: {
                hash: true,
                ordinal: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          snapshot_ordinal: "desc",
        },
        { created_at: "desc" },
        { hash: "desc" },
      ],
    };

    let pagination = paginationWithMetagraphId(metagraph_id, event);

    return await paginatedQuery(
      pagination,
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

    if (!(await metagraphIdExists(metagraph_id))) {
      return notFoundResponse("metagraph");
    }

    if (
      term != "latest" &&
      !(await metagraphSnapshotExists(metagraph_id, term))
    )
      return notFoundResponse();

    const mgSnapshotWhere = await metagraphSnapshotWhere(metagraph_id, term);

    const where = {
      where: {
        metagraph_snapshot: {
          metagraph_id: metagraph_id,
          ...mgSnapshotWhere,
        },
      },
    };

    return metagraphTransactionsQuery(metagraph_id, where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const currencyBlock = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, hash } = event.pathParameters || {};

    if (!(await metagraphIdExists(metagraph_id))) {
      return notFoundResponse("metagraph");
    }

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

    if (!(await metagraphIdExists(metagraph_id))) {
      return notFoundResponse("metagraph");
    }

    const where = { where: { metagraph_id } };

    return metagraphTransactionsQuery(metagraph_id, where, event);
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
        metagraph_id: metagraph_id!,
        hash: hash!,
      },
      include: {
        metagraph_snapshot: {
          select: {
            hash: true,
            ordinal: true,
            global_snapshot: {
              select: {
                hash: true,
                ordinal: true,
              },
            },
          },
        },
      },
    });
    return respond(transaction, transactionResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const currencyTransactionsByAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};

    if (!(await metagraphIdExists(metagraph_id))) {
      return notFoundResponse("metagraph");
    }

    const where = {
      where: {
        metagraph_id,
        OR: [{ source_addr: address }, { destination_addr: address }],
      },
    };

    return metagraphTransactionsQuery(metagraph_id, where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const currencyTransactionsBySource = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};

    if (!(await metagraphIdExists(metagraph_id))) {
      return notFoundResponse("metagraph");
    }

    const where = { where: { metagraph_id, source_addr: address } };

    return metagraphTransactionsQuery(metagraph_id, where, event);
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

    return metagraphTransactionsQuery(metagraph_id, where, event);
  } catch (error) {
    return handleError(error);
  }
};

const balanceOrZeroFn = async (metagraph_id, balance, address, ordinal) => {
  if (balance === null) {
    const snapshot_ordinal = isFinite(ordinal)
      ? ordinal
      : (await latestMetagraphSnapshot(metagraph_id))?.ordinal;
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
    const balanceOrZero = await balanceOrZeroFn(
      metagraph_id,
      balance,
      address,
      ordinalNbr
    );
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

    if (!metagraph_id || !hash) {
      throw new Error("Missing required path parameters: identifier or hash.");
    }

    const transaction = await prisma.metagraph_fee_transactions.findUnique({
      where: {
        metagraph_id_hash: {
          metagraph_id,
          hash,
        },
      },
      include: {
        metagraph_snapshot: {
          select: {
            hash: true,
            ordinal: true,
            global_snapshot: {
              select: {
                hash: true,
                ordinal: true,
              },
            },
          },
        },
      },
    });

    return respond(transaction, transactionResponse);
  } catch (error) {
    return handleError(error);
  }
};

const metagraphFeeTransactionsQuery = async (
  metagraph_id,
  baseQuery,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const query = {
      ...baseQuery,
      include: {
        metagraph_snapshot: {
          select: {
            global_snapshot: {
              select: {
                hash: true,
                ordinal: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          metagraph_snapshot_ordinal: "desc",
        },
        { created_at: "desc" },
        { hash: "desc" },
      ],
    };

    const cursor = (row) => ({
      metagraph_id: row.metagraph_id,
      hash: row.hash,
    });

    return await paginatedQuery(
      paginationWithMetagraphId(metagraph_id, event),
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

export const currencyFeeTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id } = event.pathParameters || {};

    const where = {
      where: {
        metagraph_id: metagraph_id,
      },
      include: includeGlobalSnapshotOrdinalFromMetagraph,
    };

    return metagraphFeeTransactionsQuery(metagraph_id, where, event);
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

    const mgSnapshotWhere = await metagraphSnapshotWhere(metagraph_id, term);

    const where = {
      where: {
        metagraph_snapshot: {
          metagraph_id: metagraph_id,
          ...mgSnapshotWhere,
        },
      },
      include: includeGlobalSnapshotOrdinalFromMetagraph,
    };

    return metagraphFeeTransactionsQuery(metagraph_id, where, event);
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
      include: includeGlobalSnapshotOrdinalFromMetagraph,
    };
    return metagraphFeeTransactionsQuery(metagraph_id, where, event);
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
      include: includeGlobalSnapshotOrdinalFromMetagraph,
    };
    return metagraphFeeTransactionsQuery(metagraph_id, where, event);
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
      include: includeGlobalSnapshotOrdinalFromMetagraph,
    };
    return metagraphFeeTransactionsQuery(metagraph_id, where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const metagraphs = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (
      event.queryStringParameters?.search_before !== undefined ||
      event.queryStringParameters?.search_after !== undefined
    ) {
      return unsuportedRequest("search_before or search_after not supported");
    }

    const cursor = (row) => ({ id: row.id });

    return await paginatedQuery(
      extractPagination(event),
      cursor,
      cursor,
      { orderBy: { id: "desc" } },
      prisma.metagraphs.findMany,
      metagraphsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};
