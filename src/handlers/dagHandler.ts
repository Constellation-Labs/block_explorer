import { PrismaClient } from '@prisma/client';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  extractHashOrdinal,
  extractPagination,
} from '../request-params';
import {
  balanceResponse,
  dagBlockResponse,
  dagTransactionResponse,
  dagTransactionsResponse,
  globalSnapshotResponse,
  globalSnapshotsResponse,
  handleError,
  notFoundResponse,
  respond,
  rewardsResponse
} from '../response';
import { fromCreatedAtOrdinalCursor, paginatedQuery, toCreatedAtOrdinalCursor } from '../pagination';
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


const globalSnapshotWhere = async (term) => {
    if (term == 'latest'){
      const latestSnapshotHash = await latestGlobalSnapshot()
      return { hash: latestSnapshotHash}
    } else {
      return extractHashOrdinal(term)
    }
  }

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

