export type Timestamp = {
  timestamp: string;
};

export type WithKeyword<T> = {
  [P in keyof T & string as `${P}.keyword`]: T[P];
};

export enum SortOrder {
  Desc = "desc",
  Asc = "asc",
}

export type Hash = {
  hash: string;
};

export type Ordinal = {
  ordinal: number;
};

export type BalanceValue = {
  balance: number;
};

export type Balance = Ordinal & BalanceValue;

type Height = {
  height: number;
};

export type BaseSnapshot = {
  subHeight: number;
  lastSnapshotHash: string;
} & Timestamp &
  Ordinal &
  Hash &
  Height;

export type BaseBlock = Hash;

export type OpenSearchSnapshot = {
  blocks: string[];
} & BaseSnapshot;

export type Snapshot = {
  blocks: string[];
} & BaseSnapshot;

export type RewardTransaction = {
  destination: string;
  amount: number;
};

export type WithRewards = {
  rewards: RewardTransaction[];
};

export type OpenSearchTransaction = {
  source: string;
  destination: string;
  amount: number;
  fee: number;
  parent: Hash & Ordinal;
  blockHash: string;
  snapshotHash: string;
  snapshotOrdinal: string;
  salt: number;
} & Timestamp &
  Hash;

export type Transaction = {
  source: string;
  destination: string;
  amount: number;
  fee: number;
  parent: Hash & Ordinal;
  snapshot: string;
  block: string;
} & Timestamp &
  Hash;

export type OpenSearchBlock = {
  height: number;
  transactions: string[];
  parent: BlockReference[];
  snapshotHash: string;
  snapshotOrdinal: number;
} & Timestamp &
  Hash;

export type BlockReference = {
  hash: string;
  height: number;
} & Hash;

export type Block = {
  hash: string;
  height: number;
  transactions: string[];
  parent: BlockReference[];
  snapshot: string;
} & Timestamp;
