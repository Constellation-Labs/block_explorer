import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractHashOrdinal, extractPagination } from "../request-params";
import {
  paginatedQuery,
  fromCreatedAtOrdinalCursor,
  toCreatedAtOrdinalCursor,
} from "../pagination";
import { respond, handleError } from "../response";

const prisma = new PrismaClient();

const allowSpendResponse = (transaction) => ({
  currencyId: transaction.currencyId,
  hash: transaction.hash,
  ordinal: transaction.ordinal,
  amount: transaction.amount,
  source: transaction.source_addr,
  destination: transaction.destination_addr,
  lastValidEpochProgress: transaction.last_valid_epoch_progress,
  fee: transaction.fee,
  snapshotHash: transaction.snapshot_hash,
  timestamp: transaction.created_at,
});

const allowSpendResponses = (txs) => txs.map(allowSpendResponse);

const spendTransactionResponse = (transaction) => ({
  currencyId: transaction.currencyId,
  hash: transaction.hash,
  amount: transaction.amount,
  source: transaction.source_addr,
  destination: transaction.destination_addr,
  allowSpendRef: transaction.allow_spend_ref,
  snapshotHash: transaction.snapshot_hash,
  timestamp: transaction.created_at,
});

const spendTransactionResponses = (txs) => txs.map(spendTransactionResponse);

const spendExpiredResponse = (transaction) => ({
  currencyId: transaction.currencyId,
  hash: transaction.hash,
  amount: transaction.amount,
  source: transaction.source_addr,
  allowSpendRef: transaction.allow_spend_ref,
  snapshotHash: transaction.snapshot_hash,
  timestamp: transaction.created_at,
});

const spendExpiredResponses = (txs) => txs.map(spendExpiredResponse);

export const allowSpends = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return await paginatedQuery(
    extractPagination(event),
    toCreatedAtOrdinalCursor,
    fromCreatedAtOrdinalCursor,
    { orderBy: { created_at: "desc" } },
    prisma.dag_allow_spends.findMany,
    allowSpendResponses
  );
};

export const globalSnapshotAllowSpends = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: { global_snapshot: filter },
        orderBy: { created_at: "desc" },
      },
      prisma.dag_allow_spends.findMany,
      allowSpendResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const addressAllowSpends = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: {
          OR: [{ source_addr: address }, { destination_addr: address }],
        },
        orderBy: { created_at: "desc" },
      },
      prisma.dag_allow_spends.findMany,
      allowSpendResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const spendTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { orderBy: { created_at: "desc" } },
      prisma.dag_spend_transactions.findMany,
      spendTransactionResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const globalSnapshotSpendTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: {
          dag_allow_spend: { global_snapshot: filter },
        },
        orderBy: { created_at: "desc" },
      },
      prisma.dag_spend_transactions.findMany,
      spendTransactionResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const addressSpendTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: {
          OR: [{ source_addr: address }, { destination_addr: address }],
        },
        orderBy: { created_at: "desc" },
      },
      prisma.dag_spend_transactions.findMany,
      spendTransactionResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const allowSpendExpirations = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { orderBy: { created_at: "desc" } },
      prisma.dag_expired_spend_transactions.findMany,
      spendExpiredResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const globalSnapshotAllowSpendExpirations = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: {
          dag_allow_spend: { global_snapshot: filter },
        },
        orderBy: { created_at: "desc" },
      },
      prisma.dag_expired_spend_transactions.findMany,
      spendExpiredResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const addressAllowSpendExpirations = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: {
          OR: [
            { source_addr: address },
            { dag_allow_spend: { destination_addr: address } },
          ],
        },
        orderBy: { created_at: "desc" },
      },
      prisma.dag_expired_spend_transactions.findMany,
      spendExpiredResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencyAllowSpends = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { metagraph_id }, orderBy: { created_at: "desc" } },
      prisma.metagraph_allow_spends.findMany,
      allowSpendResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencySnapshotAllowSpends = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: {
          metagraph_id,
          metagraph_allow_spend_block: { metagraph_snapshot: filter },
        },
        orderBy: { created_at: "desc" },
      },
      prisma.metagraph_allow_spends.findMany,
      allowSpendResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencyAddressAllowSpends = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: {
          metagraph_id,
          OR: [{ source_addr: address }, { destination_addr: address }],
        },
        orderBy: { created_at: "desc" },
      },
      prisma.metagraph_allow_spends.findMany,
      allowSpendResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencySpendTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { metagraph_id }, orderBy: { created_at: "desc" } },
      prisma.metagraph_spend_transactions.findMany,
      spendTransactionResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencySnapshotSpendTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: {
          metagraph_id,
          metagraph_allow_spend: {
            metagraph_allow_spend_block: { metagraph_snapshot: filter },
          },
        },
        orderBy: { created_at: "desc" },
      },
      prisma.metagraph_spend_transactions.findMany,
      spendTransactionResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencyAddressSpendTransactions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: {
          OR: [{ source_addr: address }, { destination_addr: address }],
        },
        orderBy: { created_at: "desc" },
      },
      prisma.metagraph_spend_transactions.findMany,
      spendExpiredResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencyAllowSpendExpirations = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      { where: { metagraph_id }, orderBy: { created_at: "desc" } },
      prisma.metagraph_expired_spend_transactions.findMany,
      spendExpiredResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencySnapshotAllowSpendExpirations = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, hash_or_ordinal } = event.pathParameters || {};
    const filter = extractHashOrdinal(hash_or_ordinal);

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: {
          metagraph_id,
          metagraph_allow_spend: {
            metagraph_allow_spend_block: { metagraph_snapshot: filter },
          },
        },
        orderBy: { created_at: "desc" },
      },
      prisma.metagraph_expired_spend_transactions.findMany,
      spendExpiredResponses
    );
  } catch (error) {
    return handleError(error);
  }
};

export const currencyAddressAllowSpendExpirations = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { metagraph_id, address } = event.pathParameters || {};

    return await paginatedQuery(
      extractPagination(event),
      toCreatedAtOrdinalCursor,
      fromCreatedAtOrdinalCursor,
      {
        where: {
          metagraph_id,
          OR: [
            { source_addr: address },
            { metagraph_allow_spend: { destination_addr: address } },
          ],
        },
        orderBy: { created_at: "desc" },
      },
      prisma.metagraph_expired_spend_transactions.findMany,
      spendExpiredResponses
    );
  } catch (error) {
    return handleError(error);
  }
};
