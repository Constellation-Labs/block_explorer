export type Snapshot = {
    checkpointBlocks: string[]
    hash: string
    height: number
    timestamp: string
}

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
    timestamp: string
}

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
    transactionOriginal: unknown
}

type Height = {
    min: number,
    max: number
}