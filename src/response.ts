import { APIGatewayProxyResult } from "aws-lambda";
import { toNextString } from "./request-params";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export type Result<T> = {
  data: T;
  meta?: {};
};

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    next: string | null;
  };
};

export const globalSnapshotsResponse = (ss) => ss.map(globalSnapshotResponse);

const commonSnapshotResponse = (snapshot, blocksProperty) => ({
  hash: snapshot.hash,
  ordinal: snapshot.ordinal,
  height: snapshot.height,
  subHeight: snapshot.subheight,
  lastSnapshotHash: snapshot.last_snapshot_hash,
  blocks: snapshot[blocksProperty].map((b) => b.hash),
  epochProgress: snapshot.epoch_progress,
  timestamp: snapshot.created_at,
});

export const globalSnapshotResponse = (snapshot) => ({
  ...commonSnapshotResponse(snapshot, "dag_blocks"),
});

export const rewardsResponse = (rs) => rs.map(rewardResponse);

export const rewardResponse = (reward) => ({
  destination: reward.destination_addr,
  amount: reward.amount,
});

export const dagTransactionsResponse = (ts) => ts.map(dagTransactionResponse);

export const dagTransactionResponse = (t) =>
  transactionResponse(t, t.dag_blocks.global_snapshot);

const transactionResponse = (transaction, snapshot) => ({
  hash: transaction.hash,
  ordinal: transaction.ordinal,
  amount: transaction.amount,
  source: transaction.source_addr,
  destination: transaction.destination_addr,
  fee: transaction.fee,
  parent: {
    hash: transaction.parent_hash ?? null,
    ordinal: transaction.parent_ordinal ?? null,
  },
  salt: transaction.salt,
  blockHash: transaction.block_hash,
  snapshotHash: snapshot.hash,
  snapshotOrdinal: snapshot.ordinal,
  timestamp: transaction.created_at,
});

const blockResponse = (block) => ({
  hash: block.hash,
  height: block.height,
  parents: block.super.block_parents.map(blockParentResponse),
  timestamp: block.created_at,
});

export const dagBlockResponse = (block) => ({
  ...blockResponse(block),
  transactions: block.dag_transactions.map((tx) => tx.hash),
  snapshotHash: block.global_snapshot.hash,
  snapshotOrdinal: block.global_snapshot.ordinal,
});

export const blockParentResponse = (block_parent) => ({
  hash: block_parent.parent_proof_hash,
  height: block_parent.parent_height,
});

export const balanceResponse = (balance) => ({
  ordinal: balance.snapshot_ordinal,
  balance: balance.balance,
  address: balance.address,
});

export const metagraphSnapshotsResponse = (ss) =>
  ss.map(metagraphSnapshotResponse);
export const metagraphSnapshotResponse = (snapshot) => ({
  ...commonSnapshotResponse(snapshot, "metagraph_blocks"),
  fee: snapshot.fee,
  stakingAddress: snapshot.staking_address ?? null,
  ownerAddress: snapshot.owner_address ?? null,
  sizeInKb: snapshot.size,
});

export const metagraphBlockResponse = (block) => ({
  ...blockResponse(block),
  transactions: block.metagraph_transactions.map((tx) => tx.hash),
  snapshotHash: block.metagraph_snapshot.hash,
  snapshotOrdinal: block.metagraph_snapshot.ordinal,
});

export const metagraphTransactionsResponse = (ts) =>
  ts.map(metagraphTransactionResponse);
export const metagraphTransactionResponse = (t) =>
  transactionResponse(t, t.metagraph_blocks.metagraph_snapshot);

export const metagraphFeeTransactionsResponse = (ts) =>
  ts.map(metagraphTransactionResponse);
export const metagraphFeeTransactionResponse = (t) =>
  transactionResponse(t, t.metagraph_snapshot);

export const metagraphsResponse = (mgs) => mgs.map(metagraphResponse);
export const metagraphResponse = (mg) => ({
  id: mg.id,
  timestamp: mg.created_at,
});

export const respond = (data, transform, next?) => {
  if (data) {
    const transformed = transform(data);
    const response = next
      ? { data: transformed, meta: { next: toNextString(next) } }
      : { data: transformed };
    return successResponse(response);
  } else return notFoundResponse();
};

export const successResponse = (data: any): APIGatewayProxyResult => ({
  statusCode: 200,
  headers: DEFAULT_HEADERS,
  body: JSON.stringify(data, (_, v) =>
    typeof v === "bigint"
      ? v > Number.MAX_SAFE_INTEGER
        ? v.toString()
        : Number(v)
      : v
  ),
});

export const notFoundResponse = (msg=""): APIGatewayProxyResult => ({
  statusCode: 404,
  body: JSON.stringify({ message: "Not found", errors: [msg] }),
});

export const missingParameterResponse = (
  param: string
): APIGatewayProxyResult => ({
  statusCode: 400,
  body: JSON.stringify({
    message: `Missing parameter: ${param}`,
    errors: [""],
  }),
});

export const handleError = (error: any): APIGatewayProxyResult => {
  console.error(error);
  return {
    statusCode: 500,
    body: JSON.stringify({ message: "Internal Server Error", errors: [] }),
  };
};
