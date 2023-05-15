import { Hash, Height, Ordinal, Timestamp } from "./properties";
import { RewardTransaction } from "./transaction";
import { CurrencyData } from "./currency-data";

export type OpenSearchSnapshot = {
  subHeight: number;
  lastSnapshotHash: string;
  blocks: string[];
  rewards: RewardTransaction[];
} & Timestamp &
  Ordinal &
  Hash &
  Height;

export type Snapshot = Omit<OpenSearchSnapshot, "rewards">;

export type OpenSearchCurrencySnapshot = CurrencyData<OpenSearchSnapshot>;

export type CurrencySnapshot = Snapshot;
