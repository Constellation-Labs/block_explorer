import { PrismaClient } from '@prisma/client';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractHashOrdinal, extractPagination } from '../request-params';
import { paginatedQuery, fromCreatedAtOrdinalCursor, toCreatedAtOrdinalCursor } from '../pagination';
import { respond, handleError, dagTransactionResponse } from '../response';

const prisma = new PrismaClient();


// const prisma = new PrismaClient({
//   log: [
//     {
//       emit: "event",
//       level: "query",
//     },
//   ],
// });

// prisma.$on("query", async (e) => {
//     console.log(`${e.query} ${e.params}`)
// });

const dagActionsTables =  [
    "dag_allow_spends",
    "dag_spend_transactions",
    "dag_token_locks",
    "dag_token_unlocks",
    "dag_fee_transactions"
  ];

  const metagraphActionsTables = [
    "metagraph_allow_spends",
    "metagraph_spend_transactions",
    "metagraph_token_locks",
    "metagraph_token_unlocks",
    "metagraph_fee_transactions"
  ];

  const currencyId = (transaction) => (transaction.metagraph_token_lock?.metagraph_id ?? 
    transaction.metagraph_token_unlock?.metagraph_id ?? 
    transaction.metagraph_allow_spend?.metagraph_id ?? 
    transaction.metagraph_spend_transaction?.metagraph_id ??
    transaction.metagraph_fee_transaction?.metagraph_id)
  
  const actionResponse = (transaction) => ({
    type: transaction.table_name,
    currencyId: currencyId(transaction),
    hash: transaction.hash,
    amount: transaction.amount,
    source: transaction.source_addr,
    destination: transaction.destination_addr,
    unlockEpoch: transaction.last_valid_epoch_progress ?? transaction.unlock_epoch,
    parentHash: transaction.lock_reference_hash ?? transaction.allow_spend_ref,
    timestamp: transaction.created_at
  });

export const actionsResponse = (ts) => ts.map(actionResponse);;

export const dagActions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return await paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    { 
      where: { table_name: { in: dagActionsTables } }, 
      orderBy: { created_at: 'desc' } 
    },
    prisma.abstract_transactions_view.findMany,
    actionsResponse
  );
};


const tokenLockGlobalSnapshotCond = (filter) => ({ dag_token_lock: { dag_token_lock_block: { global_snapshot: filter }} })
const tokenUnlockGlobalSnapshotCond = (filter) => ({ dag_token_unlock:  tokenLockGlobalSnapshotCond(filter) })
const allowSpendGlobalSnapshotCond = (filter) => ({
  dag_allow_spend: { 
    dag_allow_spend_block: {
      global_snapshot: filter
    }
  }
})
const spendTxGlobalSnapshotCond = (filter) => ({ dag_spend_transaction: allowSpendGlobalSnapshotCond(filter) })


const filterByGlobalSnapshot = (filter) => ( {OR: [
  tokenLockGlobalSnapshotCond(filter),
  tokenUnlockGlobalSnapshotCond(filter),
  allowSpendGlobalSnapshotCond(filter), 
  spendTxGlobalSnapshotCond(filter)
]})

export const globalSnapshotActions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { 
        ...filterByGlobalSnapshot(filter),
      table_name: { in: dagActionsTables }  
      }
      , orderBy: { created_at: 'desc' } },
      prisma.abstract_transactions_view.findMany,
      actionsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const dagAddressActions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { source_addr: address, table_name: { in: dagActionsTables } }, 
      orderBy: { created_at: 'desc' } },
      prisma.abstract_transactions_view.findMany,
      actionsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};



const metagraphIdCond = (metagraph_id) => ({ OR: [
    { metagraph_token_lock: {metagraph_id }},
    { metagraph_token_unlock: {metagraph_id }},
    { metagraph_allow_spend: {metagraph_id }},
    { metagraph_spend_transaction: {metagraph_id }},
    { metagraph_fee_transaction: {metagraph_id }}
  ]})

const tokenLockMetagraphSnapshotCond = (filter) => ({ metagraph_token_lock:  { metagraph_token_lock_block: { metagraph_snapshot: filter} } })
const tokenUnlockMetagraphSnapshotCond = (filter) => ({ metagraph_token_unlock:  tokenLockMetagraphSnapshotCond(filter) })
const allowSpendMetagraphSnapshotCond = (filter) => ({
  metagraph_allow_spend: { 
    metagraph_allow_spend_block: {
      metagraph_snapshot: filter
    }
  }
})
const spendTxMetagraphSnapshotCond = (filter) => ({ metagraph_spend_transaction: allowSpendMetagraphSnapshotCond(filter) })


const filterByMetagraphSnapshot = (filter) => ( {OR: [
  tokenLockMetagraphSnapshotCond(filter),
  tokenUnlockMetagraphSnapshotCond(filter),
  allowSpendMetagraphSnapshotCond(filter), 
  spendTxMetagraphSnapshotCond(filter)
]})


export const currencyActions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { 
        ...metagraphIdCond(metagraph_id),
        table_name: { in: metagraphActionsTables } 
      },
       orderBy: { created_at: 'desc' } },
      prisma.abstract_transactions_view.findMany,
      actionsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencySnapshotActions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { 
        ...metagraphIdCond(metagraph_id), 
        ...filterByMetagraphSnapshot(hash_or_ordinal),
        table_name: { in: metagraphActionsTables } }, orderBy: { created_at: 'desc' } },
      prisma.abstract_transactions_view.findMany,
      actionsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencyAddressActions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: {...metagraphIdCond(metagraph_id), source_addr: address, table_name: { in: metagraphActionsTables } }, orderBy: { created_at: 'desc' } },
      prisma.abstract_transactions_view.findMany,
      actionsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};
