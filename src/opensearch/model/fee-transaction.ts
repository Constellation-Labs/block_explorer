import { Hash, SnapshotHash, SnapshotOrdinal, Timestamp } from "./properties";
import { TransactionReference } from "./transaction";

export type OpenSearchFeeTransaction = {
  source: string;
  destination: string;
  amount: number;
  parent: TransactionReference;
  salt: number;
} & Timestamp &
  SnapshotHash &
  SnapshotOrdinal &
  Hash;

export type FeeTransaction = OpenSearchFeeTransaction;
