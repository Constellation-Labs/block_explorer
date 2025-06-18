import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractHashOrdinal, extractPagination } from "../request-params";
import { paginatedQuery, hashCursor } from "../pagination";
import { handleError } from "../response";

const prisma = new PrismaClient();

const allowedTypes = [
  "AllowSpend",
  "SpendTransaction",
  "ExpiredAllowSpend",
  "TokenLock",
  "TokenUnlock",
  "FeeTransaction",
  "DelegateStakeCreate",
  "DelegateStakeWithdraw",
] as const;

type TransactionType = (typeof allowedTypes)[number];

const actionsTransactions: TransactionType[] = [...allowedTypes];

function isValidTransactionType(type: string): type is TransactionType {
  return allowedTypes.includes(type as TransactionType);
}

const transactionFilter = (event): TransactionType[] => {
  const queryParams = event.queryStringParameters || {};
  const rawTypes = queryParams.transactionTypes?.split(",") || [];

  const filtered = rawTypes.filter(isValidTransactionType);

  return filtered.length > 0 ? filtered : actionsTransactions;
};

const currencyId = (transaction) =>
  transaction.metagraph_snapshot?.metagraph_id ?? null;

const actionResponse = (transaction) => ({
  type: transaction.transaction_type,
  currencyId: currencyId(transaction),
  hash: transaction.hash,
  amount: transaction.amount,
  source: transaction.source_addr,
  destination: transaction.destination_addr ?? null,
  unlockEpoch: transaction.unlock_epoch ?? null,
  parentHash: transaction.parent_hash ?? null,
  timestamp: transaction.created_at,
  globalSnapshotHash: transaction.global_snapshot_hash,
  metagraphSnapshotHash: transaction.metagraph_snapshot_hash,
  globalSnapshotOrdinal: transaction.global_snapshot_ordinal,
  metagraphSnapshotOrdinal: transaction.metagraph_snapshot_ordinal,
});

export const actionsResponse = (ts) => ts.map(actionResponse);

export const dagActions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const selectedTransactions = transactionFilter(event);

  return await paginatedQuery(
    extractPagination(event),
    hashCursor,
    hashCursor,
    {
      where: { transaction_type: { in: selectedTransactions } },
      orderBy: [{ created_at: "desc" }, { hash: "desc" }],
    },
    prisma.dag_actions_view.findMany,
    actionsResponse
  );
};

export const globalSnapshotActions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { term } = event.pathParameters || {};
    const filter = extractHashOrdinal(term);

    const selectedTransactions = transactionFilter(event);

    return await paginatedQuery(
      extractPagination(event),
      hashCursor,
      hashCursor,
      {
        where: {
          global_snapshot: filter,
          transaction_type: { in: selectedTransactions },
        },
        orderBy: [{ created_at: "desc" }, { hash: "desc" }],
      },
      prisma.dag_actions_view.findMany,
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

    const selectedTransactions = transactionFilter(event);

    return await paginatedQuery(
      extractPagination(event),
      hashCursor,
      hashCursor,
      {
        where: {
          OR: [
            { source_addr: address },
            { dag_allow_spend: { destination_addr: address } },
            { dag_spend_transaction: { destination_addr: address } },
            {
              dag_expired_spend_transaction: {
                dag_allow_spend: { destination_addr: address },
              },
            },
          ],
          transaction_type: { in: selectedTransactions },
        },
        orderBy: [{ created_at: "desc" }, { hash: "desc" }],
      },
      prisma.dag_actions_view.findMany,
      actionsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencyActions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id } = event.pathParameters || {};

    const selectedTransactions = transactionFilter(event);

    return await paginatedQuery(
      extractPagination(event),
      hashCursor,
      hashCursor,
      {
        where: {
          metagraph_snapshot: { metagraph_id },
          transaction_type: { in: selectedTransactions },
        },
        orderBy: [{ created_at: "desc" }, { hash: "desc" }],
      },
      prisma.metagraph_actions_view.findMany,
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
    const { metagraph_id, term } = event.pathParameters || {};
    const filter = extractHashOrdinal(term);

    const selectedTransactions = transactionFilter(event);

    return await paginatedQuery(
      extractPagination(event),
      hashCursor,
      hashCursor,
      {
        where: {
          metagraph_snapshot: { metagraph_id, ...filter },
          transaction_type: { in: selectedTransactions },
        },
        orderBy: [{ created_at: "desc" }, { hash: "desc" }],
      },
      prisma.metagraph_actions_view.findMany,
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

    const selectedTransactions = transactionFilter(event);

    return await paginatedQuery(
      extractPagination(event),
      hashCursor,
      hashCursor,
      {
        where: {
          metagraph_snapshot: { metagraph_id },
          OR: [
            { source_addr: address },
            { metagraph_allow_spend: { destination_addr: address } },
            { metagraph_spend_transaction: { destination_addr: address } },
            { metagraph_fee_transaction: { destination_addr: address } },
            {
              metagraph_expired_spend_transaction: {
                metagraph_allow_spend: { destination_addr: address },
              },
            },
          ],
          transaction_type: { in: selectedTransactions },
        },
        orderBy: [{ created_at: "desc" }, { hash: "desc" }],
      },
      prisma.metagraph_actions_view.findMany,
      actionsResponse
    );
  } catch (error) {
    return handleError(error);
  }
};
