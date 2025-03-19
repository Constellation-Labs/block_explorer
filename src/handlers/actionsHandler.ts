import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractHashOrdinal, extractPagination } from "../request-params";
import { paginatedQuery, hashCursor } from "../pagination";
import { handleError } from "../response";
import { getPrisma } from "../prismaClient";

const transactionTypeMap: Record<string, string> = {
  AllowSpend: "allow_spends",
  TokenLock: "token_locks",
  TokenUnlock: "token_unlocks",
  SpendTransaction: "spend_transactions",
  FeeTransaction: "fee_transactions",
};

const reverseTransactionTypeMap = Object.entries(transactionTypeMap).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {} as Record<string, string>
);

const getTransactionType = (tableName: string): string | undefined => {
  const strippedName = tableName.replace(/^(dag_|metagraph_)/, ""); // Remove prefix
  return reverseTransactionTypeMap[strippedName];
};

const dagTable = (name: string) => `dag_${name}`;
const metagraphTable = (name: string) => `metagraph_${name}`;

const actionsTables = Object.values(transactionTypeMap);

const tableFilter = (event) => {
  const queryParams = event.queryStringParameters || {};
  const transactionTypes = queryParams.transactionTypes?.split(",") || [];

  return transactionTypes.length > 0
    ? transactionTypes.map((type) => transactionTypeMap[type]).filter(Boolean)
    : actionsTables;
};

const currencyId = (transaction) =>
  transaction.metagraph_token_lock?.metagraph_id ??
  transaction.metagraph_token_unlock?.metagraph_id ??
  transaction.metagraph_allow_spend?.metagraph_id ??
  transaction.metagraph_spend_transaction?.metagraph_id ??
  transaction.metagraph_fee_transaction?.metagraph_id ??
  null;

const actionResponse = (transaction) => ({
  type: getTransactionType(transaction.table_name),
  currencyId: currencyId(transaction),
  hash: transaction.hash,
  amount: transaction.amount,
  source: transaction.source_addr,
  destination: transaction.destination_addr,
  unlockEpoch:
    transaction.dag_allow_spend?.last_valid_epoch_progress ??
    transaction.dag_token_lock?.unlock_epoch,
  parentHash:
    transaction.dag_spend_transaction?.allow_spend_ref ??
    transaction.dag_token_unlock?.lock_reference_hash,
  timestamp: transaction.created_at,
});

export const actionsResponse = (ts) => ts.map(actionResponse);

const dagInclude = {
  dag_token_lock: { select: { unlock_epoch: true } },
  dag_allow_spend: { select: { last_valid_epoch_progress: true } },
  dag_spend_transaction: { select: { allow_spend_ref: true } },
  dag_token_unlock: { select: { lock_reference_hash: true } },
};

const metagraphInclude = {
  metagraph_token_lock: { select: { unlock_epoch: true } },
  metagraph_allow_spend: { select: { last_valid_epoch_progress: true } },
  metagraph_spend_transaction: { select: { allow_spend_ref: true } },
  metagraph_token_unlock: { select: { lock_reference_hash: true } },
};

export const dagActions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {

  const prisma = await getPrisma();
  
  const selectedTables = tableFilter(event).map(dagTable);

  return await paginatedQuery(
    extractPagination(event),
    hashCursor,
    hashCursor,
    {
      where: { table_name: { in: selectedTables } },
      include: dagInclude,
      orderBy: [{ created_at: "desc" }, { hash: "desc" }],
    },
    prisma.abstract_transactions_view.findMany,
    actionsResponse
  );
};

const tokenLockGlobalSnapshotCond = (filter) => ({
  dag_token_lock: { global_snapshot: filter },
});
const tokenUnlockGlobalSnapshotCond = (filter) => ({
  dag_token_unlock: { token_lock: { global_snapshot: filter } },
});
const allowSpendGlobalSnapshotCond = (filter) => ({
  dag_allow_spend: {
    dag_allow_spend_block: {
      global_snapshot: filter,
    },
  },
});
const spendTxGlobalSnapshotCond = (filter) => ({
  dag_spend_transaction: allowSpendGlobalSnapshotCond(filter),
});

const filterByGlobalSnapshot = (filter) => ({
  OR: [
    tokenLockGlobalSnapshotCond(filter),
    tokenUnlockGlobalSnapshotCond(filter),
    allowSpendGlobalSnapshotCond(filter),
    spendTxGlobalSnapshotCond(filter),
  ],
});

