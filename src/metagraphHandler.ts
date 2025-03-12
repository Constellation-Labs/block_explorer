import { PrismaClient } from '@prisma/client';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  extractHashOrdinal,
  extractPagination,
} from './request-params';
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
  rewardsResponse
} from './response';
import { fromCreatedAtOrdinalCursor, paginatedQuery, toCreatedAtOrdinalCursor } from './pagination';
import { toNumber, isFinite } from "lodash";

const prisma = new PrismaClient();

const latestMetagraphSnapshot = async () => {
  return prisma.metagraph_snapshots.findFirst({
    select: { hash: true },
    orderBy: { ordinal: 'desc'}
  })
};

const metagraphSnapshotWhere = async (term) => {
    if (term == 'latest'){
      const latestSnapshotHash = await latestMetagraphSnapshot()
      return { hash: latestSnapshotHash}
    } else {
      return extractHashOrdinal(term)
    }
  }

const metagraphSnapshotExists = async (metagraph_id, term) => {
  const filter = extractHashOrdinal(term);

  let where;
  if ("ordinal" in filter) {
    where = {metagraph_id_ordinal: { metagraph_id, ordinal: filter.ordinal } };
  } else {
    where = { metagraph_id_hash: { metagraph_id, hash: filter.hash }};
  }

  return prisma.metagraph_snapshots.findUnique({
    where,
    select: { hash: true },
  });
};  

