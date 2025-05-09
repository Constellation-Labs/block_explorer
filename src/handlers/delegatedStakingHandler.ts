import {
  delegate_stake_create_events,
  delegate_stake_withdraw_events,
  PrismaClient,
} from "@prisma/client";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { extractPagination } from "../request-params";
import {
  paginatedQuery,
  toOrdinalCursor,
  fromOrdinalCursor,
} from "../pagination";
import { handleError, respond } from "../response";

const prisma = new PrismaClient();

const latestWithdrawEvents = (
  events: delegate_stake_withdraw_events[] = []
) => {
  let withdrawalCreate: delegate_stake_withdraw_events | null = null;
  let withdrawalComplete: delegate_stake_withdraw_events | null = null;

  for (const event of events) {
    if (event.is_completed) {
      withdrawalComplete = event;
    } else {
      withdrawalCreate = event;
    }
  }

  return { withdrawalCreate, withdrawalComplete };
};

const withdrawalStatus = (isCompleted) =>
  isCompleted ? "withdrawalComplete" : "pendingWithdrawal";

const createStatus = (ce) => (ce.transfer_from_hash ? "transfered" : "active");

const stakeStatus = (event) => {
  const withdrawalEvents = event.delegate_stake_withdraw_events;
  if (withdrawalEvents?.length > 0) {
    return withdrawalStatus(withdrawalEvents > 1);
  } else {
    return createStatus(event);
  }
};

const delegateStakeCreateResponse = (event) => ({
  hash: event.hash,
  ordinal: event.ordinal,
  source: event.source_addr,
  nodeId: event.node_id,
  amount: event.amount,
  fee: event.fee,
  tokenLockHash: event.lock_reference_hash,
  parentHash: event.parent_hash,
  type: event.transfer_from_hash ? "transfer" : "create",
  status: stakeStatus(event),
  timestamp: event.created_at,
});

const delegateStakeCreateResponses = (txs) =>
  txs.map(delegateStakeCreateResponse);

const delegateStakeWithdrawResponse = (event) => ({
  hash: event.hash,
  source: event.source_addr,
  stake: event.delegate_stake_create_event,
  globalSnapshotHash: event.global_snapshot_hash,
  unlockEpoch: event.unlock_epoch,
  status: withdrawalStatus(event.is_completed),
  timestamp: event.created_at,
});

const delegateStakeWithdrawResponses = (txs) =>
  txs.map(delegateStakeWithdrawResponse);

const totalRewards = (rs) =>
  (rs ?? []).reduce((sum, r) => sum + r.rewards, BigInt(0));

const completedAmount = (change) => {
  const withdrawal = change.withdrawal_event;
  if (change.withdrawal_event?.is_complete) {
    const createEvent = withdrawal.delegate_stake_create_even;
    return (
      createEvent.amount + totalRewards(createEvent.delegate_stake_rewards)
    );
  } else {
    return 0;
  }
};

const delegateStakePositionResponse = (change) => {
  const { withdrawalCreate, withdrawalComplete } = latestWithdrawEvents(
    change.delegate_stake_withdraw_events
  );
  return {
    address: change.source_addr,
    nodeId: change.node_id,
    status: stakeStatus(change),
    stakeHash: change.hash,
    lockAmount: change.amount,
    rewardsAccrued: totalRewards(change.delegate_stake_rewards),
    withdrawnAmount: completedAmount(change),
    transferedFromHash: change.delegated_from?.hash ?? null,
    transferedToHash: change.delegated_to?.hash ?? null,
    createdAt: change.created_at,
    transferredAt: change.delegated_to?.created_at ?? null,
    withdrawalStartedAt: withdrawalCreate?.created_at ?? null,
    withdrawalCompletedAt: withdrawalComplete?.created_at ?? null,
  };
};

const delegateStakePositionResponses = (txs) =>
  txs.map(delegateStakePositionResponse);

const statusFilter = (event) => {
  const statusParam =
    event.queryStringParameters?.status ?? "active,pendingWithdrawal";
  return statusParam.split(",");
};

const buildStatusWhereQuery = (statuses) => {
  let statusFilters: any[] = [];

  if (statuses.includes("active")) {
    statusFilters.push({
      transfer_from_hash: null,
      delegate_stake_withdraw_events: {
        none: {},
      },
    });
  }

  if (statuses.includes("transfered")) {
    statusFilters.push({
      transfer_from_hash: {
        not: null,
      },
      delegate_stake_withdraw_events: {
        none: {},
      },
    });
  }

  if (statuses.includes("pendingWithdrawal")) {
    statusFilters.push({
      delegate_stake_withdraw_events: {
        some: {},
        every: {
          is_completed: false,
        },
      },
    });
  }

  if (statuses.includes("withdrawalComplete")) {
    statusFilters.push({
      delegate_stake_withdraw_events: {
        some: {
          is_completed: true,
        },
      },
    });
  }

  return statusFilters.length > 0 ? { OR: statusFilters } : {};
};

export const delegatedStakes = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const statuses = statusFilter(event);
  const statusWhere = buildStatusWhereQuery(statuses);
  return paginatedQuery(
    extractPagination(event),
    toOrdinalCursor,
    fromOrdinalCursor,
    {
      where: {
        ...statusWhere,
      },
      include: {
        delegate_stake_withdraw_events: true,
        delegated_to: true,
        delegated_from: true,
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
      include: {
        delegate_stake_withdraw_events: true,
        delegated_to: true,
        delegated_from: true,
      },
    });

    return respond(stake, delegateStakeCreateResponse);
  } catch (error) {
    return handleError(error);
  }
};

export const addressDelegatedStakes = async (event) => {
  const address = event.pathParameters?.address;

  const statuses = statusFilter(event);
  const statusWhere = buildStatusWhereQuery(statuses);

  return paginatedQuery(
    extractPagination(event),
    toOrdinalCursor,
    fromOrdinalCursor,
    {
      where: {
        source_addr: address,
        ...statusWhere,
      },
      include: {
        delegate_stake_withdraw_events: true,
        delegated_to: true,
        delegated_from: true,
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
      include: { delegate_stake_create_event: true },
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
      include: { delegate_stake_create_event: true },
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
      include: { delegate_stake_create_event: true },
      orderBy: [{ created_at: "desc" }],
    },
    prisma.delegate_stake_withdraw_events.findMany,
    delegateStakeWithdrawResponses
  );
};

export const stakingPositions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { address } = event.pathParameters || {};

    const statuses = statusFilter(event);
    const statusWhere = buildStatusWhereQuery(statuses);

    const maxOrdinals = await prisma.delegate_stake_create_events.groupBy({
      by: ["source_addr", "node_id"],
      _max: {
        ordinal: true,
      },
    });

    const whereConditions = maxOrdinals.map(
      ({ source_addr, node_id, _max }) => ({
        source_addr,
        node_id,
        ordinal: _max.ordinal!,
      })
    );

    const addressFilter = address?.trim()
      ? { source_addr: address.trim() }
      : {};

    return paginatedQuery(
      extractPagination(event),
      toOrdinalCursor,
      fromOrdinalCursor,
      {
        where: {
          OR: whereConditions,
          ...statusWhere,
          ...addressFilter,
        },
        include: {
          delegate_stake_withdraw_events: true,
          delegate_stake_rewards: true,
          delegated_to: true,
          delegated_from: true,
        },
        orderBy: [{ source_addr: "asc" }, { node_id: "asc" }],
      },
      prisma.delegate_stake_create_events.findMany,
      delegateStakePositionResponses
    );
  } catch (error) {
    return handleError(error);
  }
};
