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

export type WithHeight = {
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

export type RewardTransaction = {
  destination: string;
  amount: number;
};

export type Snapshot = Omit<OpenSearchSnapshot, "rewards">;

export type OpenSearchTransaction = {
  source: string;
  destination: string;
  amount: number;
  fee: number;
  parent: TransactionReference;
  blockHash: string;
  salt: number;
  transactionOriginal: object;
} & WithTimestamp &
  WithSnapshotHash &
  WithSnapshotOrdinal &
  WithHash;

export type TransactionReference = WithHash & WithOrdinal;

export type Transaction = Omit<OpenSearchTransaction, "salt">;

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

export type OpenSearchBalance = {
  address: string;
  balance: number;
} & WithSnapshotOrdinal &
  WithSnapshotHash &
  WithTimestamp;

export type Balance = Pick<OpenSearchBalance, "balance" | "address"> & {
  ordinal: number;
};
