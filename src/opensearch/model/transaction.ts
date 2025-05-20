import {
  Hash,
  Ordinal,
  SnapshotHash,
  SnapshotOrdinal,
  Timestamp,
} from "./properties";

export type OpenSearchTransaction = {
  source: string;
  destination: string;
  amount: number;
  fee: number;
  parent: TransactionReference;
  blockHash: string;
  salt: number;
  transactionOriginal: object;
} & Timestamp &
  SnapshotHash &
  SnapshotOrdinal &
  Hash;

export type TransactionReference = Hash & Ordinal;

export type Transaction = Omit<OpenSearchTransaction, "salt">;

export type RewardTransaction = {
  destination: string;
  amount: number;
};
