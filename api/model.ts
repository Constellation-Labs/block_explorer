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

type Height = {
    min: number,
    max: number
}