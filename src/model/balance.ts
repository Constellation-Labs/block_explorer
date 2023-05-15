import { SnapshotHash, SnapshotOrdinal, Timestamp } from "./properties";
import { CurrencyData } from "./currency-data";

export type OpenSearchBalance = {
  address: string;
  balance: number;
} & SnapshotOrdinal &
  SnapshotHash &
  Timestamp;

export type OpenSearchCurrencyBalance = CurrencyData<OpenSearchBalance>;

export type Balance = Pick<OpenSearchBalance, "balance" | "address"> & {
  ordinal: number;
};