export const handleCurrencySnapshots = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier } = event.pathParameters || {};

    const toCursor = (row) => ({
      ...toCreatedAtOrdinalCursor(row),
      metagraph_id: row.metagraph_id,
      hash: row.hash
    });

    const fromCursor = (row) => ({
      ...fromCreatedAtOrdinalCursor(row),
      metagraph_id: row.metagraph_id,
      hash: row.hash
    });

    return await paginatedQuery(
    extractPagination(event),
      toCursor,
      fromCursor,
      {
        where: { metagraph_id: identifier },
        include: { metagraph_blocks: true },
        orderBy: { ordinal: 'desc' }
      },
      prisma.metagraph_snapshots.findMany,
      metagraphSnapshotsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencySnapshotsByOwnerAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    const toCursor = (row) => ({
      ...toCreatedAtOrdinalCursor(row),
      metagraph_id: row.metagraph_id,
      hash: row.hash
    });

    const fromCursor = (row) => ({
      ...fromCreatedAtOrdinalCursor(row),
      metagraph_id: row.metagraph_id,
      hash: row.hash
    });

    return await paginatedQuery(
    extractPagination(event),
      toCursor,
      fromCursor,
      {
        where: { owner_address: address },
        include: { metagraph_blocks: true },
        orderBy: { ordinal: 'desc' }
      },
      prisma.metagraph_snapshots.findMany,
      metagraphSnapshotsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencySnapshot = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, term } = event.pathParameters || {};

    const snapshot = await prisma.metagraph_snapshots.findFirst({
      where: { metagraph_id: metagraph_id, ...metagraphSnapshotWhere(term) },
      include: { metagraph_blocks: true },
      orderBy: { ordinal: 'desc' }
    });

    return respond(snapshot, metagraphSnapshotResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencySnapshotRewards = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, term } = event.pathParameters || {};
    
    if (term != "latest" && !(await metagraphSnapshotExists(metagraph_id, term))){
      return notFoundResponse();
    }

    const cursor = (row) => ({
      metagraph_id: row.metagraph_id,
      hash: row.hash
    });

    return await paginatedQuery(
    extractPagination(event),
      cursor,
      cursor,
      {
        where: {
          metagraph_snapshots: {
            metagraph_id,
            ...metagraphSnapshotWhere(term)
          }
        },
        orderBy: [{ metagraph_id: 'asc'}, {metagraph_snapshot_hash: 'asc'}, {destination_addr: 'asc' }]
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
            metagraph_snapshots: { select: { hash: true, ordinal: true } }
          }
        }
      },
      orderBy: { ordinal: 'desc' }
    };

    const cursor = (row) => ({
      metagraph_id: row.metagraph_id,
      hash: row.hash
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

export const handleCurrencySnapshotTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, term } = event.pathParameters || {};
    
    if (term != "latest" && !(await metagraphSnapshotExists(metagraph_id, term)))
      return notFoundResponse();

    const where = {
      where: {
        metagraph_blocks: {
          metagraph_snapshots: {
            metagraph_id: metagraph_id,
            ...metagraphSnapshotWhere(term)
          }
        }
      }
    };

    return metagraphTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencyBlock = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, hash } = event.pathParameters || {};

    const block = await prisma.metagraph_blocks.findUnique({
      where: { metagraph_id, hash },
      include: {
        metagraph_transactions: { select: { hash: true } },
        metagraph_snapshots: true,
        super: { include: { block_parents: true } }
      }
    });

    return respond(block, metagraphBlockResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencyTransactions = async (
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

export const handleCurrencyTransaction = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, hash } = event.pathParameters || {};

    const transaction = await prisma.metagraph_transactions.findUnique({
      where: {  metagraph_id_hash: {
                  metagraph_id: metagraph_id!,
                  hash: hash!
                }
         },
      include: {
        metagraph_blocks: {
          include: {
            metagraph_snapshots: { select: { hash: true, ordinal: true } }
          }
        }
      }
    });

    return respond(transaction, metagraphTransactionResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencyTransactionsByAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};

    const where = {
      where: { metagraph_id, 
        OR: [{ source_addr: address }, { destination_addr: address }]
      }
    };

    return metagraphTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencyTransactionsBySource = async (
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

export const handleCurrencyTransactionsByDestination = async (
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

export const handleCurrencyBalanceByAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address, ordinal } = event.pathParameters || {};

    const ordinalNbr = toNumber(ordinal);
    const ordinalCondition = (isFinite(ordinalNbr)? {metagraph_snapshot_ordinal: { lte: ordinalNbr}}: {})

    const balance = await prisma.metagraph_balance_changes.findFirst({
      where: {
        metagraph_id,
        address,
        ...ordinalCondition
      },
      orderBy: { metagraph_snapshot_ordinal: 'desc' }
    });

    return respond(balance, balanceResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencyFeeTransaction = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, hash } = event.pathParameters || {};

    const transaction = await prisma.metagraph_fee_transactions.findUnique({
      where: { 
          metagraph_id: metagraph_id!,
          hash: hash!
      },
      include: {
        metagraph_snapshots: { select: { hash: true, ordinal: true } }
      }
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
        metagraph_snapshots: { select: { hash: true, ordinal: true } }
      },
      orderBy: { ordinal: 'desc' }
    };

    const cursor = (row) => ({
      metagraph_id: row.metagraph_id,
      hash: row.hash
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

export const handleCurrencySnapshotFeeTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, term } = event.pathParameters || {};
    if (!metagraph_id || !term)
      return missingParameterResponse('identifier or term');

    const where = {
      metagraph_id: metagraph_id,
      ordinal: BigInt(term),
    };

    return metagraphFeeTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencyFeeTransactionsByAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};
    if (!metagraph_id || !address)
      return missingParameterResponse('identifier or address');

    const where = {
      metagraph_id: metagraph_id,
      OR: [{ source_addr: address }, { destination_addr: address }]
    };

    return metagraphFeeTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencyFeeTransactionsBySource = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};
    if (!metagraph_id || !address)
      return missingParameterResponse('identifier or address');

    const where = {
      metagraph_id: metagraph_id,
      source_addr: address
    };
    return metagraphFeeTransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const handleCurrencyFeeTransactionsByDestination = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { identifier: metagraph_id, address } = event.pathParameters || {};
    if (!metagraph_id || !address)
      return missingParameterResponse('identifier or address');

    const where = {
      metagraph_id: metagraph_id,
      destination_addr: address
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
