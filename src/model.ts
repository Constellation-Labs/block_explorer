export type WithTimestamp = {
    timestamp: string
}

export type WithKeyword<T> = { [P in keyof T & string as `${P}.keyword`]: T[P] };

export enum SortOrder {
    Desc = 'desc',
    Asc = 'asc'
}

export type Hash = {
    hash: string
}

export type Ordinal = {
    ordinal: number
}

export type BalanceValue = {
    balance: number
}

export type Balance = Ordinal & BalanceValue

type Height = {
    min: number,
    max: number
}

export type BaseSnapshot = {
    height: number,
    subHeight: number,
    lastSnapshotHash: string
} & WithTimestamp & Ordinal & Hash

export type BaseBlock = Hash

export type OpenSearchSnapshot = {
    blocks: BaseBlock[]
} & BaseSnapshot

export type Snapshot = {
    blocks: string[]
} & BaseSnapshot

export type RewardTransaction = {
    destination: string,
    amount: number
}

export type WithRewards = {
    rewards: RewardTransaction[]
}