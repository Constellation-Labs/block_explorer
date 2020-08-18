import {getClient} from './elastic'
import {getCheckpointBlocksHandler, getSnapshotHandler, getTransactionsHandler} from './service'

const client = getClient()

export const snapshots = async event => getSnapshotHandler(event, client)()
export const checkpointBlocks = async event => getCheckpointBlocksHandler(event, client)()
export const transactions = async event => getTransactionsHandler(event, client)()
