export type WithTimestamp = {
  timestamp: string;
};

export type WithHash = {
  hash: string;
};

export type WithOrdinal = {
  ordinal: number;
};

export type WithSnapshotOrdinal = {
  snapshotOrdinal: number;
};

export type WithSnapshotHash = {
  snapshotHash: number;
};

export type BalanceValue = {
  balance: number;
};

export type Balance = WithOrdinal & BalanceValue;

type WithHeight = {
  height: number;
};

export type BaseBlock = WithHash;

export type OpenSearchSnapshot = {
  subHeight: number;
  lastSnapshotHash: string;
  blocks: string[];
  rewards: RewardTransaction[];
} & WithTimestamp &
  WithOrdinal &
  WithHash &
  WithHeight;

export type Snapshot = OpenSearchSnapshot;

export type RewardTransaction = {
  destination: string;
  amount: number;
};

export type Transaction = {
  source: string;
  destination: string;
  amount: number;
  fee: number;
  parent: WithHash & WithOrdinal;
  blockHash: string;
  snapshotHash: string;
  snapshotOrdinal: string;
  salt: number;
} & WithTimestamp &
  WithSnapshotHash &
  WithSnapshotOrdinal &
  WithHash;

export type OpenSearchBlock = {
  height: number;
  transactions: string[];
  parent: BlockReference[];
  snapshotHash: string;
  snapshotOrdinal: number;
} & WithTimestamp &
  WithSnapshotOrdinal &
  WithSnapshotHash &
  WithHash;

export type BlockReference = WithHash & WithHeight;

export type Block = OpenSearchBlock;
