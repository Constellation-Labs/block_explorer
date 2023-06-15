import {
  Hash,
  Height,
  SnapshotHash,
  SnapshotOrdinal,
  Timestamp,
} from "./properties";

export type OpenSearchBlock = {
  transactions: string[];
  parent: BlockReference[];
} & Timestamp &
  SnapshotOrdinal &
  SnapshotHash &
  Hash &
  Height;

export type BlockReference = Hash & Height;

export type Block = OpenSearchBlock;
