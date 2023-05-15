import {
  Hash,
  Height,
  SnapshotHash,
  SnapshotOrdinal,
  Timestamp,
} from "./properties";
import { CurrencyData } from "./currency-data";

export type OpenSearchBlock = {
  transactions: string[];
  parent: BlockReference[];
} & Timestamp &
  SnapshotOrdinal &
  SnapshotHash &
  Hash &
  Height;

export type OpenSearchCurrencyBlock = CurrencyData<Block>;

export type BlockReference = Hash & Height;

export type Block = OpenSearchBlock;
