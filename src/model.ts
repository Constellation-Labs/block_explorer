export type WithTimestamp = {
    timestamp: string
}

export enum SortOrder {
    Desc = 'desc',
    Asc = 'asc'
}

export type Snapshot = {
    checkpointBlocks: string[]
    hash: string
    height: number
} & WithTimestamp

export type CheckpointBlock = {
    hash: string
    height: Height
    transactions: string[]
    notifications: string[]
    observations: string[]
    children: number
    snapshotHash: string
    soeHash: string
    parentSOEHashes: string[]
} & WithTimestamp

export type Transaction = {
    hash: string
    amount: number
    receiver: string
    sender: string
    fee: number
    isDummy: boolean
    lastTransactionRef: {
        prevHash: string
        ordinal: number
    }
    snapshotHash: string
    checkpointBlock: string
    transactionOriginal: any
} & WithTimestamp

type Height = {
    min: number,
    max: number
}