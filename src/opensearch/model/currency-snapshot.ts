import { OpenSearchSnapshot, WithoutRewards } from "./snapshot";

export type OpenSearchCurrencySnapshotV1 = OpenSearchSnapshot & {
  fee?: number | null;
  stakingAddress?: string | null;
  ownerAddress?: string | null;
  sizeInKB?: number | null;
};

export type OpenSearchCurrencySnapshot = OpenSearchCurrencySnapshotV1 & {
  fee: number | null;
  stakingAddress: string | null;
  ownerAddress: string | null;
  sizeInKB: number | null;
};

export const openSearchCurrencySnapshotToV2 = (
  data:
    | OpenSearchCurrencySnapshotV1
    | OpenSearchCurrencySnapshot
    | WithoutRewards<OpenSearchCurrencySnapshotV1>
    | WithoutRewards<OpenSearchCurrencySnapshot>
): WithoutRewards<OpenSearchCurrencySnapshot> => ({
  ...data,
  fee: data.fee ?? null,
  stakingAddress: data.stakingAddress ?? null,
  ownerAddress: data.ownerAddress ?? null,
  sizeInKB: data.sizeInKB ?? null,
});

export type CurrencySnapshot = {
  fee: number | null;
  stakingAddress: string | null;
  ownerAddress: string | null;
  sizeInKB: number | null;
};
