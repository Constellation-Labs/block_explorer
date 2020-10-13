import {getClient} from './elastic'
import {
    getCheckpointBlocksHandler,
    getSnapshotHandler,
    getTransactionsByAddressHandler,
    getTransactionsByReceiverHandler,
    getTransactionsBySenderHandler,
    getTransactionsBySnapshotHandler,
    getTransactionsHandler
} from './service'

const client = getClient()

export const snapshots = event => getSnapshotHandler(event, client)()
export const checkpointBlocks = event => getCheckpointBlocksHandler(event, client)()
export const transactions = event => getTransactionsHandler(event, client)()
export const transactionsBySnapshot = event => getTransactionsBySnapshotHandler(event, client)()
export const transactionsByAddress = event => getTransactionsByAddressHandler(event, client)()
export const transactionsBySender = event => getTransactionsBySenderHandler(event, client)()
export const transactionsByReceiver = event => getTransactionsByReceiverHandler(event, client)()
