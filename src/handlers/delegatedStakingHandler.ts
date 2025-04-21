import { PrismaClient } from "@prisma/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractHashOrdinal, extractPagination } from "../request-params";
import {
  paginatedQuery,
  fromCreatedAtOrdinalCursor,
  toCreatedAtOrdinalCursor,
  toOrdinalCursor,
  fromOrdinalCursor,
} from "../pagination";
import { handleError, respond } from "../response";
import { toNumber } from "lodash";
import { latestGlobalSnapshot } from "./dagHandler";

const prisma = new PrismaClient();

const delegateStakeCreateResponse = (event) => ({
  hash: event.hash,
  ordinal: event.ordinal,
  source: event.source_addr,
  nodeId: event.node_id,
  amount: event.amount,
  fee: event.fee,
  tokenLockRef: event.token_lock_ref,
  parentHash: event.parent_hash,
  globalSnapshotHash: event.global_snapshot_hash,
  timestamp: event.created_at,
});

const delegateStakeCreateResponses = (txs) =>
  txs.map(delegateStakeCreateResponse);

const delegateStakeWithdrawResponse = (event) => ({
  hash: event.hash,
  source: event.source_addr,
  stakeRef: event.stake_ref,
  globalSnapshotHash: event.global_snapshot_hash,
  timestamp: event.created_at,
});

const delegateStakeWithdrawResponses = (txs) =>
  txs.map(delegateStakeWithdrawResponse);

const delegateStakeBalanceChangeResponse = (change) => ({
  globalSnapshotOrdinal: change.global_snapshot_ordinal,
  address: change.address,
  nodeId: change.node_id,
  balance: change.balance,
  rewards: change.rewards,
  timestamp: change.created_at,
});

const delegateStakeBalanceChangeResponses = (txs) =>
  txs.map(delegateStakeBalanceChangeResponse);

export const delegatedStakes = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return paginatedQuery(
    extractPagination(event),
    toOrdinalCursor,
    fromOrdinalCursor,
    {
      where: {
        delegate_stake_withdraw_event: null,
      },
      orderBy: [{ ordinal: "desc" }],
    },
    prisma.delegate_stake_create_events.findMany,
    delegateStakeCreateResponses
  );
};

export const delegatedStake = async (event) => {
  try {
    const hash = event.pathParameters?.hash;

    const stake = await prisma.delegate_stake_create_events.findUnique({
      where: { hash },
    });

    return respond(stake, delegateStakeCreateResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const addressDelegatedStakes = async (event) => {
  const address = event.pathParameters?.address;
  return paginatedQuery(
    extractPagination(event),
    toOrdinalCursor,
    fromOrdinalCursor,
    {
      where: {
        source_addr: address,
      },
      orderBy: [{ ordinal: "desc" }],
    },
    prisma.delegate_stake_create_events.findMany,
    delegateStakeCreateResponses
  );
};

export const delegatedStakeWithdrawals = async (event) => {
  return paginatedQuery(
    extractPagination(event),
    toOrdinalCursor,
    fromOrdinalCursor,
    {
      orderBy: [{ created_at: "desc" }],
    },
    prisma.delegate_stake_withdraw_events.findMany,
    delegateStakeWithdrawResponses
  );
};

export const delegatedStakeWithdrawal = async (event) => {
  try {
    const hash = event.pathParameters?.hash;

    const withdrawal = await prisma.delegate_stake_withdraw_events.findUnique({
      where: { hash },
    });

    return respond(withdrawal, delegateStakeWithdrawResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const addressDelegatedStakeWithdrawals = async (event) => {
  const address = event.pathParameters?.address;
  return paginatedQuery(
    extractPagination(event),
    toOrdinalCursor,
    fromOrdinalCursor,
    {
      where: {
        source_addr: address,
      },
      orderBy: [{ created_at: "desc" }],
    },
    prisma.delegate_stake_withdraw_events.findMany,
    delegateStakeWithdrawResponses
  );
};

export const stakingBalanceByAddress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    const { ordinal } = event.queryStringParameters || {};

    const ordinalNbr = toNumber(ordinal);

    const ordinalCondition = isFinite(ordinalNbr)
      ? { global_snapshot_ordinal: { lte: ordinalNbr } }
      : {};

    const latestPerNode = await prisma.delegate_stake_balance_changes.groupBy({
      by: ["node_id"],
      where: {
        address,
        ...ordinalCondition,
      },
      _max: {
        global_snapshot_ordinal: true,
      },
    });

    const latestConditions = latestPerNode.map(({ node_id, _max }) => ({
      address,
      node_id,
      global_snapshot_ordinal: _max.global_snapshot_ordinal ?? {},
    }));

    const latestBalances = await prisma.delegate_stake_balance_changes.findMany(
      {
        where: {
          OR: latestConditions,
        },
      }
    );

    return respond(latestBalances, delegateStakeBalanceChangeResponses);
  } catch (error) {
    return handleError(error);
  }
};
