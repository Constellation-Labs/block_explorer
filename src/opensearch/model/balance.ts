import { SnapshotHash, SnapshotOrdinal, Timestamp } from "./properties";

export type OpenSearchBalance = {
  address: string;
  balance: number;
} & SnapshotOrdinal &
  SnapshotHash &
  Timestamp;

export type Balance = Pick<OpenSearchBalance, "balance" | "address"> & {
  ordinal: number;
};
