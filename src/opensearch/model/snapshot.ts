import { Hash, Height, Ordinal, Timestamp } from "./properties";
import { RewardTransaction } from "./transaction";

export type OpenSearchSnapshot = {
  subHeight: number;
  lastSnapshotHash: string;
  blocks: string[];
  rewards: RewardTransaction[];
} & Timestamp &
  Ordinal &
  Hash &
  Height;

export type WithoutRewards<T extends OpenSearchSnapshot> = Omit<T, "rewards">;
