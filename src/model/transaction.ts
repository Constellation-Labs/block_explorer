import {
  Hash,
  Ordinal,
  SnapshotHash,
  SnapshotOrdinal,
  Timestamp,
} from "./properties";
import { CurrencyData } from "./currency-data";

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

export type OpenSearchCurrencyTransaction = CurrencyData<OpenSearchTransaction>;

export type TransactionReference = Hash & Ordinal;

export type Transaction = Omit<OpenSearchTransaction, "salt">;

export type RewardTransaction = {
  destination: string;
  amount: number;
};
