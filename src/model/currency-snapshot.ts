import { OpenSearchSnapshot } from "./snapshot";

export type OpenSearchCurrencySnapshot = OpenSearchSnapshot & {
  fee?: number | null;
  stakingAddress?: string | null;
  ownerAddress?: string | null;
  sizeInKB?: number | null;
};
