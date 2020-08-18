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

export const snapshots = async event => getSnapshotHandler(event, client)()
export const checkpointBlocks = async event => getCheckpointBlocksHandler(event, client)()
export const transactions = async event => getTransactionsHandler(event, client)()
export const transactionsBySnapshot = async event => getTransactionsBySnapshotHandler(event, client)()
export const transactionsByAddress = async event => getTransactionsByAddressHandler(event, client)()
export const transactionsBySender = async event => getTransactionsBySenderHandler(event, client)()
export const transactionsByReceiver = async event => getTransactionsByReceiverHandler(event, client)()