export const globalSnapshotActions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const prisma = await getPrisma();

    const { term } = event.pathParameters || {};
    const filter = extractHashOrdinal(term);

    const selectedTables = tableFilter(event).map(dagTable);

    return await paginatedQuery(
      extractPagination(event),
      hashCursor,
      hashCursor,
      {
        where: {
          ...filterByGlobalSnapshot(filter),
          table_name: { in: selectedTables },
        },
        include: dagInclude,
        orderBy: [{ created_at: "desc" }, { hash: "asc" }],
      },
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

    const prisma = await getPrisma();
    
    const { address } = event.pathParameters || {};

    const selectedTables = tableFilter(event).map(dagTable);

    return await paginatedQuery(
      extractPagination(event),
      hashCursor,
      hashCursor,
      {
        where: { source_addr: address, table_name: { in: selectedTables } },
        include: dagInclude,
        orderBy: [{ created_at: "desc" }, { hash: "asc" }],
      },
      prisma.abstract_transactions_view.findMany,
      actionsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

const metagraphIdCond = (metagraph_id) => ({
  OR: [
    { metagraph_token_lock: { metagraph_id } },
    { metagraph_token_unlock: { metagraph_id } },
    { metagraph_allow_spend: { metagraph_id } },
    { metagraph_spend_transaction: { metagraph_id } },
    { metagraph_fee_transaction: { metagraph_id } },
  ],
});

const tokenLockMetagraphSnapshotCond = (filter) => ({
  metagraph_token_lock: {
    metagraph_token_lock_block: { metagraph_snapshot: filter },
  },
});
const tokenUnlockMetagraphSnapshotCond = (filter) => ({
  metagraph_token_unlock: {
    token_lock: {
      metagraph_token_lock_block: { metagraph_snapshot: filter },
    },
  },
});
const allowSpendMetagraphSnapshotCond = (filter) => ({
  metagraph_allow_spend: {
    metagraph_allow_spend_block: {
      metagraph_snapshot: filter,
    },
  },
});
const spendTxMetagraphSnapshotCond = (filter) => ({
  metagraph_spend_transaction: allowSpendMetagraphSnapshotCond(filter),
});

const filterByMetagraphSnapshot = (filter) => ({
  OR: [
    tokenLockMetagraphSnapshotCond(filter),
    tokenUnlockMetagraphSnapshotCond(filter),
    allowSpendMetagraphSnapshotCond(filter),
    spendTxMetagraphSnapshotCond(filter),
  ],
});

export const currencyActions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {

    const prisma = await getPrisma();

    const { metagraph_id } = event.pathParameters || {};

    const selectedTables = tableFilter(event).map(metagraphTable);

    return await paginatedQuery(
      extractPagination(event),
      hashCursor,
      hashCursor,
      {
        where: {
          ...metagraphIdCond(metagraph_id),
          table_name: { in: selectedTables },
        },
        include: metagraphInclude,
        orderBy: [{ created_at: "desc" }, { hash: "asc" }],
      },
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

    const prisma = await getPrisma();

    const { metagraph_id, term } = event.pathParameters || {};
    const filter = extractHashOrdinal(term);

    const selectedTables = tableFilter(event).map(metagraphTable);

    return await paginatedQuery(
      extractPagination(event),
      hashCursor,
      hashCursor,
      {
        where: {
          ...metagraphIdCond(metagraph_id),
          ...filterByMetagraphSnapshot(filter),
          table_name: { in: selectedTables },
        },
        include: metagraphInclude,
        orderBy: [{ created_at: "desc" }, { hash: "asc" }],
      },
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

    const prisma = await getPrisma();

    const { metagraph_id, address } = event.pathParameters || {};

    const selectedTables = tableFilter(event).map(metagraphTable);

    return await paginatedQuery(
      extractPagination(event),
      hashCursor,
      hashCursor,
      {
        where: {
          ...metagraphIdCond(metagraph_id),
          source_addr: address,
          table_name: { in: selectedTables },
        },
        include: metagraphInclude,
        orderBy: [{ created_at: "desc" }, { hash: "asc" }],
      },
      prisma.abstract_transactions_view.findMany,
      actionsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};
