import { PrismaClient } from '@prisma/client';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  extractHashOrdinal,
  extractPagination,
} from './request-params';
import {
  balanceResponse,
  dagBlockResponse,
  dagTransactionResponse,
  dagTransactionsResponse,
  globalSnapshotResponse,
  globalSnapshotsResponse,
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
import { paginatedQuery } from './pagination';
import { toNumber, isFinite } from "lodash";

const prisma = new PrismaClient();

const globalSnapshotExists = async (term) => {
  return prisma.global_snapshots.findUnique({
    where: extractHashOrdinal(term) , 
    select: { hash: true },
  })
};

const latestGlobalSnapshot = async () => {
  return prisma.global_snapshots.findFirst({
    select: { hash: true },
    orderBy: { ordinal: 'desc'}
  })
};

const latestMetagraphSnapshot = async () => {
  return prisma.metagraph_snapshots.findFirst({
    select: { hash: true },
    orderBy: { ordinal: 'desc'}
  })
};

const globalSnapshotWhere = async (term) => {
    if (term == 'latest'){
      const latestSnapshotHash = await latestGlobalSnapshot()
      return { hash: latestSnapshotHash}
    } else {
      return extractHashOrdinal(term)
    }
  }

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

const toCreatedAtCursor = (row) => ({ created_at: new Date(row.created_at) });
const fromCreatedAtCursor = (row) => ({
  created_at: row.created_at.toISOString()
});

const toOrdinalCursor = (row) => ({ ordinal: BigInt('0x' + row.ordinal) });
const fromOrdinalCursor = (row) => ({ ordinal: row.ordinal.toString(16) });

const toCreatedAtOrdinalCursor = (row) => ({
  ...toCreatedAtCursor(row),
  ...toOrdinalCursor(row)
});
const fromCreatedAtOrdinalCursor = (row) => ({
  ...fromCreatedAtCursor(row),
  ...fromOrdinalCursor(row)
});

export const handleGlobalSnapshots = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return await paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    {
      include: { dag_blocks: true },
      orderBy: { ordinal: 'desc' }
    },
    prisma.global_snapshots.findMany,
    globalSnapshotsResponse
  );
};

export const handleGlobalSnapshot = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { term } = event.pathParameters || {};

    let snapshot;
    if (term == 'latest'){
      snapshot = await prisma.global_snapshots.findFirst({
        include: { dag_blocks: true }, 
        orderBy: { ordinal: 'desc' }
      }); 

    } else {
      const filter =  extractHashOrdinal(term)

      snapshot = await prisma.global_snapshots.findUnique({
        where: filter,
        include: { dag_blocks: true }
      });  
    }

    return respond(snapshot, globalSnapshotResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const handleGlobalSnapshotRewards = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { term } = event.pathParameters || {};

    if (term != "latest" && !await globalSnapshotExists(term)) { 
      return notFoundResponse();
    }

    const toCursor = (row) => ({
      global_snapshot_hash_destination_addr: {
        global_snapshot_hash: row.global_snapshot_hash,
        destination_addr: row.destination_addr
      }
    });
    const fromCursor = (row) => ({
      global_snapshot_hash: row.global_snapshot_hash,
      destination_addr: row.destination_addr
    });

    return await paginatedQuery(
      extractPagination(event),
      toCursor,
      fromCursor,
      {
        where: { global_snapshots: { ...globalSnapshotWhere(term) } },
        orderBy: [{ global_snapshot_hash: 'asc' }, { destination_addr: 'asc' }]
      },
      prisma.dag_reward_transactions.findMany,
      rewardsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const handleGlobalSnapshotTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { term } = event.pathParameters || {};

    if (term != "latest" && !await globalSnapshotExists(term)) { 
      return notFoundResponse();
    }

    const query = {
      where: {
        dag_blocks: { global_snapshots: { ...globalSnapshotWhere(term) } }
      },
      include: {
        dag_blocks: {
          select: {
            global_snapshots: { select: { hash: true, ordinal: true } }
          }
        }
      },
      orderBy: { ordinal: 'desc' }
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

export const handleDagBlock = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash } = event.pathParameters || {};
    
    const block = await prisma.dag_blocks.findUnique({
      where: { hash },
      include: {
        dag_transactions: { select: { hash: true } },
        global_snapshots: true,
        super: { include: { block_parents: true } }
      }
    });
    return respond(block, dagBlockResponse);
  } catch (error) {
    return handleError(error);
  }
};

const dagTtransactionsQuery = async (
  where,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const query = {
      ...where,
      include: {
        dag_blocks: {
          include: {
            global_snapshots: { select: { hash: true, ordinal: true } }
          }
        }
      },
      orderBy: { ordinal: 'desc' }
    };

    const toCursor = (row) => ({
      ...toCreatedAtOrdinalCursor(row),
      hash: row.hash
    });

    const fromCursor = (row) => ({
      ...fromCreatedAtOrdinalCursor(row),
      hash: row.hash
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

export const handleDagTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return dagTtransactionsQuery({}, event);
};

export const handleDagTransaction = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash } = event.pathParameters || {};

    const transaction = await prisma.dag_transactions.findUnique({
      where: { hash },
      include: {
        dag_blocks: {
          include: {
            global_snapshots: { select: { hash: true, ordinal: true } }
          }
        }
      }
    });

    return respond(transaction, dagTransactionResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const handleDagTransactionsByAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    const where = {
      where: { OR: [{ source_addr: address }, { destination_addr: address }] }
    };

    return dagTtransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const handleDagTransactionsBySource = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    const where = { where: { source_addr: address } };

    return dagTtransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const handleDagTransactionsByDestination = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    const where = { where: { destination_addr: address } };

    return dagTtransactionsQuery(where, event);
  } catch (error) {
    return handleError(error);
  }
};

export const handleDagBalanceByAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address, ordinal } = event.pathParameters || {};

    const ordinalNbr = toNumber(ordinal);
    const ordinalCondition = (isFinite(ordinalNbr)? { snapshot_ordinal: {lte: ordinalNbr}}: {})

    const balances = await prisma.dag_balance_changes.findFirst({
      where: { address, ...ordinalCondition },
      orderBy: { snapshot_ordinal: 'desc' }
    });

    return respond(balances, balanceResponse);
  } catch (error) {
    return handleError(error);
  }
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
      where: { metagraph_id_hash: {
          metagraph_id: metagraph_id!,
          hash: hash!
        }
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
