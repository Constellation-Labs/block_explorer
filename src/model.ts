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

type WithHeight = {
  height: number;
};

export type OpenSearchSnapshot = {
  subHeight: number;
  lastSnapshotHash: string;
  blocks: string[];
  rewards: RewardTransaction[];
} & WithTimestamp &
  WithOrdinal &
  WithHash &
  WithHeight;

export type Snapshot = Omit<OpenSearchSnapshot, "rewards">;

export type RewardTransaction = {
  destination: string;
  amount: number;
};

export type OpenSearchTransaction = {
  source: string;
  destination: string;
  amount: number;
  fee: number;
  parent: WithHash & WithOrdinal;
  blockHash: string;
  salt: number;
} & WithTimestamp &
  WithSnapshotHash &
  WithSnapshotOrdinal &
  WithHash;

export type OpenSearchBlock = {
  transactions: string[];
  parent: BlockReference[];
} & WithTimestamp &
  WithSnapshotOrdinal &
  WithSnapshotHash &
  WithHash &
  WithHeight;

export type BlockReference = WithHash & WithHeight;

export type Block = OpenSearchBlock;
